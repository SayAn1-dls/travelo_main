"""Built-in NOMAD engine — answers travel questions from the TRAVELO catalog and
hand-written guides when no external AI key is configured, so chat (typed or
spoken) always replies."""
import re
from typing import Optional

from destinations_data import DESTINATIONS, GUIDES, tier_price

_DEST = {d["id"]: d for d in DESTINATIONS}


def _find_destination(text: str, place: str) -> Optional[dict]:
    hay = f"{text} {place}".lower()
    best = None
    for d in DESTINATIONS:
        name = d["name"].lower()
        if re.search(rf"\b{re.escape(name)}\b", hay) or d["id"].replace("-", " ") in hay:
            if best is None or len(name) > len(best["name"]):
                best = d
    if best is None:
        for d in DESTINATIONS:
            if d["country"].lower() in hay and len(d["country"]) > 4:
                return d
    return best


def _has(text: str, *words: str) -> bool:
    t = text.lower()
    return any(w in t for w in words)


def _bullets(items) -> str:
    return "\n".join(f"▸ {i}" for i in items)


def local_reply(text: str, place: str = "", phase: str = "before", language: str = "en") -> str:
    d = _find_destination(text, place)
    guide = GUIDES.get(d["id"]) if d else None

    if _has(text, "hello", "hi ", "hey", "namaste", "good morning", "good evening") and len(text) < 40 and not d:
        return ("Hey, traveler! I'm NOMAD, your TRAVELO co-pilot. Tell me a destination and I'll help with what to see, "
                "what to eat, how to get there, what it costs and when to go.")

    if not d:
        if _has(text, "pack", "packing", "luggage", "carry"):
            return ("Pack light and smart:\n" + _bullets([
                "Passport, visas, two copies of every booking",
                "One universal adapter and a power bank",
                "Layers beat bulky jackets; add a light rain shell",
                "Broken-in shoes, not new ones",
                "A small first-aid kit and any prescriptions in the original packaging",
            ]) + "\nTell me where you're going and I'll tailor it.")
        if _has(text, "budget", "cheap", "cost", "price", "money", "afford"):
            return ("Rough TRAVELO pricing per person: Explorer is the base package, Elite is about 1.65x with boutique stays "
                    "and private guides, and Legend is about 2.8x with the full premium treatment. "
                    "Tell me a destination and I'll give you the numbers.")
        picks = [x for x in DESTINATIONS if x["rating"] >= 4.9][:4]
        names = ", ".join(f"{x['name']} ({x['country']})" for x in picks)
        return (f"Not sure which place you mean yet. Top-rated right now: {names}. "
                "Name one and ask me about food, best time, budget or an itinerary.")

    name = d["name"]
    tiers = {t: tier_price(d["base_price"], t) for t in ("explorer", "elite", "legend")}

    if _has(text, "budget", "cost", "price", "how much", "cheap", "expensive", "package"):
        return (f"{name} packages on TRAVELO, per person: Explorer ${tiers['explorer']:,}, Elite ${tiers['elite']:,}, "
                f"Legend ${tiers['legend']:,}. The base trip runs about {d['duration_days']} days. "
                "Flights are separate; add roughly 10-15% for food and local transport.")

    if guide and _has(text, "eat", "food", "dish", "restaurant", "hungry", "cuisine", "try"):
        foods = [f"{f['dish']}: {f['description']}" for f in guide["food"][:4]]
        return f"Eat like a local in {name}:\n" + _bullets(foods)

    if guide and _has(text, "how to reach", "get there", "reach", "airport", "flight", "train", "fly", "travel to", "getting"):
        g = guide["getting_there"]
        return (f"Getting to {name}:\n▸ By air: {g['by_air']}\n▸ By train: {g['by_train']}\n▸ By road: {g['by_road']}")

    if guide and _has(text, "tip", "advice", "safe", "scam", "avoid", "mistake"):
        return f"{name} tips:\n" + _bullets(guide["tips"][:5])

    if guide and _has(text, "best time", "when to", "season", "weather", "month", "climate"):
        times = [f"{s['name']}: {s['best_time']}" for s in guide["top_spots"][:3]]
        return f"Best timing for {name}:\n" + _bullets(times) + f"\n{guide['tips'][-1]}"

    if _has(text, "pack", "packing", "wear", "bring"):
        extra = guide["tips"][0] if guide else ""
        return f"Packing for {name}: light layers, comfy walking shoes, a power bank, a reusable bottle and a rain shell. {extra}"

    if _has(text, "itinerary", "plan", "days", "schedule", "route", "what to do", "things to do", "see", "visit", "spots"):
        if guide:
            spots = guide["top_spots"][:5]
            days = [f"Day {i + 1}: {s['name']} ({s['best_time']}) - {s['why_go']}" for i, s in enumerate(spots)]
            return (f"A {min(len(spots), d['duration_days'])}+ day plan for {name}:\n" + _bullets(days) +
                    f"\nHidden gem to add: {guide['underrated'][0]['name']}.")
        hl = d["highlights"]
        return f"Must-do in {name}:\n" + _bullets(hl)

    if _has(text, "hidden", "underrated", "offbeat", "secret", "local"):
        if guide:
            return f"Skip the crowds in {name}:\n" + _bullets(f"{u['name']}: {u['description']}" for u in guide["underrated"])

    if guide and _has(text, "around", "transport", "metro", "taxi", "uber", "bus"):
        return f"Getting around {name}: {guide['getting_around']}"

    # default: about
    if guide:
        first = guide["overview"].split(". ")[:2]
        return (f"{name}, {d['country']}: {'. '.join(first).strip('.')}.\n"
                f"Highlights: {', '.join(d['highlights'][:3])}.\n"
                "Ask me about food, best time, budget, how to reach or an itinerary.")
    return (f"{name}, {d['country']}: {d['description']}\nHighlights: {', '.join(d['highlights'][:3])}.\n"
            "Ask me about budget, packing or an itinerary.")
