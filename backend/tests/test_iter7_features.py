"""Iteration 7 — Chat reactions, Trip itinerary CRUD, cascade includes itinerary."""
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


def _mk_trip(tok, name_prefix="TEST_Iter7", tracker=None):
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Manali",
        "start_date": "2026-09-01", "end_date": "2026-09-03",
        "budget_total": 5000,
        "budget_categories": {"food": 500},
        "members": [{"name": "Meera Nair", "email": "meera@test.com"}],
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(tok), timeout=20)
    assert r.status_code == 200, r.text[:200]
    trip = r.json()
    if tracker is not None:
        tracker.append(trip["id"])
    return trip


def _post_msg(tok, tid, text="hello"):
    r = requests.post(f"{API}/trips/{tid}/messages", json={"text": text}, headers=hdr(tok), timeout=15)
    assert r.status_code == 200, r.text[:200]
    return r.json()


# ---------- Chat Reactions ----------
class TestReactions:
    def test_react_toggle_and_persistence(self, aarav_token, meera_token, mongo, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_React", tracker=created_trip_ids)
        tid = trip["id"]
        msg = _post_msg(aarav_token, tid, "react-me")
        mid = msg["id"]

        aarav_uid = str(mongo.users.find_one({"email": "aarav@test.com"})["_id"])
        meera_uid = str(mongo.users.find_one({"email": "meera@test.com"})["_id"])

        # Aarav adds ❤️
        r = requests.post(f"{API}/trips/{tid}/messages/{mid}/react",
                          json={"emoji": "❤️"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:200]
        assert r.json()["reactions"] == {"❤️": [aarav_uid]}

        # Meera adds 👍
        r = requests.post(f"{API}/trips/{tid}/messages/{mid}/react",
                          json={"emoji": "👍"}, headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        reactions = r.json()["reactions"]
        assert set(reactions.get("❤️", [])) == {aarav_uid}
        assert set(reactions.get("👍", [])) == {meera_uid}

        # Meera adds ❤️ too
        r = requests.post(f"{API}/trips/{tid}/messages/{mid}/react",
                          json={"emoji": "❤️"}, headers=hdr(meera_token), timeout=15)
        reactions = r.json()["reactions"]
        assert set(reactions["❤️"]) == {aarav_uid, meera_uid}

        # Aarav toggles off ❤️
        r = requests.post(f"{API}/trips/{tid}/messages/{mid}/react",
                          json={"emoji": "❤️"}, headers=hdr(aarav_token), timeout=15)
        reactions = r.json()["reactions"]
        assert set(reactions["❤️"]) == {meera_uid}

        # GET messages includes reactions map
        lst = requests.get(f"{API}/trips/{tid}/messages", headers=hdr(aarav_token), timeout=15).json()
        target = next(m for m in lst if m["id"] == mid)
        assert "reactions" in target
        assert set(target["reactions"]["❤️"]) == {meera_uid}
        assert set(target["reactions"]["👍"]) == {meera_uid}

    def test_unsupported_emoji_400(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ReactBad", tracker=created_trip_ids)
        tid = trip["id"]
        msg = _post_msg(aarav_token, tid)
        r = requests.post(f"{API}/trips/{tid}/messages/{msg['id']}/react",
                          json={"emoji": "🦄"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400

    def test_invalid_message_id(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ReactBadMid", tracker=created_trip_ids)
        tid = trip["id"]
        r = requests.post(f"{API}/trips/{tid}/messages/not_an_oid/react",
                          json={"emoji": "❤️"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code in (400, 404)
        # Well-formed but non-existent ObjectId → 404
        r = requests.post(f"{API}/trips/{tid}/messages/507f1f77bcf86cd799439011/react",
                          json={"emoji": "❤️"}, headers=hdr(aarav_token), timeout=15)
        assert r.status_code in (400, 404)

    def test_non_member_403(self, aarav_token, created_trip_ids):
        # Create a trip WITHOUT meera as a member
        body = {
            "name": f"TEST_ReactSolo_{uuid.uuid4().hex[:6]}",
            "destination": "Goa", "start_date": "2026-09-01", "end_date": "2026-09-02",
            "budget_total": 100, "budget_categories": {"food": 50}, "members": [],
        }
        r = requests.post(f"{API}/trips", json=body, headers=hdr(aarav_token), timeout=20)
        assert r.status_code == 200
        trip = r.json()
        tid = trip["id"]
        created_trip_ids.append(tid)
        msg = _post_msg(aarav_token, tid)
        meera_token = _login("meera@test.com", "Pass@123")
        r = requests.post(f"{API}/trips/{tid}/messages/{msg['id']}/react",
                          json={"emoji": "❤️"}, headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403


# ---------- Itinerary CRUD ----------
class TestItinerary:
    def test_add_list_sorted(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_Itin", tracker=created_trip_ids)
        tid = trip["id"]

        # Add items in mixed order
        items = [
            {"date": "2026-09-02", "time": "10:00", "title": "Rohtang", "place": "Rohtang Pass", "notes": ""},
            {"date": "2026-09-01", "time": "09:00", "title": "Arrive", "place": "Airport", "notes": "pickup"},
            {"date": "2026-09-01", "time": "13:00", "title": "Lunch", "place": "Cafe", "notes": ""},
        ]
        for it in items:
            r = requests.post(f"{API}/trips/{tid}/itinerary", json=it, headers=hdr(aarav_token), timeout=15)
            assert r.status_code == 200, r.text[:200]
            body = r.json()
            assert body["title"] == it["title"]
            assert body["member_name"]
            assert body["created_by"]
            assert "id" in body

        # Meera (member) can also add
        r = requests.post(f"{API}/trips/{tid}/itinerary",
                          json={"date": "2026-09-03", "time": "", "title": "Return", "place": "Airport", "notes": ""},
                          headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        meera_item = r.json()

        lst = requests.get(f"{API}/trips/{tid}/itinerary", headers=hdr(aarav_token), timeout=15).json()
        assert len(lst) == 4
        # sort by date then time
        titles = [it["title"] for it in lst]
        assert titles == ["Arrive", "Lunch", "Rohtang", "Return"]
        # each has member_name + created_by
        for it in lst:
            assert it.get("member_name")
            assert it.get("created_by")

    def test_bad_date(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ItinBadDate", tracker=created_trip_ids)
        r = requests.post(f"{API}/trips/{trip['id']}/itinerary",
                          json={"date": "tomorrow", "time": "10:00", "title": "X", "place": "", "notes": ""},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400
        assert "YYYY-MM-DD" in r.text

    def test_bad_time(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ItinBadTime", tracker=created_trip_ids)
        r = requests.post(f"{API}/trips/{trip['id']}/itinerary",
                          json={"date": "2026-09-01", "time": "25:99", "title": "X", "place": "", "notes": ""},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400

    def test_empty_title_422(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ItinNoTitle", tracker=created_trip_ids)
        r = requests.post(f"{API}/trips/{trip['id']}/itinerary",
                          json={"date": "2026-09-01", "time": "10:00", "title": "", "place": "", "notes": ""},
                          headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 422

    def test_edit_delete_permissions(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ItinPerm", tracker=created_trip_ids)
        tid = trip["id"]

        # Meera adds an item
        r = requests.post(f"{API}/trips/{tid}/itinerary",
                          json={"date": "2026-09-01", "time": "10:00", "title": "MeeraItem", "place": "", "notes": ""},
                          headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        meera_item = r.json()

        # Aarav (organizer) adds an item
        r = requests.post(f"{API}/trips/{tid}/itinerary",
                          json={"date": "2026-09-02", "time": "10:00", "title": "AaravItem", "place": "", "notes": ""},
                          headers=hdr(aarav_token), timeout=15)
        aarav_item = r.json()

        # Meera can edit her own
        r = requests.put(f"{API}/trips/{tid}/itinerary/{meera_item['id']}",
                         json={"date": "2026-09-01", "time": "11:00", "title": "MeeraItem2", "place": "", "notes": ""},
                         headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "MeeraItem2"

        # Meera CANNOT edit aarav's item (she's not organizer, not creator) → 403
        r = requests.put(f"{API}/trips/{tid}/itinerary/{aarav_item['id']}",
                         json={"date": "2026-09-02", "time": "10:00", "title": "hack", "place": "", "notes": ""},
                         headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403

        # Meera CANNOT delete aarav's item
        r = requests.delete(f"{API}/trips/{tid}/itinerary/{aarav_item['id']}",
                            headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403

        # Organizer aarav CAN edit meera's item
        r = requests.put(f"{API}/trips/{tid}/itinerary/{meera_item['id']}",
                         json={"date": "2026-09-01", "time": "12:00", "title": "OrgEdit", "place": "", "notes": ""},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "OrgEdit"

        # Organizer aarav CAN delete meera's item
        r = requests.delete(f"{API}/trips/{tid}/itinerary/{meera_item['id']}",
                            headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200

        # Creator meera can delete own — add another and delete
        r = requests.post(f"{API}/trips/{tid}/itinerary",
                          json={"date": "2026-09-01", "time": "10:00", "title": "Mine", "place": "", "notes": ""},
                          headers=hdr(meera_token), timeout=15)
        m2 = r.json()
        r = requests.delete(f"{API}/trips/{tid}/itinerary/{m2['id']}", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200

    def test_delete_cascade_removes_itinerary(self, aarav_token, mongo):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ItinCascade")
        tid = trip["id"]
        requests.post(f"{API}/trips/{tid}/itinerary",
                      json={"date": "2026-09-01", "time": "10:00", "title": "X", "place": "", "notes": ""},
                      headers=hdr(aarav_token), timeout=15)
        assert mongo.itinerary_items.count_documents({"trip_id": tid}) >= 1
        r = requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert mongo.itinerary_items.count_documents({"trip_id": tid}) == 0
