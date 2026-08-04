"""TRAVELO backend — auth, destinations, bookings, Stripe payments, quotes."""
import os
import random
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
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
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
