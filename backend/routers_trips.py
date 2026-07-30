import uuid
import secrets
from urllib.parse import quote
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from db import db
from auth import get_current_user
from models import TripCreate, TripMemberIn, ContributionUpdate, ExpenseCreate, SettlementCreate, RemindRequest, utcnow

trips_router = APIRouter(prefix="/trips")
notifications_router = APIRouter(prefix="/notifications")


def upi_link(vpa, name, amount):
    return f"upi://pay?pa={vpa}&pn={quote(name)}&am={amount:.2f}&cu=INR"


async def notify(user_id, ntype, title, message, data=None):
    await db.notifications.insert_one({
        "user_id": user_id, "type": ntype, "title": title, "message": message,
        "data": data or {}, "read": False, "created_at": utcnow(),
    })


def trip_public(doc):
    doc["id"] = str(doc.pop("_id"))
    return doc


async def make_member(name, email):
    email = email.strip().lower()
    linked = await db.users.find_one({"email": email})
    return {
        "member_id": uuid.uuid4().hex[:10],
        "name": name.strip() or email.split("@")[0].title(),
        "email": email,
        "user_id": str(linked["_id"]) if linked else None,
        "contribution": 0.0,
    }


async def get_trip_or_404(trip_id, user):
    try:
        doc = await db.trips.find_one({"_id": ObjectId(trip_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid trip id")
    if not doc:
        raise HTTPException(status_code=404, detail="Trip not found")
    uid, email = str(user["_id"]), user["email"]
    if not any(m.get("user_id") == uid or m.get("email") == email for m in doc["members"]):
        raise HTTPException(status_code=403, detail="You are not a member of this trip")
    return doc


@trips_router.post("")
async def create_trip(body: TripCreate, user: dict = Depends(get_current_user)):
    organizer = await make_member(user.get("name", "Organizer"), user["email"])
    organizer["user_id"] = str(user["_id"])
    members = [organizer]
    for m in body.members:
        if m.email.strip().lower() == user["email"]:
            continue
        members.append(await make_member(m.name, m.email))
    doc = {
        "name": body.name, "destination": body.destination,
        "start_date": body.start_date, "end_date": body.end_date,
        "organizer_id": str(user["_id"]), "organizer_member_id": organizer["member_id"],
        "budget_total": body.budget_total, "budget_categories": body.budget_categories,
        "members": members, "invite_code": secrets.token_urlsafe(6),
        "created_at": utcnow(),
    }
    result = await db.trips.insert_one(doc)
    for m in members[1:]:
        if m["user_id"]:
            await notify(m["user_id"], "trip_invite", "Added to a trip",
                         f"{user.get('name')} added you to \"{body.name}\" ({body.destination})",
                         {"trip_id": str(result.inserted_id)})
    doc["_id"] = result.inserted_id
    return trip_public(doc)


@trips_router.get("")
async def list_trips(user: dict = Depends(get_current_user)):
    docs = await db.trips.find({"$or": [
        {"members.user_id": str(user["_id"])},
        {"members.email": user["email"]},
    ]}).sort("created_at", -1).to_list(100)
    return [trip_public(d) for d in docs]


class JoinRequest(BaseModel):
    code: str


@trips_router.post("/join")
async def join_trip(body: JoinRequest, user: dict = Depends(get_current_user)):
    doc = await db.trips.find_one({"invite_code": body.code.strip()})
    if not doc:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    uid, email = str(user["_id"]), user["email"]
    for m in doc["members"]:
        if m.get("email") == email:
            if not m.get("user_id"):
                await db.trips.update_one({"_id": doc["_id"], "members.email": email},
                                          {"$set": {"members.$.user_id": uid}})
            return {"trip_id": str(doc["_id"]), "joined": True}
    member = await make_member(user.get("name", ""), email)
    member["user_id"] = uid
    await db.trips.update_one({"_id": doc["_id"]}, {"$push": {"members": member}})
    await notify(doc["organizer_id"], "member_joined", "New trip member",
                 f"{user.get('name')} joined \"{doc['name']}\"", {"trip_id": str(doc["_id"])})
    return {"trip_id": str(doc["_id"]), "joined": True}


@trips_router.get("/{trip_id}")
async def get_trip(trip_id: str, user: dict = Depends(get_current_user)):
    doc = await get_trip_or_404(trip_id, user)
    return trip_public(doc)


@trips_router.post("/{trip_id}/members")
async def add_member(trip_id: str, body: TripMemberIn, user: dict = Depends(get_current_user)):
    doc = await get_trip_or_404(trip_id, user)
    email = body.email.strip().lower()
    if any(m["email"] == email for m in doc["members"]):
        raise HTTPException(status_code=409, detail="Member already in trip")
    member = await make_member(body.name, email)
    await db.trips.update_one({"_id": doc["_id"]}, {"$push": {"members": member}})
    if member["user_id"]:
        await notify(member["user_id"], "trip_invite", "Added to a trip",
                     f"{user.get('name')} added you to \"{doc['name']}\"", {"trip_id": trip_id})
    return member


@trips_router.put("/{trip_id}/contribution")
async def set_contribution(trip_id: str, body: ContributionUpdate, user: dict = Depends(get_current_user)):
    doc = await get_trip_or_404(trip_id, user)
    uid = str(user["_id"])
    await db.trips.update_one({"_id": doc["_id"], "members.user_id": uid},
                              {"$set": {"members.$.contribution": body.contribution}})
    return {"ok": True}


def build_splits(amount, split_type, splits_in, members):
    member_ids = {m["member_id"] for m in members}
    if split_type == "equal":
        targets = [s.member_id for s in splits_in if s.member_id in member_ids] or list(member_ids)
        share = round(amount / len(targets), 2)
        splits = [{"member_id": mid, "amount": share} for mid in targets]
        splits[-1]["amount"] = round(amount - share * (len(targets) - 1), 2)
        return splits
    if split_type == "custom":
        splits = [{"member_id": s.member_id, "amount": round(s.amount or 0, 2)} for s in splits_in if s.member_id in member_ids]
        if abs(sum(s["amount"] for s in splits) - amount) > 0.05:
            raise HTTPException(status_code=400, detail="Custom split amounts must add up to the total")
        return splits
    if split_type == "percentage":
        pct_total = sum(s.percent or 0 for s in splits_in)
        if abs(pct_total - 100) > 0.1:
            raise HTTPException(status_code=400, detail="Percentages must add up to 100")
        splits = [{"member_id": s.member_id, "amount": round(amount * (s.percent or 0) / 100, 2)} for s in splits_in if s.member_id in member_ids]
        drift = round(amount - sum(s["amount"] for s in splits), 2)
        if splits:
            splits[-1]["amount"] = round(splits[-1]["amount"] + drift, 2)
        return splits
    raise HTTPException(status_code=400, detail="Invalid split type")


@trips_router.post("/{trip_id}/expenses")
async def add_expense(trip_id: str, body: ExpenseCreate, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    members = trip["members"]
    if body.paid_by not in {m["member_id"] for m in members}:
        raise HTTPException(status_code=400, detail="Payer is not a trip member")
    splits = build_splits(body.amount, body.split_type, body.splits, members)
    doc = {
        "trip_id": trip_id, "description": body.description, "amount": round(body.amount, 2),
        "category": body.category, "paid_by": body.paid_by, "split_type": body.split_type,
        "splits": splits, "created_by": str(user["_id"]), "created_at": utcnow(),
    }
    result = await db.expenses.insert_one(doc)
    payer = next(m for m in members if m["member_id"] == body.paid_by)
    for m in members:
        if m.get("user_id") and m["user_id"] != str(user["_id"]):
            await notify(m["user_id"], "expense_added", f"New expense in {trip['name']}",
                         f"{payer['name']} paid ₹{body.amount:,.0f} for {body.description}",
                         {"trip_id": trip_id})
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@trips_router.get("/{trip_id}/expenses")
async def list_expenses(trip_id: str, user: dict = Depends(get_current_user)):
    await get_trip_or_404(trip_id, user)
    docs = await db.expenses.find({"trip_id": trip_id}).sort("created_at", -1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def compute_balances(trip):
    trip_id = str(trip["_id"])
    expenses = await db.expenses.find({"trip_id": trip_id}).to_list(1000)
    settlements = await db.settlements.find({"trip_id": trip_id, "status": "settled"}).to_list(1000)
    net = {m["member_id"]: 0.0 for m in trip["members"]}
    by_category = {}
    for e in expenses:
        if e["paid_by"] in net:
            net[e["paid_by"]] += e["amount"]
        for s in e["splits"]:
            if s["member_id"] in net:
                net[s["member_id"]] -= s["amount"]
        by_category[e["category"]] = by_category.get(e["category"], 0) + e["amount"]
    for st in settlements:
        if st["from_member_id"] in net:
            net[st["from_member_id"]] += st["amount"]
        if st["to_member_id"] in net:
            net[st["to_member_id"]] -= st["amount"]
    debtors = sorted([[m, -v] for m, v in net.items() if v < -0.01], key=lambda x: -x[1])
    creditors = sorted([[m, v] for m, v in net.items() if v > 0.01], key=lambda x: -x[1])
    suggestions = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        amt = min(debtors[i][1], creditors[j][1])
        suggestions.append({"from_member_id": debtors[i][0], "to_member_id": creditors[j][0], "amount": round(amt, 2)})
        debtors[i][1] -= amt
        creditors[j][1] -= amt
        if debtors[i][1] < 0.01:
            i += 1
        if creditors[j][1] < 0.01:
            j += 1
    return {
        "net": {k: round(v, 2) for k, v in net.items()},
        "suggestions": suggestions,
        "total_spent": round(sum(e["amount"] for e in expenses), 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "budget_total": trip.get("budget_total", 0),
    }


async def creditor_upi(trip, to_member_id, amount):
    to_m = next((m for m in trip["members"] if m["member_id"] == to_member_id), None)
    if to_m and to_m.get("user_id"):
        u = await db.users.find_one({"_id": ObjectId(to_m["user_id"])})
        if u and u.get("upi_vpa"):
            return upi_link(u["upi_vpa"], to_m["name"], amount)
    return None


@trips_router.get("/{trip_id}/balances")
async def get_balances(trip_id: str, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    balances = await compute_balances(trip)
    for s in balances["suggestions"]:
        s["upi_link"] = await creditor_upi(trip, s["to_member_id"], s["amount"])
    settled = await db.settlements.find({"trip_id": trip_id}).sort("created_at", -1).to_list(200)
    for d in settled:
        d["id"] = str(d.pop("_id"))
    balances["settlements"] = settled
    return balances


@trips_router.post("/{trip_id}/settlements")
async def mark_settled(trip_id: str, body: SettlementCreate, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    ids = {m["member_id"] for m in trip["members"]}
    if body.from_member_id not in ids or body.to_member_id not in ids:
        raise HTTPException(status_code=400, detail="Invalid member")
    doc = {
        "trip_id": trip_id, "from_member_id": body.from_member_id, "to_member_id": body.to_member_id,
        "amount": round(body.amount, 2), "method": body.method, "note": body.note,
        "status": "settled", "created_by": str(user["_id"]), "created_at": utcnow(),
    }
    result = await db.settlements.insert_one(doc)
    from_m = next(m for m in trip["members"] if m["member_id"] == body.from_member_id)
    to_m = next(m for m in trip["members"] if m["member_id"] == body.to_member_id)
    if to_m.get("user_id"):
        await notify(to_m["user_id"], "settlement", "Payment marked as settled",
                     f"{from_m['name']} settled ₹{body.amount:,.0f} for \"{trip['name']}\"",
                     {"trip_id": trip_id})
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@trips_router.post("/{trip_id}/remind")
async def send_reminder(trip_id: str, body: RemindRequest, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    from_m = next((m for m in trip["members"] if m["member_id"] == body.from_member_id), None)
    to_m = next((m for m in trip["members"] if m["member_id"] == body.to_member_id), None)
    if not from_m or not to_m:
        raise HTTPException(status_code=400, detail="Invalid member")
    if not from_m.get("user_id"):
        raise HTTPException(status_code=400, detail=f"{from_m['name']} hasn't joined Travelo yet")
    link = await creditor_upi(trip, body.to_member_id, body.amount)
    await notify(from_m["user_id"], "payment_due", f"You owe ₹{body.amount:,.0f}",
                 f"You owe ₹{body.amount:,.0f} to {to_m['name']} for \"{trip['name']}\"",
                 {"trip_id": trip_id, "amount": body.amount, "upi_link": link,
                  "from_member_id": body.from_member_id, "to_member_id": body.to_member_id})
    return {"ok": True, "upi_link": link}


@notifications_router.get("")
async def list_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": str(user["_id"])}).sort("created_at", -1).to_list(50)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


@notifications_router.post("/read/{notification_id}")
async def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    try:
        await db.notifications.update_one({"_id": ObjectId(notification_id), "user_id": str(user["_id"])},
                                          {"$set": {"read": True}})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid notification id")
    return {"ok": True}


@notifications_router.post("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": str(user["_id"])}, {"$set": {"read": True}})
    return {"ok": True}
