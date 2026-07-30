import os
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from db import db
from auth import get_current_user
from models import ChatRequest, utcnow
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

chat_router = APIRouter(prefix="/chat")

SYSTEM_BASE = """You are Tara, Travelo's AI travel assistant — a well-travelled local friend, not a search engine.
Give specific, actionable travel recommendations: hidden local spots, best food nearby, how to get around, what to skip.
Keep answers short and scannable: 2-4 short paragraphs or a tight bulleted list using "-". No emoji. Mention approximate prices in local currency when relevant.
If you don't know the user's location, ask them once for a city or suggest picking their trip destination."""


async def reverse_geocode(lat, lng):
    try:
        async with httpx.AsyncClient(timeout=6) as c:
            r = await c.get("https://nominatim.openstreetmap.org/reverse",
                            params={"lat": lat, "lon": lng, "format": "json", "zoom": 10},
                            headers={"User-Agent": "Travelo/1.0"})
            a = r.json().get("address", {})
            return a.get("city") or a.get("town") or a.get("village") or a.get("county") or a.get("state")
    except Exception:
        return None


async def build_trip_context(trip_id, user):
    from routers_trips import get_trip_or_404, compute_balances
    try:
        trip = await get_trip_or_404(trip_id, user)
        balances = await compute_balances(trip)
    except Exception:
        return None
    names = {m["member_id"]: m["name"] for m in trip["members"]}
    budgets = trip.get("budget_categories") or {}
    cat_lines = ", ".join(
        f"{c} ₹{v:,.0f}" + (f" of ₹{budgets[c]:,.0f} budget" if budgets.get(c) else "")
        for c, v in balances["by_category"].items()) or "no expenses logged yet"
    owed = "; ".join(f"{names.get(s['from_member_id'], '?')} owes {names.get(s['to_member_id'], '?')} ₹{s['amount']:,.0f}"
                     for s in balances["suggestions"]) or "everyone is settled up"
    recent = await db.expenses.find({"trip_id": trip_id}).sort("created_at", -1).to_list(8)
    exp_lines = "; ".join(f"{e['description']} ₹{e['amount']:,.0f} ({e['category']}, paid by {names.get(e['paid_by'], 'someone')})" for e in recent) or "none"
    return (
        f"ACTIVE GROUP TRIP: \"{trip['name']}\" to {trip['destination']} ({trip['start_date']} → {trip['end_date']}), "
        f"members: {', '.join(names.values())}. Total budget ₹{trip.get('budget_total', 0):,.0f}, spent so far ₹{balances['total_spent']:,.0f}. "
        f"Category spend: {cat_lines}. Balances: {owed}. Recent expenses: {exp_lines}. "
        f"Answer budget and money questions using these exact numbers (INR). If a category or the total is over budget, say so plainly and suggest where to cut back."
    )


@chat_router.post("/stream")
async def chat_stream(body: ChatRequest, user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    city = body.city
    if not city and body.lat is not None and body.lng is not None:
        city = await reverse_geocode(body.lat, body.lng)

    context_lines = [f"The user's name is {user.get('name', 'traveller')}."]
    if city:
        context_lines.append(f"The user is currently in or near: {city}. Tailor recommendations to this area.")
    if body.destination:
        context_lines.append(f"The user is planning/on a trip to: {body.destination}.")
    if body.trip_id:
        trip_ctx = await build_trip_context(body.trip_id, user)
        if trip_ctx:
            context_lines.append(trip_ctx)

    history = await db.chat_messages.find({"user_id": uid, "session_id": body.session_id}).sort("created_at", -1).to_list(12)
    history.reverse()
    if history:
        convo = "\n".join(f"{'User' if h['role'] == 'user' else 'Tara'}: {h['content'][:500]}" for h in history)
        context_lines.append(f"Recent conversation:\n{convo}")

    system_message = SYSTEM_BASE + "\n\n" + "\n".join(context_lines)

    await db.chat_messages.insert_one({
        "user_id": uid, "session_id": body.session_id, "role": "user",
        "content": body.message, "city": city, "created_at": utcnow(),
    })

    async def gen():
        full = ""
        try:
            chat = LlmChat(
                api_key=os.environ["EMERGENT_LLM_KEY"],
                session_id=f"{uid}:{body.session_id}",
                system_message=system_message,
            ).with_model("anthropic", "claude-sonnet-4-6")
            async for ev in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(ev, TextDelta):
                    full += ev.content
                    yield f"data: {json.dumps({'delta': ev.content})}\n\n"
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            yield f"data: {json.dumps({'error': 'Tara is unavailable right now. Please try again.'})}\n\n"
            full = full or f"[error: {e}]"
        await db.chat_messages.insert_one({
            "user_id": uid, "session_id": body.session_id, "role": "assistant",
            "content": full, "city": city, "created_at": utcnow(),
        })
        yield f"data: {json.dumps({'done': True, 'city': city})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@chat_router.get("/history/{session_id}")
async def chat_history(session_id: str, user: dict = Depends(get_current_user)):
    docs = await db.chat_messages.find({"user_id": str(user["_id"]), "session_id": session_id}).sort("created_at", 1).to_list(100)
    return [{"role": d["role"], "content": d["content"], "created_at": d["created_at"]} for d in docs]
