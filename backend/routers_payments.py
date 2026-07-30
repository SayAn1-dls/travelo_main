import os
import stripe
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from db import db
from auth import get_current_user
from models import CheckoutRequest, csym, utcnow

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

payments_router = APIRouter()

_tax_supported = True

ZERO_DECIMAL = {"jpy"}


def create_session(name, amount, currency, success_url, cancel_url, metadata):
    global _tax_supported
    unit_amount = int(round(amount)) if currency in ZERO_DECIMAL else int(round(amount * 100))
    kwargs = dict(
        line_items=[{
            "price_data": {"currency": currency, "product_data": {"name": name}, "unit_amount": unit_amount},
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    if _tax_supported:
        try:
            return stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True}, billing_address_collection="required")
        except stripe.error.InvalidRequestError:
            _tax_supported = False
    return stripe.checkout.Session.create(**kwargs)


@payments_router.post("/payments/checkout")
async def create_checkout(body: CheckoutRequest, user: dict = Depends(get_current_user)):
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/payment/cancel"
    metadata = {"user_id": str(user["_id"]), "purpose": body.purpose}
    currency = "inr"

    if body.purpose == "booking":
        if not body.booking_id:
            raise HTTPException(status_code=400, detail="booking_id required")
        booking = await db.bookings.find_one({"_id": ObjectId(body.booking_id), "user_id": str(user["_id"])})
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] == "confirmed":
            raise HTTPException(status_code=400, detail="Booking already paid")
        amount = float(booking["amount"])
        name = f"Travelo {booking['type'].title()} Booking — {booking['destination']} (PNR {booking['pnr']})"
        metadata["booking_id"] = body.booking_id
    elif body.purpose == "settlement":
        if not (body.trip_id and body.from_member_id and body.to_member_id):
            raise HTTPException(status_code=400, detail="trip_id, from_member_id, to_member_id required")
        from routers_trips import get_trip_or_404, compute_balances
        trip = await get_trip_or_404(body.trip_id, user)
        balances = await compute_balances(trip)
        match = next((s for s in balances["suggestions"]
                      if s["from_member_id"] == body.from_member_id and s["to_member_id"] == body.to_member_id), None)
        if not match:
            raise HTTPException(status_code=400, detail="No outstanding balance between these members")
        amount = float(match["amount"])
        currency = trip.get("currency", "INR").lower()
        to_m = next(m for m in trip["members"] if m["member_id"] == body.to_member_id)
        name = f"Trip settlement — pay {to_m['name']} for \"{trip['name']}\""
        metadata.update({"trip_id": body.trip_id, "from_member_id": body.from_member_id, "to_member_id": body.to_member_id})
    else:
        raise HTTPException(status_code=400, detail="Invalid purpose")

    if amount < 1:
        raise HTTPException(status_code=400, detail="Amount too small")

    try:
        session = create_session(name, amount, currency, success_url, cancel_url, metadata)
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=502, detail=f"Payment provider error: {e.user_message or 'try again'}")

    await db.payment_transactions.insert_one({
        "session_id": session.id, "user_id": str(user["_id"]), "purpose": body.purpose,
        "amount": amount, "currency": currency, "metadata": metadata,
        "status": "initiated", "payment_status": "pending",
        "created_at": utcnow(), "updated_at": utcnow(),
    })
    return {"checkout_url": session.url, "session_id": session.id}


async def apply_success(session_id: str, meta_fallback: dict = None):
    """Idempotently mark paid + run side effects (confirm booking / record settlement)."""
    prev = await db.payment_transactions.find_one_and_update(
        {"session_id": session_id, "payment_status": {"$ne": "paid"}},
        {"$set": {"status": "completed", "payment_status": "paid", "updated_at": utcnow()}},
    )
    if not prev:
        return
    meta = prev.get("metadata") or meta_fallback or {}
    purpose = meta.get("purpose") or prev.get("purpose")
    if purpose == "booking" and meta.get("booking_id"):
        booking = await db.bookings.find_one_and_update(
            {"_id": ObjectId(meta["booking_id"])},
            {"$set": {"status": "confirmed", "paid_at": utcnow()}},
        )
        if booking:
            await db.notifications.insert_one({
                "user_id": booking["user_id"], "type": "booking_confirmed",
                "title": "Booking confirmed",
                "message": f"Your {booking['type']} to {booking['destination']} is confirmed. PNR {booking['pnr']}",
                "data": {"booking_id": meta["booking_id"]}, "read": False, "created_at": utcnow(),
            })
    elif purpose == "settlement" and meta.get("trip_id"):
        trip = await db.trips.find_one({"_id": ObjectId(meta["trip_id"])})
        if trip:
            await db.settlements.insert_one({
                "trip_id": meta["trip_id"], "from_member_id": meta["from_member_id"],
                "to_member_id": meta["to_member_id"], "amount": prev["amount"],
                "method": "stripe", "note": "Paid via card", "status": "settled",
                "created_by": prev["user_id"], "created_at": utcnow(),
            })
            to_m = next((m for m in trip["members"] if m["member_id"] == meta["to_member_id"]), None)
            from_m = next((m for m in trip["members"] if m["member_id"] == meta["from_member_id"]), None)
            sym = csym(trip.get("currency", "INR"))
            if to_m and to_m.get("user_id"):
                await db.notifications.insert_one({
                    "user_id": to_m["user_id"], "type": "settlement",
                    "title": "Payment received",
                    "message": f"{from_m['name'] if from_m else 'A member'} paid {sym}{prev['amount']:,.0f} for \"{trip['name']}\" via card",
                    "data": {"trip_id": meta["trip_id"]}, "read": False, "created_at": utcnow(),
                })


@payments_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    record = await db.payment_transactions.find_one({"session_id": session_id})
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if record.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await apply_success(session_id, s.get("metadata"))
                record = await db.payment_transactions.find_one({"session_id": session_id})
        except stripe.error.StripeError:
            pass
    return {"session_id": record["session_id"], "status": record["status"],
            "payment_status": record["payment_status"], "purpose": record.get("purpose"),
            "metadata": {"booking_id": (record.get("metadata") or {}).get("booking_id"),
                         "trip_id": (record.get("metadata") or {}).get("trip_id")}}


@payments_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, STRIPE_WEBHOOK_SECRET)
    except (stripe.error.SignatureVerificationError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t in ("checkout.session.completed", "checkout.session.async_payment_succeeded"):
        await apply_success(obj["id"], obj.get("metadata"))
    elif t == "checkout.session.async_payment_failed":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "failed", "payment_status": "failed", "updated_at": utcnow()}})
    elif t == "checkout.session.expired":
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "expired", "payment_status": "expired", "updated_at": utcnow()}})
    return {"status": "ok"}


@payments_router.get("/payments/config")
async def payments_config():
    return {"publishable_key": os.environ.get("STRIPE_PUBLISHABLE_KEY", ""), "mode": os.environ.get("STRIPE_MODE", "test")}
