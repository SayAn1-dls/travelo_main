"""TRAVELO Backend API Test Suite - NEW FEATURES ONLY"""
import requests
import time
import json
import base64
from io import BytesIO
from PIL import Image, ImageDraw

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

def create_scenic_image(width=400, height=300, seed=0):
    """Create a small JPEG image with real visual features (gradients, shapes, edges)."""
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Sky gradient (blue to orange)
    for y in range(height // 2):
        ratio = y / (height // 2)
        r = int(30 + ratio * 225)
        g = int(100 + ratio * 155)
        b = int(200 - ratio * 100)
        draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
    
    # Ground gradient (green to brown)
    for y in range(height // 2, height):
        ratio = (y - height // 2) / (height // 2)
        r = int(100 + ratio * 100)
        g = int(150 - ratio * 50)
        b = int(50 - ratio * 30)
        draw.rectangle([(0, y), (width, y+1)], fill=(r, g, b))
    
    # Sun circle
    sun_x = width // 4 + seed * 50
    sun_y = height // 4
    sun_radius = 40
    draw.ellipse([(sun_x - sun_radius, sun_y - sun_radius), 
                  (sun_x + sun_radius, sun_y + sun_radius)], 
                 fill=(255, 220, 100))
    
    # Mountain triangles
    mountain_points = [
        (width // 3 + seed * 20, height // 2),
        (width // 2 + seed * 10, height // 3),
        (2 * width // 3 + seed * 5, height // 2)
    ]
    draw.polygon(mountain_points, fill=(80, 60, 40))
    
    # Convert to base64 JPEG
    buffer = BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode('utf-8')

print("=" * 80)
print("TRAVELO BACKEND API TEST SUITE - NEW FEATURES")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print()

# ============================================================================
# 1. EXPANDED CATALOG - 24 DESTINATIONS
# ============================================================================
print("\n[1] EXPANDED CATALOG - 24 DESTINATIONS")
print("-" * 80)

try:
    resp = requests.get(f"{BASE_URL}/destinations", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        if isinstance(destinations, list) and len(destinations) == 24:
            log_pass("GET /destinations: returns exactly 24 destinations")
        else:
            log_fail("GET /destinations", f"Expected 24 destinations, got {len(destinations) if isinstance(destinations, list) else 'non-list'}")
    else:
        log_fail("GET /destinations", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /destinations", str(e))

# Test region filter for India (should return 6)
try:
    resp = requests.get(f"{BASE_URL}/destinations?region=India", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        dest_ids = [d.get("id") for d in destinations]
        expected_ids = ["goa", "jaipur", "kerala", "ladakh", "varanasi", "udaipur"]
        
        if len(destinations) == 6 and all(eid in dest_ids for eid in expected_ids):
            log_pass(f"GET /destinations?region=India: returns 6 destinations ({', '.join(dest_ids)})")
        else:
            log_fail("GET /destinations?region=India", f"Expected 6 destinations {expected_ids}, got {len(destinations)}: {dest_ids}")
    else:
        log_fail("GET /destinations?region=India", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /destinations?region=India", str(e))

# Test Bora Bora destination with tier pricing
try:
    resp = requests.get(f"{BASE_URL}/destinations/bora-bora", timeout=10)
    if resp.status_code == 200:
        dest = resp.json()
        base_price = dest.get("base_price")
        tiers = dest.get("tiers", {})
        
        # Expected: base_price 3499, explorer=3499, elite=round(3499*1.65)=5773, legend=round(3499*2.8)=9797
        expected_base = 3499
        expected_explorer = 3499
        expected_elite = 5773
        expected_legend = 9797
        
        checks = []
        checks.append(("base_price = 3499", base_price == expected_base))
        checks.append(("explorer tier = 3499", tiers.get("explorer") == expected_explorer))
        checks.append(("elite tier = 5773", tiers.get("elite") == expected_elite))
        checks.append(("legend tier = 9797", tiers.get("legend") == expected_legend))
        
        if all(check[1] for check in checks):
            log_pass("GET /destinations/bora-bora: correct base_price and tier pricing")
        else:
            failed_checks = [check[0] for check in checks if not check[1]]
            log_fail("GET /destinations/bora-bora", f"Failed checks: {', '.join(failed_checks)}. Got: base={base_price}, tiers={tiers}")
    else:
        log_fail("GET /destinations/bora-bora", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /destinations/bora-bora", str(e))

# ============================================================================
# 2. EXPANDED QUOTES - 40 QUOTES
# ============================================================================
print("\n[2] EXPANDED QUOTES - 40 QUOTES")
print("-" * 80)

try:
    resp = requests.get(f"{BASE_URL}/quotes", timeout=10)
    if resp.status_code == 200:
        quotes = resp.json()
        if isinstance(quotes, list) and len(quotes) == 40:
            log_pass("GET /quotes: returns exactly 40 quotes")
        else:
            log_fail("GET /quotes", f"Expected 40 quotes, got {len(quotes) if isinstance(quotes, list) else 'non-list'}")
    else:
        log_fail("GET /quotes", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("GET /quotes", str(e))

# ============================================================================
# 3. NEW DESTINATION BOOKING (LADAKH) + STRIPE PRICE
# ============================================================================
print("\n[3] NEW DESTINATION BOOKING (LADAKH) + STRIPE PRICE")
print("-" * 80)

# Login with test credentials
auth_token = None
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "smoke@travelo.app",
        "password": "Test@1234"
    }, timeout=10)
    if resp.status_code == 200:
        auth_token = resp.json().get("token")
        log_pass("Login with test credentials: successful")
    else:
        log_fail("Login with test credentials", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Login with test credentials", str(e))

booking_id = None

if auth_token:
    # Create booking for Ladakh, explorer tier, 2 travelers
    try:
        resp = requests.post(f"{BASE_URL}/bookings", json={
            "destination_id": "ladakh",
            "tier": "explorer",
            "travelers": 2,
            "start_date": "2026-10-05",
            "end_date": "2026-10-13"
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 200:
            booking = resp.json()
            # Ladakh base_price = 1099, explorer = 1099 * 1.0 = 1099
            # Amount = 1099 * 2 = 2198.0
            expected_amount = 2198.0
            actual_amount = booking.get("amount")
            
            if actual_amount == expected_amount:
                booking_id = booking.get("id")
                log_pass(f"POST /bookings (ladakh, explorer, 2 travelers): correct amount ({expected_amount})")
            else:
                log_fail("POST /bookings (ladakh)", f"Expected amount={expected_amount}, got {actual_amount}")
        else:
            log_fail("POST /bookings (ladakh)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /bookings (ladakh)", str(e))
    
    # Create Stripe checkout to verify ladakh_explorer price exists
    if booking_id:
        try:
            resp = requests.post(f"{BASE_URL}/payments/checkout", json={
                "booking_id": booking_id,
                "origin_url": "https://example.com"
            }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
            
            if resp.status_code == 200:
                data = resp.json()
                checkout_url = data.get("checkout_url", "")
                
                if checkout_url.startswith("https://checkout.stripe.com"):
                    log_pass("POST /payments/checkout (ladakh_explorer): valid Stripe checkout URL (proves Stripe price exists)")
                else:
                    log_fail("POST /payments/checkout (ladakh_explorer)", f"Invalid checkout_url: {checkout_url}")
            else:
                log_fail("POST /payments/checkout (ladakh_explorer)", f"Status {resp.status_code}: {resp.text}")
        except Exception as e:
            log_fail("POST /payments/checkout (ladakh_explorer)", str(e))
else:
    log_fail("NEW DESTINATION BOOKING", "No auth token available, skipping booking tests")

# ============================================================================
# 4. VIBE LAB AI ANALYSIS
# ============================================================================
print("\n[4] VIBE LAB AI ANALYSIS")
print("-" * 80)

if auth_token:
    # Test 1: Valid collage analysis with 3 scenic images
    try:
        print("Creating 3 scenic test images with real visual features...")
        images = [create_scenic_image(400, 300, i) for i in range(3)]
        print(f"Created {len(images)} images, sizes: {[len(img) for img in images]} bytes (base64)")
        
        resp = requests.post(f"{BASE_URL}/collage/analyze", json={
            "images": images
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=120)  # 120s timeout for LLM
        
        if resp.status_code == 200:
            data = resp.json()
            
            # Check required keys
            required_keys = ["vibe_title", "caption", "mood", "palette", "hashtags", "source"]
            checks = []
            checks.append(("has all required keys", all(k in data for k in required_keys)))
            checks.append(("vibe_title is string", isinstance(data.get("vibe_title"), str)))
            checks.append(("caption is string", isinstance(data.get("caption"), str)))
            checks.append(("mood is string", isinstance(data.get("mood"), str)))
            checks.append(("palette is array of 3", isinstance(data.get("palette"), list) and len(data.get("palette", [])) == 3))
            checks.append(("hashtags is array of 5", isinstance(data.get("hashtags"), list) and len(data.get("hashtags", [])) == 5))
            checks.append(("all hashtags start with #", all(h.startswith("#") for h in data.get("hashtags", []))))
            checks.append(("all palette items are hex colors", all(isinstance(c, str) and c.startswith("#") for c in data.get("palette", []))))
            
            source = data.get("source")
            if source == "ai":
                checks.append(("source is 'ai'", True))
            elif source == "fallback":
                log_warning("POST /collage/analyze", "LLM call failed, returned fallback response. Check backend logs for EMERGENT_LLM_KEY or API errors.")
                checks.append(("source is 'ai'", False))
            
            if all(check[1] for check in checks):
                log_pass(f"POST /collage/analyze (3 images): correct response structure, source={source}")
            else:
                failed_checks = [check[0] for check in checks if not check[1]]
                log_fail("POST /collage/analyze (3 images)", f"Failed checks: {', '.join(failed_checks)}. Response: {json.dumps(data, indent=2)}")
        else:
            log_fail("POST /collage/analyze (3 images)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /collage/analyze (3 images)", str(e))
    
    # Test 2: Validation - empty images array
    try:
        resp = requests.post(f"{BASE_URL}/collage/analyze", json={
            "images": []
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 422:
            log_pass("POST /collage/analyze (empty images): returns 422")
        else:
            log_fail("POST /collage/analyze (empty images)", f"Expected 422, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /collage/analyze (empty images)", str(e))
    
    # Test 3: Validation - more than 5 images
    try:
        images = [create_scenic_image(200, 150, i) for i in range(6)]
        resp = requests.post(f"{BASE_URL}/collage/analyze", json={
            "images": images
        }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
        
        if resp.status_code == 422:
            log_pass("POST /collage/analyze (6 images): returns 422")
        else:
            log_fail("POST /collage/analyze (6 images)", f"Expected 422, got {resp.status_code}")
    except Exception as e:
        log_fail("POST /collage/analyze (6 images)", str(e))
else:
    log_fail("VIBE LAB AI ANALYSIS", "No auth token available, skipping all tests")

# Test 4: Validation - without auth
try:
    images = [create_scenic_image(200, 150, 0)]
    resp = requests.post(f"{BASE_URL}/collage/analyze", json={
        "images": images
    }, timeout=10)
    
    if resp.status_code in [401, 403]:
        log_pass("POST /collage/analyze (without auth): returns 401/403")
    else:
        log_fail("POST /collage/analyze (without auth)", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /collage/analyze (without auth)", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY - NEW FEATURES")
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
