"""Iteration 3 — Recap sharing, spending alerts, trip-chat context."""
import io
import os
import json
import time
import uuid
from datetime import datetime, timezone

import pytest
import requests
from PIL import Image
from dotenv import dotenv_values
from pymongo import MongoClient

backend_env = dotenv_values("/app/backend/.env")
frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL") or backend_env.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or backend_env.get("DB_NAME")


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


def _tiny_png(color=(100, 150, 200)):
    buf = io.BytesIO()
    Image.new("RGB", (24, 24), color).save(buf, format="PNG")
    return buf.getvalue()


def _mk_trip(aarav_token, name_prefix="TEST_Iter3", budget_total=20000, cats=None):
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Goa",
        "start_date": "2026-09-01", "end_date": "2026-09-05",
        "budget_total": budget_total,
        "budget_categories": cats or {"food": 5000},
        "members": [{"name": "Meera Nair", "email": "meera@test.com"}],
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
    assert r.status_code == 200, r.text[:300]
    t = r.json()
    aarav_m = next(m for m in t["members"] if m["email"] == "aarav@test.com")
    meera_m = next(m for m in t["members"] if m["email"] == "meera@test.com")
    return t, aarav_m["member_id"], meera_m["member_id"]


# --------------- Recap share ---------------
class TestRecap:
    def test_recap_flow_and_edge_cases(self, aarav_token, meera_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_Recap")
        tid = trip["id"]

        # add an expense so stats exist
        exp = requests.post(f"{API}/trips/{tid}/expenses",
                            json={"description": "Lunch", "amount": 400, "category": "food",
                                  "paid_by": a, "split_type": "equal",
                                  "splits": [{"member_id": a}, {"member_id": m}]},
                            headers=hdr(aarav_token), timeout=15)
        assert exp.status_code == 200

        # add a photo memory
        up = requests.post(f"{API}/trips/{tid}/memories/photo",
                           files={"file": ("m.png", _tiny_png(), "image/png")},
                           data={"caption": "TEST_recap_photo"},
                           headers=hdr(aarav_token), timeout=30)
        assert up.status_code == 200
        mem_id = up.json()["id"]

        # POST recap/share → token
        r1 = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert r1.status_code == 200, r1.text[:300]
        token = r1.json()["token"]
        assert token and isinstance(token, str) and len(token) >= 6

        # Second call must return SAME token (stable)
        r2 = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert r2.status_code == 200
        assert r2.json()["token"] == token, "share token must be stable across calls"

        # Public GET (no auth)
        pub = requests.get(f"{API}/recap/{token}", timeout=15)
        assert pub.status_code == 200, pub.text[:300]
        data = pub.json()
        assert data["name"] == trip["name"]
        assert data["destination"] == "Goa"
        assert "start_date" in data and "end_date" in data
        assert isinstance(data["members"], list) and len(data["members"]) == 2
        # members should be names only (strings, no emails)
        for mem in data["members"]:
            assert isinstance(mem, str) and "@" not in mem, f"member leaked: {mem}"
        stats = data["stats"]
        assert stats["total_spent"] >= 400
        assert stats["by_category"].get("food", 0) >= 400
        assert stats["budget_total"] == 20000
        mem_ids = [x["id"] for x in data["memories"]]
        assert mem_id in mem_ids

        # Public image (no auth)
        ir = requests.get(f"{API}/recap/{token}/image/{mem_id}", timeout=20)
        assert ir.status_code == 200
        assert len(ir.content) > 50

        # Wrong token → 404
        bad = requests.get(f"{API}/recap/definitely-not-a-real-token-xyz", timeout=15)
        assert bad.status_code == 404

        # memory_id from a DIFFERENT trip via valid token → 404
        trip2, a2, _ = _mk_trip(aarav_token, "TEST_Recap_Other")
        up2 = requests.post(f"{API}/trips/{trip2['id']}/memories/photo",
                            files={"file": ("m2.png", _tiny_png((10, 10, 10)), "image/png")},
                            data={"caption": "TEST_other_trip_photo"},
                            headers=hdr(aarav_token), timeout=30)
        assert up2.status_code == 200
        other_mem_id = up2.json()["id"]
        cross = requests.get(f"{API}/recap/{token}/image/{other_mem_id}", timeout=15)
        assert cross.status_code == 404, f"cross-trip image should 404, got {cross.status_code}"

        # Non-member POST recap/share → 403
        outsider_email = f"TEST_outsider_{uuid.uuid4().hex[:6]}@travelo.test"
        reg = requests.post(f"{API}/auth/register",
                            json={"name": "Out", "email": outsider_email, "password": "Pass@123"},
                            timeout=15)
        assert reg.status_code == 200
        out_tok = reg.json()["access_token"]
        forb = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(out_tok), timeout=15)
        assert forb.status_code == 403, f"non-member should get 403, got {forb.status_code}"


