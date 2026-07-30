"""Travelo backend integration tests.

Covers: auth, bookings (mock inventory), payments (Stripe checkout URL creation),
group trips (splits/balances/settlements/reminders/join), destinations,
chat (SSE stream via Emergent LLM), notifications.
"""
import os
import re
import json
import time
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="module")
def s():
    return requests.Session()


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"Login {email} failed: {r.status_code} {r.text[:300]}"
    tok = r.json()["access_token"]
    return tok


@pytest.fixture(scope="module")
def aarav_token():
    return _login("aarav@test.com", "Pass@123")


@pytest.fixture(scope="module")
def meera_token():
    return _login("meera@test.com", "Pass@123")


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- Auth ----------
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"email": "aarav@test.com", "password": "Pass@123"}, timeout=15)
        assert r.status_code == 200
        j = r.json()
        assert "access_token" in j and j["user"]["email"] == "aarav@test.com"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "aarav@test.com", "password": "WRONG"}, timeout=15)
        assert r.status_code in (401, 429)

    def test_me_bearer(self, aarav_token):
        r = requests.get(f"{API}/auth/me", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == "aarav@test.com"

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_register_new_user(self):
        email = f"TEST_user_{uuid.uuid4().hex[:8]}@travelo.test"
        r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "Pass@123"}, timeout=15)
        assert r.status_code == 200, r.text[:300]
        j = r.json()
        assert j["user"]["email"] == email.lower()
        assert "access_token" in j

    def test_profile_update_upi(self, aarav_token):
        r = requests.put(f"{API}/auth/profile", json={"upi_vpa": "aarav@okhdfc"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["upi_vpa"] == "aarav@okhdfc"


# ---------- Bookings (mock inventory) ----------
class TestBookings:
    def test_search_flight(self, aarav_token):
        r = requests.post(f"{API}/bookings/search",
                          json={"type": "flight", "origin": "Mumbai", "destination": "Goa", "date": "2026-07-15", "passengers": 1},
                          headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200, r.text[:300]
        results = r.json()["results"]
        assert 6 <= len(results) <= 9, f"Expected 6-9 flights, got {len(results)}"
        assert "price" in results[0]

    def test_search_train(self, aarav_token):
        r = requests.post(f"{API}/bookings/search",
                          json={"type": "train", "origin": "Mumbai", "destination": "Goa", "date": "2026-07-15"},
                          headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200
        assert len(r.json()["results"]) > 0

    def test_search_hotel_city_only(self, aarav_token):
        r = requests.post(f"{API}/bookings/search",
                          json={"type": "hotel", "destination": "Goa", "date": "2026-07-15", "nights": 2, "rooms": 1},
                          headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200
        results = r.json()["results"]
        assert len(results) > 0
        assert "price_per_night" in results[0]

    def test_search_flight_missing_origin(self, aarav_token):
        r = requests.post(f"{API}/bookings/search",
                          json={"type": "flight", "destination": "Goa", "date": "2026-07-15"},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400

    def test_booking_create_and_checkout(self, aarav_token):
        # Search first
        sr = requests.post(f"{API}/bookings/search",
                           json={"type": "flight", "origin": "Mumbai", "destination": "Goa", "date": "2026-07-15", "passengers": 2},
                           headers=hdr(aarav_token), timeout=20)
        item = sr.json()["results"][0]
        unit_price = float(item["price"])
        # Create booking
        payload = {
            "type": "flight", "item": item,
            "passengers": [{"name": "Aarav S", "age": 30, "gender": "male"},
                           {"name": "Test P2", "age": 28, "gender": "female"}],
            "contact_email": "aarav@test.com",
            "contact_phone": "+919999999999",
            "origin": "Mumbai", "destination": "Goa",
            "travel_date": "2026-07-15",
        }
        r = requests.post(f"{API}/bookings", json=payload, headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200, r.text[:300]
        b = r.json()
        assert b["status"] == "pending_payment"
        assert b.get("pnr") and len(b["pnr"]) == 6
        assert abs(b["amount"] - unit_price * 2) < 0.01
        booking_id = b["id"]

        # List
        lr = requests.get(f"{API}/bookings", headers=hdr(aarav_token), timeout=15)
        assert lr.status_code == 200
        assert any(x["id"] == booking_id for x in lr.json())

        # Checkout
        cr = requests.post(f"{API}/payments/checkout",
                           json={"purpose": "booking", "booking_id": booking_id, "origin_url": BASE_URL},
                           headers=hdr(aarav_token), timeout=30)
        assert cr.status_code == 200, cr.text[:400]
        cj = cr.json()
        assert "checkout.stripe.com" in cj["checkout_url"]
        session_id = cj["session_id"]

        # Status pending
        time.sleep(1)
        sr = requests.get(f"{API}/payments/status/{session_id}", timeout=15)
        assert sr.status_code == 200
        assert sr.json()["payment_status"] in ("pending", "unpaid")


# ---------- Trips ----------
@pytest.fixture(scope="module")
def trip_data(aarav_token, meera_token):
    """Create a trip aarav + meera; return trip doc & member ids."""
    # ensure aarav upi
    requests.put(f"{API}/auth/profile", json={"upi_vpa": "aarav@okhdfc"}, headers=hdr(aarav_token), timeout=15)
    body = {
        "name": "TEST_Goa_Trip", "destination": "Goa",
        "start_date": "2026-07-15", "end_date": "2026-07-20",
        "budget_total": 40000, "budget_categories": {"food": 10000, "stay": 20000, "transport": 10000},
        "members": [{"name": "Meera Nair", "email": "meera@test.com"}],
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
    assert r.status_code == 200, r.text[:300]
    trip = r.json()
    assert len(trip["members"]) == 2
    aarav_m = next(m for m in trip["members"] if m["email"] == "aarav@test.com")
    meera_m = next(m for m in trip["members"] if m["email"] == "meera@test.com")
    assert meera_m["user_id"], "Meera should be linked (existing user)"
    return {"trip": trip, "aarav_m": aarav_m, "meera_m": meera_m}


class TestTrips:
    def test_meera_got_notification(self, meera_token, trip_data):
        r = requests.get(f"{API}/notifications", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        titles = [n.get("title", "") for n in r.json()]
        assert any("trip" in t.lower() or "added" in t.lower() for t in titles), titles

    def test_add_equal_expense(self, aarav_token, trip_data):
        trip = trip_data["trip"]
        a, m = trip_data["aarav_m"]["member_id"], trip_data["meera_m"]["member_id"]
        body = {
            "description": "Dinner", "amount": 3000, "category": "food",
            "paid_by": a, "split_type": "equal",
            "splits": [{"member_id": a}, {"member_id": m}],
        }
        r = requests.post(f"{API}/trips/{trip['id']}/expenses", json=body, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:300]
        exp = r.json()
        assert len(exp["splits"]) == 2
        assert all(abs(s["amount"] - 1500) < 0.01 for s in exp["splits"])

    def test_balances_and_upi(self, aarav_token, trip_data):
        trip = trip_data["trip"]
        r = requests.get(f"{API}/trips/{trip['id']}/balances", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        b = r.json()
        assert b["total_spent"] >= 3000
        assert b["by_category"].get("food", 0) >= 3000
        # suggestion: meera -> aarav 1500
        assert len(b["suggestions"]) >= 1
        s = b["suggestions"][0]
        assert s["from_member_id"] == trip_data["meera_m"]["member_id"]
        assert s["to_member_id"] == trip_data["aarav_m"]["member_id"]
        assert abs(s["amount"] - 1500) < 0.01
        # upi link since aarav has vpa
        assert s.get("upi_link") and "upi://pay" in s["upi_link"]

    def test_custom_split_validation(self, aarav_token, trip_data):
        trip = trip_data["trip"]
        a, m = trip_data["aarav_m"]["member_id"], trip_data["meera_m"]["member_id"]
        # Wrong sum
        bad = {"description": "Cab", "amount": 1000, "paid_by": a, "split_type": "custom",
               "splits": [{"member_id": a, "amount": 400}, {"member_id": m, "amount": 400}]}
        r = requests.post(f"{API}/trips/{trip['id']}/expenses", json=bad, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400

    def test_percentage_split_validation(self, aarav_token, trip_data):
        trip = trip_data["trip"]
        a, m = trip_data["aarav_m"]["member_id"], trip_data["meera_m"]["member_id"]
        bad = {"description": "Hotel", "amount": 2000, "paid_by": a, "split_type": "percentage",
               "splits": [{"member_id": a, "percent": 30}, {"member_id": m, "percent": 30}]}
        r = requests.post(f"{API}/trips/{trip['id']}/expenses", json=bad, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400

    def test_remind_creates_notification(self, aarav_token, meera_token, trip_data):
        trip = trip_data["trip"]
        a, m = trip_data["aarav_m"]["member_id"], trip_data["meera_m"]["member_id"]
        r = requests.post(f"{API}/trips/{trip['id']}/remind",
                          json={"from_member_id": m, "to_member_id": a, "amount": 1500},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("upi_link", "").startswith("upi://pay")
        # meera sees it
        nr = requests.get(f"{API}/notifications", headers=hdr(meera_token), timeout=15)
        found = [n for n in nr.json() if "owe" in n.get("title", "").lower() or "owe" in n.get("message", "").lower()]
        assert found, "Meera did not receive owe notification"
        assert found[0]["data"].get("upi_link", "").startswith("upi://pay")

    def test_settle_zeros_balance(self, aarav_token, trip_data):
        trip = trip_data["trip"]
        a, m = trip_data["aarav_m"]["member_id"], trip_data["meera_m"]["member_id"]
        r = requests.post(f"{API}/trips/{trip['id']}/settlements",
                          json={"from_member_id": m, "to_member_id": a, "amount": 1500, "method": "upi"},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        # balances should now be ~0
        br = requests.get(f"{API}/trips/{trip['id']}/balances", headers=hdr(aarav_token), timeout=15)
        b = br.json()
        assert all(abs(v) < 0.5 for v in b["net"].values()), b["net"]
        assert len(b["suggestions"]) == 0

    def test_join_by_invite(self, aarav_token, trip_data):
        # register new user
        email = f"TEST_join_{uuid.uuid4().hex[:6]}@travelo.test"
        reg = requests.post(f"{API}/auth/register", json={"name": "Joiner", "email": email, "password": "Pass@123"}, timeout=15)
        assert reg.status_code == 200
        tok = reg.json()["access_token"]
        # get trip full doc for invite_code
        tr = requests.get(f"{API}/trips/{trip_data['trip']['id']}", headers=hdr(aarav_token), timeout=15)
        code = tr.json()["invite_code"]
        jr = requests.post(f"{API}/trips/join", json={"code": code}, headers=hdr(tok), timeout=15)
        assert jr.status_code == 200, jr.text[:300]
        assert jr.json()["joined"] is True


# ---------- Destinations ----------
class TestDestinations:
    def test_list(self, aarav_token):
        r = requests.get(f"{API}/destinations", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        lst = r.json()
        assert len(lst) >= 6, f"Expected >=6 destinations, got {len(lst)}"

    def test_goa_detail(self, aarav_token):
        r = requests.get(f"{API}/destinations/goa", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "attractions" in d and len(d["attractions"]) > 0
        assert "hubs" in d
        t = d.get("transport", {})
        for key in ("buses", "cabs", "bike_rentals", "car_rentals"):
            assert key in t, f"transport missing {key}"


# ---------- Chat (SSE) ----------
class TestChat:
    def test_chat_stream_and_history(self, aarav_token):
        session_id = "general"
        payload = {"message": "Best food in Goa? One line.", "session_id": session_id, "destination": "goa"}
        got_delta = False
        with requests.post(f"{API}/chat/stream", json=payload, headers=hdr(aarav_token), stream=True, timeout=60) as r:
            assert r.status_code == 200
            deadline = time.time() + 30
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
                    got_delta = True
                if d.get("done"):
                    break
        assert got_delta, "No SSE delta received from Claude"
        # persistence
        time.sleep(1)
        h = requests.get(f"{API}/chat/history/{session_id}", headers=hdr(aarav_token), timeout=15)
        assert h.status_code == 200
        msgs = h.json()
        assert any(m["role"] == "user" for m in msgs)
        assert any(m["role"] == "assistant" and m["content"] for m in msgs)
