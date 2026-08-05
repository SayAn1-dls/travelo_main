"""TRAVELO backend — auth, destinations, bookings, Stripe payments, quotes."""
import os
import random
import re
import secrets
import threading
import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, List

import bcrypt
import jwt
import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

from destinations_data import DESTINATIONS, QUOTES, TIERS, tier_price
import setup_stripe

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("travelo")

# ---------------------------------------------------------------- database
mongo_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = mongo_client[os.environ.get("DB_NAME", "travelo")]
users_col = db["users"]
bookings_col = db["bookings"]
payment_transactions = db["payment_transactions"]
trip_plans = db["trip_plans"]
trip_expenses = db["trip_expenses"]
trip_notifications = db["trip_notifications"]
chat_sessions = db["chat_sessions"]
chat_messages = db["chat_messages"]
rooms_col = db["rooms"]
room_messages = db["room_messages"]
media_col = db["media"]

UPLOADS_DIR = ROOT_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------- stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
tax_mode = "calc_only"  # travel packages = services (no digital goods)

# ---------------------------------------------------------------- auth utils
JWT_SECRET = os.environ.get("JWT_SECRET", "travelo-dev-secret")
JWT_ALGO = "HS256"
JWT_EXPIRY_DAYS = 7
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await users_col.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ---------------------------------------------------------------- models
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class BookingRequest(BaseModel):
    destination_id: str
    tier: str
    travelers: int = Field(..., ge=1, le=12)
    start_date: str
    end_date: str


class CheckoutRequest(BaseModel):
    booking_id: str
    origin_url: str


# ---- Trip Planner models
class MemberIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    contribution: float = Field(..., ge=0)
    payment_handle: str = Field("", max_length=120)  # UPI id / paypal.me / venmo url


class TripPlanRequest(BaseModel):
    place: str = Field(..., min_length=2, max_length=100)
    start_date: str
    end_date: str
    budget: float = Field(..., ge=0)
    members: List[MemberIn] = Field(..., min_length=1, max_length=20)


class ExpenseRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=140)
    amount: float = Field(..., gt=0)
    paid_by: str  # member id
    category: str = Field("general", max_length=30)  # general|hotel|flight|car|food|activity


class SettleRequest(BaseModel):
    from_member: str
    to_member: str
    amount: float = Field(..., gt=0)


class CollageAnalyzeRequest(BaseModel):
    images: List[str] = Field(..., min_length=1, max_length=5)  # base64-encoded JPEG/PNG/WEBP


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    place: str = Field("", max_length=100)
    phase: str = Field("before", max_length=10)  # before | during | after
    text: str = Field(..., min_length=1, max_length=2000)
    vibe_context: Optional[dict] = None


class RoomCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)


class RoomJoinRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)


class RoomMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000)


# ---------------------------------------------------------------- app
app = FastAPI(title="TRAVELO API")
api = APIRouter(prefix="/api")

DEST_MAP = {d["id"]: d for d in DESTINATIONS}


def public_destination(d: dict) -> dict:
    return {**d, "tiers": {t: tier_price(d["base_price"], t) for t in TIERS}}


# ---------------------------------------------------------------- health
@api.get("/")
async def root():
    return {"service": "TRAVELO API", "status": "operational"}


# ---------------------------------------------------------------- auth
@api.post("/auth/register")
async def register(req: RegisterRequest):
    existing = await users_col.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(409, "An account with this email already exists")
    user = {
        "id": str(uuid.uuid4()),
        "name": req.name.strip(),
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await users_col.insert_one({**user})
    token = create_token(user["id"])
    return {"token": token, "user": {k: user[k] for k in ("id", "name", "email", "created_at")}}


@api.post("/auth/login")
async def login(req: LoginRequest):
    user = await users_col.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user.get("password", "")):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"])
    return {"token": token, "user": {k: user[k] for k in ("id", "name", "email", "created_at")}}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------------------------------------------------------------- destinations
@api.get("/destinations")
async def list_destinations(region: Optional[str] = None, q: Optional[str] = None):
    results = DESTINATIONS
    if region:
        results = [d for d in results if d["region"].lower() == region.lower()]
    if q:
        ql = q.lower()
        results = [d for d in results if ql in d["name"].lower() or ql in d["country"].lower() or ql in d["tagline"].lower()]
    return [public_destination(d) for d in results]


