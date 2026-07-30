"""Iteration 6 — Trip archive/unarchive/delete, chat unread + notification dedup,
recap share HTML + og.png card."""
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
    # cleanup with aarav token
    try:
        tok = _login("aarav@test.com", "Pass@123")
        for tid in created_trip_ids:
            try:
                requests.delete(f"{API}/trips/{tid}", headers=hdr(tok), timeout=10)
            except Exception:
                pass
    except Exception:
        pass


def _mk_trip(tok, name_prefix="TEST_Iter6", extra_members=None, tracker=None):
    members = extra_members if extra_members is not None else [{"name": "Meera Nair", "email": "meera@test.com"}]
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Paris",
        "start_date": "2026-12-01", "end_date": "2026-12-05",
        "budget_total": 5000,
        "budget_categories": {"food": 500},
        "members": members,
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(tok), timeout=20)
    assert r.status_code == 200, r.text[:200]
    trip = r.json()
    if tracker is not None:
        tracker.append(trip["id"])
    return trip


# ---------- Archive / Unarchive ----------
class TestArchive:
    def test_organizer_archive_and_unarchive(self, aarav_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_Archive", tracker=created_trip_ids)
        tid = trip["id"]

        r = requests.post(f"{API}/trips/{tid}/archive", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": True, "archived": True}

        # list_trips shows archived flag
        lst = requests.get(f"{API}/trips", headers=hdr(aarav_token), timeout=15).json()
        found = next(t for t in lst if t["id"] == tid)
        assert found.get("archived") is True

        # Unarchive
        r = requests.post(f"{API}/trips/{tid}/unarchive", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        assert r.json() == {"ok": True, "archived": False}

        lst = requests.get(f"{API}/trips", headers=hdr(aarav_token), timeout=15).json()
        found = next(t for t in lst if t["id"] == tid)
        assert found.get("archived") in (False, None)

    def test_non_organizer_403(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ArchivePerm", tracker=created_trip_ids)
        tid = trip["id"]

        r = requests.post(f"{API}/trips/{tid}/archive", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403
        r = requests.post(f"{API}/trips/{tid}/unarchive", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403


# ---------- Delete trip ----------
class TestDeleteTrip:
    def test_non_organizer_403(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_DelPerm", tracker=created_trip_ids)
        tid = trip["id"]
        r = requests.delete(f"{API}/trips/{tid}", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403

    def test_delete_cascades(self, aarav_token, meera_token, mongo):
        trip = _mk_trip(aarav_token, name_prefix="TEST_DelCascade")
        tid = trip["id"]
        a = next(m["member_id"] for m in trip["members"] if m["email"] == "aarav@test.com")
        m = next(m["member_id"] for m in trip["members"] if m["email"] == "meera@test.com")

        # expense
        er = requests.post(f"{API}/trips/{tid}/expenses",
                           json={"description": "d", "amount": 100, "category": "food", "paid_by": a,
                                 "split_type": "equal",
                                 "splits": [{"member_id": a}, {"member_id": m}]},
                           headers=hdr(aarav_token), timeout=15)
        assert er.status_code == 200
        # chat message
        cr = requests.post(f"{API}/trips/{tid}/messages", json={"text": "hi"},
                           headers=hdr(aarav_token), timeout=15)
        assert cr.status_code == 200
        # recap share token
        sh = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert sh.status_code == 200
        share_tok = sh.json()["token"]

        # DELETE trip
        dr = requests.delete(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=15)
        assert dr.status_code == 200, dr.text[:200]

        # GET trip → 404
        gr = requests.get(f"{API}/trips/{tid}", headers=hdr(aarav_token), timeout=15)
        assert gr.status_code == 404

        # messages/expenses/settlements cascade — direct DB check
        assert mongo.trip_messages.count_documents({"trip_id": tid}) == 0
        assert mongo.expenses.count_documents({"trip_id": tid}) == 0
        assert mongo.settlements.count_documents({"trip_id": tid}) == 0
        assert mongo.chat_reads.count_documents({"trip_id": tid}) == 0

        # recap token → 404
        pr = requests.get(f"{API}/recap/{share_tok}", timeout=15)
        assert pr.status_code == 404


# ---------- Chat unread ----------
class TestChatUnread:
    def test_unread_count_and_read(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_Unread", tracker=created_trip_ids)
        tid = trip["id"]

        # Aarav posts 3 msgs
        for i in range(3):
            requests.post(f"{API}/trips/{tid}/messages", json={"text": f"m{i}"},
                          headers=hdr(aarav_token), timeout=15)

        # Meera's unread
        r = requests.get(f"{API}/trips/{tid}/messages/unread", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["count"] == 3

        # Aarav's own unread (from OTHERS) — should be 0
        r = requests.get(f"{API}/trips/{tid}/messages/unread", headers=hdr(aarav_token), timeout=15)
        assert r.json()["count"] == 0

        # Meera marks read
        r = requests.post(f"{API}/trips/{tid}/messages/read", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200

        r = requests.get(f"{API}/trips/{tid}/messages/unread", headers=hdr(meera_token), timeout=15)
        assert r.json()["count"] == 0

    def test_list_trips_includes_unread_chat(self, aarav_token, meera_token, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ListUnread", tracker=created_trip_ids)
        tid = trip["id"]
        requests.post(f"{API}/trips/{tid}/messages", json={"text": "hey"},
                      headers=hdr(aarav_token), timeout=15)

        lst = requests.get(f"{API}/trips", headers=hdr(meera_token), timeout=15).json()
        found = next(t for t in lst if t["id"] == tid)
        assert "unread_chat" in found
        assert found["unread_chat"] >= 1


# ---------- Chat notification dedup ----------
class TestChatNotificationDedup:
    def test_dedup_and_reissue_after_read(self, aarav_token, meera_token, mongo, created_trip_ids):
        trip = _mk_trip(aarav_token, name_prefix="TEST_NotifDedup", tracker=created_trip_ids)
        tid = trip["id"]

        meera_uid = str(mongo.users.find_one({"email": "meera@test.com"})["_id"])
        # Clear prior chat_message notifs for this trip (shouldn't exist yet, but be safe)
        mongo.notifications.delete_many(
            {"user_id": meera_uid, "type": "chat_message", "data.trip_id": tid})

        # Aarav posts 2 msgs
        requests.post(f"{API}/trips/{tid}/messages", json={"text": "first"},
                      headers=hdr(aarav_token), timeout=15)
        requests.post(f"{API}/trips/{tid}/messages", json={"text": "second"},
                      headers=hdr(aarav_token), timeout=15)
        time.sleep(0.3)

        unread_notifs = list(mongo.notifications.find(
            {"user_id": meera_uid, "type": "chat_message", "data.trip_id": tid, "read": False}))
        assert len(unread_notifs) == 1, f"expected 1 unread chat notif, got {len(unread_notifs)}"
        n = unread_notifs[0]
        msg = n.get("message", "") + " " + n.get("body", "")
        # 'Name: text' format
        assert ":" in msg
        # Message should reference the sender
        assert "first" in msg or "second" in msg or "Aarav" in msg or "Aarav" in n.get("title", "")

        # Meera marks read → notif read
        r = requests.post(f"{API}/trips/{tid}/messages/read", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 200
        unread_notifs = list(mongo.notifications.find(
            {"user_id": meera_uid, "type": "chat_message", "data.trip_id": tid, "read": False}))
        assert len(unread_notifs) == 0

        # Aarav posts again → new notif created
        requests.post(f"{API}/trips/{tid}/messages", json={"text": "third"},
                      headers=hdr(aarav_token), timeout=15)
        time.sleep(0.3)
        unread_notifs = list(mongo.notifications.find(
            {"user_id": meera_uid, "type": "chat_message", "data.trip_id": tid, "read": False}))
        assert len(unread_notifs) == 1, f"expected new notif after read+new msg, got {len(unread_notifs)}"


# ---------- Recap share HTML + og.png ----------
class TestRecapShare:
    def _mk_shared(self, aarav_token, tracker):
        trip = _mk_trip(aarav_token, name_prefix="TEST_ShareRecap", tracker=tracker)
        tid = trip["id"]
        sh = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert sh.status_code == 200
        return trip, sh.json()["token"]

    def test_share_page_html(self, aarav_token, created_trip_ids):
        trip, tok = self._mk_shared(aarav_token, created_trip_ids)
        # No auth — public
        r = requests.get(f"{API}/recap/{tok}/share", timeout=20)
        assert r.status_code == 200
        assert "text/html" in r.headers.get("content-type", "")
        html = r.text
        assert trip["name"] in html
        assert f'og:image" content=' in html
        assert f"/api/recap/{tok}/og.png" in html
        assert f"/recap/{tok}" in html
        # meta refresh redirect
        assert "http-equiv=\"refresh\"" in html or "location.replace" in html

    def test_og_png(self, aarav_token, created_trip_ids):
        trip, tok = self._mk_shared(aarav_token, created_trip_ids)
        r = requests.get(f"{API}/recap/{tok}/og.png", timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("image/png")
        # PNG magic bytes
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
        # Check dimensions via PIL
        from PIL import Image
        import io as _io
        im = Image.open(_io.BytesIO(r.content))
        assert im.size == (1200, 630), f"expected 1200x630, got {im.size}"

    def test_invalid_token_404(self):
        r = requests.get(f"{API}/recap/invalid_token_xyz/share", timeout=15)
        assert r.status_code == 404
        r = requests.get(f"{API}/recap/invalid_token_xyz/og.png", timeout=15)
        assert r.status_code == 404