# --------------- Spending alerts ---------------
class TestSpendingAlerts:
    def test_budget_alerts_fire_only_on_crossing(self, aarav_token, meera_token, mongo):
        trip, a, m = _mk_trip(aarav_token, "TEST_Alerts", budget_total=5000, cats={"food": 1000})
        tid = trip["id"]

        # snapshot notification counts BEFORE
        aarav_uid = str(mongo.users.find_one({"email": "aarav@test.com"})["_id"])
        meera_uid = str(mongo.users.find_one({"email": "meera@test.com"})["_id"])

        def count_alerts(uid, title_substr):
            return mongo.notifications.count_documents({
                "user_id": uid, "type": "budget_alert",
                "data.trip_id": tid,
                "title": {"$regex": title_substr},
            })

        # 1) Add food 800 — NO alert
        r = requests.post(f"{API}/trips/{tid}/expenses",
                          json={"description": "Snacks", "amount": 800, "category": "food",
                                "paid_by": a, "split_type": "equal",
                                "splits": [{"member_id": a}, {"member_id": m}]},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert count_alerts(aarav_uid, "budget crossed") == 0, "no alert should fire before crossing"

        # 2) Add food 400 (total food 1200 > 1000) — food budget crossed for BOTH members
        r = requests.post(f"{API}/trips/{tid}/expenses",
                          json={"description": "Cake", "amount": 400, "category": "food",
                                "paid_by": a, "split_type": "equal",
                                "splits": [{"member_id": a}, {"member_id": m}]},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        food_a = count_alerts(aarav_uid, "Food budget crossed")
        food_m = count_alerts(meera_uid, "Food budget crossed")
        assert food_a == 1, f"aarav Food alert count expected 1, got {food_a}"
        assert food_m == 1, f"meera Food alert count expected 1, got {food_m}"

        # 3) Duplicate suppression: another food expense (already over) — NO new food alert
        r = requests.post(f"{API}/trips/{tid}/expenses",
                          json={"description": "More Cake", "amount": 100, "category": "food",
                                "paid_by": a, "split_type": "equal",
                                "splits": [{"member_id": a}, {"member_id": m}]},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        assert count_alerts(aarav_uid, "Food budget crossed") == 1, "duplicate Food alert should NOT be created"
        assert count_alerts(meera_uid, "Food budget crossed") == 1

        # 4) Add stay 4000 (total 5200 > 5000) — Trip budget crossed
        r = requests.post(f"{API}/trips/{tid}/expenses",
                          json={"description": "Hotel", "amount": 4000, "category": "stay",
                                "paid_by": a, "split_type": "equal",
                                "splits": [{"member_id": a}, {"member_id": m}]},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        trip_a = count_alerts(aarav_uid, "Trip budget crossed")
        trip_m = count_alerts(meera_uid, "Trip budget crossed")
        assert trip_a == 1, f"aarav Trip alert expected 1, got {trip_a}"
        assert trip_m == 1, f"meera Trip alert expected 1, got {trip_m}"

        # confirm no dup on the trip alert on subsequent crossing-safe expenses (already over)
        r = requests.post(f"{API}/trips/{tid}/expenses",
                          json={"description": "Extra", "amount": 200, "category": "stay",
                                "paid_by": a, "split_type": "equal",
                                "splits": [{"member_id": a}, {"member_id": m}]},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        assert count_alerts(aarav_uid, "Trip budget crossed") == 1, "trip alert duplicate suppressed"


# --------------- Trip chat context ---------------
class TestTripChatContext:
    def _stream_and_collect(self, token, payload, deadline_s=45):
        deltas = []
        with requests.post(f"{API}/chat/stream", json=payload, headers=hdr(token), stream=True, timeout=90) as r:
            assert r.status_code == 200, f"chat stream status {r.status_code}"
            deadline = time.time() + deadline_s
            for line in r.iter_lines(decode_unicode=True):
                if time.time() > deadline:
                    break
                if not line or not line.startswith("data:"):
                    continue
                try:
                    d = json.loads(line[5:].strip())
                except Exception:
                    continue
                if "delta" in d:
                    deltas.append(d["delta"])
                if d.get("done"):
                    break
        return "".join(deltas)

    def test_chat_receives_trip_financial_context(self, aarav_token):
        # Build a fresh trip with a specific spend
        trip, a, m = _mk_trip(aarav_token, "TEST_ChatCtx", budget_total=10000, cats={"food": 5000})
        tid = trip["id"]
        # Add two expenses summing to 2345
        for desc, amt in [("Breakfast", 1234), ("Lunch", 1111)]:
            r = requests.post(f"{API}/trips/{tid}/expenses",
                              json={"description": desc, "amount": amt, "category": "food",
                                    "paid_by": a, "split_type": "equal",
                                    "splits": [{"member_id": a}, {"member_id": m}]},
                              headers=hdr(aarav_token), timeout=15)
            assert r.status_code == 200
        expected_total = 1234 + 1111  # 2345

        answer = self._stream_and_collect(aarav_token, {
            "message": "How much have we spent in total? Answer with just the number in rupees, no words.",
            "session_id": f"trip-{tid}",
            "trip_id": tid,
        })
        assert answer.strip(), "empty answer from chat"
        # The total figure should appear (allow comma formatting)
        variants = [str(expected_total), f"{expected_total:,}", f"₹{expected_total}", f"₹{expected_total:,}"]
        assert any(v in answer for v in variants), (
            f"Trip context missing — expected total {expected_total} in reply. Got: {answer[:400]}"
        )

    def test_chat_non_member_trip_context_silently_skipped(self, aarav_token):
        # aarav creates trip with only aarav
        body = {
            "name": f"TEST_ChatOnly_{uuid.uuid4().hex[:6]}",
            "destination": "Goa",
            "start_date": "2026-10-01", "end_date": "2026-10-02",
            "budget_total": 1000, "budget_categories": {},
            "members": [],
        }
        r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200
        tid = r.json()["id"]

        # Register an outsider
        outsider_email = f"TEST_chatoutsider_{uuid.uuid4().hex[:6]}@travelo.test"
        reg = requests.post(f"{API}/auth/register",
                            json={"name": "Out", "email": outsider_email, "password": "Pass@123"},
                            timeout=15)
        assert reg.status_code == 200
        out_tok = reg.json()["access_token"]

        # Just assert HTTP 200 stream starts — no LLM completion needed
        with requests.post(f"{API}/chat/stream",
                           json={"message": "hi", "session_id": f"trip-{tid}", "trip_id": tid},
                           headers=hdr(out_tok), stream=True, timeout=30) as rr:
            assert rr.status_code == 200, f"non-member trip_id chat should still 200, got {rr.status_code}"
            # Don't await full stream — just read first byte or a short window
            start = time.time()
            for line in rr.iter_lines(decode_unicode=True):
                if line or time.time() - start > 5:
                    break