@api.get("/destinations/{dest_id}")
async def get_destination(dest_id: str):
    d = DEST_MAP.get(dest_id)
    if not d:
        raise HTTPException(404, "Destination not found")
    return public_destination(d)


# ---------------------------------------------------------------- quotes
@api.get("/quotes")
async def list_quotes():
    return QUOTES


@api.get("/quotes/random")
async def random_quote():
    return random.choice(QUOTES)


# ---------------------------------------------------------------- bookings
@api.post("/bookings")
async def create_booking(req: BookingRequest, user=Depends(get_current_user)):
    dest = DEST_MAP.get(req.destination_id)
    if not dest:
        raise HTTPException(404, "Destination not found")
    if req.tier not in TIERS:
        raise HTTPException(400, f"Invalid tier. Choose one of: {', '.join(TIERS)}")
    try:
        start = datetime.fromisoformat(req.start_date)
        end = datetime.fromisoformat(req.end_date)
    except ValueError:
        raise HTTPException(400, "Dates must be ISO format (YYYY-MM-DD)")
    if end <= start:
        raise HTTPException(400, "End date must be after start date")
    per_person = tier_price(dest["base_price"], req.tier)
    amount = float(per_person * req.travelers)
    booking = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "destination_id": dest["id"],
        "destination_name": dest["name"],
        "country": dest["country"],
        "image": dest["image"],
        "tier": req.tier,
        "travelers": req.travelers,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "per_person": float(per_person),
        "amount": amount,
        "currency": "usd",
        "status": "pending_payment",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await bookings_col.insert_one({**booking})
    return booking


@api.get("/bookings")
async def list_bookings(user=Depends(get_current_user)):
    cursor = bookings_col.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(200)


