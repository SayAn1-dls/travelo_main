"""Iteration 8 — Recap itinerary field, expense-from-plan (backend regression only),
   trip countdown (frontend-only feature). Also regression on recap share/og and itinerary CRUD."""
import os
import time
import uuid

import pytest
import requests
from dotenv import dotenv_values

backend_env = dotenv_values("/app/backend/.env")
frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"


def _retry_request(method, url, **kwargs):
    last = None
    for attempt in range(4):
        try:
            return requests.Session().request(method, url, **kwargs)
        except (requests.exceptions.ConnectTimeout, requests.exceptions.ConnectionError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


_orig = {"get": requests.get, "post": requests.post, "put": requests.put, "delete": requests.delete}
requests.get = lambda url, **k: _retry_request("GET", url, **k)
requests.post = lambda url, **k: _retry_request("POST", url, **k)
requests.put = lambda url, **k: _retry_request("PUT", url, **k)
requests.delete = lambda url, **k: _retry_request("DELETE", url, **k)


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
def created_trip_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup_trips(created_trip_ids):
    yield
    try:
        tok = _login("aarav@test.com", "Pass@123")
        for tid in created_trip_ids:
            try:
                requests.delete(f"{API}/trips/{tid}", headers=hdr(tok), timeout=10)
            except Exception:
                pass
    except Exception:
        pass


def _mk_trip(tok, tracker, name_prefix="TEST_Iter8", start="2026-09-01", end="2026-09-03"):
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Kochi",
        "start_date": start, "end_date": end,
        "budget_total": 5000,
        "budget_categories": {"food": 500, "activities": 500},
        "members": [{"name": "Meera Nair", "email": "meera@test.com"}],
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(tok), timeout=20)
    assert r.status_code == 200, r.text[:200]
    trip = r.json()
    tracker.append(trip["id"])
    return trip


def _mk_share(tok, tid):
    r = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(tok), timeout=15)
    assert r.status_code == 200, r.text[:200]
    return r.json()["token"]


class TestRecapItinerary:
    def test_recap_includes_itinerary_sorted(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8Recap")
        tid = trip["id"]
        # add items in mixed order across 2 days
        items = [
            {"date": "2026-09-02", "time": "10:00", "title": "Backwaters", "place": "Alleppey", "notes": ""},
            {"date": "2026-09-01", "time": "09:00", "title": "Arrive", "place": "Airport", "notes": ""},
            {"date": "2026-09-01", "time": "13:00", "title": "Fort Kochi walk", "place": "Fort Kochi", "notes": ""},
        ]
        for it in items:
            r = requests.post(f"{API}/trips/{tid}/itinerary", json=it, headers=hdr(aarav_token), timeout=15)
            assert r.status_code == 200
        token = _mk_share(aarav_token, tid)

        r = requests.get(f"{API}/recap/{token}", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "itinerary" in body, "recap must expose itinerary array"
        it = body["itinerary"]
        assert isinstance(it, list)
        assert len(it) == 3
        # sorted by (date, time)
        assert [x["title"] for x in it] == ["Arrive", "Fort Kochi walk", "Backwaters"]
        # shape check
        for row in it:
            assert set(row.keys()) >= {"date", "time", "title", "place"}
        # trip metadata still there
        assert body["name"] == trip["name"]
        assert body["destination"] == "Kochi"
        assert "stats" in body

    def test_recap_empty_itinerary(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8Empty")
        token = _mk_share(aarav_token, trip["id"])
        r = requests.get(f"{API}/recap/{token}", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("itinerary") == []

    def test_recap_share_and_og_still_work(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8Share")
        token = _mk_share(aarav_token, trip["id"])
        # share HTML page
        r = requests.get(f"{API}/recap/{token}/share", timeout=15)
        assert r.status_code == 200
        assert "og:image" in r.text
        assert "og:title" in r.text
        # og image
        r = requests.get(f"{API}/recap/{token}/og.png", timeout=20)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/")
        assert len(r.content) > 500


class TestItineraryRegression:
    """Quick regression on itinerary CRUD to ensure iter8 didn't regress iter7."""
    def test_crud_flow(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8ItinReg")
        tid = trip["id"]
        r = requests.post(f"{API}/trips/{tid}/itinerary",
                          json={"date": "2026-09-01", "time": "10:00", "title": "X", "place": "P", "notes": ""},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        iid = r.json()["id"]
        # list
        r = requests.get(f"{API}/trips/{tid}/itinerary", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200 and any(x["id"] == iid for x in r.json())
        # update
        r = requests.put(f"{API}/trips/{tid}/itinerary/{iid}",
                         json={"date": "2026-09-01", "time": "11:00", "title": "X2", "place": "P", "notes": ""},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200 and r.json()["title"] == "X2"
        # delete
        r = requests.delete(f"{API}/trips/{tid}/itinerary/{iid}", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200


class TestChatReactionsRegression:
    def test_react_flow(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8ChatReg")
        tid = trip["id"]
        r = requests.post(f"{API}/trips/{tid}/messages", json={"text": "hi"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        mid = r.json()["id"]
        r = requests.post(f"{API}/trips/{tid}/messages/{mid}/react",
                          json={"emoji": "🎉"}, headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        assert "🎉" in r.json()["reactions"]


class TestExpensesRegression:
    """Backend does not know about 'from plan' — but the expense POST that the UI will call
    with prefilled description+category must still work."""
    def test_expense_create_activities_category(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, created_trip_ids, "TEST_Iter8Exp")
        tid = trip["id"]
        # find aarav's member id
        me = next(m for m in trip["members"] if m.get("email") == "aarav@test.com" or m.get("name", "").lower().startswith("aarav"))
        body = {
            "description": "Fort Kochi walk",
            "amount": 250.0,
            "category": "activities",
            "paid_by": me["member_id"],
            "split_type": "equal",
            "split_between": [m["member_id"] for m in trip["members"]],
        }
        r = requests.post(f"{API}/trips/{tid}/expenses", json=body, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:200]
        e = r.json()
        assert e["description"] == "Fort Kochi walk"
        assert e["category"] == "activities"
        assert abs(e["amount"] - 250.0) < 1e-6
        # list
        r = requests.get(f"{API}/trips/{tid}/expenses", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert any(x["description"] == "Fort Kochi walk" and x["category"] == "activities" for x in r.json())
        # balances endpoint still works
        r = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["total_spent"] >= 250.0
