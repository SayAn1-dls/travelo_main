from fastapi import APIRouter, HTTPException
from destinations_data import DESTINATIONS

destinations_router = APIRouter(prefix="/destinations")


@destinations_router.get("")
async def list_destinations():
    return [
        {k: d[k] for k in ("slug", "name", "country", "tagline", "image", "lat", "lng", "best_time")}
        for d in DESTINATIONS.values()
    ]


@destinations_router.get("/{slug}")
async def get_destination(slug: str):
    d = DESTINATIONS.get(slug.lower())
    if not d:
        raise HTTPException(status_code=404, detail="Destination not found")
    return d