@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user=Depends(get_current_user)):
    booking = await bookings_col.find_one({"id": booking_id, "user_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Booking not found")
    return booking


# ---------------------------------------------------------------- payments (Flow A playbook)
@api.post("/payments/checkout")
async def create_checkout(req: CheckoutRequest, user=Depends(get_current_user)):
    booking = await bookings_col.find_one({"id": req.booking_id, "user_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking["status"] == "confirmed":
        raise HTTPException(400, "Booking is already paid")
    lookup_key = f"{booking['destination_id']}_{booking['tier']}"
    prices = stripe.Price.list(lookup_keys=[lookup_key], active=True, limit=1).data
    if not prices:
        raise HTTPException(500, f"Price not found: {lookup_key}")
    price = prices[0]
    quantity = int(booking["travelers"])
    kwargs = dict(
        line_items=[{"price": price.id, "quantity": quantity}],
        mode="payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel?booking_id={booking['id']}",
        metadata={"user_id": user["id"], "booking_id": booking["id"], "lookup_key": lookup_key},
    )
    if tax_mode == "calc_only":
        try:
            session = stripe.checkout.Session.create(
                **kwargs, automatic_tax={"enabled": True}, billing_address_collection="required",
            )
        except stripe.error.InvalidRequestError as e:
            logger.warning("automatic tax unavailable, falling back to plain session: %s", e)
            session = stripe.checkout.Session.create(**kwargs)
    else:
        session = stripe.checkout.Session.create(**kwargs)
    await payment_transactions.insert_one({
        "session_id": session.id,
        "user_id": user["id"],
        "booking_id": booking["id"],
        "lookup_key": lookup_key,
        "amount": float((price.unit_amount or 0) * quantity) / 100.0,
        "currency": price.currency,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"checkout_url": session.url, "session_id": session.id}


async def _mark_paid(session_id: str, extra: dict):
    """Idempotent: flip transaction to paid + confirm linked booking."""
    res = await payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid",
                  "updated_at": datetime.now(timezone.utc), **extra}},
    )
    record = await payment_transactions.find_one({"session_id": session_id})
    if record and record.get("booking_id"):
        await bookings_col.update_one(
            {"id": record["booking_id"]},
            {"$set": {"status": "confirmed", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
    return res


@api.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str):
    record = await payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(404, "Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _mark_paid(session_id, {"stripe_payment_intent_id": s.payment_intent})
                record = await payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {
        "session_id": record["session_id"],
        "status": record["status"],
        "payment_status": record["payment_status"],
        "booking_id": record.get("booking_id"),
    }


@api.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    except Exception:
        raise HTTPException(400, "Invalid payload")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await _mark_paid(obj["id"], {"stripe_payment_intent_id": obj.get("payment_intent")})
    elif t == "checkout.session.async_payment_succeeded":
        await _mark_paid(obj["id"], {})
    elif t == "checkout.session.async_payment_failed":
        await payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": datetime.now(timezone.utc)}})
    elif t == "checkout.session.expired":
        await payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": datetime.now(timezone.utc)}})
    elif t == "charge.refunded":
        await payment_transactions.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": datetime.now(timezone.utc)}})
    return {"status": "ok"}


# ---------------------------------------------------------------- trip planner
async def _notify(trip_id: str, ntype: str, message: str, member_id: str = None):
    await trip_notifications.insert_one({
        "id": str(uuid.uuid4()),
        "trip_id": trip_id,
        "type": ntype,  # expense | settlement | reminder | info
        "message": message,
        "member_id": member_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })


def _compute_finances(trip: dict, expenses: list, settlements: list) -> dict:
    members = trip["members"]
    n = len(members) or 1
    pool = sum(m["contribution"] for m in members)
    spent = sum(e["amount"] for e in expenses)

    paid = {m["id"]: 0.0 for m in members}
    share = {m["id"]: 0.0 for m in members}
    for e in expenses:
        if e["paid_by"] in paid:
            paid[e["paid_by"]] += e["amount"]
        per_head = e["amount"] / n
        for m in members:
            share[m["id"]] += per_head

    settled_out = {m["id"]: 0.0 for m in members}
    settled_in = {m["id"]: 0.0 for m in members}
    for s in settlements:
        if s["from_member"] in settled_out:
            settled_out[s["from_member"]] += s["amount"]
        if s["to_member"] in settled_in:
            settled_in[s["to_member"]] += s["amount"]

    balances = {}
    member_stats = []
    for m in members:
        bal = round(paid[m["id"]] - share[m["id"]] + settled_out[m["id"]] - settled_in[m["id"]], 2)
        balances[m["id"]] = bal
        member_stats.append({
            **m,
            "paid": round(paid[m["id"]], 2),
            "share": round(share[m["id"]], 2),
            "settled_paid": round(settled_out[m["id"]], 2),
            "settled_received": round(settled_in[m["id"]], 2),
            "balance": bal,  # >0 is owed money, <0 owes money
        })

    # Min-cash-flow settle suggestions (greedy)
    creditors = sorted([[mid, b] for mid, b in balances.items() if b > 0.01], key=lambda x: -x[1])
    debtors = sorted([[mid, -b] for mid, b in balances.items() if b < -0.01], key=lambda x: -x[1])
    suggestions = []
    ci, di = 0, 0
    while ci < len(creditors) and di < len(debtors):
        amt = round(min(creditors[ci][1], debtors[di][1]), 2)
        if amt > 0:
            suggestions.append({"from_member": debtors[di][0], "to_member": creditors[ci][0], "amount": amt})
        creditors[ci][1] -= amt
        debtors[di][1] -= amt
        if creditors[ci][1] <= 0.01:
            ci += 1
        if debtors[di][1] <= 0.01:
            di += 1

    over = spent > trip["budget"]
    return {
        "pool": round(pool, 2),
        "spent": round(spent, 2),
        "remaining": round(pool - spent, 2),
        "budget": trip["budget"],
        "budget_left": round(trip["budget"] - spent, 2),
        "budget_status": "over" if over else "under",
        "budget_used_pct": round((spent / trip["budget"]) * 100, 1) if trip["budget"] > 0 else 0,
        "members": member_stats,
        "settle_suggestions": suggestions,
        "all_settled": len(suggestions) == 0,
    }


async def _get_trip_or_404(trip_id: str, user_id: str) -> dict:
    trip = await trip_plans.find_one({"id": trip_id, "user_id": user_id}, {"_id": 0})
    if not trip:
        raise HTTPException(404, "Trip plan not found")
    return trip


async def _full_trip(trip: dict) -> dict:
    expenses = await trip_expenses.find({"trip_id": trip["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    settlements = trip.get("settlements", [])
    finances = _compute_finances(trip, expenses, settlements)
    return {**trip, "expenses": expenses, "finances": finances}


@api.post("/trips")
async def create_trip(req: TripPlanRequest, user=Depends(get_current_user)):
    try:
        start = datetime.fromisoformat(req.start_date)
        end = datetime.fromisoformat(req.end_date)
    except ValueError:
        raise HTTPException(400, "Dates must be ISO format (YYYY-MM-DD)")
    if end <= start:
        raise HTTPException(400, "Return date must be after departure")
    members = [{
        "id": str(uuid.uuid4()),
        "name": m.name.strip(),
        "contribution": round(m.contribution, 2),
        "payment_handle": m.payment_handle.strip(),
        "is_owner": i == 0,
    } for i, m in enumerate(req.members)]
    trip = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "place": req.place.strip(),
        "start_date": req.start_date,
        "end_date": req.end_date,
        "budget": round(req.budget, 2),
        "members": members,
        "settlements": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await trip_plans.insert_one({**trip})
    await _notify(trip["id"], "info", f"Trip to {trip['place']} created. Squad of {len(members)}. Pool: ${sum(m['contribution'] for m in members):,.0f}. Budget: ${trip['budget']:,.0f}.")
    return await _full_trip(trip)


@api.get("/trips")
async def list_trips(user=Depends(get_current_user)):
    trips = await trip_plans.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    result = []
    for t in trips:
        expenses = await trip_expenses.find({"trip_id": t["id"]}, {"_id": 0}).to_list(500)
        fin = _compute_finances(t, expenses, t.get("settlements", []))
        result.append({**t, "finances": {k: fin[k] for k in ("pool", "spent", "remaining", "budget", "budget_status", "budget_used_pct")}})
    return result


@api.get("/trips/{trip_id}")
async def get_trip(trip_id: str, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    return await _full_trip(trip)


@api.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str, user=Depends(get_current_user)):
    await _get_trip_or_404(trip_id, user["id"])
    await trip_plans.delete_one({"id": trip_id})
    await trip_expenses.delete_many({"trip_id": trip_id})
    await trip_notifications.delete_many({"trip_id": trip_id})
    return {"deleted": True}


@api.post("/trips/{trip_id}/expenses")
async def add_expense(trip_id: str, req: ExpenseRequest, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    member_map = {m["id"]: m for m in trip["members"]}
    if req.paid_by not in member_map:
        raise HTTPException(400, "paid_by must be a valid member id")
    expense = {
        "id": str(uuid.uuid4()),
        "trip_id": trip_id,
        "description": req.description.strip(),
        "amount": round(req.amount, 2),
        "paid_by": req.paid_by,
        "paid_by_name": member_map[req.paid_by]["name"],
        "category": req.category,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await trip_expenses.insert_one({**expense})
    per_head = round(req.amount / len(trip["members"]), 2)
    await _notify(
        trip_id, "expense",
        f"{member_map[req.paid_by]['name']} spent ${req.amount:,.2f} on \"{req.description.strip()}\". "
        f"Everyone owes them ${per_head:,.2f}. Pay them back, squad!",
        req.paid_by,
    )
    return await _full_trip(trip)


@api.delete("/trips/{trip_id}/expenses/{expense_id}")
async def delete_expense(trip_id: str, expense_id: str, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    res = await trip_expenses.delete_one({"id": expense_id, "trip_id": trip_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Expense not found")
    return await _full_trip(trip)


@api.post("/trips/{trip_id}/settle")
async def settle_up(trip_id: str, req: SettleRequest, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    member_map = {m["id"]: m for m in trip["members"]}
    if req.from_member not in member_map or req.to_member not in member_map:
        raise HTTPException(400, "Members must belong to this trip")
    settlement = {
        "id": str(uuid.uuid4()),
        "from_member": req.from_member,
        "to_member": req.to_member,
        "amount": round(req.amount, 2),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await trip_plans.update_one({"id": trip_id}, {"$push": {"settlements": settlement}})
    trip["settlements"] = trip.get("settlements", []) + [settlement]
    await _notify(
        trip_id, "settlement",
        f"{member_map[req.from_member]['name']} paid back ${req.amount:,.2f} to {member_map[req.to_member]['name']}. Respect.",
        req.from_member,
    )
    return await _full_trip(trip)


@api.post("/trips/{trip_id}/remind")
async def remind_debtors(trip_id: str, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    expenses = await trip_expenses.find({"trip_id": trip_id}, {"_id": 0}).to_list(500)
    fin = _compute_finances(trip, expenses, trip.get("settlements", []))
    member_map = {m["id"]: m for m in trip["members"]}
    reminded = []
    for s in fin["settle_suggestions"]:
        debtor = member_map[s["from_member"]]["name"]
        creditor = member_map[s["to_member"]]["name"]
        await _notify(
            trip_id, "reminder",
            f"REMINDER: {debtor} still owes ${s['amount']:,.2f} to {creditor}. The trip is over. Pay up!",
            s["from_member"],
        )
        reminded.append(debtor)
    if not reminded:
        await _notify(trip_id, "info", "Everyone is settled up. This squad is elite.")
    return {"reminded": reminded, "count": len(reminded)}


@api.get("/trips/{trip_id}/notifications")
async def trip_notifications_list(trip_id: str, user=Depends(get_current_user)):
    await _get_trip_or_404(trip_id, user["id"])
    return await trip_notifications.find({"trip_id": trip_id}, {"_id": 0}).sort("created_at", -1).to_list(200)


# ---------------------------------------------------------------- vibe lab (AI collage analysis)
VIBE_FALLBACK = {
    "vibe_title": "WANDER MODE ON",
    "caption": "Some trips don't need captions. This is one of them.",
    "mood": "epic",
    "palette": ["#FF4500", "#EAFF00", "#141414"],
    "hashtags": ["#travelo", "#wanderlust", "#tripdump", "#goldenhour", "#squadgoals"],
    "photo_type": "friends",
    "scrapbook_labels": ["take us back", "no bad days", "squad forever"],
}

PHOTO_TYPES = {"friends", "couple", "solo", "family", "scenery"}

VIBE_PROMPT = (
    "You are TRAVELO's vibe analyst. Look at these trip photos and capture their collective vibe. "
    "First judge WHO is in the photos: a group of friends, a couple, a solo traveler, a family, or pure scenery with no clear people. "
    "Return ONLY raw valid JSON (no markdown, no code fences) with exactly these keys: "
    "vibe_title (2-4 punchy words in caps energy, e.g. 'GOLDEN HOUR CHAOS'), "
    "caption (one short, warm-but-savage social-story sentence, max 90 characters, matched to who is in the photos), "
    "mood (a single lowercase word), "
    "palette (array of exactly 3 hex color strings pulled from the photos' dominant tones, dark-theme friendly), "
    "hashtags (array of exactly 5 lowercase hashtags starting with #, matched to the photo type), "
    "photo_type (exactly one of: friends, couple, solo, family, scenery), "
    "scrapbook_labels (array of exactly 3 short handwritten-sticker phrases, lowercase, max 18 chars each, matched to the photo type — "
    "e.g. friends: 'squad forever'; couple: 'just us two'; family: 'the whole gang'; solo: 'my own map')."
)


@api.post("/collage/analyze")
async def analyze_collage(req: CollageAnalyzeRequest, user=Depends(get_current_user)):
    import json as _json
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        return {**VIBE_FALLBACK, "source": "fallback"}
    try:
        chat = LlmChat(
            api_key=key,
            session_id=f"vibe-{uuid.uuid4()}",
            system_message="You analyze travel photos and answer in strict JSON only.",
        ).with_model("openai", "gpt-5.4")
        attachments = [ImageContent(image_base64=img.split(",")[-1]) for img in req.images]
        response = await chat.send_message(UserMessage(text=VIBE_PROMPT, file_contents=attachments))
        text = response if isinstance(response, str) else str(response)
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1:
            raise ValueError("No JSON in model response")
        data = _json.loads(text[start:end + 1])
        result = {
            "vibe_title": str(data.get("vibe_title") or VIBE_FALLBACK["vibe_title"])[:40],
            "caption": str(data.get("caption") or VIBE_FALLBACK["caption"])[:120],
            "mood": str(data.get("mood") or VIBE_FALLBACK["mood"])[:20],
            "palette": (list(data.get("palette") or [])[:3] or VIBE_FALLBACK["palette"]),
            "hashtags": (list(data.get("hashtags") or [])[:5] or VIBE_FALLBACK["hashtags"]),
            "photo_type": str(data.get("photo_type") or "scenery").lower().strip(),
            "scrapbook_labels": [str(x)[:22] for x in (data.get("scrapbook_labels") or [])][:3],
        }
        if result["photo_type"] not in PHOTO_TYPES:
            result["photo_type"] = "scenery"
        while len(result["scrapbook_labels"]) < 3:
            result["scrapbook_labels"].append(VIBE_FALLBACK["scrapbook_labels"][len(result["scrapbook_labels"])])
        while len(result["palette"]) < 3:
            result["palette"].append(VIBE_FALLBACK["palette"][len(result["palette"])])
        return {**result, "source": "ai"}
    except Exception as e:  # noqa: BLE001
        logger.error("Vibe analysis failed: %s", e)
        return {**VIBE_FALLBACK, "source": "fallback"}


# ---------------------------------------------------------------- NOMAD chat (AI travel companion)
CHAT_PHASES = {"before", "during", "after"}

PHASE_BRIEFS = {
    "before": (
        "PHASE: BEFORE THE TRIP. Hype them up and help them prepare: rough itineraries, what to pack, "
        "budget tricks, best time of day for spots, booking tips, what to skip. Build anticipation."
    ),
    "during": (
        "PHASE: ON THE ROAD RIGHT NOW. Act like you're travelling beside them: quick local tips, what to "
        "eat nearby, hidden gems, etiquette, safety nudges, how to salvage a rainy day. Short, instantly usable answers."
    ),
    "after": (
        "PHASE: AFTER THE TRIP. Help them relive it: story captions, journaling prompts, how to fight "
        "post-trip blues, printing/sharing memories, and start plotting the next escape."
    ),
}


def _nomad_system(place: str, phase: str, vibe: Optional[dict]) -> str:
    base = (
        "You are NOMAD, TRAVELO's AI travel co-pilot — bold, warm, a little savage, deeply knowledgeable "
        "about world travel. You talk like the TRAVELO brand: punchy, confident, zero fluff. "
        "Keep replies under 120 words unless the traveler asks for a detailed plan. Use short paragraphs "
        "or tight bullet lists. Never invent bookings or prices as facts; give ranges and practical guidance. "
    )
    if place:
        base += f"The traveler's destination in focus: {place}. "
    base += PHASE_BRIEFS.get(phase, PHASE_BRIEFS["before"])
    if vibe and isinstance(vibe, dict):
        vt, mood, ptype = vibe.get("vibe_title"), vibe.get("mood"), vibe.get("photo_type")
        if vt or mood or ptype:
            base += f" Context from their recent trip photos: vibe '{vt}', mood {mood}, group type {ptype}. Reference it naturally when relevant."
    return base


@api.post("/chat/message")
async def nomad_chat(req: ChatMessageRequest, user=Depends(get_current_user)):
    import json as _json
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    key = os.environ.get("EMERGENT_LLM_KEY")
    phase = req.phase if req.phase in CHAT_PHASES else "before"
    now = datetime.now(timezone.utc).isoformat()

    # get or create session
    session = None
    if req.session_id:
        session = await chat_sessions.find_one({"id": req.session_id, "user_id": user["id"]}, {"_id": 0})
    if not session:
        session = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "place": req.place.strip(),
            "phase": phase,
            "vibe_context": req.vibe_context,
            "created_at": now,
            "updated_at": now,
        }
        await chat_sessions.insert_one({**session})
    else:
        updates = {"phase": phase, "updated_at": now}
        if req.place.strip():
            updates["place"] = req.place.strip()
        if req.vibe_context:
            updates["vibe_context"] = req.vibe_context
        await chat_sessions.update_one({"id": session["id"]}, {"$set": updates})
        session = {**session, **updates}
    sid = session["id"]

    # recent history (last 12 messages) BEFORE storing the new one
    history = await chat_messages.find({"session_id": sid}, {"_id": 0}).sort("created_at", -1).to_list(12)
    history.reverse()

    await chat_messages.insert_one({
        "id": str(uuid.uuid4()), "session_id": sid, "user_id": user["id"],
        "role": "user", "text": req.text, "created_at": now,
    })

    system_message = _nomad_system(session.get("place", ""), phase, session.get("vibe_context"))
    if history:
        transcript = "\n".join(
            f"{'TRAVELER' if m['role'] == 'user' else 'NOMAD'}: {m['text']}" for m in history
        )
        prompt = f"Conversation so far:\n{transcript}\n\nTRAVELER: {req.text}\n\nReply as NOMAD (reply text only)."
    else:
        prompt = req.text

    async def event_stream():
        yield f"data: {_json.dumps({'type': 'session', 'session_id': sid})}\n\n"
        chunks = []
        try:
            if not key:
                raise RuntimeError("No LLM key configured")
            chat = LlmChat(
                api_key=key, session_id=sid, system_message=system_message,
            ).with_model("openai", "gpt-5.4")
            async for ev in chat.stream_message(UserMessage(text=prompt)):
                if isinstance(ev, TextDelta):
                    chunks.append(ev.content)
                    yield f"data: {_json.dumps({'type': 'delta', 'content': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:  # noqa: BLE001
            logger.error("NOMAD chat failed: %s", e)
            if not chunks:
                fallback = "NOMAD lost signal in the mountains. Give it another shot in a moment."
                chunks.append(fallback)
                yield f"data: {_json.dumps({'type': 'delta', 'content': fallback})}\n\n"
        reply = "".join(chunks)
        await chat_messages.insert_one({
            "id": str(uuid.uuid4()), "session_id": sid, "user_id": user["id"],
            "role": "assistant", "text": reply, "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await chat_sessions.update_one(
            {"id": sid},
            {"$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "preview": req.text[:80]}},
        )
        yield f"data: {_json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api.get("/chat/sessions")
async def list_chat_sessions(user=Depends(get_current_user)):
    return await chat_sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(50)


@api.get("/chat/sessions/{session_id}/messages")
async def chat_history(session_id: str, user=Depends(get_current_user)):
    session = await chat_sessions.find_one({"id": session_id, "user_id": user["id"]})
    if not session:
        raise HTTPException(404, "Chat session not found")
    return await chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(500)


# ---------------------------------------------------------------- squad chat rooms (friends group chat)
INVITE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"  # no confusables
MAX_MEDIA_BYTES = 20 * 1024 * 1024  # 20MB
ALLOWED_MEDIA_PREFIXES = ("image/", "video/")


def _invite_code() -> str:
    return "".join(secrets.choice(INVITE_ALPHABET) for _ in range(6))


async def _get_room_for_member(room_id: str, user_id: str) -> dict:
    room = await rooms_col.find_one({"id": room_id, "member_ids": user_id}, {"_id": 0})
    if not room:
        raise HTTPException(404, "Room not found (or you're not a member)")
    return room


def _room_public(room: dict) -> dict:
    return {k: v for k, v in room.items() if k != "member_ids"} | {
        "member_count": len(room.get("member_ids", [])),
    }


@api.post("/rooms")
async def create_room(req: RoomCreateRequest, user=Depends(get_current_user)):
    code = _invite_code()
    while await rooms_col.find_one({"invite_code": code}):
        code = _invite_code()
    now = datetime.now(timezone.utc).isoformat()
    room = {
        "id": str(uuid.uuid4()),
        "name": req.name.strip(),
        "invite_code": code,
        "created_by": user["id"],
        "member_ids": [user["id"]],
        "members": [{"id": user["id"], "name": user["name"]}],
        "last_message": None,
        "created_at": now,
        "updated_at": now,
    }
    await rooms_col.insert_one({**room})
    return _room_public(room)


@api.get("/rooms")
async def list_rooms(user=Depends(get_current_user)):
    rooms = await rooms_col.find({"member_ids": user["id"]}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return [_room_public(r) for r in rooms]


@api.post("/rooms/join")
async def join_room(req: RoomJoinRequest, user=Depends(get_current_user)):
    room = await rooms_col.find_one({"invite_code": req.code.strip().upper()}, {"_id": 0})
    if not room:
        raise HTTPException(404, "No room with that invite code")
    if user["id"] not in room["member_ids"]:
        await rooms_col.update_one(
            {"id": room["id"]},
            {"$push": {"member_ids": user["id"], "members": {"id": user["id"], "name": user["name"]}},
             "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        await room_messages.insert_one({
            "id": str(uuid.uuid4()), "room_id": room["id"], "user_id": "system",
            "user_name": "TRAVELO", "type": "system",
            "text": f"{user['name']} joined the squad. Say hi!",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        room = await rooms_col.find_one({"id": room["id"]}, {"_id": 0})
    return _room_public(room)


@api.get("/rooms/{room_id}")
async def get_room(room_id: str, user=Depends(get_current_user)):
    room = await _get_room_for_member(room_id, user["id"])
    return _room_public(room)


@api.get("/rooms/{room_id}/messages")
async def get_room_messages(room_id: str, after: Optional[str] = None, user=Depends(get_current_user)):
    await _get_room_for_member(room_id, user["id"])
    query = {"room_id": room_id}
    if after:
        query["created_at"] = {"$gt": after}
    msgs = await room_messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(300)
    if not after and len(msgs) > 100:
        msgs = msgs[-100:]
    return msgs


async def _store_room_message(room_id: str, user: dict, text: str = "",
                              media_id: str = None, media_type: str = None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    msg = {
        "id": str(uuid.uuid4()),
        "room_id": room_id,
        "user_id": user["id"],
        "user_name": user["name"],
        "type": "media" if media_id else "text",
        "text": text,
        "media_id": media_id,
        "media_type": media_type,  # image | video
        "media_url": f"/api/media/{media_id}" if media_id else None,
        "created_at": now,
    }
    await room_messages.insert_one({**msg})
    preview = text[:60] if text else ("📷 Photo" if media_type == "image" else "🎬 Video")
    await rooms_col.update_one(
        {"id": room_id},
        {"$set": {"updated_at": now,
                  "last_message": {"user_name": user["name"], "preview": preview, "created_at": now}}},
    )
    return msg


@api.post("/rooms/{room_id}/messages")
async def send_room_message(room_id: str, req: RoomMessageRequest, user=Depends(get_current_user)):
    await _get_room_for_member(room_id, user["id"])
    return await _store_room_message(room_id, user, text=req.text.strip())


@api.post("/rooms/{room_id}/media")
async def send_room_media(room_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    await _get_room_for_member(room_id, user["id"])
    content_type = (file.content_type or "").lower()
    if not content_type.startswith(ALLOWED_MEDIA_PREFIXES):
        raise HTTPException(400, "Only images and videos are allowed")
    media_kind = "image" if content_type.startswith("image/") else "video"
    media_id = str(uuid.uuid4())
    ext = re.sub(r"[^a-zA-Z0-9]", "", (file.filename or "").rsplit(".", 1)[-1])[:6] or "bin"
    dest = UPLOADS_DIR / f"{media_id}.{ext}"
    size = 0
    with open(dest, "wb") as out:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            size += len(chunk)
            if size > MAX_MEDIA_BYTES:
                out.close()
                dest.unlink(missing_ok=True)
                raise HTTPException(413, "File too large (max 20MB)")
            out.write(chunk)
    await media_col.insert_one({
        "id": media_id, "path": str(dest), "content_type": content_type,
        "size": size, "uploader": user["id"], "room_id": room_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return await _store_room_message(room_id, user, media_id=media_id, media_type=media_kind)


@api.get("/media/{media_id}")
async def serve_media(media_id: str):
    media = await media_col.find_one({"id": media_id}, {"_id": 0})
    if not media or not Path(media["path"]).exists():
        raise HTTPException(404, "Media not found")
    return FileResponse(media["path"], media_type=media["content_type"])


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await users_col.create_index("email", unique=True)
    await users_col.create_index("id")
    await bookings_col.create_index([("user_id", 1), ("created_at", -1)])
    await payment_transactions.create_index("session_id")
    # Idempotent Stripe catalog setup in background thread (sync SDK calls)
    threading.Thread(target=_setup_catalog, daemon=True).start()


def _setup_catalog():
    try:
        setup_stripe.run()
        logger.info("Stripe catalog verified/created")
    except Exception as e:  # noqa: BLE001
        logger.error("Stripe catalog setup failed: %s", e)


@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()
