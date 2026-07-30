from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import logging
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware
from db import db, client
from auth import auth_router, seed_users
from routers_bookings import bookings_router
from routers_destinations import destinations_router
from routers_trips import trips_router, notifications_router
from routers_chat import chat_router
from routers_payments import payments_router
from routers_memories import memories_router
from storage import init_storage

app = FastAPI(title="Travelo API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Travelo API", "status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(bookings_router)
api_router.include_router(destinations_router)
api_router.include_router(trips_router)
api_router.include_router(notifications_router)
api_router.include_router(chat_router)
api_router.include_router(payments_router)
api_router.include_router(memories_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.bookings.create_index("user_id")
    await db.trips.create_index("invite_code")
    await db.expenses.create_index("trip_id")
    await db.settlements.create_index("trip_id")
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.chat_messages.create_index([("user_id", 1), ("session_id", 1)])
    await db.payment_transactions.create_index("session_id")
    await db.user_sessions.create_index("session_token")
    await db.memories.create_index("trip_id")
    await db.trip_messages.create_index([("trip_id", 1), ("created_at", 1)])
    await seed_users()
    try:
        await init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    logger.info("Travelo startup complete")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
