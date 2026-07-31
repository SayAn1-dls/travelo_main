import os
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from db import db
from auth import get_current_user
from models import ChatRequest, csym, utcnow
from openai import AsyncOpenAI

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
    cur = trip.get("currency", "INR")
    sym = csym(cur)
    budgets = trip.get("budget_categories") or {}
    
    cat_items = []
    for c, v in balances.get("by_category", {}).items():
        line = f"{c} {sym}{v:,.0f}"
        if budgets.get(c):
            line += f" of {sym}{budgets[c]:,.0f} budget"
        cat_items.append(line)
    cat_lines = ", ".join(cat_items) or "no expenses logged yet"

    owed_items = []
    for s in balances.get("suggestions", []):
        f_name = names.get(s['from_member_id'], '?')
        t_name = names.get(s['to_member_id'], '?')
        amt = s['amount']
        owed_items.append(f"{f_name} owes {t_name} {sym}{amt:,.0f}")
    owed = "; ".join(owed_items) or "everyone is settled up"

    recent_docs = await db.expenses.find({"trip_id": trip_id}).sort("created_at", -1).to_list(8)
    exp_items = []
    for e in recent_docs:
        desc = e.get('description', 'expense')
        amt = e.get('amount', 0)
        cat = e.get('category', 'other')
        pb = names.get(e.get('paid_by'), 'someone')
        exp_items.append(f"{desc} {sym}{amt:,.0f} ({cat}, paid by {pb})")
    exp_lines = "; ".join(exp_items) or "none"

    return (
        f"ACTIVE GROUP TRIP: \"{trip['name']}\" to {trip['destination']} ({trip['start_date']} → {trip['end_date']}), "
        f"members: {', '.join(names.values())}. Total budget {sym}{trip.get('budget_total', 0):,.0f}, spent so far {sym}{balances['total_spent']:,.0f}. "
        f"Category spend: {cat_lines}. Balances: {owed}. Recent expenses: {exp_lines}. "
        f"Answer budget and money questions using these exact numbers (currency: {cur}). If a category or the total is over budget, say so plainly and suggest where to cut back."
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
    
    messages = [{"role": "system", "content": SYSTEM_BASE + "\n\n" + "\n".join(context_lines)}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": body.message})

    await db.chat_messages.insert_one({
        "user_id": uid, "session_id": body.session_id, "role": "user",
        "content": body.message, "city": city, "created_at": utcnow(),
    })

    client = AsyncOpenAI(
        api_key=os.environ.get("EMERGENT_LLM_KEY"),
        base_url="https://integrations.emergentagent.com/llm/v1"
    )

    async def gen():
        full = ""
        try:
            stream = await client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                stream=True
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    full += delta
                    yield f"data: {json.dumps({'delta': delta})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': 'Tara is unavailable right now. Please try again.'})}\n\n"
            full = full or f"[error: {str(e)}]"
        
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
