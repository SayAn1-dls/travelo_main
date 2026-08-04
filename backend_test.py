"""TRAVELO Backend API Test Suite"""
import requests
import time
import json
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://wanderlust-chaos.internal.stage-preview.emergentagent.com/api"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
    "warnings": []
}

def log_pass(test_name):
    results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")

def log_fail(test_name, reason):
    results["failed"].append(f"{test_name}: {reason}")
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")

def log_warning(test_name, reason):
    results["warnings"].append(f"{test_name}: {reason}")
    print(f"⚠️  WARNING: {test_name}: {reason}")

print("=" * 80)
print("TRAVELO BACKEND API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print()

# ============================================================================
# 1. HEALTH CHECK
# ============================================================================
print("\n[1] HEALTH CHECK")
print("-" * 80)
try:
    resp = requests.get(f"{BASE_URL}/", timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if data.get("service") == "TRAVELO API" and data.get("status") == "operational":
            log_pass("Health check: correct response")
        else:
            log_fail("Health check", f"Unexpected response: {data}")
    else:
        log_fail("Health check", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Health check", str(e))

# ============================================================================
# 2. QUOTES API
# ============================================================================
print("\n[2] QUOTES API")
print("-" * 80)
try:
    resp = requests.get(f"{BASE_URL}/quotes", timeout=10)
    if resp.status_code == 200:
        quotes = resp.json()
        if isinstance(quotes, list) and len(quotes) == 24:
            # Check structure
            if all("text" in q and "author" in q for q in quotes):
                log_pass("GET /quotes: 24 quotes with correct structure")
            else:
                log_fail("GET /quotes", "Quotes missing 'text' or 'author' fields")
        else:
            log_fail("GET /quotes", f"Expected 24 quotes, got {len(quotes) if isinstance(quotes, list) else 'non-list'}")
    else:
        log_fail("GET /quotes", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /quotes", str(e))

try:
    resp = requests.get(f"{BASE_URL}/quotes/random", timeout=10)
    if resp.status_code == 200:
        quote = resp.json()
        if isinstance(quote, dict) and "text" in quote and "author" in quote:
            log_pass("GET /quotes/random: single quote with correct structure")
        else:
            log_fail("GET /quotes/random", f"Invalid structure: {quote}")
    else:
        log_fail("GET /quotes/random", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /quotes/random", str(e))

# ============================================================================
# 3. DESTINATIONS API
# ============================================================================
print("\n[3] DESTINATIONS API")
print("-" * 80)
try:
    resp = requests.get(f"{BASE_URL}/destinations", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        if isinstance(destinations, list) and len(destinations) == 12:
            # Check structure of first destination
            required_fields = ["id", "name", "country", "region", "tagline", "description", 
                             "image", "base_price", "rating", "duration_days", "highlights", "tiers"]
            sample = destinations[0]
            if all(field in sample for field in required_fields):
                # Check tiers structure
                tiers = sample.get("tiers", {})
                if "explorer" in tiers and "elite" in tiers and "legend" in tiers:
                    # Verify tier pricing calculation
                    base = sample["base_price"]
                    expected_explorer = int(round(base * 1.0))
                    expected_elite = int(round(base * 1.65))
                    expected_legend = int(round(base * 2.8))
                    if (tiers["explorer"] == expected_explorer and 
                        tiers["elite"] == expected_elite and 
                        tiers["legend"] == expected_legend):
                        log_pass("GET /destinations: 12 destinations with correct structure and tier pricing")
                    else:
                        log_fail("GET /destinations", f"Tier pricing incorrect. Base: {base}, Got: {tiers}, Expected: explorer={expected_explorer}, elite={expected_elite}, legend={expected_legend}")
                else:
                    log_fail("GET /destinations", "Missing tier prices (explorer/elite/legend)")
            else:
                missing = [f for f in required_fields if f not in sample]
                log_fail("GET /destinations", f"Missing fields: {missing}")
        else:
            log_fail("GET /destinations", f"Expected 12 destinations, got {len(destinations) if isinstance(destinations, list) else 'non-list'}")
    else:
        log_fail("GET /destinations", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations", str(e))

# Test region filter
try:
    resp = requests.get(f"{BASE_URL}/destinations?region=Asia", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        if all(d.get("region") == "Asia" for d in destinations):
            log_pass("GET /destinations?region=Asia: filter works")
        else:
            log_fail("GET /destinations?region=Asia", "Filter returned non-Asia destinations")
    else:
        log_fail("GET /destinations?region=Asia", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations?region=Asia", str(e))

# Test search filter
try:
    resp = requests.get(f"{BASE_URL}/destinations?q=santo", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        if len(destinations) > 0 and any("santo" in d.get("name", "").lower() or "santo" in d.get("country", "").lower() for d in destinations):
            log_pass("GET /destinations?q=santo: search works")
        else:
            log_fail("GET /destinations?q=santo", "Search didn't return expected results")
    else:
        log_fail("GET /destinations?q=santo", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations?q=santo", str(e))

# Test single destination
try:
    resp = requests.get(f"{BASE_URL}/destinations/santorini", timeout=10)
    if resp.status_code == 200:
        dest = resp.json()
        if dest.get("id") == "santorini" and "tiers" in dest:
            log_pass("GET /destinations/santorini: single destination works")
        else:
            log_fail("GET /destinations/santorini", f"Invalid response: {dest}")
    else:
        log_fail("GET /destinations/santorini", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations/santorini", str(e))

# Test nonexistent destination
try:
    resp = requests.get(f"{BASE_URL}/destinations/nonexistent", timeout=10)
    if resp.status_code == 404:
        log_pass("GET /destinations/nonexistent: returns 404")
    else:
        log_fail("GET /destinations/nonexistent", f"Expected 404, got {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations/nonexistent", str(e))

# ============================================================================
# 4. AUTH FLOW
# ============================================================================
print("\n[4] AUTH FLOW")
print("-" * 80)

# Generate unique email
timestamp = int(time.time())
test_email = f"test_{timestamp}@travelo.app"
test_password = "SecurePass123!"
test_name = "Test Traveler"
auth_token = None

# Register
try:
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    }, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            user = data["user"]
            if ("id" in user and "name" in user and "email" in user and 
                "created_at" in user and "password" not in user):
                auth_token = data["token"]
                log_pass("POST /auth/register: successful registration, no password leaked")
            else:
                log_fail("POST /auth/register", f"Invalid user structure or password leaked: {user}")
        else:
            log_fail("POST /auth/register", f"Missing token or user: {data}")
    else:
        log_fail("POST /auth/register", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /auth/register", str(e))

# Duplicate register
try:
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": test_name,
        "email": test_email,
        "password": test_password
    }, timeout=10)
    if resp.status_code == 409:
        log_pass("POST /auth/register (duplicate): returns 409")
    else:
        log_fail("POST /auth/register (duplicate)", f"Expected 409, got {resp.status_code}")
except Exception as e:
    log_fail("POST /auth/register (duplicate)", str(e))

# Login with correct credentials
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": test_password
    }, timeout=10)
    if resp.status_code == 200:
        data = resp.json()
        if "token" in data and "user" in data:
            log_pass("POST /auth/login: successful login")
            if not auth_token:  # In case register failed but login worked
                auth_token = data["token"]
        else:
            log_fail("POST /auth/login", f"Missing token or user: {data}")
    else:
        log_fail("POST /auth/login", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /auth/login", str(e))

# Login with wrong password
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_email,
        "password": "WrongPassword123!"
    }, timeout=10)
    if resp.status_code == 401:
        log_pass("POST /auth/login (wrong password): returns 401")
    else:
        log_fail("POST /auth/login (wrong password)", f"Expected 401, got {resp.status_code}")
except Exception as e:
    log_fail("POST /auth/login (wrong password)", str(e))

# GET /auth/me with token
if auth_token:
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", 
                          headers={"Authorization": f"Bearer {auth_token}"}, 
                          timeout=10)
        if resp.status_code == 200:
            user = resp.json()
            if "id" in user and "email" in user and "password" not in user:
                log_pass("GET /auth/me (with token): returns user")
            else:
                log_fail("GET /auth/me (with token)", f"Invalid user structure: {user}")
        else:
            log_fail("GET /auth/me (with token)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("GET /auth/me (with token)", str(e))
else:
    log_fail("GET /auth/me (with token)", "No auth token available from registration/login")

# GET /auth/me without token
try:
    resp = requests.get(f"{BASE_URL}/auth/me", timeout=10)
    if resp.status_code in [401, 403]:
        log_pass("GET /auth/me (without token): returns 401/403")
    else:
        log_fail("GET /auth/me (without token)", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("GET /auth/me (without token)", str(e))

# GET /auth/me with invalid token
try:
    resp = requests.get(f"{BASE_URL}/auth/me", 
                      headers={"Authorization": "Bearer invalid_token_xyz"}, 
                      timeout=10)
    if resp.status_code == 401:
        log_pass("GET /auth/me (invalid token): returns 401")
    else:
        log_fail("GET /auth/me (invalid token)", f"Expected 401, got {resp.status_code}")
except Exception as e:
    log_fail("GET /auth/me (invalid token)", str(e))

# ============================================================================
# 5. BOOKINGS (auth required)
# ============================================================================
print("\n[5] BOOKINGS API")
print("-" * 80)

booking_id = None

if auth_token:
    # Create booking
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "kyoto",
            "tier": "legend",
            "travelers": 3,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 200:
            booking = resp.json()
            # Kyoto base_price = 1799, legend = round(1799 * 2.8) = 5037
            # Amount = 5037 * 3 = 15111.0
            expected_amount = 15111.0
            if booking.get("amount") == expected_amount and booking.get("status") == "pending_payment":
                booking_id = booking.get("id")
                log_pass(f"POST /bookings: correct amount ({expected_amount}) and status")
            else:
                log_fail("POST /bookings", f"Expected amount={expected_amount}, status=pending_payment. Got: amount={booking.get('amount')}, status={booking.get('status')}")
        else:
            log_fail("POST /bookings", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /bookings", str(e))
    
    # Invalid tier
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "kyoto",
            "tier": "invalid_tier",
            "travelers": 2,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 400:
            log_pass("POST /bookings (invalid tier): returns 400")
        else:
            log_fail("POST /bookings (invalid tier)", f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /bookings (invalid tier)", str(e))
    
    # End before start
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "kyoto",
            "tier": "explorer",
            "travelers": 2,
            "start_date": "2026-10-08",
            "end_date": "2026-10-01"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 400:
            log_pass("POST /bookings (end before start): returns 400")
        else:
            log_fail("POST /bookings (end before start)", f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /bookings (end before start)", str(e))
    
    # Unknown destination
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "unknown_dest",
            "tier": "explorer",
            "travelers": 2,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 404:
            log_pass("POST /bookings (unknown destination): returns 404")
        else:
            log_fail("POST /bookings (unknown destination)", f"Expected 404, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /bookings (unknown destination)", str(e))
    
    # Travelers 0
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "kyoto",
            "tier": "explorer",
            "travelers": 0,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 422:
            log_pass("POST /bookings (travelers=0): returns 422")
        else:
            log_fail("POST /bookings (travelers=0)", f"Expected 422, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /bookings (travelers=0)", str(e))
    
    # Travelers 13 (over limit)
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "kyoto",
            "tier": "explorer",
            "travelers": 13,
            "start_date": "2026-10-01",
            "end_date": "2026-10-08"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 422:
            log_pass("POST /bookings (travelers=13): returns 422")
        else:
            log_fail("POST /bookings (travelers=13)", f"Expected 422, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /bookings (travelers=13)", str(e))
    
    # GET /bookings
    try:
        resp = requests.get(f"{BASE_URL}/bookings", 
                          headers={"Authorization": f"Bearer {auth_token}"}, 
                          timeout=10)
        if resp.status_code == 200:
            bookings = resp.json()
            if isinstance(bookings, list) and len(bookings) > 0:
                if booking_id and any(b.get("id") == booking_id for b in bookings):
                    log_pass("GET /bookings: list contains created booking")
                else:
                    log_pass("GET /bookings: returns list of bookings")
            else:
                log_fail("GET /bookings", "Expected non-empty list")
        else:
            log_fail("GET /bookings", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("GET /bookings", str(e))
    
    # GET /bookings/{id}
    if booking_id:
        try:
            resp = requests.get(f"{BASE_URL}/bookings/{booking_id}", 
                              headers={"Authorization": f"Bearer {auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                booking = resp.json()
                if booking.get("id") == booking_id:
                    log_pass("GET /bookings/{id}: returns correct booking")
                else:
                    log_fail("GET /bookings/{id}", f"Wrong booking returned: {booking}")
            else:
                log_fail("GET /bookings/{id}", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("GET /bookings/{id}", str(e))
        
        # GET /bookings/{random_id}
        try:
            random_id = "00000000-0000-0000-0000-000000000000"
            resp = requests.get(f"{BASE_URL}/bookings/{random_id}", 
                              headers={"Authorization": f"Bearer {auth_token}"}, 
                              timeout=10)
            if resp.status_code == 404:
                log_pass("GET /bookings/{random_id}: returns 404")
            else:
                log_fail("GET /bookings/{random_id}", f"Expected 404, got {resp.status_code}")
        except Exception as e:
            log_fail("GET /bookings/{random_id}", str(e))
else:
    log_fail("BOOKINGS API", "No auth token available, skipping all booking tests")

# POST /bookings without auth
try:
    resp = requests.post(f"{BASE_URL}/bookings", json={
        "destination_id": "kyoto",
        "tier": "explorer",
        "travelers": 2,
        "start_date": "2026-10-01",
        "end_date": "2026-10-08"
    }, timeout=10)
    
    if resp.status_code in [401, 403]:
        log_pass("POST /bookings (without auth): returns 401/403")
    else:
        log_fail("POST /bookings (without auth)", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /bookings (without auth)", str(e))

# ============================================================================
# 6. PAYMENTS
# ============================================================================
print("\n[6] PAYMENTS API")
print("-" * 80)

session_id = None

if auth_token and booking_id:
    # Create checkout
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json={
            "booking_id": booking_id,
            "origin_url": "https://example.com"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            checkout_url = data.get("checkout_url", "")
            session_id = data.get("session_id", "")
            
            if checkout_url.startswith("https://checkout.stripe.com") and session_id.startswith("cs_test_"):
                log_pass("POST /payments/checkout: returns valid Stripe checkout URL and session_id")
            else:
                log_fail("POST /payments/checkout", f"Invalid checkout_url or session_id: {data}")
        else:
            log_fail("POST /payments/checkout", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /payments/checkout", str(e))
    
    # GET payment status
    if session_id:
        try:
            resp = requests.get(f"{BASE_URL}/payments/status/{session_id}", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if (data.get("session_id") == session_id and 
                    data.get("status") == "initiated" and 
                    data.get("payment_status") == "pending" and 
                    data.get("booking_id") == booking_id):
                    log_pass("GET /payments/status/{session_id}: returns pending status (expected for unpaid session)")
                else:
                    log_fail("GET /payments/status/{session_id}", f"Unexpected response: {data}")
            else:
                log_fail("GET /payments/status/{session_id}", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("GET /payments/status/{session_id}", str(e))
    
    # Checkout with nonexistent booking_id
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json={
            "booking_id": "00000000-0000-0000-0000-000000000000",
            "origin_url": "https://example.com"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 404:
            log_pass("POST /payments/checkout (nonexistent booking): returns 404")
        else:
            log_fail("POST /payments/checkout (nonexistent booking)", f"Expected 404, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /payments/checkout (nonexistent booking)", str(e))
else:
    if not auth_token:
        log_fail("PAYMENTS API", "No auth token available, skipping payment tests")
    if not booking_id:
        log_fail("PAYMENTS API", "No booking_id available, skipping payment tests")

# Checkout without auth
try:
    resp = requests.post(f"{BASE_URL}/payments/checkout", json={
        "booking_id": "some_booking_id",
        "origin_url": "https://example.com"
    }, timeout=10)
    
    if resp.status_code in [401, 403]:
        log_pass("POST /payments/checkout (without auth): returns 401/403")
    else:
        log_fail("POST /payments/checkout (without auth)", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /payments/checkout (without auth)", str(e))

# ============================================================================
# 7. TRIP PLANNER (NEW FEATURE)
# ============================================================================
print("\n[7] TRIP PLANNER API")
print("-" * 80)

# Login with test credentials for Trip Planner tests
trip_auth_token = None
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "smoke@travelo.app",
        "password": "Test@1234"
    }, timeout=10)
    if resp.status_code == 200:
        trip_auth_token = resp.json().get("token")
        log_pass("Trip Planner: logged in with test credentials")
    else:
        log_fail("Trip Planner login", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Trip Planner login", str(e))

trip_id = None
alice_id = None
bob_id = None
cara_id = None
dan_id = None
expense1_id = None
expense2_id = None

if trip_auth_token:
    # 1. POST /api/trips - Create trip with 4 members
    try:
        resp = requests.post(f"{BASE_URL}/trips", json={
            "place": "Lisbon, Portugal",
            "start_date": "2026-11-01",
            "end_date": "2026-11-08",
            "budget": 3000,
            "members": [
                {"name": "Alice (You)", "contribution": 1000, "payment_handle": "alice@upi"},
                {"name": "Bob", "contribution": 800, "payment_handle": ""},
                {"name": "Cara", "contribution": 700, "payment_handle": "cara.paypal"},
                {"name": "Dan", "contribution": 500, "payment_handle": ""}
            ]
        }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
        
        if resp.status_code == 200:
            trip = resp.json()
            trip_id = trip.get("id")
            members = trip.get("members", [])
            finances = trip.get("finances", {})
            expenses = trip.get("expenses", [])
            
            # Verify structure
            checks = []
            checks.append(("trip has id", trip_id is not None))
            checks.append(("4 members", len(members) == 4))
            checks.append(("first member is_owner=true", members[0].get("is_owner") == True if members else False))
            checks.append(("all members have id", all("id" in m for m in members)))
            checks.append(("expenses is empty list", expenses == []))
            checks.append(("finances.pool = 3000.0", finances.get("pool") == 3000.0))
            checks.append(("finances.spent = 0", finances.get("spent") == 0))
            checks.append(("finances.remaining = 3000", finances.get("remaining") == 3000))
            checks.append(("finances.budget_status = under", finances.get("budget_status") == "under"))
            checks.append(("finances.all_settled = true", finances.get("all_settled") == True))
            
            if all(check[1] for check in checks):
                # Store member IDs for later tests
                alice_id = members[0].get("id")
                bob_id = members[1].get("id")
                cara_id = members[2].get("id")
                dan_id = members[3].get("id")
                log_pass("POST /api/trips: trip created with correct structure and finances")
            else:
                failed_checks = [check[0] for check in checks if not check[1]]
                log_fail("POST /api/trips", f"Failed checks: {', '.join(failed_checks)}. Response: {json.dumps(trip, indent=2)}")
        else:
            log_fail("POST /api/trips", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /api/trips", str(e))
    
    # 2. Validation: end_date before start_date
    try:
        resp = requests.post(f"{BASE_URL}/trips", json={
            "place": "Paris, France",
            "start_date": "2026-12-10",
            "end_date": "2026-12-05",
            "budget": 2000,
            "members": [{"name": "Test User", "contribution": 2000, "payment_handle": ""}]
        }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
        
        if resp.status_code == 400:
            log_pass("POST /api/trips (end_date before start_date): returns 400")
        else:
            log_fail("POST /api/trips (end_date before start_date)", f"Expected 400, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /api/trips (end_date before start_date)", str(e))
    
    # 3. Validation: empty members array
    try:
        resp = requests.post(f"{BASE_URL}/trips", json={
            "place": "Rome, Italy",
            "start_date": "2026-12-01",
            "end_date": "2026-12-08",
            "budget": 2000,
            "members": []
        }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
        
        if resp.status_code == 422:
            log_pass("POST /api/trips (empty members): returns 422")
        else:
            log_fail("POST /api/trips (empty members)", f"Expected 422, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /api/trips (empty members)", str(e))
    
    # 4. GET /api/trips - List trips
    if trip_id:
        try:
            resp = requests.get(f"{BASE_URL}/trips", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                trips = resp.json()
                if isinstance(trips, list) and any(t.get("id") == trip_id for t in trips):
                    # Check that finances summary is included
                    trip_in_list = next((t for t in trips if t.get("id") == trip_id), None)
                    if trip_in_list and "finances" in trip_in_list:
                        log_pass("GET /api/trips: list includes trip with finances summary")
                    else:
                        log_fail("GET /api/trips", "Trip found but missing finances summary")
                else:
                    log_fail("GET /api/trips", f"Created trip not found in list. Got {len(trips)} trips")
            else:
                log_fail("GET /api/trips", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("GET /api/trips", str(e))
    
    # 5. GET /api/trips/{id} - Get single trip
    if trip_id:
        try:
            resp = requests.get(f"{BASE_URL}/trips/{trip_id}", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                trip = resp.json()
                if trip.get("id") == trip_id and "finances" in trip and "expenses" in trip:
                    log_pass("GET /api/trips/{id}: returns full trip object")
                else:
                    log_fail("GET /api/trips/{id}", f"Invalid trip structure: {trip}")
            else:
                log_fail("GET /api/trips/{id}", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("GET /api/trips/{id}", str(e))
        
        # 6. GET /api/trips/{nonexistent_id}
        try:
            resp = requests.get(f"{BASE_URL}/trips/00000000-0000-0000-0000-000000000000", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 404:
                log_pass("GET /api/trips/{nonexistent_id}: returns 404")
            else:
                log_fail("GET /api/trips/{nonexistent_id}", f"Expected 404, got {resp.status_code}")
        except Exception as e:
            log_fail("GET /api/trips/{nonexistent_id}", str(e))
    
    # 7. POST /api/trips/{id}/expenses - Add first expense (Bob pays)
    if trip_id and bob_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/expenses", json={
                "description": "Fado night dinner",
                "amount": 400,
                "paid_by": bob_id,
                "category": "food"
            }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
            
            if resp.status_code == 200:
                trip = resp.json()
                finances = trip.get("finances", {})
                expenses = trip.get("expenses", [])
                members_stats = finances.get("members", [])
                suggestions = finances.get("settle_suggestions", [])
                
                # Verify finances after first expense
                checks = []
                checks.append(("spent = 400", finances.get("spent") == 400))
                checks.append(("remaining = 2600", finances.get("remaining") == 2600))
                
                # Per-member share should be 100 each (400/4)
                # Bob paid 400, owes 100, so balance = +300
                # Others paid 0, owe 100 each, so balance = -100
                bob_stats = next((m for m in members_stats if m.get("id") == bob_id), None)
                alice_stats = next((m for m in members_stats if m.get("id") == alice_id), None)
                
                if bob_stats:
                    checks.append(("Bob share = 100", bob_stats.get("share") == 100))
                    checks.append(("Bob balance = +300", bob_stats.get("balance") == 300))
                if alice_stats:
                    checks.append(("Alice balance = -100", alice_stats.get("balance") == -100))
                
                # Settle suggestions: 3 entries totaling 300 all to Bob
                total_to_bob = sum(s.get("amount", 0) for s in suggestions if s.get("to_member") == bob_id)
                checks.append(("3 settle suggestions", len(suggestions) == 3))
                checks.append(("total to Bob = 300", total_to_bob == 300))
                
                if expenses:
                    expense1_id = expenses[0].get("id")
                
                if all(check[1] for check in checks):
                    log_pass("POST /api/trips/{id}/expenses (Bob pays 400): finances calculated correctly")
                else:
                    failed_checks = [check[0] for check in checks if not check[1]]
                    log_fail("POST /api/trips/{id}/expenses (Bob pays 400)", f"Failed checks: {', '.join(failed_checks)}. Finances: {json.dumps(finances, indent=2)}")
            else:
                log_fail("POST /api/trips/{id}/expenses (Bob pays 400)", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/expenses (Bob pays 400)", str(e))
    
    # 8. POST /api/trips/{id}/expenses - Add second expense (Alice pays)
    if trip_id and alice_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/expenses", json={
                "description": "Surf lessons",
                "amount": 200,
                "paid_by": alice_id,
                "category": "activity"
            }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
            
            if resp.status_code == 200:
                trip = resp.json()
                finances = trip.get("finances", {})
                expenses = trip.get("expenses", [])
                members_stats = finances.get("members", [])
                suggestions = finances.get("settle_suggestions", [])
                
                # Verify finances after second expense
                # Total spent = 600, share per person = 150
                # Alice: paid 200, share 150, balance = +50
                # Bob: paid 400, share 150, balance = +250
                # Cara: paid 0, share 150, balance = -150
                # Dan: paid 0, share 150, balance = -150
                checks = []
                checks.append(("spent = 600", finances.get("spent") == 600))
                checks.append(("remaining = 2400", finances.get("remaining") == 2400))
                
                alice_stats = next((m for m in members_stats if m.get("id") == alice_id), None)
                bob_stats = next((m for m in members_stats if m.get("id") == bob_id), None)
                cara_stats = next((m for m in members_stats if m.get("id") == cara_id), None)
                dan_stats = next((m for m in members_stats if m.get("id") == dan_id), None)
                
                if alice_stats:
                    checks.append(("Alice balance = +50", alice_stats.get("balance") == 50))
                if bob_stats:
                    checks.append(("Bob balance = +250", bob_stats.get("balance") == 250))
                if cara_stats:
                    checks.append(("Cara balance = -150", cara_stats.get("balance") == -150))
                if dan_stats:
                    checks.append(("Dan balance = -150", dan_stats.get("balance") == -150))
                
                # Verify settle suggestions sum matches total owed (300)
                total_suggested = sum(s.get("amount", 0) for s in suggestions)
                checks.append(("settle suggestions sum = 300", total_suggested == 300))
                
                if len(expenses) >= 2:
                    expense2_id = expenses[0].get("id") if expenses[0].get("description") == "Surf lessons" else expenses[1].get("id")
                
                if all(check[1] for check in checks):
                    log_pass("POST /api/trips/{id}/expenses (Alice pays 200): finances calculated correctly")
                else:
                    failed_checks = [check[0] for check in checks if not check[1]]
                    log_fail("POST /api/trips/{id}/expenses (Alice pays 200)", f"Failed checks: {', '.join(failed_checks)}. Finances: {json.dumps(finances, indent=2)}")
            else:
                log_fail("POST /api/trips/{id}/expenses (Alice pays 200)", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/expenses (Alice pays 200)", str(e))
    
    # 9. Validation: invalid paid_by
    if trip_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/expenses", json={
                "description": "Invalid expense",
                "amount": 100,
                "paid_by": "invalid_member_id",
                "category": "general"
            }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
            
            if resp.status_code == 400:
                log_pass("POST /api/trips/{id}/expenses (invalid paid_by): returns 400")
            else:
                log_fail("POST /api/trips/{id}/expenses (invalid paid_by)", f"Expected 400, got {resp.status_code}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/expenses (invalid paid_by)", str(e))
    
    # 10. Validation: amount <= 0
    if trip_id and alice_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/expenses", json={
                "description": "Zero expense",
                "amount": 0,
                "paid_by": alice_id,
                "category": "general"
            }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
            
            if resp.status_code == 422:
                log_pass("POST /api/trips/{id}/expenses (amount=0): returns 422")
            else:
                log_fail("POST /api/trips/{id}/expenses (amount=0)", f"Expected 422, got {resp.status_code}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/expenses (amount=0)", str(e))
    
    # 11. GET /api/trips/{id}/notifications
    if trip_id:
        try:
            resp = requests.get(f"{BASE_URL}/trips/{trip_id}/notifications", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                notifications = resp.json()
                # Should have: 1 info (trip created) + 2 expense notifications
                if isinstance(notifications, list) and len(notifications) >= 3:
                    info_notifs = [n for n in notifications if n.get("type") == "info"]
                    expense_notifs = [n for n in notifications if n.get("type") == "expense"]
                    
                    if len(info_notifs) >= 1 and len(expense_notifs) >= 2:
                        log_pass("GET /api/trips/{id}/notifications: contains info + 2 expense notifications")
                    else:
                        log_fail("GET /api/trips/{id}/notifications", f"Expected 1+ info and 2+ expense notifications. Got: {len(info_notifs)} info, {len(expense_notifs)} expense")
                else:
                    log_fail("GET /api/trips/{id}/notifications", f"Expected at least 3 notifications, got {len(notifications) if isinstance(notifications, list) else 'non-list'}")
            else:
                log_fail("GET /api/trips/{id}/notifications", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("GET /api/trips/{id}/notifications", str(e))
    
    # 12. POST /api/trips/{id}/settle - Cara pays Bob 150
    if trip_id and cara_id and bob_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/settle", json={
                "from_member": cara_id,
                "to_member": bob_id,
                "amount": 150
            }, headers={"Authorization": f"Bearer {trip_auth_token}"}, timeout=10)
            
            if resp.status_code == 200:
                trip = resp.json()
                finances = trip.get("finances", {})
                members_stats = finances.get("members", [])
                suggestions = finances.get("settle_suggestions", [])
                
                # Cara's balance should become 0 (was -150, paid 150)
                cara_stats = next((m for m in members_stats if m.get("id") == cara_id), None)
                
                checks = []
                if cara_stats:
                    checks.append(("Cara balance = 0", cara_stats.get("balance") == 0))
                
                # Suggestions should shrink (Cara no longer in suggestions)
                cara_in_suggestions = any(s.get("from_member") == cara_id for s in suggestions)
                checks.append(("Cara not in suggestions", not cara_in_suggestions))
                
                if all(check[1] for check in checks):
                    log_pass("POST /api/trips/{id}/settle (Cara pays Bob 150): balance updated, suggestions shrink")
                else:
                    failed_checks = [check[0] for check in checks if not check[1]]
                    log_fail("POST /api/trips/{id}/settle (Cara pays Bob 150)", f"Failed checks: {', '.join(failed_checks)}. Cara stats: {cara_stats}")
            else:
                log_fail("POST /api/trips/{id}/settle (Cara pays Bob 150)", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/settle (Cara pays Bob 150)", str(e))
        
        # Verify settlement notification was created
        try:
            resp = requests.get(f"{BASE_URL}/trips/{trip_id}/notifications", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                notifications = resp.json()
                settlement_notifs = [n for n in notifications if n.get("type") == "settlement"]
                if len(settlement_notifs) >= 1:
                    log_pass("POST /api/trips/{id}/settle: settlement notification created")
                else:
                    log_fail("POST /api/trips/{id}/settle notification", f"Expected settlement notification, got {len(settlement_notifs)}")
            else:
                log_fail("POST /api/trips/{id}/settle notification", f"Status {resp.status_code}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/settle notification", str(e))
    
    # 13. POST /api/trips/{id}/remind - Remind remaining debtors
    if trip_id:
        try:
            resp = requests.post(f"{BASE_URL}/trips/{trip_id}/remind", 
                                headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                                timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                reminded = data.get("reminded", [])
                count = data.get("count", 0)
                
                # Dan should still be in debt (balance = -150), so should be reminded
                # Alice and Bob are creditors, Cara is settled
                if "Dan" in reminded and count >= 1:
                    log_pass("POST /api/trips/{id}/remind: Dan included in reminders")
                else:
                    log_fail("POST /api/trips/{id}/remind", f"Expected Dan in reminders. Got: {reminded}, count: {count}")
            else:
                log_fail("POST /api/trips/{id}/remind", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/remind", str(e))
        
        # Verify reminder notifications were created
        try:
            resp = requests.get(f"{BASE_URL}/trips/{trip_id}/notifications", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 200:
                notifications = resp.json()
                reminder_notifs = [n for n in notifications if n.get("type") == "reminder"]
                if len(reminder_notifs) >= 1:
                    log_pass("POST /api/trips/{id}/remind: reminder notifications created")
                else:
                    log_fail("POST /api/trips/{id}/remind notifications", f"Expected reminder notifications, got {len(reminder_notifs)}")
            else:
                log_fail("POST /api/trips/{id}/remind notifications", f"Status {resp.status_code}")
        except Exception as e:
            log_fail("POST /api/trips/{id}/remind notifications", str(e))
    
    # 14. DELETE /api/trips/{id}/expenses/{expense_id} - Delete expense
    if trip_id and expense1_id:
        try:
            resp = requests.delete(f"{BASE_URL}/trips/{trip_id}/expenses/{expense1_id}", 
                                  headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                                  timeout=10)
            if resp.status_code == 200:
                trip = resp.json()
                finances = trip.get("finances", {})
                expenses = trip.get("expenses", [])
                
                # After deleting first expense (400), spent should be 200
                if finances.get("spent") == 200:
                    log_pass("DELETE /api/trips/{id}/expenses/{expense_id}: finances recomputed")
                else:
                    log_fail("DELETE /api/trips/{id}/expenses/{expense_id}", f"Expected spent=200, got {finances.get('spent')}")
            else:
                log_fail("DELETE /api/trips/{id}/expenses/{expense_id}", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("DELETE /api/trips/{id}/expenses/{expense_id}", str(e))
        
        # 15. DELETE nonexistent expense
        try:
            resp = requests.delete(f"{BASE_URL}/trips/{trip_id}/expenses/00000000-0000-0000-0000-000000000000", 
                                  headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                                  timeout=10)
            if resp.status_code == 404:
                log_pass("DELETE /api/trips/{id}/expenses/{nonexistent_id}: returns 404")
            else:
                log_fail("DELETE /api/trips/{id}/expenses/{nonexistent_id}", f"Expected 404, got {resp.status_code}")
        except Exception as e:
            log_fail("DELETE /api/trips/{id}/expenses/{nonexistent_id}", str(e))
    
    # 16. DELETE /api/trips/{id} - Delete trip
    if trip_id:
        try:
            resp = requests.delete(f"{BASE_URL}/trips/{trip_id}", 
                                  headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                                  timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("deleted") == True:
                    log_pass("DELETE /api/trips/{id}: returns {deleted: true}")
                else:
                    log_fail("DELETE /api/trips/{id}", f"Expected {{deleted: true}}, got {data}")
            else:
                log_fail("DELETE /api/trips/{id}", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("DELETE /api/trips/{id}", str(e))
        
        # 17. Verify trip is deleted (GET should return 404)
        try:
            resp = requests.get(f"{BASE_URL}/trips/{trip_id}", 
                              headers={"Authorization": f"Bearer {trip_auth_token}"}, 
                              timeout=10)
            if resp.status_code == 404:
                log_pass("DELETE /api/trips/{id}: subsequent GET returns 404")
            else:
                log_fail("DELETE /api/trips/{id} verification", f"Expected 404 after delete, got {resp.status_code}")
        except Exception as e:
            log_fail("DELETE /api/trips/{id} verification", str(e))

else:
    log_fail("TRIP PLANNER API", "No auth token available, skipping all trip planner tests")

# POST /api/trips without auth
try:
    resp = requests.post(f"{BASE_URL}/trips", json={
        "place": "Test Place",
        "start_date": "2026-12-01",
        "end_date": "2026-12-08",
        "budget": 1000,
        "members": [{"name": "Test", "contribution": 1000, "payment_handle": ""}]
    }, timeout=10)
    
    if resp.status_code in [401, 403]:
        log_pass("POST /api/trips (without auth): returns 401/403")
    else:
        log_fail("POST /api/trips (without auth)", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /api/trips (without auth)", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(results['passed'])}")
print(f"❌ FAILED: {len(results['failed'])}")
print(f"⚠️  WARNINGS: {len(results['warnings'])}")

if results['failed']:
    print("\nFailed Tests:")
    for fail in results['failed']:
        print(f"  - {fail}")

if results['warnings']:
    print("\nWarnings:")
    for warn in results['warnings']:
        print(f"  - {warn}")

print("\n" + "=" * 80)
exit_code = 0 if len(results['failed']) == 0 else 1
print(f"Exit code: {exit_code}")
exit(exit_code)
