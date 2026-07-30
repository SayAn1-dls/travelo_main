"""Iteration 9 tests: Recap Auto Post + Facebook Login gating."""
import os
import time
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")

AARAV = {"email": "aarav@test.com", "password": "Pass@123"}
MEERA = {"email": "meera@test.com", "password": "Pass@123"}


def _login(creds):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _h(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def aarav_token():
    return _login(AARAV)


@pytest.fixture(scope="module")
def meera_token():
    return _login(MEERA)


@pytest.fixture(scope="module")
def created_trip_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(aarav_token, created_trip_ids):
    yield
    for tid in created_trip_ids:
        try:
            requests.delete(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=15)
        except Exception:
            pass


def _create_trip(token, name, start, end, member_emails=None):
    members = [{"name": e.split("@")[0].title(), "email": e} for e in (member_emails or [])]
    payload = {
        "name": name,
        "destination": "Goa",
        "start_date": start,
        "end_date": end,
        "members": members,
        "budget_total": 10000,
    }
    r = requests.post(f"{BASE_URL}/api/trips", headers=_h(token), json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()


# ================= Recap Auto Post =================

class TestRecapAutoPost:
    def test_ended_trip_auto_posts_once_across_users(self, aarav_token, meera_token, created_trip_ids):
        # Trip ended in the past
        trip = _create_trip(aarav_token, "TEST_Iter9_Ended_A",
                            "2026-07-01", "2026-07-05", ["meera@test.com"])
        tid = trip["id"]
        created_trip_ids.append(tid)

        # First GET by organizer should trigger auto-post
        r = requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        assert r.status_code == 200
        # Small settle time — inserts are awaited but be safe
        time.sleep(0.5)

        # Trip doc should now have share_token
        trip_after = r.json()
        # Re-fetch just to be sure trip has share_token now (auto-post ran)
        r2 = requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        trip_after = r2.json()
        assert trip_after.get("share_token"), f"share_token missing: {trip_after}"
        assert trip_after.get("recap_auto_posted") is True

        # Messages should include exactly one system recap message
        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages", headers=_h(aarav_token), timeout=30).json()
        sys_msgs = [m for m in msgs if m.get("system")]
        assert len(sys_msgs) == 1, f"expected 1 system message, got {len(sys_msgs)}: {sys_msgs}"
        sm = sys_msgs[0]
        assert sm.get("kind") == "recap"
        assert sm.get("name") == "Travelo"
        assert sm.get("user_id") in (None, "")
        assert sm.get("data", {}).get("recap_token"), "recap_token missing in system message"
        assert sm["data"]["recap_token"] == trip_after["share_token"]

        # Idempotency: multiple GETs (and from other user) should not add more
        for _ in range(3):
            requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(meera_token), timeout=30)
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(meera_token), timeout=30)
        time.sleep(0.3)

        msgs2 = requests.get(f"{BASE_URL}/api/trips/{tid}/messages", headers=_h(aarav_token), timeout=30).json()
        sys_msgs2 = [m for m in msgs2 if m.get("system")]
        assert len(sys_msgs2) == 1, f"idempotency broken: {len(sys_msgs2)} system messages"

        # Notifications delivered to both members (organizer + meera)
        n_aarav = requests.get(f"{BASE_URL}/api/notifications", headers=_h(aarav_token), timeout=30).json()
        n_meera = requests.get(f"{BASE_URL}/api/notifications", headers=_h(meera_token), timeout=30).json()
        a_hits = [n for n in n_aarav if n.get("type") == "recap_ready" and n.get("data", {}).get("trip_id") == tid]
        m_hits = [n for n in n_meera if n.get("type") == "recap_ready" and n.get("data", {}).get("trip_id") == tid]
        assert len(a_hits) == 1, f"aarav should have exactly 1 recap_ready notif, got {len(a_hits)}"
        assert len(m_hits) == 1, f"meera should have exactly 1 recap_ready notif, got {len(m_hits)}"

    def test_future_trip_does_not_auto_post(self, aarav_token, created_trip_ids):
        trip = _create_trip(aarav_token, "TEST_Iter9_Future",
                            "2026-09-01", "2026-09-10", [])
        tid = trip["id"]
        created_trip_ids.append(tid)

        # Trigger GET multiple times
        for _ in range(2):
            r = requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
            assert r.status_code == 200
        time.sleep(0.3)

        trip_after = requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30).json()
        assert not trip_after.get("recap_auto_posted"), "future trip should NOT be auto-posted"

        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages", headers=_h(aarav_token), timeout=30).json()
        sys_msgs = [m for m in msgs if m.get("system")]
        assert len(sys_msgs) == 0

    def test_today_end_date_does_not_auto_post(self, aarav_token, created_trip_ids):
        # end_date == today should NOT trigger (strictly less than)
        from datetime import datetime, timezone
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        trip = _create_trip(aarav_token, "TEST_Iter9_TodayEnds",
                            "2026-07-25", today, [])
        tid = trip["id"]
        created_trip_ids.append(tid)

        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        time.sleep(0.3)
        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages", headers=_h(aarav_token), timeout=30).json()
        assert not any(m.get("system") for m in msgs)

    def test_recap_token_public_accessible(self, aarav_token, created_trip_ids):
        trip = _create_trip(aarav_token, "TEST_Iter9_Ended_B",
                            "2026-06-10", "2026-06-15", [])
        tid = trip["id"]
        created_trip_ids.append(tid)

        # trigger auto-post
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        time.sleep(0.4)
        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages", headers=_h(aarav_token), timeout=30).json()
        sys_msg = next((m for m in msgs if m.get("system")), None)
        assert sys_msg is not None
        token = sys_msg["data"]["recap_token"]

        # Public GET (no auth)
        r = requests.get(f"{BASE_URL}/api/recap/{token}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # Basic shape
        assert data.get("trip", {}).get("name") == "TEST_Iter9_Ended_B" or data.get("name") == "TEST_Iter9_Ended_B" or "trip" in data


# ================= Facebook Gating =================

class TestFacebookGating:
    def test_facebook_status_unconfigured(self):
        r = requests.get(f"{BASE_URL}/api/auth/facebook/status", timeout=15)
        assert r.status_code == 200
        assert r.json() == {"configured": False}

    def test_facebook_login_400(self):
        r = requests.get(f"{BASE_URL}/api/auth/facebook/login", timeout=15, allow_redirects=False)
        assert r.status_code == 400
        body = r.json()
        detail = body.get("detail", "")
        assert "Facebook" in detail or "configured" in detail.lower()

    def test_facebook_callback_redirects_to_auth_error(self):
        r = requests.get(f"{BASE_URL}/api/auth/facebook/callback",
                         params={"code": "x", "state": "y"},
                         timeout=15, allow_redirects=False)
        assert r.status_code == 302
        loc = r.headers.get("location", "")
        assert "/auth?fb_error=1" in loc, f"expected fb_error=1 redirect, got {loc}"


# ================= Auth regression =================

class TestAuthRegression:
    def test_both_test_users_can_login(self):
        for creds in (AARAV, MEERA):
            r = requests.post(f"{BASE_URL}/api/auth/login", json=creds, timeout=30)
            assert r.status_code == 200, f"{creds['email']} login failed: {r.text}"
            data = r.json()
            assert "access_token" in data
            assert data["user"]["email"] == creds["email"]
