"""Iteration 5 — Trip currency, group chat messages, currency in payments/recap/notifications."""
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values
from pymongo import MongoClient


def _retry_request(method, url, **kwargs):
    last = None
    for attempt in range(4):
        try:
            return requests.request(method, url, **kwargs)
        except (requests.exceptions.ConnectTimeout, requests.exceptions.ConnectionError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


_orig = {"get": requests.get, "post": requests.post, "put": requests.put, "delete": requests.delete}
requests.get = lambda url, **k: _retry_request("GET", url, **k)
requests.post = lambda url, **k: _retry_request("POST", url, **k)
requests.put = lambda url, **k: _retry_request("PUT", url, **k)
requests.delete = lambda url, **k: _retry_request("DELETE", url, **k)

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
    assert r.status_code == 200, f"login failed {email}: {r.status_code} {r.text[:200]}"
    return r.json()["access_token"]


@pytest.fixture(scope="module")
def aarav_token():
    return _login("aarav@test.com", "Pass@123")


@pytest.fixture(scope="module")
def meera_token():
    return _login("meera@test.com", "Pass@123")


@pytest.fixture(scope="module")
def mongo():
    return MongoClient(MONGO_URL)[DB_NAME]


def _mk_trip(tok, currency=None, name_prefix="TEST_Iter5", extra_members=None, budget_total=5000, cats=None):
    members = extra_members if extra_members is not None else [{"name": "Meera Nair", "email": "meera@test.com"}]
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Paris",
        "start_date": "2026-12-01", "end_date": "2026-12-05",
        "budget_total": budget_total,
        "budget_categories": cats or {"food": 500},
        "members": members,
    }
    if currency is not None:
        body["currency"] = currency
    r = requests.post(f"{API}/trips", json=body, headers=hdr(tok), timeout=20)
    return r


# ---------- Trip currency creation ----------
class TestTripCurrency:
    def test_create_trip_with_eur(self, aarav_token):
        r = _mk_trip(aarav_token, currency="EUR")
        assert r.status_code == 200, r.text[:200]
        t = r.json()
        assert t["currency"] == "EUR"
        # Cleanup
        requests.delete(f"{API}/trips/{t['id']}", headers=hdr(aarav_token), timeout=10)

    def test_invalid_currency_400(self, aarav_token):
        r = _mk_trip(aarav_token, currency="XYZ")
        assert r.status_code == 400, f"expected 400 got {r.status_code}: {r.text[:200]}"
        assert "Unsupported currency" in r.text

    def test_omit_currency_defaults_inr(self, aarav_token):
        # Omit currency by not passing it (pydantic default INR)
        body = {
            "name": f"TEST_DefaultINR_{uuid.uuid4().hex[:6]}",
            "destination": "Delhi", "start_date": "2026-11-01", "end_date": "2026-11-03",
            "budget_total": 1000, "budget_categories": {}, "members": [],
        }
        r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200
        t = r.json()
        assert t["currency"] == "INR"
        requests.delete(f"{API}/trips/{t['id']}", headers=hdr(aarav_token), timeout=10)


