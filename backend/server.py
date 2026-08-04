"""TRAVELO backend — auth, destinations, bookings, Stripe payments, quotes."""
import os
import random
import threading
import logging
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

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
