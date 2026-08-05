#!/usr/bin/env python3
"""Backend tests for TRAVELO - NEWEST features only"""
import os
import sys
import time
import requests
from datetime import datetime, timedelta
from pymongo import MongoClient

# Load environment
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001') + '/api'
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'travelo')

print(f"🔗 Backend URL: {BASE_URL}")
print(f"🔗 MongoDB: {MONGO_URL}")

# Test credentials
SMOKE_EMAIL = "smoke@travelo.app"
SMOKE_PASSWORD = "Test@1234"
FRIEND_EMAIL = "friend@travelo.app"
FRIEND_PASSWORD = "Friend@1234"

# Global tokens
smoke_token = None
friend_token = None

def login(email: str, password: str) -> str:
    """Login and return JWT token"""
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password}, timeout=10)
    if resp.status_code == 200:
        return resp.json()["token"]
    raise Exception(f"Login failed for {email}: {resp.status_code} {resp.text}")

def auth_headers(token: str) -> dict:
    """Return authorization headers"""
    return {"Authorization": f"Bearer {token}"}

# ============================================================================
# SCENARIO 1: TRIP EMAIL INVITES
# ============================================================================
def test_trip_email_invites():
    """Test trip email invites with Gmail SMTP"""
    global smoke_token, friend_token
    
    print("\n" + "="*80)
    print("SCENARIO 1: TRIP EMAIL INVITES")
    print("="*80)
    
    # Login both users
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    friend_token = login(FRIEND_EMAIL, FRIEND_PASSWORD)
    print("✅ Both users logged in")
    
    # Get smoke's trips
    resp = requests.get(f"{BASE_URL}/trips", headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"GET /trips failed: {resp.status_code}"
    trips = resp.json()
    
    # If no trips, create one
    if not trips:
        print("📝 Creating a new trip for smoke user...")
        trip_data = {
            "place": "Goa Beach Escape",
            "start_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=35)).strftime("%Y-%m-%d"),
            "budget": 50000,
            "members": [
                {"name": "Smoke Test", "contribution": 25000, "payment_handle": "smoke@upi", "is_owner": True},
                {"name": "Alice Wonder", "contribution": 25000, "payment_handle": "alice@upi", "is_owner": False}
            ]
        }
        resp = requests.post(f"{BASE_URL}/trips", json=trip_data, headers=auth_headers(smoke_token), timeout=10)
        assert resp.status_code == 200, f"POST /trips failed: {resp.status_code} {resp.text}"
        trip = resp.json()
        trip_id = trip["id"]
        print(f"✅ Created trip: {trip_id}")
    else:
        trip_id = trips[0]["id"]
        print(f"✅ Using existing trip: {trip_id}")
    
    # Send invite email (ONLY ONE real email to sayanbhatt2005@gmail.com)
    print(f"\n📧 Sending invite email to sayanbhatt2005@gmail.com...")
    invite_data = {
        "emails": ["sayanbhatt2005@gmail.com"],
        "origin_url": "https://example.com"
    }
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        json=invite_data,
        headers=auth_headers(smoke_token),
        timeout=30  # Allow up to 30s for SMTP
    )
    assert resp.status_code == 200, f"POST /trips/{trip_id}/invite failed: {resp.status_code} {resp.text}"
    result = resp.json()
    print(f"✅ Invite response: {result}")
    assert "sent" in result, "Response missing 'sent' field"
    assert "failed" in result, "Response missing 'failed' field"
    assert "sayanbhatt2005@gmail.com" in result["sent"], f"Email not in sent list: {result}"
    assert len(result["failed"]) == 0, f"Email failed to send: {result['failed']}"
    print("✅ Email invite sent successfully (may take 5-15s for SMTP)")
    
    # Read newest invite token from MongoDB
    print("\n🔍 Reading invite token from MongoDB...")
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    invite = db.trip_invites.find_one(
        {"trip_id": trip_id, "email": "sayanbhatt2005@gmail.com"},
        sort=[("created_at", -1)]
    )
    assert invite is not None, "Invite not found in MongoDB"
    token = invite["token"]
    print(f"✅ Found invite token: {token[:20]}...")
    
    # GET /api/invites/{token} (NO auth)
    print(f"\n🔍 GET /api/invites/{token} (NO auth)...")
    resp = requests.get(f"{BASE_URL}/invites/{token}", timeout=10)
    assert resp.status_code == 200, f"GET /invites/{token} failed: {resp.status_code} {resp.text}"
    invite_info = resp.json()
    print(f"✅ Invite info: {invite_info}")
    assert invite_info["status"] == "pending", f"Expected status=pending, got {invite_info['status']}"
    assert "invited_by_name" in invite_info, "Missing invited_by_name"
    assert "trip" in invite_info, "Missing trip object"
    trip_info = invite_info["trip"]
    assert "place" in trip_info, "Missing trip.place"
    assert "start_date" in trip_info, "Missing trip.start_date"
    assert "end_date" in trip_info, "Missing trip.end_date"
    assert "member_count" in trip_info, "Missing trip.member_count"
    assert "budget" in trip_info, "Missing trip.budget"
    print("✅ Invite info structure correct")
    
    # GET /api/invites/badtoken123 -> 404
    print(f"\n🔍 GET /api/invites/badtoken123 (should 404)...")
    resp = requests.get(f"{BASE_URL}/invites/badtoken123", timeout=10)
    assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
    print("✅ Invalid token returns 404")
    
    # POST /api/invites/{token}/accept as friend (auth)
    print(f"\n✅ POST /api/invites/{token}/accept as friend...")
    resp = requests.post(f"{BASE_URL}/invites/{token}/accept", headers=auth_headers(friend_token), timeout=10)
    assert resp.status_code == 200, f"POST /invites/{token}/accept failed: {resp.status_code} {resp.text}"
    accept_result = resp.json()
    print(f"✅ Accept result: {accept_result}")
    assert "trip_id" in accept_result, "Missing trip_id"
    assert "room_id" in accept_result, "Missing room_id"
    assert "place" in accept_result, "Missing place"
    assert accept_result["trip_id"] == trip_id, f"trip_id mismatch: {accept_result['trip_id']} != {trip_id}"
    
    # Verify: GET /api/trips/{trip_id} as smoke -> members now include "Friend Rahul"
    print(f"\n🔍 Verifying Friend Rahul added to trip members...")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}", headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"GET /trips/{trip_id} failed: {resp.status_code}"
    trip = resp.json()
    member_names = [m["name"] for m in trip.get("members", [])]
    print(f"✅ Trip members: {member_names}")
    assert "Friend Rahul" in member_names, f"Friend Rahul not in members: {member_names}"
    print("✅ Friend Rahul successfully added to trip")
    
    # Accept the same token again -> should NOT add duplicate member
    print(f"\n🔍 Accepting same token again (should be idempotent)...")
    resp = requests.post(f"{BASE_URL}/invites/{token}/accept", headers=auth_headers(friend_token), timeout=10)
    assert resp.status_code == 200, f"Second accept failed: {resp.status_code}"
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}", headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"GET /trips/{trip_id} failed: {resp.status_code}"
    trip = resp.json()
    friend_count = sum(1 for m in trip.get("members", []) if m["name"] == "Friend Rahul")
    assert friend_count == 1, f"Duplicate member added! Friend Rahul appears {friend_count} times"
    print("✅ Idempotent accept: no duplicate member added")
    
    # Verify: GET /api/rooms as friend -> includes room for that trip
    print(f"\n🔍 Verifying friend has access to trip room...")
    resp = requests.get(f"{BASE_URL}/rooms", headers=auth_headers(friend_token), timeout=10)
    assert resp.status_code == 200, f"GET /rooms failed: {resp.status_code}"
    rooms = resp.json()
    trip_room = next((r for r in rooms if r.get("trip_id") == trip_id), None)
    assert trip_room is not None, f"Friend not in trip room. Rooms: {[r.get('name') for r in rooms]}"
    print(f"✅ Friend has access to trip room: {trip_room['name']}")
    
    # Test: Invite without auth -> 401/403
    print(f"\n🔍 Testing invite without auth (should fail)...")
    resp = requests.post(f"{BASE_URL}/trips/{trip_id}/invite", json=invite_data, timeout=10)
    assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
    print("✅ Invite without auth returns 401/403")
    
    # Test: Invite to someone else's trip -> should fail (friend tries to invite to smoke's trip)
    print(f"\n🔍 Testing invite to someone else's trip (should fail)...")
    # Create a trip owned by smoke only
    other_trip_data = {
        "place": "Private Trip",
        "start_date": (datetime.now() + timedelta(days=60)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=65)).strftime("%Y-%m-%d"),
        "budget": 30000,
        "members": [
            {"name": "Smoke Test", "contribution": 30000, "payment_handle": "smoke@upi", "is_owner": True}
        ]
    }
    resp = requests.post(f"{BASE_URL}/trips", json=other_trip_data, headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"POST /trips failed: {resp.status_code}"
    other_trip_id = resp.json()["id"]
    
    # Friend tries to invite to smoke's private trip
    resp = requests.post(
        f"{BASE_URL}/trips/{other_trip_id}/invite",
        json={"emails": ["test@example.com"], "origin_url": "https://example.com"},
        headers=auth_headers(friend_token),
        timeout=10
    )
    assert resp.status_code == 404, f"Expected 404 for other user's trip, got {resp.status_code}"
    print("✅ Cannot invite to someone else's trip (404)")
    
    print("\n" + "="*80)
    print("✅ SCENARIO 1 PASSED: Trip email invites working correctly")
    print("="*80)

# ============================================================================
# SCENARIO 2: DESTINATION INTEL GUIDE
# ============================================================================
def test_destination_guide():
    """Test destination intel guide with AI + Wikipedia images"""
    print("\n" + "="*80)
    print("SCENARIO 2: DESTINATION INTEL GUIDE")
    print("="*80)
    
    # Test 1: GET /api/destinations/goa/guide (should be cached or instant)
    print("\n🔍 GET /api/destinations/goa/guide (should be instant if cached)...")
    start = time.time()
    resp = requests.get(f"{BASE_URL}/destinations/goa/guide", timeout=130)
    elapsed = time.time() - start
    assert resp.status_code == 200, f"GET /destinations/goa/guide failed: {resp.status_code} {resp.text}"
    guide = resp.json()
    print(f"✅ Goa guide returned in {elapsed:.2f}s")
    
    # Verify structure
    assert "overview" in guide, "Missing overview"
    assert isinstance(guide["overview"], str), "overview should be string"
    assert len(guide["overview"]) >= 100, f"overview too short: {len(guide['overview'])} chars"
    print(f"✅ overview: {len(guide['overview'])} words")
    
    assert "top_spots" in guide, "Missing top_spots"
    assert isinstance(guide["top_spots"], list), "top_spots should be array"
    assert len(guide["top_spots"]) == 7, f"Expected 7 top_spots, got {len(guide['top_spots'])}"
    for i, spot in enumerate(guide["top_spots"]):
        assert "name" in spot, f"top_spots[{i}] missing name"
        assert "description" in spot, f"top_spots[{i}] missing description"
        assert "why_go" in spot, f"top_spots[{i}] missing why_go"
        assert "best_time" in spot, f"top_spots[{i}] missing best_time"
        assert "image" in spot, f"top_spots[{i}] missing image"
    print(f"✅ top_spots: 7 spots with correct structure")
    
    assert "underrated" in guide, "Missing underrated"
    assert isinstance(guide["underrated"], list), "underrated should be array"
    assert len(guide["underrated"]) == 4, f"Expected 4 underrated, got {len(guide['underrated'])}"
    for i, gem in enumerate(guide["underrated"]):
        assert "name" in gem, f"underrated[{i}] missing name"
        assert "description" in gem, f"underrated[{i}] missing description"
        assert "image" in gem, f"underrated[{i}] missing image"
    print(f"✅ underrated: 4 gems with correct structure")
    
    assert "getting_there" in guide, "Missing getting_there"
    getting_there = guide["getting_there"]
    assert "by_air" in getting_there, "Missing getting_there.by_air"
    assert "by_train" in getting_there, "Missing getting_there.by_train"
    assert "by_road" in getting_there, "Missing getting_there.by_road"
    print(f"✅ getting_there: by_air, by_train, by_road")
    
    assert "getting_around" in guide, "Missing getting_around"
    assert isinstance(guide["getting_around"], str), "getting_around should be string"
    print(f"✅ getting_around: {len(guide['getting_around'])} chars")
    
    assert "food" in guide, "Missing food"
    assert isinstance(guide["food"], list), "food should be array"
    assert len(guide["food"]) == 5, f"Expected 5 food items, got {len(guide['food'])}"
    for i, dish in enumerate(guide["food"]):
        assert "dish" in dish, f"food[{i}] missing dish"
        assert "description" in dish, f"food[{i}] missing description"
    print(f"✅ food: 5 dishes with correct structure")
    
    assert "tips" in guide, "Missing tips"
    assert isinstance(guide["tips"], list), "tips should be array"
    assert len(guide["tips"]) == 5, f"Expected 5 tips, got {len(guide['tips'])}"
    print(f"✅ tips: 5 tips")
    
    # Check if cached (instant response < 3s)
    if elapsed < 3:
        print(f"✅ Goa guide is CACHED (response in {elapsed:.2f}s)")
    else:
        print(f"⚠️  Goa guide generated fresh (took {elapsed:.2f}s)")
    
    # Test 2: GET /api/destinations/jaipur/guide (FIRST generation, allow 120s)
    print("\n🔍 GET /api/destinations/jaipur/guide (first generation, allow 120s)...")
    
    # Clear jaipur guide from cache if exists
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    db.guides.delete_one({"destination_id": "jaipur"})
    print("✅ Cleared jaipur guide cache")
    
    start = time.time()
    resp = requests.get(f"{BASE_URL}/destinations/jaipur/guide", timeout=130)
    elapsed = time.time() - start
    assert resp.status_code == 200, f"GET /destinations/jaipur/guide failed: {resp.status_code} {resp.text}"
    guide = resp.json()
    print(f"✅ Jaipur guide generated in {elapsed:.2f}s")
    
    # Verify same structure
    assert "overview" in guide and len(guide["overview"]) >= 100, "Invalid overview"
    assert "top_spots" in guide and len(guide["top_spots"]) == 7, "Invalid top_spots"
    assert "underrated" in guide and len(guide["underrated"]) == 4, "Invalid underrated"
    assert "getting_there" in guide, "Missing getting_there"
    assert "getting_around" in guide, "Missing getting_around"
    assert "food" in guide and len(guide["food"]) == 5, "Invalid food"
    assert "tips" in guide and len(guide["tips"]) == 5, "Invalid tips"
    print("✅ Jaipur guide structure correct")
    
    # Check if at least some spot images contain "wikimedia"
    all_images = [s["image"] for s in guide["top_spots"]] + [g["image"] for g in guide["underrated"]]
    wikimedia_count = sum(1 for img in all_images if "wikimedia" in img.lower())
    print(f"✅ {wikimedia_count}/{len(all_images)} images from Wikimedia")
    if wikimedia_count > 0:
        print("✅ Wikipedia image integration working")
    else:
        print("⚠️  No Wikimedia images found (fallback to destination image)")
    
    # Test 3: GET /api/destinations/jaipur/guide again -> instant (cached, response < 3s)
    print("\n🔍 GET /api/destinations/jaipur/guide again (should be cached)...")
    start = time.time()
    resp = requests.get(f"{BASE_URL}/destinations/jaipur/guide", timeout=10)
    elapsed = time.time() - start
    assert resp.status_code == 200, f"GET /destinations/jaipur/guide failed: {resp.status_code}"
    guide2 = resp.json()
    print(f"✅ Jaipur guide returned in {elapsed:.2f}s")
    assert elapsed < 3, f"Cached response should be < 3s, got {elapsed:.2f}s"
    print(f"✅ Jaipur guide is CACHED (response in {elapsed:.2f}s)")
    
    # Verify same data
    assert guide2["overview"] == guide["overview"], "Cached guide data mismatch"
    print("✅ Cached guide data matches original")
    
    # Test 4: GET /api/destinations/nonexistent/guide -> 404
    print("\n🔍 GET /api/destinations/nonexistent/guide (should 404)...")
    resp = requests.get(f"{BASE_URL}/destinations/nonexistent/guide", timeout=10)
    assert resp.status_code == 404, f"Expected 404, got {resp.status_code}"
    print("✅ Nonexistent destination returns 404")
    
    print("\n" + "="*80)
    print("✅ SCENARIO 2 PASSED: Destination intel guide working correctly")
    print("="*80)

# ============================================================================
# SCENARIO 3: INR NOTIFICATIONS
# ============================================================================
def test_inr_notifications():
    """Test INR (₹) symbol in trip notifications"""
    global smoke_token
    
    print("\n" + "="*80)
    print("SCENARIO 3: INR NOTIFICATIONS")
    print("="*80)
    
    if not smoke_token:
        smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    
    # Create a fresh trip with 2 members, budget 5000
    print("\n📝 Creating fresh trip with budget ₹5000...")
    trip_data = {
        "place": "INR Test Trip",
        "start_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
        "budget": 5000,
        "members": [
            {"name": "Smoke Test", "contribution": 2500, "payment_handle": "smoke@upi", "is_owner": True},
            {"name": "Bob Kumar", "contribution": 2500, "payment_handle": "bob@upi", "is_owner": False}
        ]
    }
    resp = requests.post(f"{BASE_URL}/trips", json=trip_data, headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"POST /trips failed: {resp.status_code} {resp.text}"
    trip = resp.json()
    trip_id = trip["id"]
    print(f"✅ Created trip: {trip_id}")
    
    # Add an expense (₹500)
    print("\n💰 Adding expense: ₹500...")
    expense_data = {
        "description": "Lunch at beach shack",
        "amount": 500,
        "paid_by": trip["members"][0]["id"],  # Smoke pays
        "category": "food"
    }
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/expenses",
        json=expense_data,
        headers=auth_headers(smoke_token),
        timeout=10
    )
    assert resp.status_code == 200, f"POST /trips/{trip_id}/expenses failed: {resp.status_code} {resp.text}"
    print("✅ Expense added")
    
    # GET /api/trips/{id}/notifications
    print("\n🔍 GET /api/trips/{trip_id}/notifications...")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/notifications", headers=auth_headers(smoke_token), timeout=10)
    assert resp.status_code == 200, f"GET /trips/{trip_id}/notifications failed: {resp.status_code}"
    notifications = resp.json()
    print(f"✅ Got {len(notifications)} notifications")
    
    # Find expense notification
    expense_notif = next((n for n in notifications if n["type"] == "expense"), None)
    assert expense_notif is not None, f"No expense notification found. Notifications: {notifications}"
    print(f"✅ Expense notification: {expense_notif['message']}")
    
    # Verify message contains ₹500 (rupee symbol, NOT $)
    message = expense_notif["message"]
    assert "₹500" in message or "₹ 500" in message, f"Expected '₹500' in message, got: {message}"
    assert "$500" not in message and "$ 500" not in message, f"Found '$500' instead of '₹500' in message: {message}"
    print(f"✅ Expense notification contains ₹500 (rupee symbol, NOT $)")
    
    # Also check the info notification (trip creation)
    info_notif = next((n for n in notifications if n["type"] == "info" and "created" in n["message"].lower()), None)
    if info_notif:
        print(f"✅ Info notification: {info_notif['message']}")
        # Should contain ₹2,500 (pool) and ₹5,000 (budget)
        if "₹" in info_notif["message"]:
            print(f"✅ Info notification also uses ₹ symbol")
        else:
            print(f"⚠️  Info notification doesn't contain ₹ symbol: {info_notif['message']}")
    
    print("\n" + "="*80)
    print("✅ SCENARIO 3 PASSED: INR notifications working correctly")
    print("="*80)

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    try:
        print("\n" + "="*80)
        print("🚀 TRAVELO BACKEND TESTING - NEWEST FEATURES")
        print("="*80)
        
        # Run all scenarios
        test_trip_email_invites()
        test_destination_guide()
        test_inr_notifications()
        
        print("\n" + "="*80)
        print("✅ ALL TESTS PASSED")
        print("="*80)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
