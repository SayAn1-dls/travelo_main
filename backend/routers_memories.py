import io
import html as html_mod
import uuid
import secrets
from pathlib import Path
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from PIL import Image, ImageDraw, ImageFont
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


@memories_router.post("/trips/{trip_id}/recap/revoke")
async def revoke_recap_share(trip_id: str, user: dict = Depends(get_current_user)):
    trip = await get_trip_or_404(trip_id, user)
    if trip["organizer_id"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Only the organizer can revoke the share link")
    await db.trips.update_one({"_id": trip["_id"]}, {"$unset": {"share_token": ""}})
    return {"ok": True}


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
        "currency": trip.get("currency", "INR"),
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


FONT_DIR = Path(__file__).parent / "assets" / "fonts"


def _font(name, size, axes=None):
    try:
        f = ImageFont.truetype(str(FONT_DIR / name), size)
        if axes:
            try:
                f.set_variation_by_axes(axes)
            except Exception:
                pass
        return f
    except Exception:
        return ImageFont.load_default(size)


async def build_og_card(trip):
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), (11, 79, 108))
    photo = await db.memories.find_one({"trip_id": str(trip["_id"]), "kind": "photo", "is_deleted": False})
    if photo and photo.get("storage_path"):
        try:
            data, _ = await get_object(photo["storage_path"])
            p = Image.open(io.BytesIO(data)).convert("RGB")
            scale = max(W / p.width, H / p.height)
            p = p.resize((max(W, round(p.width * scale)), max(H, round(p.height * scale))))
            left, top = (p.width - W) // 2, (p.height - H) // 2
            base = p.crop((left, top, left + W, top + H))
        except Exception:
            pass
    mask = Image.linear_gradient("L").resize((W, H)).point(lambda v: 70 + int(v * 0.62))
    dark = Image.new("RGB", (W, H), (7, 38, 53))
    base = Image.composite(dark, base, mask)

    draw = ImageDraw.Draw(base)
    accent = (249, 179, 132)
    small = _font("DMSans.ttf", 26, [14, 700])
    big = _font("PlayfairDisplay-Bold.ttf", 84, [800])
    med = _font("DMSans.ttf", 32, [14, 500])
    pillf = _font("DMSans.ttf", 24, [14, 700])

    draw.text((70, 62), "T R A V E L O   R E C A P", font=small, fill=accent)

    lines, line = [], ""
    for w in str(trip["name"]).split():
        t = f"{line} {w}".strip()
        if draw.textlength(t, font=big) > 1060 and line:
            lines.append(line)
            line = w
        else:
            line = t
    if line:
        lines.append(line)
    lines = lines[:2]
    y = 330 if len(lines) == 1 else 240
    for l in lines:
        draw.text((70, y), l, font=big, fill=(255, 255, 255))
        y += 102
    draw.text((70, y + 10), f"{trip['destination']}  ·  {trip['start_date']} → {trip['end_date']}", font=med, fill=(240, 240, 240))

    label = "Watch the recap"
    tw = draw.textlength(label, font=pillf)
    px, py = 70, y + 74
    pw = int(tw) + 96
    draw.rounded_rectangle((px, py, px + pw, py + 56), radius=28, fill=(226, 88, 34))
    draw.polygon([(px + 34, py + 18), (px + 34, py + 38), (px + 52, py + 28)], fill=(255, 255, 255))
    draw.text((px + 64, py + 13), label, font=pillf, fill=(255, 255, 255))
    return base


@memories_router.get("/recap/{token}/og.png")
async def recap_og(token: str):
    trip = await trip_by_share_token(token)
    img = await build_og_card(trip)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png",
                    headers={"Cache-Control": "public, max-age=3600"})


@memories_router.get("/recap/{token}/share")
async def recap_share_page(token: str, request: Request):
    trip = await trip_by_share_token(token)
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    origin = f"https://{host}"
    mem_count = await db.memories.count_documents({"trip_id": str(trip["_id"]), "is_deleted": False})
    name = html_mod.escape(trip["name"])
    desc = html_mod.escape(
        f"{trip['destination']} · {trip['start_date']} → {trip['end_date']} · "
        f"{mem_count} memories with {len(trip['members'])} travellers. Tap to watch the recap."
    )
    target = f"{origin}/recap/{token}"
    page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{name} — Travelo recap</title>
<meta property="og:type" content="website">
<meta property="og:site_name" content="Travelo">
<meta property="og:title" content="{name} — trip recap">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="{origin}/api/recap/{token}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="{origin}/api/recap/{token}/share">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{name} — trip recap">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{origin}/api/recap/{token}/og.png">
<meta http-equiv="refresh" content="0;url={target}">
</head>
<body style="background:#0B4F6C;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<script>location.replace("{target}")</script>
<p>Opening recap… <a href="{target}" style="color:#F9B384">tap here</a> if nothing happens.</p>
</body>
</html>"""
    return HTMLResponse(page)
