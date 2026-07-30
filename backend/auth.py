import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from db import db
from models import RegisterRequest, LoginRequest, ProfileUpdate, utcnow

JWT_ALGORITHM = "HS256"

auth_router = APIRouter(prefix="/auth")


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


def public_user(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "phone": user.get("phone"),
        "upi_vpa": user.get("upi_vpa"),
        "currency": user.get("currency", "INR"),
        "avatar": user.get("avatar"),
        "role": user.get("role", "user"),
    }


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


LOCKOUT_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


async def check_lockout(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if rec and rec.get("count", 0) >= LOCKOUT_ATTEMPTS:
        last = datetime.fromisoformat(rec["last_attempt"])
        if datetime.now(timezone.utc) - last < timedelta(minutes=LOCKOUT_MINUTES):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        await db.login_attempts.delete_one({"identifier": identifier})


async def record_failure(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_attempt": utcnow()}},
        upsert=True,
    )


@auth_router.post("/register")
async def register(body: RegisterRequest, response: Response):
    email = body.email.strip().lower()
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    doc = {
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name.strip(),
        "phone": None,
        "upi_vpa": None,
        "currency": "INR",
        "avatar": None,
        "role": "user",
        "providers": ["password"],
        "created_at": utcnow(),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    doc["_id"] = result.inserted_id
    return {"user": public_user(doc), "access_token": access}


@auth_router.post("/login")
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    await check_lockout(identifier)
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await record_failure(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}


@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@auth_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@auth_router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
        return {"access_token": access}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@auth_router.put("/profile")
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"_id": user["_id"]}, {"$set": updates})
    fresh = await db.users.find_one({"_id": user["_id"]})
    return public_user(fresh)


async def seed_users():
    seeds = [
        {"email": os.environ.get("ADMIN_EMAIL", "admin@travelo.app"), "password": os.environ.get("ADMIN_PASSWORD", "Travelo@2026"), "name": "Travelo Admin", "role": "admin"},
        {"email": "aarav@test.com", "password": "Pass@123", "name": "Aarav Sharma", "role": "user"},
        {"email": "meera@test.com", "password": "Pass@123", "name": "Meera Nair", "role": "user"},
    ]
    for s in seeds:
        existing = await db.users.find_one({"email": s["email"]})
        if existing is None:
            await db.users.insert_one({
                "email": s["email"], "password_hash": hash_password(s["password"]),
                "name": s["name"], "phone": None, "upi_vpa": None, "currency": "INR",
                "avatar": None, "role": s["role"], "providers": ["password"], "created_at": utcnow(),
            })
        elif not verify_password(s["password"], existing.get("password_hash", "")):
            await db.users.update_one({"email": s["email"]}, {"$set": {"password_hash": hash_password(s["password"])}})
