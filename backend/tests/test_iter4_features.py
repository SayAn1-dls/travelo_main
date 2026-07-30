"""Iteration 4 — Expense edit/delete, budget-alert flag safety, recap revoke."""
import os
import time
import uuid

import pytest
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import dotenv_values


def _retry_request(method, url, **kwargs):
    """Wrap request with retries for ingress ConnectTimeout flake."""
    last = None
    for attempt in range(4):
        try:
            r = requests.request(method, url, **kwargs)
            return r
        except (requests.exceptions.ConnectTimeout, requests.exceptions.ConnectionError) as e:
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise last


# Monkey-patch the module-level convenience methods used in tests
_orig_get = requests.get
_orig_post = requests.post
_orig_put = requests.put
_orig_delete = requests.delete
requests.get = lambda url, **k: _retry_request("GET", url, **k)
requests.post = lambda url, **k: _retry_request("POST", url, **k)
requests.put = lambda url, **k: _retry_request("PUT", url, **k)
requests.delete = lambda url, **k: _retry_request("DELETE", url, **k)
from pymongo import MongoClient
from bson import ObjectId

backend_env = dotenv_values("/app/backend/.env")
frontend_env = dotenv_values("/app/frontend/.env")
BASE_URL = (os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")).rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL") or backend_env.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME") or backend_env.get("DB_NAME")


def hdr(tok):
    return {"Authorization": f"Bearer {tok}"}


def _login(email, password):
    for attempt in range(2):
        try:
            r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
            if r.status_code == 200:
                return r.json()["access_token"]
        except requests.exceptions.RequestException:
            if attempt == 1:
                raise
            time.sleep(1)
    pytest.fail(f"login failed for {email}")


@pytest.fixture(scope="module")
def aarav_token():
    return _login("aarav@test.com", "Pass@123")


@pytest.fixture(scope="module")
def meera_token():
    return _login("meera@test.com", "Pass@123")


@pytest.fixture(scope="module")
def mongo():
    return MongoClient(MONGO_URL)[DB_NAME]


def _mk_trip(tok, name_prefix="TEST_Iter4", budget_total=20000, cats=None, extra_members=None):
    members = extra_members if extra_members is not None else [{"name": "Meera Nair", "email": "meera@test.com"}]
    body = {
        "name": f"{name_prefix}_{uuid.uuid4().hex[:6]}",
        "destination": "Goa",
        "start_date": "2026-11-01", "end_date": "2026-11-05",
        "budget_total": budget_total,
        "budget_categories": cats or {"food": 1000},
        "members": members,
    }
    r = requests.post(f"{API}/trips", json=body, headers=hdr(tok), timeout=20)
    assert r.status_code == 200, r.text[:300]
    t = r.json()
    org = next(m for m in t["members"] if m["email"] == "aarav@test.com")
    other = next((m for m in t["members"] if m["email"] == "meera@test.com"), None)
    return t, org["member_id"], (other["member_id"] if other else None)


def _add_expense(tok, tid, amount, category, paid_by, splits, description="TEST_e"):
    r = requests.post(f"{API}/trips/{tid}/expenses",
                      json={"description": description, "amount": amount, "category": category,
                            "paid_by": paid_by, "split_type": "equal",
                            "splits": [{"member_id": mid} for mid in splits]},
                      headers=hdr(tok), timeout=15)
    assert r.status_code == 200, r.text[:300]
    return r.json()