# ---------- Chat messages ----------
class TestChatMessages:
    def test_post_and_list_multi_user(self, aarav_token, meera_token):
        r = _mk_trip(aarav_token, currency="EUR", name_prefix="TEST_Chat")
        assert r.status_code == 200
        trip = r.json()
        tid = trip["id"]

        # Aarav posts
        r1 = requests.post(f"{API}/trips/{tid}/messages", json={"text": "Hello team!"},
                           headers=hdr(aarav_token), timeout=15)
        assert r1.status_code == 200, r1.text[:200]
        m1 = r1.json()
        assert m1["text"] == "Hello team!"
        assert m1.get("user_id") and m1.get("name") and m1.get("created_at")

        # Meera posts
        r2 = requests.post(f"{API}/trips/{tid}/messages", json={"text": "Hi Aarav"},
                           headers=hdr(meera_token), timeout=15)
        assert r2.status_code == 200

        # Both see both messages
        for tok in (aarav_token, meera_token):
            lr = requests.get(f"{API}/trips/{tid}/messages", headers=hdr(tok), timeout=15)
            assert lr.status_code == 200
            texts = [m["text"] for m in lr.json()]
            assert "Hello team!" in texts and "Hi Aarav" in texts
            # Chronological
            ts = [m["created_at"] for m in lr.json()]
            assert ts == sorted(ts)

        requests.delete(f"{API}/trips/{tid}/messages", headers=hdr(aarav_token), timeout=10)
        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)

    def test_empty_text_422(self, aarav_token):
        r = _mk_trip(aarav_token, name_prefix="TEST_ChatEmpty")
        trip = r.json()
        tid = trip["id"]
        r = requests.post(f"{API}/trips/{tid}/messages", json={"text": ""},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 422, f"expected 422 got {r.status_code}"
        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)

    def test_non_member_403(self, aarav_token, meera_token):
        # Aarav creates trip with NO other members
        r = _mk_trip(aarav_token, name_prefix="TEST_ChatSolo", extra_members=[])
        trip = r.json()
        tid = trip["id"]

        # Meera tries to list → 403
        lr = requests.get(f"{API}/trips/{tid}/messages", headers=hdr(meera_token), timeout=15)
        assert lr.status_code == 403, f"non-member list should 403, got {lr.status_code}"

        # Meera tries to post → 403
        pr = requests.post(f"{API}/trips/{tid}/messages", json={"text": "sneak"},
                           headers=hdr(meera_token), timeout=15)
        assert pr.status_code == 403, f"non-member post should 403, got {pr.status_code}"

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)


# ---------- Currency symbol in notifications ----------
class TestCurrencyInNotifications:
    def test_expense_notification_uses_trip_currency(self, aarav_token, meera_token, mongo):
        # EUR trip
        r = _mk_trip(aarav_token, currency="EUR", name_prefix="TEST_EurNotif",
                     budget_total=100, cats={"food": 10})
        trip = r.json()
        tid = trip["id"]
        a = next(m["member_id"] for m in trip["members"] if m["email"] == "aarav@test.com")
        m = next(m["member_id"] for m in trip["members"] if m["email"] == "meera@test.com")

        # Add expense that also crosses food budget → both expense_added + budget_alert notif
        er = requests.post(f"{API}/trips/{tid}/expenses",
                           json={"description": "Dinner", "amount": 50, "category": "food",
                                 "paid_by": a, "split_type": "equal",
                                 "splits": [{"member_id": a}, {"member_id": m}]},
                           headers=hdr(aarav_token), timeout=15)
        assert er.status_code == 200
        time.sleep(0.3)

        # Check meera's notifications (she's a member so gets notified)
        meera_uid = str(mongo.users.find_one({"email": "meera@test.com"})["_id"])
        notifs = list(mongo.notifications.find({"user_id": meera_uid, "data.trip_id": tid}))
        assert len(notifs) >= 1
        joined = " | ".join((n.get("title", "") + " " + n.get("message", "") + " " + n.get("body", "")) for n in notifs)
        assert "€" in joined, f"expected € in notifications, got: {joined[:400]}"
        assert "₹" not in joined, f"should NOT contain ₹ in EUR trip notifications: {joined[:400]}"

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)


