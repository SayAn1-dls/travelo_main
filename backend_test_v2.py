"""TRAVELO Backend API Test Suite - v2 EXPANDED CATALOG + VIBE LAB v2"""
import requests
import base64
import io
from PIL import Image, ImageDraw
import time

# Base URL from frontend/.env
BASE_URL = "https://wanderlust-chaos.internal.stage-preview.emergentagent.com/api"

# Test credentials
TEST_EMAIL = "smoke@travelo.app"
TEST_PASSWORD = "Test@1234"

# Test results tracking
results = {
    "passed": [],
    "failed": [],
}

def log_pass(test_name):
    results["passed"].append(test_name)
    print(f"✅ PASS: {test_name}")

def log_fail(test_name, reason):
    results["failed"].append(f"{test_name}: {reason}")
    print(f"❌ FAIL: {test_name}")
    print(f"   Reason: {reason}")

print("=" * 80)
print("TRAVELO BACKEND API TEST SUITE - v2")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print()

# ============================================================================
# 0. LOGIN
# ============================================================================
print("\n[0] LOGIN")
print("-" * 80)
auth_token = None
try:
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }, timeout=10)
    if resp.status_code == 200:
        auth_token = resp.json().get("token")
        log_pass("Login with test credentials")
    else:
        log_fail("Login", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("Login", str(e))

if not auth_token:
    print("\n❌ Cannot proceed without auth token. Exiting.")
    exit(1)

# ============================================================================
# 1. EXPANDED CATALOG v2
# ============================================================================
print("\n[1] EXPANDED CATALOG v2")
print("-" * 80)

# 1a. GET /api/destinations → exactly 30 destinations
try:
    resp = requests.get(f"{BASE_URL}/destinations", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        if len(destinations) == 30:
            log_pass("GET /destinations: exactly 30 destinations")
        else:
            log_fail("GET /destinations", f"Expected 30 destinations, got {len(destinations)}")
    else:
        log_fail("GET /destinations", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations", str(e))

# 1b. GET /api/destinations?region=India → exactly 12
expected_india = ["goa", "jaipur", "kerala", "ladakh", "varanasi", "udaipur", 
                  "agra", "rishikesh", "manali", "jaisalmer", "andaman", "darjeeling"]
try:
    resp = requests.get(f"{BASE_URL}/destinations?region=India", timeout=10)
    if resp.status_code == 200:
        destinations = resp.json()
        dest_ids = [d["id"] for d in destinations]
        if len(destinations) == 12:
            # Check if all expected destinations are present
            missing = [d for d in expected_india if d not in dest_ids]
            extra = [d for d in dest_ids if d not in expected_india]
            if not missing and not extra:
                log_pass("GET /destinations?region=India: exactly 12 destinations with correct IDs")
            else:
                log_fail("GET /destinations?region=India", 
                        f"Expected {expected_india}, got {dest_ids}. Missing: {missing}, Extra: {extra}")
        else:
            log_fail("GET /destinations?region=India", 
                    f"Expected 12 destinations, got {len(destinations)}. IDs: {dest_ids}")
    else:
        log_fail("GET /destinations?region=India", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations?region=India", str(e))

# 1c. GET /api/destinations/agra → base_price 699, duration_days 4
try:
    resp = requests.get(f"{BASE_URL}/destinations/agra", timeout=10)
    if resp.status_code == 200:
        dest = resp.json()
        checks = []
        checks.append(("base_price = 699", dest.get("base_price") == 699))
        checks.append(("duration_days = 4", dest.get("duration_days") == 4))
        
        if all(check[1] for check in checks):
            log_pass("GET /destinations/agra: base_price 699, duration_days 4")
        else:
            failed_checks = [check[0] for check in checks if not check[1]]
            log_fail("GET /destinations/agra", 
                    f"Failed checks: {', '.join(failed_checks)}. Got: base_price={dest.get('base_price')}, duration_days={dest.get('duration_days')}")
    else:
        log_fail("GET /destinations/agra", f"Status {resp.status_code}")
except Exception as e:
    log_fail("GET /destinations/agra", str(e))

# 1d. Verify all 6 NEW destination image URLs return HTTP 200
new_destinations = ["agra", "rishikesh", "manali", "jaisalmer", "andaman", "darjeeling"]
for dest_id in new_destinations:
    try:
        # Get destination details
        resp = requests.get(f"{BASE_URL}/destinations/{dest_id}", timeout=10)
        if resp.status_code == 200:
            dest = resp.json()
            image_url = dest.get("image")
            if image_url:
                # HEAD request to check if image URL is accessible
                img_resp = requests.head(image_url, timeout=10, allow_redirects=True)
                if img_resp.status_code == 200:
                    log_pass(f"Image URL for {dest_id}: HTTP 200")
                else:
                    log_fail(f"Image URL for {dest_id}", f"HTTP {img_resp.status_code}")
            else:
                log_fail(f"Image URL for {dest_id}", "No image URL found")
        else:
            log_fail(f"GET /destinations/{dest_id}", f"Status {resp.status_code}")
    except Exception as e:
        log_fail(f"Image URL for {dest_id}", str(e))

# ============================================================================
# 2. NEW INDIAN DESTINATION BOOKING + STRIPE
# ============================================================================
print("\n[2] NEW INDIAN DESTINATION BOOKING + STRIPE")
print("-" * 80)

booking_id = None

# 2a. POST /api/bookings with jaisalmer, tier legend, 2 travelers
# Expected: amount = round(849*2.8)*2 = 2377*2 = 4754.0
try:
    resp = requests.post(f"{BASE_URL}/bookings", json={
        "destination_id": "jaisalmer",
        "tier": "legend",
        "travelers": 2,
        "start_date": "2026-12-01",
        "end_date": "2026-12-06"
    }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=10)
    
    if resp.status_code == 200:
        booking = resp.json()
        booking_id = booking.get("id")
        expected_amount = 4754.0
        actual_amount = booking.get("amount")
        
        if actual_amount == expected_amount:
            log_pass(f"POST /bookings (jaisalmer legend 2 travelers): amount = {expected_amount}")
        else:
            log_fail("POST /bookings (jaisalmer)", 
                    f"Expected amount={expected_amount}, got {actual_amount}")
    else:
        log_fail("POST /bookings (jaisalmer)", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /bookings (jaisalmer)", str(e))

# 2b. POST /api/payments/checkout → valid Stripe URL
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
                log_pass("POST /payments/checkout (jaisalmer): valid Stripe checkout URL (proves jaisalmer_legend price exists)")
            else:
                log_fail("POST /payments/checkout (jaisalmer)", 
                        f"Invalid checkout_url: {checkout_url}")
        else:
            log_fail("POST /payments/checkout (jaisalmer)", f"Status {resp.status_code}: {resp.text}")
    except Exception as e:
        log_fail("POST /payments/checkout (jaisalmer)", str(e))
else:
    log_fail("POST /payments/checkout (jaisalmer)", "No booking_id available")

# ============================================================================
# 3. VIBE LAB v2
# ============================================================================
print("\n[3] VIBE LAB v2")
print("-" * 80)

def create_test_image(width=400, height=400, colors=None):
    """Create a test image with gradients and shapes (per image_testing.md)"""
    if colors is None:
        colors = [(255, 100, 50), (100, 200, 255), (255, 255, 100)]
    
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(height):
        r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * y / height)
        g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * y / height)
        b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * y / height)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    # Add shapes for visual features
    draw.ellipse([50, 50, 150, 150], fill=colors[2], outline=(0, 0, 0))
    draw.rectangle([200, 100, 350, 250], fill=colors[1], outline=(255, 255, 255))
    draw.polygon([(100, 300), (200, 250), (300, 300)], fill=colors[0], outline=(0, 0, 0))
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.read()).decode('utf-8')
    return f"data:image/jpeg;base64,{img_base64}"

# Generate 2 test images with real visual features
print("Generating test images with gradients and shapes...")
image1 = create_test_image(400, 400, [(255, 150, 100), (100, 150, 255), (255, 200, 50)])
image2 = create_test_image(400, 400, [(200, 100, 255), (100, 255, 200), (255, 100, 150)])

# 3a. POST /api/collage/analyze with 2 images
try:
    resp = requests.post(f"{BASE_URL}/collage/analyze", json={
        "images": [image1, image2]
    }, headers={"Authorization": f"Bearer {auth_token}"}, timeout=95)
    
    if resp.status_code == 200:
        data = resp.json()
        
        # Check all required fields
        checks = []
        checks.append(("has vibe_title", "vibe_title" in data and len(str(data.get("vibe_title", ""))) > 0))
        checks.append(("has caption", "caption" in data and len(str(data.get("caption", ""))) > 0))
        checks.append(("has mood", "mood" in data and len(str(data.get("mood", ""))) > 0))
        
        # Check palette (3 hex colors)
        palette = data.get("palette", [])
        checks.append(("palette has 3 colors", isinstance(palette, list) and len(palette) == 3))
        if isinstance(palette, list) and len(palette) == 3:
            all_hex = all(isinstance(c, str) and c.startswith("#") for c in palette)
            checks.append(("palette all hex colors", all_hex))
        
        # Check hashtags (5 strings starting with #)
        hashtags = data.get("hashtags", [])
        checks.append(("hashtags has 5 items", isinstance(hashtags, list) and len(hashtags) == 5))
        if isinstance(hashtags, list) and len(hashtags) == 5:
            all_hashtags = all(isinstance(h, str) and h.startswith("#") for h in hashtags)
            checks.append(("hashtags all start with #", all_hashtags))
        
        # NEW FIELDS
        # Check photo_type (one of: friends|couple|solo|family|scenery)
        photo_type = data.get("photo_type", "")
        valid_types = {"friends", "couple", "solo", "family", "scenery"}
        checks.append(("has photo_type", photo_type in valid_types))
        
        # Check scrapbook_labels (array of exactly 3 short strings)
        scrapbook_labels = data.get("scrapbook_labels", [])
        checks.append(("scrapbook_labels has 3 items", isinstance(scrapbook_labels, list) and len(scrapbook_labels) == 3))
        if isinstance(scrapbook_labels, list) and len(scrapbook_labels) == 3:
            all_strings = all(isinstance(s, str) and len(s) > 0 for s in scrapbook_labels)
            checks.append(("scrapbook_labels all non-empty strings", all_strings))
        
        # Check source (should be "ai", not "fallback")
        source = data.get("source", "")
        checks.append(("source = 'ai'", source == "ai"))
        
        if all(check[1] for check in checks):
            log_pass("POST /collage/analyze: ALL fields present (vibe_title, caption, mood, palette[3], hashtags[5], photo_type, scrapbook_labels[3], source='ai')")
            print(f"   Response: vibe_title='{data.get('vibe_title')}', photo_type='{photo_type}', scrapbook_labels={scrapbook_labels}, source='{source}'")
        else:
            failed_checks = [check[0] for check in checks if not check[1]]
            log_fail("POST /collage/analyze", 
                    f"Failed checks: {', '.join(failed_checks)}. Response: {data}")
            if source == "fallback":
                print("   ⚠️  WARNING: LLM returned fallback response. Check backend logs for LLM integration issues.")
    else:
        log_fail("POST /collage/analyze", f"Status {resp.status_code}: {resp.text}")
except Exception as e:
    log_fail("POST /collage/analyze", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(results['passed'])}")
print(f"❌ FAILED: {len(results['failed'])}")

if results['failed']:
    print("\nFailed Tests:")
    for fail in results['failed']:
        print(f"  - {fail}")

print("\n" + "=" * 80)
exit_code = 0 if len(results['failed']) == 0 else 1
print(f"Exit code: {exit_code}")
exit(exit_code)
