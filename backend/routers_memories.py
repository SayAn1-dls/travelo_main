import uuid
import secrets
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from pydantic import BaseModel, Field
from db import db
from auth import get_current_user
from models import utcnow
from routers_trips import get_trip_or_404, compute_balances
from storage import put_object, get_object, APP_NAME

memories_router = APIRouter()

ALLOWED_IMG = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE = 8 * 1024 * 1024


def member_name_of(trip, user):
    m = next((m for m in trip["members"] if m.get("user_id") == str(user["_id"])), None)
    return m["name"] if m else user.get("name", "Member")


async def upload_image(file: UploadFile, folder: str):
    if file.content_type not in ALLOWED_IMG:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 8 MB")
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "jpg").lower()[:5]
    path = f"{APP_NAME}/{folder}/{uuid.uuid4().hex}.{ext}"
    try:
        result = await put_object(path, data, file.content_type)
    except Exception:
        raise HTTPException(status_code=502, detail="Upload failed — please try again")
    return result["path"], file.content_type


@memories_router.post("/trips/{trip_id}/memories/photo")
async def add_photo_memory(trip_id: str, caption: str = Form(""), file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    path, ctype = await upload_image(file, f"trips/{trip_id}")
    doc = {"trip_id": trip_id, "kind": "photo", "storage_path": path, "content_type": ctype,
           "caption": caption.strip()[:300], "note": None, "member_name": member_name_of(trip, user),
           "created_by": str(user["_id"]), "is_deleted": False, "created_at": utcnow()}
    result = await db.memories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


class NoteIn(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


@memories_router.post("/trips/{trip_id}/memories/note")
async def add_note_memory(trip_id: str, body: NoteIn, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    doc = {"trip_id": trip_id, "kind": "note", "storage_path": None, "content_type": None,
           "caption": "", "note": body.text.strip(), "member_name": member_name_of(trip, user),
           "created_by": str(user["_id"]), "is_deleted": False, "created_at": utcnow()}
    result = await db.memories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@memories_router.get("/trips/{trip_id}/memories")
async def list_memories(trip_id: str, user: dict = Depends(get_current_user)):
    await get_trip_or_404(trip_id, user)
    docs = await db.memories.find({"trip_id": trip_id, "is_deleted": False}).sort("created_at", -1).to_list(300)
    for d in docs:
        d["id"] = str(d.pop("_id"))
    return docs


async def get_memory_or_404(memory_id: str):
    try:
        doc = await db.memories.find_one({"_id": ObjectId(memory_id), "is_deleted": False})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid memory id")
    if not doc:
        raise HTTPException(status_code=404, detail="Memory not found")
    return doc


@memories_router.get("/memories/{memory_id}/image")
async def memory_image(memory_id: str, user: dict = Depends(get_current_user)):
    doc = await get_memory_or_404(memory_id)
    await get_trip_or_404(doc["trip_id"], user)
    if not doc.get("storage_path"):
        raise HTTPException(status_code=404, detail="No image on this memory")
    data, ctype = await get_object(doc["storage_path"])
    return Response(content=data, media_type=doc.get("content_type") or ctype)


@memories_router.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str, user: dict = Depends(get_current_user)):
    doc = await get_memory_or_404(memory_id)
    trip = await get_trip_or_404(doc["trip_id"], user)
    if doc["created_by"] != str(user["_id"]) and trip["organizer_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only the creator or organizer can delete this")
    await db.memories.update_one({"_id": doc["_id"]}, {"$set": {"is_deleted": True}})
    return {"ok": True}


@memories_router.post("/trips/{trip_id}/settlements/{settlement_id}/proof")
async def upload_settlement_proof(trip_id: str, settlement_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    await get_trip_or_404(trip_id, user)
    try:
        settlement = await db.settlements.find_one({"_id": ObjectId(settlement_id), "trip_id": trip_id})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid settlement id")
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    path, ctype = await upload_image(file, f"proofs/{trip_id}")
    await db.settlements.update_one({"_id": settlement["_id"]},
                                    {"$set": {"proof_path": path, "proof_content_type": ctype}})
    return {"ok": True, "proof_path": path}


@memories_router.get("/settlements/{settlement_id}/proof")
async def settlement_proof(settlement_id: str, user: dict = Depends(get_current_user)):
    try:
        settlement = await db.settlements.find_one({"_id": ObjectId(settlement_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid settlement id")
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found")
    await get_trip_or_404(settlement["trip_id"], user)
    if not settlement.get("proof_path"):
        raise HTTPException(status_code=404, detail="No proof uploaded")
    data, ctype = await get_object(settlement["proof_path"])
    return Response(content=data, media_type=settlement.get("proof_content_type") or ctype)


@memories_router.post("/trips/{trip_id}/recap/share")
async def create_recap_share(trip_id: str, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    token = trip.get("share_token")
    if not token:
        token = secrets.token_urlsafe(8)
        await db.trips.update_one({"_id": trip["_id"]}, {"$set": {"share_token": token}})
    return {"token": token}


async def trip_by_share_token(token: str):
    trip = await db.trips.find_one({"share_token": token})
    if not trip:
        raise HTTPException(status_code=404, detail="This recap link is invalid")
    return trip


@memories_router.get("/recap/{token}")
async def get_recap(token: str):
    trip = await trip_by_share_token(token)
    balances = await compute_balances(trip)
    memories = await db.memories.find({"trip_id": str(trip["_id"]), "is_deleted": False}).sort("created_at", 1).to_list(300)
    return {
        "name": trip["name"], "destination": trip["destination"],
        "start_date": trip["start_date"], "end_date": trip["end_date"],
        "members": [m["name"] for m in trip["members"]],
        "stats": {"total_spent": balances["total_spent"], "by_category": balances["by_category"],
                  "budget_total": trip.get("budget_total", 0)},
        "memories": [{"id": str(m["_id"]), "kind": m["kind"], "caption": m.get("caption", ""),
                      "note": m.get("note"), "member_name": m["member_name"], "created_at": m["created_at"]}
                     for m in memories],
    }


@memories_router.get("/recap/{token}/image/{memory_id}")
async def recap_image(token: str, memory_id: str):
    trip = await trip_by_share_token(token)
    try:
        doc = await db.memories.find_one({"_id": ObjectId(memory_id), "trip_id": str(trip["_id"]), "is_deleted": False})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid memory id")
    if not doc or not doc.get("storage_path"):
        raise HTTPException(status_code=404, detail="Image not found")
    data, ctype = await get_object(doc["storage_path"])
    return Response(content=data, media_type=doc.get("content_type") or ctype)
