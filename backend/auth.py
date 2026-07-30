import os
import jwt
import bcrypt
import httpx
import secrets as pysecrets
from urllib.parse import urlencode
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import RedirectResponse
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


async def user_from_session(token: str):
    doc = await db.user_sessions.find_one({"session_token": token})
    if not doc:
        return None
    expires_at = doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at and expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"_id": doc["_id"]})
        return None
    return await db.users.find_one({"_id": ObjectId(doc["user_id"])})


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        token = request.cookies.get("session_token")
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
        user = await user_from_session(token)
        if user:
            return user
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
    if not user or not verify_password(body.password, user.get("password_hash") or ""):
        await record_failure(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {"user": public_user(user), "access_token": access}


EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


class GoogleSessionRequest(BaseModel):
    session_id: str


@auth_router.post("/google/session")
async def google_session(body: GoogleSessionRequest, response: Response):
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": body.session_id})
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Auth service unreachable — please try again")
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid or expired Google session")
    data = r.json()
    email = data["email"].strip().lower()
    user = await db.users.find_one({"email": email})
    if user is None:
        doc = {
            "email": email, "password_hash": None,
            "name": data.get("name") or email.split("@")[0].title(),
            "phone": None, "upi_vpa": None, "currency": "INR",
            "avatar": data.get("picture"), "role": "user",
            "providers": ["google"], "created_at": utcnow(),
        }
        result = await db.users.insert_one(doc)
        user = await db.users.find_one({"_id": result.inserted_id})
    else:
        updates = {"$addToSet": {"providers": "google"}}
        if data.get("picture") and not user.get("avatar"):
            updates["$set"] = {"avatar": data["picture"]}
        await db.users.update_one({"_id": user["_id"]}, updates)
    session_token = data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": str(user["_id"]), "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": utcnow(),
    })
    response.set_cookie("session_token", session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"user": public_user(user), "session_token": session_token}


@auth_router.post("/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
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


FB_API_VERSION = "v19.0"


def fb_config():
    app_id = (os.environ.get("FACEBOOK_APP_ID") or "").strip().strip('"')
    secret = (os.environ.get("FACEBOOK_APP_SECRET") or "").strip().strip('"')
    return app_id, secret


def public_origin(request: Request) -> str:
    host = request.headers.get("x-forwarded-host") or request.headers.get("host", "")
    return f"https://{host}"


@auth_router.get("/facebook/status")
async def facebook_status():
    app_id, secret = fb_config()
    return {"configured": bool(app_id and secret)}


@auth_router.get("/facebook/login")
async def facebook_login(request: Request):
    app_id, secret = fb_config()
    if not (app_id and secret):
        raise HTTPException(status_code=400, detail="Facebook login isn't configured yet — add your Meta App ID and Secret first")
    state = pysecrets.token_urlsafe(24)
    redirect_uri = f"{public_origin(request)}/api/auth/facebook/callback"
    params = urlencode({
        "client_id": app_id, "redirect_uri": redirect_uri,
        "state": state, "scope": "email,public_profile", "response_type": "code",
    })
    resp = RedirectResponse(url=f"https://www.facebook.com/{FB_API_VERSION}/dialog/oauth?{params}", status_code=302)
    resp.set_cookie("fb_oauth_state", state, httponly=True, secure=True, samesite="lax", max_age=600, path="/")
    return resp


@auth_router.get("/facebook/callback")
async def facebook_callback(request: Request, code: str = None, state: str = None, error: str = None):
    origin = public_origin(request)
    fail = RedirectResponse(url=f"{origin}/auth?fb_error=1", status_code=302)
    fail.delete_cookie("fb_oauth_state", path="/")
    app_id, secret = fb_config()
    if error or not code or not state or not (app_id and secret):
        return fail
    if request.cookies.get("fb_oauth_state") != state:
        return fail
    redirect_uri = f"{origin}/api/auth/facebook/callback"
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            tr = await c.get(f"https://graph.facebook.com/{FB_API_VERSION}/oauth/access_token",
                             params={"client_id": app_id, "client_secret": secret,
                                     "redirect_uri": redirect_uri, "code": code})
            if tr.status_code != 200:
                return fail
            fb_token = tr.json().get("access_token")
            if not fb_token:
                return fail
            pr = await c.get(f"https://graph.facebook.com/{FB_API_VERSION}/me",
                             params={"fields": "id,name,email,picture", "access_token": fb_token})
            if pr.status_code != 200:
                return fail
            profile = pr.json()
    except httpx.HTTPError:
        return fail
    fb_id = profile["id"]
    email = (profile.get("email") or f"fb{fb_id}@facebook.travelo").strip().lower()
    picture = ((profile.get("picture") or {}).get("data") or {}).get("url")
    user = await db.users.find_one({"facebook_id": fb_id}) or await db.users.find_one({"email": email})
    if user is None:
        doc = {
            "email": email, "password_hash": None,
            "name": profile.get("name") or "Traveller",
            "phone": None, "upi_vpa": None, "currency": "INR",
            "avatar": picture, "role": "user",
            "providers": ["facebook"], "facebook_id": fb_id,
            "created_at": utcnow(),
        }
        result = await db.users.insert_one(doc)
        user = await db.users.find_one({"_id": result.inserted_id})
    else:
        updates = {"$addToSet": {"providers": "facebook"}, "$set": {"facebook_id": fb_id}}
        if picture and not user.get("avatar"):
            updates["$set"]["avatar"] = picture
        await db.users.update_one({"_id": user["_id"]}, updates)
    access = create_access_token(str(user["_id"]), user["email"])
    refresh = create_refresh_token(str(user["_id"]))
    ok = RedirectResponse(url=f"{origin}/dashboard", status_code=302)
    ok.delete_cookie("fb_oauth_state", path="/")
    set_auth_cookies(ok, access, refresh)
    return ok


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
