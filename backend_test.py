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
