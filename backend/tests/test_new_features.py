"""Iteration 2 — new features: Google session auth, Memories, Settlement proofs, Reminder emails.

Uses mongo directly via motor to seed a user_session (Emergent Google session recipe from
/app/auth_testing.md) and to inspect db.email_log.
"""
import io
import os
import uuid
import time
import asyncio
from datetime import datetime, timezone, timedelta
from pathlib import Path

import pytest
import requests
from PIL import Image
from bson import ObjectId
from dotenv import dotenv_values

# Load backend .env for MONGO_URL/DB_NAME
backend_env = dotenv_values("/app/backend/.env")
frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"

MONGO_URL = os.environ.get("MONGO_URL") or backend_env.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or backend_env.get("DB_NAME")

from pymongo import MongoClient  # noqa: E402


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text[:200]}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def aarav_token():
    return _login("aarav@test.com", "Pass@123")


@pytest.fixture(scope="module")
def meera_token():
    return _login("meera@test.com", "Pass@123")


@pytest.fixture(scope="module")
def mongo():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


def _tiny_png_bytes(color=(200, 80, 40)):
    buf = io.BytesIO()
    Image.new("RGB", (32, 32), color).save(buf, format="PNG")
    return buf.getvalue()


# ---------- Google session (Emergent-managed) ----------
class TestGoogleSession:
    def test_google_session_invalid_returns_401(self):
        r = requests.post(f"{API}/auth/google/session", json={"session_id": "definitely-not-real-" + uuid.uuid4().hex}, timeout=20)
        assert r.status_code == 401, f"expected 401, got {r.status_code}: {r.text[:200]}"

    def test_mongo_session_accepts_bearer_and_cookie(self, mongo):
        # Insert a valid session for aarav directly per /app/auth_testing.md
        session_token = "TEST_session_" + uuid.uuid4().hex
        user = mongo.users.find_one({"email": "aarav@test.com"})
        assert user is not None
        mongo.user_sessions.insert_one({
            "user_id": str(user["_id"]),
            "session_token": session_token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            # Bearer
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=15)
            assert r.status_code == 200, r.text[:200]
            assert r.json()["email"] == "aarav@test.com"
            # Cookie
            r2 = requests.get(f"{API}/auth/me", cookies={"session_token": session_token}, timeout=15)
            assert r2.status_code == 200
            assert r2.json()["email"] == "aarav@test.com"

            # Logout via Bearer deletes session
            lo = requests.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {session_token}"}, timeout=15)
            assert lo.status_code == 200
            remaining = mongo.user_sessions.find_one({"session_token": session_token})
            assert remaining is None, "logout did not delete session record"
        finally:
            mongo.user_sessions.delete_many({"session_token": session_token})

    def test_expired_session_returns_401(self, mongo):
        session_token = "TEST_expired_" + uuid.uuid4().hex
        user = mongo.users.find_one({"email": "aarav@test.com"})
        mongo.user_sessions.insert_one({
            "user_id": str(user["_id"]),
            "session_token": session_token,
            "expires_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {session_token}"}, timeout=15)
            assert r.status_code == 401
        finally:
            mongo.user_sessions.delete_many({"session_token": session_token})


# ---------- JWT still intact ----------
class TestJWTIntact:
    def test_jwt_login_and_me(self, aarav_token):
        r = requests.get(f"{API}/auth/me", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == "aarav@test.com"

    def test_garbage_bearer_401(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage.token.value"}, timeout=15)
        assert r.status_code == 401


# ---------- Shared trip fixture ----------
@pytest.fixture(scope="module")
def trip(aarav_token, meera_token):
    body = {
        "name": f"TEST_Iter2_Trip_{uuid.uuid4().hex[:6]}",
        "destination": "Goa",
        "start_date": "2026-08-01", "end_date": "2026-08-05",
        "budget_total": 20000, "budget_categories": {"food": 5000},
        "members": [{"name": "Meera Nair", "email": "meera@test.com"}],
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
    assert r.status_code == 200, r.text[:300]
    t = r.json()
    aarav_m = next(m for m in t["members"] if m["email"] == "aarav@test.com")
    meera_m = next(m for m in t["members"] if m["email"] == "meera@test.com")
    return {"trip": t, "aarav_m": aarav_m, "meera_m": meera_m}


# ---------- Email reminder ----------
class TestReminderEmails:
    def test_remind_registered_debtor_logs_email(self, aarav_token, trip, mongo):
        t = trip["trip"]
        a, m = trip["aarav_m"]["member_id"], trip["meera_m"]["member_id"]
        # Add an expense so meera owes aarav
        exp = requests.post(f"{API}/trips/{t['id']}/expenses",
                            json={"description": "Dinner", "amount": 3000, "category": "food",
                                  "paid_by": a, "split_type": "equal",
                                  "splits": [{"member_id": a}, {"member_id": m}]},
                            headers=hdr(aarav_token), timeout=15)
        assert exp.status_code == 200
        # Remind
        before = mongo.email_log.count_documents({"to": "meera@test.com"})
        r = requests.post(f"{API}/trips/{t['id']}/remind",
                          json={"from_member_id": m, "to_member_id": a, "amount": 1500},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:200]
        # Give tiny time for insert (should be already awaited)
        time.sleep(0.5)
        doc = mongo.email_log.find_one(
            {"to": "meera@test.com"}, sort=[("created_at", -1)])
        assert doc is not None
        assert doc["provider"] == "console"
        assert doc["status"] == "logged"
        assert "owe" in doc["subject"].lower()
        after = mongo.email_log.count_documents({"to": "meera@test.com"})
        assert after == before + 1

    def test_remind_unregistered_member_ok(self, aarav_token, trip, mongo):
        t = trip["trip"]
        fake_email = f"ghost_{uuid.uuid4().hex[:6]}@nowhere.test"
        # add member (not registered user)
        am = requests.post(f"{API}/trips/{t['id']}/members",
                           json={"name": "Ghost", "email": fake_email},
                           headers=hdr(aarav_token), timeout=15)
        assert am.status_code == 200
        ghost_member_id = am.json()["member_id"]
        a = trip["aarav_m"]["member_id"]
        # Get trip fresh
        tr = requests.get(f"{API}/trips/{t['id']}", headers=hdr(aarav_token), timeout=15)
        # add expense charged to ghost too so they owe
        exp = requests.post(f"{API}/trips/{t['id']}/expenses",
                            json={"description": "Cab", "amount": 600, "category": "transport",
                                  "paid_by": a, "split_type": "equal",
                                  "splits": [{"member_id": a}, {"member_id": ghost_member_id}]},
                            headers=hdr(aarav_token), timeout=15)
        assert exp.status_code == 200
        # Remind unregistered
        r = requests.post(f"{API}/trips/{t['id']}/remind",
                          json={"from_member_id": ghost_member_id, "to_member_id": a, "amount": 300},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:200]
        time.sleep(0.5)
        doc = mongo.email_log.find_one({"to": fake_email})
        assert doc is not None, "no email logged for unregistered member"
        assert doc["status"] == "logged"


# ---------- Memories ----------
class TestMemories:
    def test_photo_upload_note_list_image_delete_and_forbidden(self, aarav_token, meera_token, trip):
        t = trip["trip"]
        img = _tiny_png_bytes()
        # POST photo
        r = requests.post(
            f"{API}/trips/{t['id']}/memories/photo",
            files={"file": ("test.png", img, "image/png")},
            data={"caption": "TEST_snapshot"},
            headers=hdr(aarav_token), timeout=30,
        )
        assert r.status_code == 200, r.text[:300]
        photo = r.json()
        assert photo["storage_path"], "no storage_path returned"
        assert photo["kind"] == "photo"
        photo_id = photo["id"]

        # POST note
        rn = requests.post(f"{API}/trips/{t['id']}/memories/note",
                           json={"text": "TEST note content"}, headers=hdr(aarav_token), timeout=15)
        assert rn.status_code == 200
        note = rn.json()
        assert note["kind"] == "note"
        note_id = note["id"]

        # GET list has both
        lr = requests.get(f"{API}/trips/{t['id']}/memories", headers=hdr(aarav_token), timeout=15)
        assert lr.status_code == 200
        ids = {m["id"] for m in lr.json()}
        assert photo_id in ids and note_id in ids

        # GET image
        ir = requests.get(f"{API}/memories/{photo_id}/image", headers=hdr(aarav_token), timeout=30)
        assert ir.status_code == 200
        assert ir.content[:4] == b"\x89PNG" or len(ir.content) > 100

        # Non-member forbidden: register a fresh user (not on trip)
        fresh_email = f"TEST_outsider_{uuid.uuid4().hex[:6]}@travelo.test"
        reg = requests.post(f"{API}/auth/register",
                            json={"name": "Outsider", "email": fresh_email, "password": "Pass@123"},
                            timeout=15)
        assert reg.status_code == 200
        outsider_tok = reg.json()["access_token"]
        fr = requests.get(f"{API}/trips/{t['id']}/memories", headers=hdr(outsider_tok), timeout=15)
        assert fr.status_code == 403

        # Non-image upload → 400
        bad = requests.post(
            f"{API}/trips/{t['id']}/memories/photo",
            files={"file": ("bad.txt", b"not an image", "text/plain")},
            data={"caption": ""}, headers=hdr(aarav_token), timeout=15,
        )
        assert bad.status_code == 400

        # DELETE by creator → soft delete, list drops it
        dr = requests.delete(f"{API}/memories/{note_id}", headers=hdr(aarav_token), timeout=15)
        assert dr.status_code == 200
        lr2 = requests.get(f"{API}/trips/{t['id']}/memories", headers=hdr(aarav_token), timeout=15)
        assert note_id not in {m["id"] for m in lr2.json()}


# ---------- Settlement proof ----------
class TestSettlementProof:
    def test_settlement_proof_flow(self, aarav_token, trip):
        t = trip["trip"]
        a, m = trip["aarav_m"]["member_id"], trip["meera_m"]["member_id"]
        # Create settlement
        sr = requests.post(f"{API}/trips/{t['id']}/settlements",
                           json={"from_member_id": m, "to_member_id": a, "amount": 500, "method": "upi"},
                           headers=hdr(aarav_token), timeout=15)
        assert sr.status_code == 200, sr.text[:200]
        sid = sr.json()["id"]

        # Fetch proof before upload → 404
        pr0 = requests.get(f"{API}/settlements/{sid}/proof", headers=hdr(aarav_token), timeout=15)
        assert pr0.status_code == 404

        # Upload proof
        img = _tiny_png_bytes((10, 200, 50))
        up = requests.post(
            f"{API}/trips/{t['id']}/settlements/{sid}/proof",
            files={"file": ("proof.png", img, "image/png")},
            headers=hdr(aarav_token), timeout=30,
        )
        assert up.status_code == 200, up.text[:200]
        assert up.json().get("proof_path")

        # Fetch proof image
        pr = requests.get(f"{API}/settlements/{sid}/proof", headers=hdr(aarav_token), timeout=30)
        assert pr.status_code == 200
        assert len(pr.content) > 100
