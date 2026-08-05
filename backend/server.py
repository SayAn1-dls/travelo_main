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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
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
trip_invites = db["trip_invites"]
guides_col = db["guides"]

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
    origin_url: str = Field("", max_length=200)


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
    language: str = Field("en", max_length=5)  # en | hi


class RoomCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60)


class RoomJoinRequest(BaseModel):
    code: str = Field(..., min_length=4, max_length=10)


class RoomMessageRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=3000)


class TripInviteRequest(BaseModel):
    emails: List[EmailStr] = Field(..., min_length=1, max_length=10)
    origin_url: str


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
        "origin_url": req.origin_url,
        "amount": float((price.unit_amount or 0) * quantity) / 100.0,
        "currency": price.currency,
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    })
    return {"checkout_url": session.url, "session_id": session.id}


async def _mark_paid(session_id: str, extra: dict):
    """Idempotent: flip transaction to paid + confirm linked booking + email receipt."""
    res = await payment_transactions.update_one(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid",
                  "updated_at": datetime.now(timezone.utc), **extra}},
    )
    record = await payment_transactions.find_one({"session_id": session_id})
    booking = None
    if record and record.get("booking_id"):
        await bookings_col.update_one(
            {"id": record["booking_id"]},
            {"$set": {"status": "confirmed", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
        booking = await bookings_col.find_one({"id": record["booking_id"]}, {"_id": 0})
    # send receipt only on the first flip to paid (webhook/poll race-safe)
    if res.modified_count and booking:
        import asyncio as _asyncio
        _asyncio.create_task(_send_receipt_email(booking, record))
    return res


async def _send_receipt_email(booking: dict, txn: dict):
    try:
        buyer = await users_col.find_one({"id": booking["user_id"]}, {"_id": 0, "password": 0})
        if not buyer or not buyer.get("email"):
            return
        html = _booking_receipt_html(buyer["name"].split(" ")[0], booking, txn)
        await send_email(
            buyer["email"],
            f"PAID. Your {booking['destination_name']} trip is locked in — TRAVELO receipt",
            html,
        )
        logger.info("Receipt email sent to %s for booking %s", buyer["email"], booking["id"])
    except Exception as e:  # noqa: BLE001
        logger.error("Receipt email failed for booking %s: %s", booking.get("id"), e)


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
        "origin_url": req.origin_url.strip(),
        "reminder_sent": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await trip_plans.insert_one({**trip})
    await _notify(trip["id"], "info", f"Trip to {trip['place']} created. Squad of {len(members)}. Pool: ₹{sum(m['contribution'] for m in members):,.0f}. Budget: ₹{trip['budget']:,.0f}.")
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
        f"{member_map[req.paid_by]['name']} spent ₹{req.amount:,.2f} on \"{req.description.strip()}\". "
        f"Everyone owes them ₹{per_head:,.2f}. Pay them back, squad!",
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
        f"{member_map[req.from_member]['name']} paid back ₹{req.amount:,.2f} to {member_map[req.to_member]['name']}. Respect.",
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
            f"REMINDER: {debtor} still owes ₹{s['amount']:,.2f} to {creditor}. The trip is over. Pay up!",
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


def _nomad_system(place: str, phase: str, vibe: Optional[dict], language: str = "en") -> str:
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
    if language == "hi":
        base += (
            " IMPORTANT: Reply ENTIRELY in Hindi (Devanagari script), in a friendly conversational tone "
            "like talking to a dost. Keep place names in their common form. Do not reply in English."
        )
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

    system_message = _nomad_system(session.get("place", ""), phase, session.get("vibe_context"), req.language)
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
ALLOWED_MEDIA_PREFIXES = ("image/", "video/", "audio/")


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
    if text:
        preview = text[:60]
    elif media_type == "image":
        preview = "📷 Photo"
    elif media_type == "audio":
        preview = "🎤 Voice note"
    else:
        preview = "🎬 Video"
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
        raise HTTPException(400, "Only images, videos and audio are allowed")
    if content_type.startswith("image/"):
        media_kind = "image"
    elif content_type.startswith("audio/"):
        media_kind = "audio"
    else:
        media_kind = "video"
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


# ---------------------------------------------------------------- email (Gmail SMTP)
import asyncio
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

GMAIL_ADDRESS = os.environ.get("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "").replace(" ", "")
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "console")


import re as _re_email
from email.utils import formatdate, make_msgid


def _html_to_text(html: str) -> str:
    text = _re_email.sub(r"<style.*?</style>", " ", html, flags=_re_email.S)
    text = _re_email.sub(r"<[^>]+>", " ", text)
    return _re_email.sub(r"\s+", " ", text).strip()[:1500]


def _send_email_sync(to_email: str, subject: str, html: str):
    if EMAIL_PROVIDER == "gmail":
        if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
            # Never pretend success — surface the misconfiguration to the caller
            raise RuntimeError("Email is not configured on this server (missing Gmail credentials)")
    else:
        logger.info("[EMAIL console fallback] to=%s subject=%s", to_email, subject)
        return
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"TRAVELO <{GMAIL_ADDRESS}>"
    msg["To"] = to_email
    msg["Reply-To"] = GMAIL_ADDRESS
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="travelo.app")
    # plain-text part first (spam-score friendly), HTML second
    msg.attach(MIMEText(_html_to_text(html), "plain"))
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as server:
        server.starttls()
        server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
        server.sendmail(GMAIL_ADDRESS, [to_email], msg.as_string())
    logger.info("[EMAIL sent via gmail] to=%s subject=%s", to_email, subject)


async def send_email(to_email: str, subject: str, html: str):
    await asyncio.to_thread(_send_email_sync, to_email, subject, html)


def _invite_email_html(inviter: str, place: str, dates: str, link: str) -> str:
    display = "'Arial Black', Impact, 'Helvetica Neue', Arial, sans-serif"
    mono = "'Courier New', Courier, monospace"
    marquee = f"{place.upper()} &#10038; PACK YOUR BAGS &#10038; NO EXCUSES &#10038; " * 3
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#030303;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#030303;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- top bar -->
  <tr><td style="background-color:#FF4500;padding:14px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:{display};font-size:24px;font-weight:900;letter-spacing:4px;color:#000000;">TRAVELO &#9992;</td>
      <td align="right" style="font-family:{mono};font-size:10px;font-weight:bold;letter-spacing:3px;color:#000000;">SQUAD SUMMONS</td>
    </tr></table>
  </td></tr>

  <!-- marquee strip -->
  <tr><td style="background-color:#EAFF00;padding:8px 0;overflow:hidden;white-space:nowrap;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">{marquee}</div>
  </td></tr>

  <!-- hero -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:44px 32px 20px;">
    <div style="font-family:{mono};font-size:11px;letter-spacing:5px;color:#EAFF00;text-transform:uppercase;">// YOU'VE BEEN SUMMONED</div>
    <div style="font-family:{display};font-size:44px;line-height:0.95;color:#ffffff;text-transform:uppercase;margin-top:18px;font-weight:900;">
      {inviter} ADDED<br/>YOU TO THE<br/><span style="color:#FF4500;font-style:italic;">{place.upper()}</span><br/>TRIP.
    </div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;color:#EAFF00;margin-top:20px;">
      &ldquo;your excuses expired yesterday.&rdquo;
    </div>
  </td></tr>

  <!-- boarding pass ticket -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #444444;background-color:#000000;">
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-bottom:4px;">DESTINATION</td>
            <td align="right" style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-bottom:4px;">DATES</td>
          </tr>
          <tr>
            <td style="font-family:{display};font-size:22px;color:#ffffff;text-transform:uppercase;">{place.upper()}</td>
            <td align="right" style="font-family:{mono};font-size:13px;color:#EAFF00;">{dates}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom:1px dashed #333333;padding-top:14px;"></td></tr>
          <tr>
            <td style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-top:12px;">PASSENGER</td>
            <td align="right" style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-top:12px;">STATUS</td>
          </tr>
          <tr>
            <td style="font-family:{display};font-size:16px;color:#ffffff;text-transform:uppercase;">YOU, OBVIOUSLY</td>
            <td align="right"><span style="font-family:{mono};font-size:11px;font-weight:bold;color:#000000;background-color:#FF4500;padding:3px 10px;letter-spacing:2px;">WAITING FOR YOU</span></td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:16px 32px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background-color:#EAFF00;border:3px solid #FF4500;">
        <a href="{link}" style="display:inline-block;font-family:{display};font-size:20px;font-weight:900;letter-spacing:3px;color:#000000;text-decoration:none;text-transform:uppercase;padding:18px 44px;">
          YES, I'M IN &#8594;
        </a>
      </td>
    </tr></table>
    <div style="font-family:{mono};font-size:10px;letter-spacing:2px;color:#666666;margin-top:14px;text-transform:uppercase;">
      one click = trip plan + squad chat. no codes. no app switching.
    </div>
  </td></tr>

  <!-- perks row -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:20px 32px 34px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="33%" align="center" style="border:1px solid #2a2a2a;padding:12px 6px;">
        <div style="font-size:18px;">&#128172;</div>
        <div style="font-family:{mono};font-size:9px;letter-spacing:2px;color:#aaaaaa;margin-top:5px;">SQUAD CHAT</div>
      </td>
      <td width="8"></td>
      <td width="33%" align="center" style="border:1px solid #2a2a2a;padding:12px 6px;">
        <div style="font-size:18px;">&#8377;</div>
        <div style="font-family:{mono};font-size:9px;letter-spacing:2px;color:#aaaaaa;margin-top:5px;">SPLIT EXPENSES</div>
      </td>
      <td width="8"></td>
      <td width="33%" align="center" style="border:1px solid #2a2a2a;padding:12px 6px;">
        <div style="font-size:18px;">&#128248;</div>
        <div style="font-family:{mono};font-size:9px;letter-spacing:2px;color:#aaaaaa;margin-top:5px;">SHARE MEMORIES</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- bottom marquee -->
  <tr><td style="background-color:#FF4500;padding:8px 0;overflow:hidden;white-space:nowrap;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038;</div>
  </td></tr>

  <!-- footer -->
  <tr><td align="center" style="background-color:#000000;padding:16px 24px;border:1px solid #1a1a1a;border-top:none;">
    <div style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#555555;text-transform:uppercase;">
      didn't expect this? ignore it. your loss though. &mdash; TRAVELO
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


def _booking_receipt_html(name: str, booking: dict, txn: dict) -> str:
    display = "'Arial Black', Impact, 'Helvetica Neue', Arial, sans-serif"
    mono = "'Courier New', Courier, monospace"
    origin = (txn or {}).get("origin_url") or ""
    trips_link = f"{origin}/dashboard" if origin else "#"
    amount = f"${booking['amount']:,.0f}"
    session_short = (txn or {}).get("session_id", "")[-12:].upper()
    paid_date = datetime.now(timezone.utc).strftime("%d %b %Y")
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#030303;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#030303;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- top bar -->
  <tr><td style="background-color:#FF4500;padding:14px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:{display};font-size:24px;font-weight:900;letter-spacing:4px;color:#000000;">TRAVELO &#9992;</td>
      <td align="right" style="font-family:{mono};font-size:10px;font-weight:bold;letter-spacing:3px;color:#000000;">PAYMENT RECEIPT</td>
    </tr></table>
  </td></tr>

  <!-- acid strip -->
  <tr><td style="background-color:#EAFF00;padding:8px 0;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">PAID &#10038; CONFIRMED &#10038; PACK YOUR BAGS &#10038; PAID &#10038; CONFIRMED &#10038; PACK YOUR BAGS &#10038; PAID &#10038; CONFIRMED &#10038;</div>
  </td></tr>

  <!-- hero -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:44px 32px 20px;">
    <div style="font-family:{mono};font-size:11px;letter-spacing:5px;color:#EAFF00;text-transform:uppercase;">// PAYMENT CONFIRMED &#10003;</div>
    <div style="font-family:{display};font-size:46px;line-height:0.95;color:#ffffff;text-transform:uppercase;margin-top:18px;font-weight:900;">
      {name}, IT'S<br/><span style="color:#EAFF00;">OFFICIAL.</span><br/><span style="color:#FF4500;font-style:italic;">{booking['destination_name'].upper()}</span><br/>IS HAPPENING.
    </div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;color:#EAFF00;margin-top:20px;">
      &ldquo;pack your bags, legend.&rdquo;
    </div>
  </td></tr>

  <!-- boarding pass -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:22px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #444444;background-color:#000000;">
      <tr><td style="padding:18px 22px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-bottom:4px;">DESTINATION</td>
            <td align="right" style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-bottom:4px;">DATES</td>
          </tr>
          <tr>
            <td style="font-family:{display};font-size:22px;color:#ffffff;text-transform:uppercase;">{booking['destination_name'].upper()}, {booking['country'].upper()}</td>
            <td align="right" style="font-family:{mono};font-size:13px;color:#EAFF00;">{booking['start_date']} &#8594; {booking['end_date']}</td>
          </tr>
          <tr><td colspan="2" style="border-bottom:1px dashed #333333;padding-top:14px;"></td></tr>
          <tr>
            <td style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-top:12px;">SQUAD &#215; TIER</td>
            <td align="right" style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;padding-top:12px;">STATUS</td>
          </tr>
          <tr>
            <td style="font-family:{display};font-size:16px;color:#ffffff;text-transform:uppercase;">&#215;{booking['travelers']} &#183; {booking['tier'].upper()}</td>
            <td align="right"><span style="font-family:{mono};font-size:11px;font-weight:bold;color:#000000;background-color:#EAFF00;padding:3px 10px;letter-spacing:2px;">CONFIRMED &#10003;</span></td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>

  <!-- receipt block -->
  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:0 32px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a2a2a;">
      <tr>
        <td style="padding:16px 22px;border-right:1px solid #2a2a2a;">
          <div style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;">AMOUNT PAID</div>
          <div style="font-family:{display};font-size:30px;color:#EAFF00;margin-top:4px;">{amount} <span style="font-size:12px;color:#777777;">USD</span></div>
        </td>
        <td style="padding:16px 22px;">
          <div style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#777777;">RECEIPT REF &#183; {paid_date}</div>
          <div style="font-family:{mono};font-size:14px;color:#ffffff;margin-top:6px;">{session_short}</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- CTA -->
  <tr><td align="center" style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:8px 32px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background-color:#FF4500;border:3px solid #EAFF00;">
        <a href="{trips_link}" style="display:inline-block;font-family:{display};font-size:18px;font-weight:900;letter-spacing:3px;color:#000000;text-decoration:none;text-transform:uppercase;padding:16px 40px;">
          VIEW MY TRIPS &#8594;
        </a>
      </td>
    </tr></table>
  </td></tr>

  <!-- bottom marquee -->
  <tr><td style="background-color:#FF4500;padding:8px 0;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038;</div>
  </td></tr>

  <!-- footer -->
  <tr><td align="center" style="background-color:#000000;padding:16px 24px;border:1px solid #1a1a1a;border-top:none;">
    <div style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#555555;text-transform:uppercase;">
      Stripe test mode receipt &mdash; TRAVELO
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


# ---------------------------------------------------------------- trip invites (email -> auto-join trip + chat)
async def _ensure_trip_room(trip: dict, user: dict) -> dict:
    room = await rooms_col.find_one({"trip_id": trip["id"]}, {"_id": 0})
    if room:
        return room
    code = _invite_code()
    while await rooms_col.find_one({"invite_code": code}):
        code = _invite_code()
    now = datetime.now(timezone.utc).isoformat()
    room = {
        "id": str(uuid.uuid4()),
        "name": trip["place"],
        "trip_id": trip["id"],
        "invite_code": code,
        "created_by": user["id"],
        "member_ids": [user["id"]],
        "members": [{"id": user["id"], "name": user["name"]}],
        "last_message": None,
        "created_at": now,
        "updated_at": now,
    }
    await rooms_col.insert_one({**room})
    return room


@api.post("/trips/{trip_id}/invite")
async def invite_to_trip(trip_id: str, req: TripInviteRequest, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    room = await _ensure_trip_room(trip, user)
    dates = f"{trip['start_date']} → {trip['end_date']}"
    sent, failed = [], []
    for email in req.emails:
        email_l = str(email).lower()
        token = secrets.token_urlsafe(24)
        await trip_invites.insert_one({
            "id": str(uuid.uuid4()),
            "token": token,
            "trip_id": trip["id"],
            "room_id": room["id"],
            "email": email_l,
            "invited_by": user["id"],
            "invited_by_name": user["name"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        link = f"{req.origin_url}/invite/{token}"
        try:
            await send_email(
                email_l,
                f"{user['name'].split(' ')[0]} added you to the {trip['place']} trip on TRAVELO",
                _invite_email_html(user["name"].split(" ")[0], trip["place"], dates, link),
            )
            sent.append({"email": email_l, "link": link})
        except Exception as e:  # noqa: BLE001
            logger.error("Invite email to %s failed: %s", email_l, e)
            failed.append({"email": email_l, "link": link, "reason": str(e)[:140]})
    await _notify(trip["id"], "info", f"{user['name']} invited {len(req.emails)} friend(s) by email. Waiting for them to say yes.")
    return {"sent": sent, "failed": failed}


@api.get("/trips/{trip_id}/invites")
async def list_trip_invites(trip_id: str, user=Depends(get_current_user)):
    await _get_trip_or_404(trip_id, user["id"])
    # token included: this endpoint is owner-only; the UI offers "copy invite link" as an email fallback
    return await trip_invites.find(
        {"trip_id": trip_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)


@api.get("/invites/{token}")
async def invite_info(token: str):
    invite = await trip_invites.find_one({"token": token}, {"_id": 0})
    if not invite:
        raise HTTPException(404, "Invite not found or expired")
    trip = await trip_plans.find_one({"id": invite["trip_id"]}, {"_id": 0})
    if not trip:
        raise HTTPException(404, "Trip no longer exists")
    return {
        "status": invite["status"],
        "invited_by_name": invite["invited_by_name"],
        "email": invite["email"],
        "trip": {
            "place": trip["place"],
            "start_date": trip["start_date"],
            "end_date": trip["end_date"],
            "member_count": len(trip.get("members", [])),
            "budget": trip.get("budget"),
        },
    }


@api.post("/invites/{token}/accept")
async def accept_invite(token: str, user=Depends(get_current_user)):
    invite = await trip_invites.find_one({"token": token}, {"_id": 0})
    if not invite:
        raise HTTPException(404, "Invite not found or expired")
    trip = await trip_plans.find_one({"id": invite["trip_id"]}, {"_id": 0})
    if not trip:
        raise HTTPException(404, "Trip no longer exists")
    # add to trip members (linked to their account) if not present
    already = any(m.get("user_id") == user["id"] for m in trip.get("members", []))
    if not already and trip["user_id"] != user["id"]:
        member = {
            "id": str(uuid.uuid4()),
            "name": user["name"],
            "contribution": 0.0,
            "payment_handle": "",
            "is_owner": False,
            "user_id": user["id"],
        }
        await trip_plans.update_one({"id": trip["id"]}, {"$push": {"members": member}})
        await _notify(trip["id"], "info", f"{user['name']} accepted the email invite and joined the {trip['place']} squad!")
    # join the squad chat room
    room = await rooms_col.find_one({"id": invite["room_id"]}, {"_id": 0})
    if room and user["id"] not in room["member_ids"]:
        await rooms_col.update_one(
            {"id": room["id"]},
            {"$push": {"member_ids": user["id"], "members": {"id": user["id"], "name": user["name"]}},
             "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        await room_messages.insert_one({
            "id": str(uuid.uuid4()), "room_id": room["id"], "user_id": "system",
            "user_name": "TRAVELO", "type": "system",
            "text": f"{user['name']} accepted the invite and joined the squad. Say hi!",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await trip_invites.update_one({"token": token}, {"$set": {"status": "accepted", "accepted_by": user["id"],
                                                              "accepted_at": datetime.now(timezone.utc).isoformat()}})
    return {"trip_id": trip["id"], "room_id": invite["room_id"], "place": trip["place"]}


# ---------------------------------------------------------------- destination intel guide (AI + wikipedia images)
GUIDE_PROMPT = (
    "You are TRAVELO's destination intelligence writer. Create a rich travel guide for {name}, {country}. "
    "Return ONLY raw valid JSON (no markdown fences) with exactly these keys: "
    "overview (an engaging 150-word paragraph: history, culture, vibe — real knowledge, no fluff), "
    "top_spots (array of exactly 7 objects: {{name (real famous place), description (2-3 factual sentences), "
    "why_go (one punchy sentence), best_time (short, e.g. 'sunrise' or 'Oct-Mar')}}), "
    "underrated (array of exactly 4 objects: {{name (real lesser-known/hidden place nearby), description (2 factual sentences why it's a hidden gem)}}), "
    "getting_there (object: {{by_air (nearest airport + how to reach the destination from it), "
    "by_train (nearest railway station + connection details, or 'No rail access' + alternative), "
    "by_road (major highways/bus routes and drive times from the nearest big city)}}), "
    "getting_around (2 sentences on local transport: metro/taxis/rickshaws/rentals with rough costs), "
    "food (array of exactly 5 objects: {{dish (must-try local dish/drink), description (one sentence)}}), "
    "tips (array of exactly 5 short practical traveler tips: money, etiquette, safety, timing, packing)."
)


async def _wiki_thumb(client, query: str) -> Optional[str]:
    try:
        r = await client.get(
            f"https://en.wikipedia.org/api/rest_v1/page/summary/{query.replace(' ', '_')}",
            timeout=8, follow_redirects=True,
        )
        if r.status_code == 200:
            data = r.json()
            thumb = (data.get("thumbnail") or {}).get("source")
            if thumb:
                return thumb  # native thumbnail size — upscaling 404s on small originals
    except Exception:  # noqa: BLE001
        pass
    return None


@api.get("/destinations/{dest_id}/guide")
async def destination_guide(dest_id: str):
    import json as _json
    import httpx
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    dest = DEST_MAP.get(dest_id)
    if not dest:
        raise HTTPException(404, "Destination not found")
    cached = await guides_col.find_one({"destination_id": dest_id}, {"_id": 0})
    if cached:
        return cached["data"]

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(503, "Guide engine unavailable")
    try:
        chat = LlmChat(
            api_key=key,
            session_id=f"guide-{dest_id}-{uuid.uuid4()}",
            system_message="You write factual, vivid travel guides and answer in strict JSON only.",
        ).with_model("openai", "gpt-5.4")
        response = await chat.send_message(UserMessage(text=GUIDE_PROMPT.format(name=dest["name"], country=dest["country"])))
        text = response if isinstance(response, str) else str(response)
        start, end = text.find("{"), text.rfind("}")
        data = _json.loads(text[start:end + 1])
    except Exception as e:  # noqa: BLE001
        logger.error("Guide generation failed for %s: %s", dest_id, e)
        raise HTTPException(502, "Guide generation failed — try again in a moment")

    # enrich spots with wikipedia images (parallel)
    async with httpx.AsyncClient(headers={
        "User-Agent": "TraveloGuide/1.0 (https://travelo.app; contact@travelo.app) python-httpx",
        "Accept": "application/json",
    }) as client:
        spots = data.get("top_spots", [])[:7]
        gems = data.get("underrated", [])[:4]
        thumbs = await asyncio.gather(
            *[_wiki_thumb(client, s.get("name", "")) for s in spots],
            *[_wiki_thumb(client, g.get("name", "")) for g in gems],
        )
    for i, s in enumerate(spots):
        s["image"] = thumbs[i] or dest["image"]
    for j, g in enumerate(gems):
        g["image"] = thumbs[len(spots) + j] or dest["image"]
    data["top_spots"] = spots
    data["underrated"] = gems
    data["destination_id"] = dest_id

    await guides_col.insert_one({"destination_id": dest_id, "data": data,
                                 "generated_at": datetime.now(timezone.utc).isoformat()})
    return data


# ---------------------------------------------------------------- voice transcription (whisper-1)
VOICE_MAX_BYTES = 10 * 1024 * 1024  # 10MB voice notes
VOICE_EXTS = {"webm", "mp4", "mp3", "wav", "m4a", "mpeg", "mpga", "ogg"}


@api.post("/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...), language: Optional[str] = Form(None), user=Depends(get_current_user)):
    from emergentintegrations.llm.openai import OpenAISpeechToText

    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        raise HTTPException(503, "Transcription unavailable")
    lang = language if language in {"en", "hi"} else None
    content_type = (file.content_type or "").lower()
    ext = re.sub(r"[^a-z0-9]", "", (file.filename or "voice.webm").rsplit(".", 1)[-1].lower()) or "webm"
    if ext == "ogg":
        ext = "webm"  # whisper accepts webm container for opus audio
    if ext not in VOICE_EXTS:
        ext = "webm"
    data = await file.read()
    if len(data) > VOICE_MAX_BYTES:
        raise HTTPException(413, "Voice note too large (max 10MB)")
    if len(data) < 800:
        raise HTTPException(400, "Recording too short — hold the mic and speak")
    tmp_path = UPLOADS_DIR / f"voice_{uuid.uuid4()}.{ext}"
    try:
        with open(tmp_path, "wb") as f:
            f.write(data)
        stt = OpenAISpeechToText(api_key=key)
        kwargs = {"model": "whisper-1", "response_format": "json",
                  "prompt": "A traveler talking to a travel assistant about trips, destinations, packing, food and plans."}
        if lang:
            kwargs["language"] = lang
        with open(tmp_path, "rb") as audio_file:
            response = await stt.transcribe(file=audio_file, **kwargs)
        text = (getattr(response, "text", "") or "").strip()
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        logger.error("Transcription failed (%s, %d bytes): %s", content_type, len(data), e)
        raise HTTPException(502, "Could not transcribe — try again")
    finally:
        tmp_path.unlink(missing_ok=True)


# ---------------------------------------------------------------- pre-trip hype reminders (T-minus 3 days)
DEFAULT_CHECKLIST = [
    "Passport / ID + printed & digital copies",
    "Phone charger + power bank (fully juiced)",
    "Weather-appropriate layers — check the forecast tonight",
    "Comfortable walking shoes (broken in, not brand new)",
    "Meds, band-aids and that one painkiller someone always needs",
    "Sunscreen + sunglasses (non-negotiable)",
    "Cash in small notes + one backup card",
    "Reusable water bottle",
    "Offline maps downloaded for the destination",
    "Good vibes. Leave the drama at home.",
]

PACKING_PROMPT = (
    "You write hype pre-trip emails for TRAVELO. A squad leaves for {place} on {start_date}. "
    "Return ONLY raw valid JSON (no fences) with keys: "
    "hype_line (one savage-but-loving sentence, max 90 chars, to fire up the squad), "
    "checklist (array of exactly 10 short packing checklist items SPECIFIC to {place} and its typical weather/culture — "
    "practical, punchy, max 60 chars each)."
)


async def _reminder_content(place: str, start_date: str) -> dict:
    import json as _json
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    key = os.environ.get("EMERGENT_LLM_KEY")
    fallback = {"hype_line": "3 days. Pack smart, sleep early, dream big.", "checklist": DEFAULT_CHECKLIST}
    if not key:
        return fallback
    try:
        chat = LlmChat(api_key=key, session_id=f"remind-{uuid.uuid4()}",
                       system_message="You answer in strict JSON only.").with_model("openai", "gpt-5.4")
        resp = await chat.send_message(UserMessage(text=PACKING_PROMPT.format(place=place, start_date=start_date)))
        text = resp if isinstance(resp, str) else str(resp)
        data = _json.loads(text[text.find("{"):text.rfind("}") + 1])
        checklist = [str(x)[:70] for x in (data.get("checklist") or [])][:10] or DEFAULT_CHECKLIST
        return {"hype_line": str(data.get("hype_line") or fallback["hype_line"])[:110], "checklist": checklist}
    except Exception as e:  # noqa: BLE001
        logger.error("Reminder content generation failed: %s", e)
        return fallback


def _reminder_email_html(place: str, dates: str, squad: int, days_left: int, hype: str,
                         checklist: List[str], link: str) -> str:
    display = "'Arial Black', Impact, 'Helvetica Neue', Arial, sans-serif"
    mono = "'Courier New', Courier, monospace"
    items = "".join(
        f'<tr><td style="padding:9px 18px;border-bottom:1px dashed #2a2a2a;font-family:{mono};font-size:13px;color:#dddddd;">'
        f'<span style="color:#EAFF00;font-weight:bold;">&#9744;</span>&nbsp;&nbsp;{item}</td></tr>'
        for item in checklist
    )
    return f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background-color:#030303;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#030303;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <tr><td style="background-color:#FF4500;padding:14px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:{display};font-size:24px;font-weight:900;letter-spacing:4px;color:#000000;">TRAVELO &#9992;</td>
      <td align="right" style="font-family:{mono};font-size:10px;font-weight:bold;letter-spacing:3px;color:#000000;">T-MINUS {days_left} DAYS</td>
    </tr></table>
  </td></tr>

  <tr><td style="background-color:#EAFF00;padding:8px 0;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">{place.upper()} &#10038; PACK YOUR BAGS &#10038; {place.upper()} &#10038; PACK YOUR BAGS &#10038; {place.upper()} &#10038; PACK YOUR BAGS &#10038;</div>
  </td></tr>

  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:44px 32px 20px;">
    <div style="font-family:{mono};font-size:11px;letter-spacing:5px;color:#EAFF00;text-transform:uppercase;">// FINAL COUNTDOWN</div>
    <div style="font-family:{display};font-size:52px;line-height:0.92;color:#ffffff;text-transform:uppercase;margin-top:18px;font-weight:900;">
      {days_left} DAYS<br/>UNTIL<br/><span style="color:#FF4500;font-style:italic;">{place.upper()}.</span>
    </div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:17px;color:#EAFF00;margin-top:20px;">
      &ldquo;{hype}&rdquo;
    </div>
    <div style="font-family:{mono};font-size:11px;letter-spacing:2px;color:#888888;margin-top:16px;text-transform:uppercase;">
      {dates} &#183; squad of {squad}
    </div>
  </td></tr>

  <tr><td style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:10px 32px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed #444444;background-color:#000000;">
      <tr><td style="background-color:#EAFF00;padding:10px 18px;font-family:{display};font-size:16px;font-weight:900;letter-spacing:3px;color:#000000;text-transform:uppercase;">
        THE PACKING CHECKLIST
      </td></tr>
      {items}
    </table>
  </td></tr>

  <tr><td align="center" style="background-color:#0a0a0a;border-left:1px solid #2a2a2a;border-right:1px solid #2a2a2a;padding:8px 32px 40px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="background-color:#FF4500;border:3px solid #EAFF00;">
        <a href="{link}" style="display:inline-block;font-family:{display};font-size:18px;font-weight:900;letter-spacing:3px;color:#000000;text-decoration:none;text-transform:uppercase;padding:16px 40px;">
          OPEN THE TRIP PLAN &#8594;
        </a>
      </td>
    </tr></table>
  </td></tr>

  <tr><td style="background-color:#FF4500;padding:8px 0;">
    <div style="font-family:{display};font-size:13px;font-weight:900;letter-spacing:3px;color:#000000;white-space:nowrap;overflow:hidden;">STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038; STOP DREAMING &#10038; START PACKING &#10038;</div>
  </td></tr>

  <tr><td align="center" style="background-color:#000000;padding:16px 24px;border:1px solid #1a1a1a;border-top:none;">
    <div style="font-family:{mono};font-size:9px;letter-spacing:3px;color:#555555;text-transform:uppercase;">
      See you at the airport. &mdash; TRAVELO
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


async def _trip_squad_emails(trip: dict) -> List[str]:
    emails = set()
    owner = await users_col.find_one({"id": trip["user_id"]}, {"_id": 0, "email": 1})
    if owner and owner.get("email"):
        emails.add(owner["email"])
    for m in trip.get("members", []):
        if m.get("user_id"):
            u = await users_col.find_one({"id": m["user_id"]}, {"_id": 0, "email": 1})
            if u and u.get("email"):
                emails.add(u["email"])
    async for inv in trip_invites.find({"trip_id": trip["id"], "status": "accepted"}, {"_id": 0, "email": 1}):
        if inv.get("email"):
            emails.add(inv["email"])
    return sorted(emails)


async def _send_trip_reminder(trip: dict, days_left: int) -> List[str]:
    recipients = await _trip_squad_emails(trip)
    if not recipients:
        return []
    content = await _reminder_content(trip["place"], trip["start_date"])
    origin = trip.get("origin_url") or os.environ.get("APP_URL", "")
    link = f"{origin}/planner/{trip['id']}" if origin else "#"
    dates = f"{trip['start_date']} → {trip['end_date']}"
    html = _reminder_email_html(trip["place"], dates, len(trip.get("members", [])),
                                days_left, content["hype_line"], content["checklist"], link)
    sent = []
    for email in recipients:
        try:
            await send_email(email, f"{days_left} days until {trip['place']} — the packing checklist is here 🔥", html)
            sent.append(email)
        except Exception as e:  # noqa: BLE001
            logger.error("Reminder email to %s failed: %s", email, e)
    await trip_plans.update_one({"id": trip["id"]}, {"$set": {"reminder_sent": True,
                                                              "reminder_sent_at": datetime.now(timezone.utc).isoformat()}})
    await _notify(trip["id"], "info", f"Pre-trip hype email + packing checklist sent to {len(sent)} squad member(s).")
    return sent


@api.post("/trips/{trip_id}/send-reminder")
async def send_reminder_now(trip_id: str, user=Depends(get_current_user)):
    trip = await _get_trip_or_404(trip_id, user["id"])
    try:
        start = datetime.fromisoformat(trip["start_date"]).date()
        days_left = max(0, (start - datetime.now(timezone.utc).date()).days)
    except ValueError:
        days_left = 3
    sent = await _send_trip_reminder(trip, days_left or 3)
    return {"sent": sent}


async def _reminder_loop():
    """Hourly scan: trips departing within 3 days that haven't been hyped yet."""
    while True:
        try:
            today = datetime.now(timezone.utc).date()
            async for trip in trip_plans.find({"reminder_sent": {"$ne": True}}, {"_id": 0}):
                try:
                    start = datetime.fromisoformat(trip["start_date"]).date()
                except (ValueError, KeyError):
                    continue
                days_left = (start - today).days
                if 0 <= days_left <= 3:
                    logger.info("Auto reminder firing for trip %s (%s, T-%d)", trip["id"], trip["place"], days_left)
                    await _send_trip_reminder(trip, days_left)
        except Exception as e:  # noqa: BLE001
            logger.error("Reminder loop error: %s", e)
        await asyncio.sleep(3600)


# ---------------------------------------------------------------- read receipts (squad chat)
@api.post("/rooms/{room_id}/read")
async def mark_room_read(room_id: str, user=Depends(get_current_user)):
    await _get_room_for_member(room_id, user["id"])
    await rooms_col.update_one(
        {"id": room_id},
        {"$set": {f"reads.{user['id']}": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True}


@api.get("/rooms/{room_id}/reads")
async def get_room_reads(room_id: str, user=Depends(get_current_user)):
    room = await _get_room_for_member(room_id, user["id"])
    return room.get("reads", {})


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
    # Hourly pre-trip reminder scanner
    asyncio.create_task(_reminder_loop())


def _setup_catalog():
    try:
        setup_stripe.run()
        logger.info("Stripe catalog verified/created")
    except Exception as e:  # noqa: BLE001
        logger.error("Stripe catalog setup failed: %s", e)


@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()
