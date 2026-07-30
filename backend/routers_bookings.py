import random
import string
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from db import db
from auth import get_current_user
from models import SearchRequest, BookingCreate, utcnow
from providers import provider

bookings_router = APIRouter(prefix="/bookings")


def gen_pnr():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


def booking_public(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


@bookings_router.post("/search")
async def search(body: SearchRequest, user: dict = Depends(get_current_user)):
    if body.type == "flight":
        if not body.origin:
            raise HTTPException(status_code=400, detail="Origin is required for flights")
        results = provider.search_flights(body.origin, body.destination, body.date, body.passengers, body.travel_class)
    elif body.type == "train":
        if not body.origin:
            raise HTTPException(status_code=400, detail="Origin is required for trains")
        results = provider.search_trains(body.origin, body.destination, body.date, body.passengers, body.travel_class)
    elif body.type == "hotel":
        results = provider.search_hotels(body.destination, body.date, body.nights, body.rooms)
    else:
        raise HTTPException(status_code=400, detail="Invalid search type")
    return {"results": results, "type": body.type}


@bookings_router.post("")
async def create_booking(body: BookingCreate, user: dict = Depends(get_current_user)):
    if body.type not in ("flight", "train", "hotel"):
        raise HTTPException(status_code=400, detail="Invalid booking type")
    if not body.passengers:
        raise HTTPException(status_code=400, detail="At least one traveller is required")
    if body.type == "hotel":
        unit = float(body.item.get("price_per_night", 0))
        amount = unit * body.nights * body.rooms
    else:
        unit = float(body.item.get("price", 0))
        amount = unit * len(body.passengers)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid item price")
    doc = {
        "user_id": str(user["_id"]),
        "type": body.type,
        "item": body.item,
        "passengers": [p.model_dump() for p in body.passengers],
        "contact_email": body.contact_email,
        "contact_phone": body.contact_phone,
        "origin": body.origin,
        "destination": body.destination,
        "travel_date": body.travel_date,
        "nights": body.nights,
        "rooms": body.rooms,
        "amount": round(amount, 2),
        "currency": "INR",
        "status": "pending_payment",
        "pnr": gen_pnr(),
        "created_at": utcnow(),
    }
    result = await db.bookings.insert_one(doc)
    doc["_id"] = result.inserted_id
    return booking_public(doc)


@bookings_router.get("")
async def list_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(200)
    return [booking_public(d) for d in docs]


@bookings_router.get("/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    try:
        doc = await db.bookings.find_one({"_id": ObjectId(booking_id), "user_id": str(user["_id"])})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid booking id")
    if not doc:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking_public(doc)
