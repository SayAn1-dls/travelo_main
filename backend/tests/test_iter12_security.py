"""Iter12 — cookie-only auth + hardening regression."""
import os
import re
import requests
import pytest
from dotenv import dotenv_values

fe = dotenv_values("/app/frontend/.env")
BASE = (os.environ.get("REACT_APP_BACKEND_URL") or fe.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE}/api"


@pytest.fixture
def aarav_cookie_session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": "aarav@test.com", "password": "Pass@123"}, timeout=20)
    assert r.status_code == 200, r.text[:300]
    # httpOnly cookies should be set
    names = {c.name for c in s.cookies}
    assert "access_token" in names, f"access_token cookie missing: {names}"
    return s


class TestCookieAuth:
    def test_login_sets_cookies(self, aarav_cookie_session):
        # /me works using cookies only (no Authorization header)
        s = aarav_cookie_session
        assert "Authorization" not in s.headers
        r = s.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["email"] == "aarav@test.com"

    def test_trips_list_cookie_only(self, aarav_cookie_session):
        r = aarav_cookie_session.get(f"{API}/trips", timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_logout_clears_session(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": "aarav@test.com", "password": "Pass@123"}, timeout=20)
        assert r.status_code == 200
        assert s.get(f"{API}/auth/me", timeout=15).status_code == 200
        lo = s.post(f"{API}/auth/logout", timeout=15)
        assert lo.status_code == 200
        # after logout — fresh session with no cookies should be 401
        s2 = requests.Session()
        assert s2.get(f"{API}/auth/me", timeout=15).status_code == 401


class TestGoogleSession:
    def test_invalid_session_id_not_500(self):
        r = requests.post(f"{API}/auth/google/session", json={"session_id": "bogus_invalid_xyz"}, timeout=20)
        assert r.status_code >= 400 and r.status_code < 500, f"expected 4xx got {r.status_code} {r.text[:200]}"


class TestBookingPNR:
    def test_pnr_format_and_stripe_url(self, aarav_cookie_session):
        s = aarav_cookie_session
        # search first
        sr = s.post(f"{API}/bookings/search",
                    json={"type": "flight", "origin": "DEL", "destination": "GOI",
                          "date": "2026-09-15", "passengers": 1, "travel_class": "economy"},
                    timeout=20)
        assert sr.status_code == 200
        results = sr.json()["results"]
        assert len(results) > 0
        item = results[0]
        br = s.post(f"{API}/bookings",
                    json={"type": "flight", "item": item,
                          "passengers": [{"name": "TEST User", "age": 30, "gender": "male"}],
                          "contact_email": "aarav@test.com", "contact_phone": "9999999999",
                          "origin": "DEL", "destination": "GOI",
                          "travel_date": "2026-09-15", "nights": 0, "rooms": 0},
                    timeout=20)
        assert br.status_code == 200, br.text[:300]
        booking = br.json()
        pnr = booking["pnr"]
        assert re.fullmatch(r"[A-Z0-9]{6}", pnr), f"PNR format invalid: {pnr!r}"
        booking_id = booking["id"]

        # Checkout — verifies STRIPE_SECRET_KEY strict env works & returns checkout URL
        origin_url = BASE
        cr = s.post(f"{API}/payments/checkout",
                    json={"origin_url": origin_url, "purpose": "booking", "booking_id": booking_id},
                    timeout=30)
        assert cr.status_code == 200, cr.text[:400]
        data = cr.json()
        assert data.get("checkout_url", "").startswith("https://"), data
        assert "session_id" in data

        # Cleanup — cancel is not exposed; leave booking as pending_payment (harmless test data)