# ---------- Non-INR balances: no upi_link ----------
class TestBalancesUpiLink:
    def test_non_inr_no_upi_link(self, aarav_token, meera_token):
        r = _mk_trip(aarav_token, currency="EUR", name_prefix="TEST_EurBal")
        trip = r.json()
        tid = trip["id"]
        a = next(m["member_id"] for m in trip["members"] if m["email"] == "aarav@test.com")
        m = next(m["member_id"] for m in trip["members"] if m["email"] == "meera@test.com")
        # Aarav pays 100, split equally
        requests.post(f"{API}/trips/{tid}/expenses",
                      json={"description": "d", "amount": 100, "category": "food", "paid_by": a,
                            "split_type": "equal", "splits": [{"member_id": a}, {"member_id": m}]},
                      headers=hdr(aarav_token), timeout=15)

        br = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert br.status_code == 200
        data = br.json()
        assert data["suggestions"], "should have at least one settlement suggestion"
        for s in data["suggestions"]:
            assert s.get("upi_link") in (None, ""), f"EUR trip must not have upi_link, got {s.get('upi_link')}"

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)

    def test_inr_has_upi_link_when_vpa_present(self, aarav_token, mongo):
        # ensure aarav has upi_vpa
        mongo.users.update_one({"email": "aarav@test.com"}, {"$set": {"upi_vpa": "aarav@upi"}})

        r = _mk_trip(aarav_token, currency="INR", name_prefix="TEST_InrBal")
        trip = r.json()
        tid = trip["id"]
        a = next(m["member_id"] for m in trip["members"] if m["email"] == "aarav@test.com")
        m = next(m["member_id"] for m in trip["members"] if m["email"] == "meera@test.com")
        requests.post(f"{API}/trips/{tid}/expenses",
                      json={"description": "d", "amount": 100, "category": "food", "paid_by": a,
                            "split_type": "equal", "splits": [{"member_id": a}, {"member_id": m}]},
                      headers=hdr(aarav_token), timeout=15)

        br = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert br.status_code == 200
        sug = br.json()["suggestions"]
        assert sug
        # Aarav is creditor (upi_vpa set)
        creditor_sugs = [s for s in sug if s.get("to_member_id") == a]
        assert creditor_sugs and creditor_sugs[0].get("upi_link"), "INR trip with creditor upi_vpa must include upi_link"
        assert "upi://" in creditor_sugs[0]["upi_link"]

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)


# ---------- Stripe settlement checkout with trip currency ----------
class TestStripeCheckoutCurrency:
    def test_settlement_eur_session(self, aarav_token, meera_token, mongo):
        r = _mk_trip(aarav_token, currency="EUR", name_prefix="TEST_EurStripe")
        trip = r.json()
        tid = trip["id"]
        a = next(mm["member_id"] for mm in trip["members"] if mm["email"] == "aarav@test.com")
        m = next(mm["member_id"] for mm in trip["members"] if mm["email"] == "meera@test.com")

        # add expense so meera owes aarav
        requests.post(f"{API}/trips/{tid}/expenses",
                      json={"description": "d", "amount": 100, "category": "food", "paid_by": a,
                            "split_type": "equal", "splits": [{"member_id": a}, {"member_id": m}]},
                      headers=hdr(aarav_token), timeout=15)

        # Meera initiates settlement checkout (she owes aarav 50)
        body = {
            "purpose": "settlement",
            "origin_url": "https://example.com",
            "trip_id": tid,
            "from_member_id": m,
            "to_member_id": a,
            "amount": 50,
        }
        cr = requests.post(f"{API}/payments/checkout", json=body, headers=hdr(meera_token), timeout=30)
        # Stripe may or may not be configured; accept 200 with valid session, else surface
        if cr.status_code != 200:
            pytest.skip(f"Stripe checkout not available: {cr.status_code} {cr.text[:200]}")
        data = cr.json()
        sid = data.get("session_id")
        assert sid, f"missing session_id: {data}"

        # Verify payment_transactions doc has currency=eur
        time.sleep(0.3)
        tx = mongo.payment_transactions.find_one({"session_id": sid})
        assert tx is not None, "payment_transactions doc not found"
        assert tx.get("currency") == "eur", f"expected currency=eur, got {tx.get('currency')}"

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)


# ---------- Recap currency field ----------
class TestRecapCurrency:
    def test_recap_includes_currency(self, aarav_token):
        r = _mk_trip(aarav_token, currency="EUR", name_prefix="TEST_EurRecap")
        trip = r.json()
        tid = trip["id"]

        sh = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert sh.status_code == 200
        tok = sh.json()["token"]

        pub = requests.get(f"{API}/recap/{tok}", timeout=15)
        assert pub.status_code == 200
        data = pub.json()
        assert data.get("currency") == "EUR", f"recap should include currency=EUR, got {data.get('currency')}"

        requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=10)