# --------------- Expense edit ---------------
class TestExpenseEdit:
    def test_edit_updates_fields_and_balances(self, aarav_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_Edit")
        tid = trip["id"]
        e = _add_expense(aarav_token, tid, 500, "food", a, [a, m], "Snacks")
        eid = e["id"]

        # Edit: change amount 500 -> 800, description, category
        r = requests.put(f"{API}/trips/{tid}/expenses/{eid}",
                         json={"description": "Big Snacks", "amount": 800, "category": "transport",
                               "paid_by": a, "split_type": "equal",
                               "splits": [{"member_id": a}, {"member_id": m}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:300]
        upd = r.json()
        assert upd["description"] == "Big Snacks"
        assert upd["amount"] == 800
        assert upd["category"] == "transport"
        assert "edited_at" in upd
        assert upd.get("edited_by")

        # GET list — should reflect new amount
        lr = requests.get(f"{API}/trips/{tid}/expenses", headers=hdr(aarav_token), timeout=15)
        assert lr.status_code == 200
        exp = next(x for x in lr.json() if x["id"] == eid)
        assert exp["amount"] == 800
        assert exp["description"] == "Big Snacks"
        assert exp.get("edited_at")

        # Balances reflect new total 800
        br = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert br.status_code == 200
        assert br.json()["total_spent"] == 800

    def test_non_creator_non_organizer_403(self, aarav_token, meera_token):
        # meera creates an expense; aarav (organizer) edits allowed; a THIRD outsider cannot,
        # and meera cannot edit aarav's expense either.
        trip, a, m = _mk_trip(aarav_token, "TEST_EditPerm")
        tid = trip["id"]

        # Aarav creates expense
        e = _add_expense(aarav_token, tid, 200, "food", a, [a, m], "Aarav paid")
        eid = e["id"]

        # Meera (member but not creator, not organizer) → 403
        r = requests.put(f"{API}/trips/{tid}/expenses/{eid}",
                         json={"description": "hack", "amount": 100, "category": "food",
                               "paid_by": a, "split_type": "equal",
                               "splits": [{"member_id": a}, {"member_id": m}]},
                         headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403, f"expected 403 got {r.status_code}: {r.text[:200]}"

    def test_organizer_can_edit_others_expense(self, aarav_token, meera_token):
        # meera creates expense in trip; aarav (organizer) edits it → allowed
        trip, a, m = _mk_trip(aarav_token, "TEST_OrgEdit")
        tid = trip["id"]

        e_meera = _add_expense(meera_token, tid, 300, "food", m, [a, m], "Meera paid")
        eid = e_meera["id"]

        # Aarav (organizer, not creator) edits
        r = requests.put(f"{API}/trips/{tid}/expenses/{eid}",
                         json={"description": "Org edited", "amount": 350, "category": "food",
                               "paid_by": m, "split_type": "equal",
                               "splits": [{"member_id": a}, {"member_id": m}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, f"organizer edit should work: {r.status_code} {r.text[:200]}"
        assert r.json()["description"] == "Org edited"
        assert r.json()["amount"] == 350

    def test_invalid_expense_id(self, aarav_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_EditBadId")
        tid = trip["id"]

        # Malformed id → 400
        r = requests.put(f"{API}/trips/{tid}/expenses/not-an-object-id",
                         json={"description": "x", "amount": 10, "category": "food",
                               "paid_by": a, "split_type": "equal",
                               "splits": [{"member_id": a}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400, f"malformed id should be 400, got {r.status_code}"

        # Well-formed but non-existent id → 404
        r = requests.put(f"{API}/trips/{tid}/expenses/{ObjectId().__str__()}",
                         json={"description": "x", "amount": 10, "category": "food",
                               "paid_by": a, "split_type": "equal",
                               "splits": [{"member_id": a}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 404, f"non-existent id should be 404, got {r.status_code}"

    def test_custom_split_not_summing_to_total_400(self, aarav_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_EditBadSplit")
        tid = trip["id"]
        e = _add_expense(aarav_token, tid, 500, "food", a, [a, m], "s")
        eid = e["id"]

        r = requests.put(f"{API}/trips/{tid}/expenses/{eid}",
                         json={"description": "s", "amount": 500, "category": "food",
                               "paid_by": a, "split_type": "custom",
                               "splits": [{"member_id": a, "amount": 100},
                                          {"member_id": m, "amount": 100}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 400, f"bad custom split should be 400, got {r.status_code}"


# --------------- Expense delete ---------------
class TestExpenseDelete:
    def test_delete_by_creator_and_balances_recalc(self, aarav_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_Del")
        tid = trip["id"]

        e1 = _add_expense(aarav_token, tid, 400, "food", a, [a, m], "keep")
        e2 = _add_expense(aarav_token, tid, 600, "food", a, [a, m], "delete_me")

        r = requests.delete(f"{API}/trips/{tid}/expenses/{e2['id']}", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200, r.text[:200]

        br = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert br.status_code == 200
        assert br.json()["total_spent"] == 400

        # Verify expense is gone from list
        lr = requests.get(f"{API}/trips/{tid}/expenses", headers=hdr(aarav_token), timeout=15)
        assert not any(x["id"] == e2["id"] for x in lr.json())

    def test_delete_403_for_non_creator_non_organizer(self, aarav_token, meera_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_DelPerm")
        tid = trip["id"]
        e = _add_expense(aarav_token, tid, 300, "food", a, [a, m], "aarav's")

        r = requests.delete(f"{API}/trips/{tid}/expenses/{e['id']}", headers=hdr(meera_token), timeout=15)
        assert r.status_code == 403, f"meera should get 403 deleting aarav's expense, got {r.status_code}"

    def test_delete_all_expenses_empty_suggestions(self, aarav_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_DelAll")
        tid = trip["id"]
        e1 = _add_expense(aarav_token, tid, 400, "food", a, [a, m], "e1")
        e2 = _add_expense(aarav_token, tid, 250, "transport", a, [a, m], "e2")

        for eid in [e1["id"], e2["id"]]:
            r = requests.delete(f"{API}/trips/{tid}/expenses/{eid}", headers=hdr(aarav_token), timeout=15)
            assert r.status_code == 200

        br = requests.get(f"{API}/trips/{tid}/balances", headers=hdr(aarav_token), timeout=15)
        assert br.status_code == 200
        data = br.json()
        assert data["total_spent"] == 0
        assert data["suggestions"] == []


# --------------- Budget alert flag safety ---------------
class TestBudgetAlertFlagSafety:
    def _count(self, mongo, uid, tid, title_substr):
        return mongo.notifications.count_documents({
            "user_id": uid, "type": "budget_alert",
            "data.trip_id": tid, "title": {"$regex": title_substr},
        })

    def test_food_flag_edit_delete_refire(self, aarav_token, mongo):
        # budget_categories.food = 1000
        trip, a, m = _mk_trip(aarav_token, "TEST_Flag", budget_total=100000, cats={"food": 1000})
        tid = trip["id"]

        aarav_uid = str(mongo.users.find_one({"email": "aarav@test.com"})["_id"])

        # Add food 1200 → alert fires + flag set
        e_big = _add_expense(aarav_token, tid, 1200, "food", a, [a, m], "cross")
        time.sleep(0.3)
        c1 = self._count(mongo, aarav_uid, tid, "Food budget crossed")
        assert c1 == 1, f"expected 1 Food alert after crossing, got {c1}"

        trip_doc = mongo.trips.find_one({"_id": ObjectId(tid)})
        assert trip_doc.get("budget_alerts_fired", {}).get("food") is True

        # Add another food 100 → no new food alert
        e_small = _add_expense(aarav_token, tid, 100, "food", a, [a, m], "extra")
        time.sleep(0.3)
        assert self._count(mongo, aarav_uid, tid, "Food budget crossed") == 1, "duplicate suppressed"

        # Edit the 100 → 50: still over 1000, no new alert
        r = requests.put(f"{API}/trips/{tid}/expenses/{e_small['id']}",
                         json={"description": "extra", "amount": 50, "category": "food",
                               "paid_by": a, "split_type": "equal",
                               "splits": [{"member_id": a}, {"member_id": m}]},
                         headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        assert self._count(mongo, aarav_uid, tid, "Food budget crossed") == 1, "edit-down still over, no new alert"

        # Delete the 1200 → spend now 50, under 1000 → flag cleared
        r = requests.delete(f"{API}/trips/{tid}/expenses/{e_big['id']}", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        trip_doc = mongo.trips.find_one({"_id": ObjectId(tid)})
        assert "food" not in (trip_doc.get("budget_alerts_fired") or {}), \
            f"flag should be cleared, got {trip_doc.get('budget_alerts_fired')}"

        # Add food 1100 → refire (crossing again)
        _add_expense(aarav_token, tid, 1100, "food", a, [a, m], "refire")
        time.sleep(0.3)
        c2 = self._count(mongo, aarav_uid, tid, "Food budget crossed")
        assert c2 == 2, f"expected refire (count 2), got {c2}"

    def test_total_flag_clear_and_refire(self, aarav_token, mongo):
        trip, a, m = _mk_trip(aarav_token, "TEST_TotalFlag", budget_total=1000, cats={})
        tid = trip["id"]
        aarav_uid = str(mongo.users.find_one({"email": "aarav@test.com"})["_id"])

        e_big = _add_expense(aarav_token, tid, 1200, "food", a, [a, m], "big")
        time.sleep(0.3)
        assert self._count(mongo, aarav_uid, tid, "Trip budget crossed") == 1

        trip_doc = mongo.trips.find_one({"_id": ObjectId(tid)})
        assert trip_doc.get("budget_alerts_fired", {}).get("__total__") is True

        # Delete → under budget, __total__ cleared
        r = requests.delete(f"{API}/trips/{tid}/expenses/{e_big['id']}", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        time.sleep(0.3)
        trip_doc = mongo.trips.find_one({"_id": ObjectId(tid)})
        assert "__total__" not in (trip_doc.get("budget_alerts_fired") or {})

        # Refire
        _add_expense(aarav_token, tid, 1500, "food", a, [a, m], "refire_total")
        time.sleep(0.3)
        c = self._count(mongo, aarav_uid, tid, "Trip budget crossed")
        assert c == 2, f"expected 2 Trip alerts after refire, got {c}"


# --------------- Recap revoke ---------------
class TestRecapRevoke:
    def test_revoke_flow(self, aarav_token, meera_token):
        trip, a, m = _mk_trip(aarav_token, "TEST_Revoke")
        tid = trip["id"]

        # Share
        r = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert r.status_code == 200
        tok1 = r.json()["token"]

        # Old token works
        pub = requests.get(f"{API}/recap/{tok1}", timeout=15)
        assert pub.status_code == 200

        # Non-organizer revoke → 403
        forb = requests.post(f"{API}/trips/{tid}/recap/revoke", headers=hdr(meera_token), timeout=15)
        assert forb.status_code == 403, f"non-organizer revoke should 403, got {forb.status_code}"

        # Organizer revoke → ok
        rv = requests.post(f"{API}/trips/{tid}/recap/revoke", headers=hdr(aarav_token), timeout=15)
        assert rv.status_code == 200
        assert rv.json().get("ok") is True

        # Old token now 404
        pub2 = requests.get(f"{API}/recap/{tok1}", timeout=15)
        assert pub2.status_code == 404, f"revoked token should 404, got {pub2.status_code}"

        # Re-share issues DIFFERENT token
        r2 = requests.post(f"{API}/trips/{tid}/recap/share", headers=hdr(aarav_token), timeout=15)
        assert r2.status_code == 200
        tok2 = r2.json()["token"]
        assert tok2 != tok1, "re-share must issue a new token"

        # New token works
        pub3 = requests.get(f"{API}/recap/{tok2}", timeout=15)
        assert pub3.status_code == 200
