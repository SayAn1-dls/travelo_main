"""Iteration 11 tests: Explore Glow-Up (17 destinations) + Settle-Up Nudge."""
import os
import time
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")

AARAV = {"email": "aarav@test.com", "password": "Pass@123"}
MEERA = {"email": "meera@test.com", "password": "Pass@123"}

NEW_SLUGS = ["paris", "tokyo", "santorini", "dubai", "bangkok",
             "singapore", "phuket", "rome", "istanbul", "agra", "leh"]


def _login(c):
    r = requests.post(f"{BASE_URL}/api/auth/login", json=c, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _h(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


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


# ================ Destinations (Explore) ================

class TestDestinations:
    def test_list_returns_17_items_with_required_fields(self):
        r = requests.get(f"{BASE_URL}/api/destinations", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        # Support either list or wrapped
        items = data if isinstance(data, list) else data.get("items") or data.get("destinations")
        assert isinstance(items, list), f"unexpected shape: {type(data)}"
        assert len(items) == 17, f"expected 17 destinations, got {len(items)}"
        for d in items:
            for k in ("slug", "name", "country", "tagline", "image", "best_time"):
                assert k in d and d[k], f"missing/empty '{k}' in {d}"

    def test_new_slugs_present(self):
        r = requests.get(f"{BASE_URL}/api/destinations", timeout=30)
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        slugs = {d["slug"] for d in items}
        for s in NEW_SLUGS:
            assert s in slugs, f"new slug '{s}' missing"

    @pytest.mark.parametrize("slug", NEW_SLUGS)
    def test_destination_detail_new_slug(self, slug):
        r = requests.get(f"{BASE_URL}/api/destinations/{slug}", timeout=30)
        assert r.status_code == 200, f"{slug} -> {r.status_code} {r.text[:200]}"
        d = r.json()
        assert d.get("slug") == slug
        attractions = d.get("attractions") or []
        assert len(attractions) == 5, f"{slug}: expected 5 attractions, got {len(attractions)}"
        assert d.get("hubs"), f"{slug}: hubs missing"
        assert d.get("transport"), f"{slug}: transport missing"


# ================ Settle-Up Nudge ================

def _create_trip(token, name, start, end, member_emails=None, currency="INR"):
    members = [{"name": e.split("@")[0].title(), "email": e} for e in (member_emails or [])]
    payload = {
        "name": name,
        "destination": "Goa",
        "start_date": start,
        "end_date": end,
        "members": members,
        "budget_total": 10000,
        "currency": currency,
    }
    r = requests.post(f"{BASE_URL}/api/trips", headers=_h(token), json=payload, timeout=30)
    assert r.status_code in (200, 201), r.text
    return r.json()


class TestSettleNudge:
    def test_wrapped_trip_with_expense_posts_recap_and_settle(self, aarav_token, meera_token, created_trip_ids):
        trip = _create_trip(aarav_token, "TEST_Iter11_Settle_A",
                            "2026-06-01", "2026-06-05", ["meera@test.com"], "INR")
        tid = trip["id"]
        created_trip_ids.append(tid)

        # Resolve member_ids for Aarav (payer)
        members = trip.get("members") or []
        aarav_m = next(m for m in members if (m.get("email") or "").lower() == "aarav@test.com")
        exp_payload = {
            "description": "Hotel",
            "amount": 6000,
            "category": "stay",
            "paid_by": aarav_m["member_id"],
            "split_type": "equal",
        }
        r = requests.post(f"{BASE_URL}/api/trips/{tid}/expenses", headers=_h(aarav_token),
                          json=exp_payload, timeout=30)
        assert r.status_code in (200, 201), f"expense create failed: {r.status_code} {r.text[:300]}"

        # First GET triggers auto-post
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        time.sleep(0.8)

        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages",
                            headers=_h(aarav_token), timeout=30).json()
        sys = [m for m in msgs if m.get("system")]
        kinds = [m.get("kind") for m in sys]
        assert "recap" in kinds, f"recap system msg missing; kinds={kinds}"
        assert "settle" in kinds, f"settle system msg missing; kinds={kinds}"

        settle = next(m for m in sys if m.get("kind") == "settle")
        data = settle.get("data") or {}
        assert data.get("currency") == "INR", f"currency wrong: {data.get('currency')}"
        suggestions = data.get("suggestions") or []
        assert len(suggestions) >= 1, "no settle suggestions"
        row = suggestions[0]
        for k in ("from_name", "to_name", "amount"):
            assert k in row, f"suggestion missing {k}: {row}"
        # Meera owes Aarav ~3000
        assert row["from_name"].lower().startswith("meera")
        assert row["to_name"].lower().startswith("aarav")
        assert abs(float(row["amount"]) - 3000) < 1, f"amount={row['amount']}"
        # UPI deep link
        upi = row.get("upi_link") or ""
        assert upi.startswith("upi://pay"), f"upi_link wrong: {upi}"

        # Idempotency — no new settle/recap on repeat GETs
        for _ in range(3):
            requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(meera_token), timeout=30)
        time.sleep(0.4)
        msgs2 = requests.get(f"{BASE_URL}/api/trips/{tid}/messages",
                             headers=_h(aarav_token), timeout=30).json()
        sys2 = [m for m in msgs2 if m.get("system")]
        assert len([m for m in sys2 if m.get("kind") == "settle"]) == 1
        assert len([m for m in sys2 if m.get("kind") == "recap"]) == 1

    def test_settled_trip_no_settle_message(self, aarav_token, created_trip_ids):
        trip = _create_trip(aarav_token, "TEST_Iter11_Settled_NoDebt",
                            "2026-06-10", "2026-06-14", ["meera@test.com"], "INR")
        tid = trip["id"]
        created_trip_ids.append(tid)

        # No expenses added -> nobody owes anyone
        requests.get(f"{BASE_URL}/api/trips/{tid}", headers=_h(aarav_token), timeout=30)
        time.sleep(0.6)

        msgs = requests.get(f"{BASE_URL}/api/trips/{tid}/messages",
                            headers=_h(aarav_token), timeout=30).json()
        sys = [m for m in msgs if m.get("system")]
        kinds = [m.get("kind") for m in sys]
        assert "recap" in kinds, f"recap missing; kinds={kinds}"
        assert "settle" not in kinds, f"settle should NOT be posted when settled; kinds={kinds}"
