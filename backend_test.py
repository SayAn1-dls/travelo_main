#!/usr/bin/env python3
"""Backend testing for TRAVELO - Trip Reminder Emails + Read Receipts"""
import os
import sys
import time
from datetime import datetime, timedelta, timezone
import requests

# Base URL from frontend/.env
BASE_URL = "https://wanderlust-chaos.internal.stage-preview.emergentagent.com/api"

# Test credentials
SMOKE_EMAIL = "smoke@travelo.app"
SMOKE_PASSWORD = "Test@1234"
FRIEND_EMAIL = "friend@travelo.app"
FRIEND_PASSWORD = "Friend@1234"

def login(email, password):
    """Login and return auth token"""
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"❌ Login failed for {email}: {resp.status_code} {resp.text}")
        sys.exit(1)
    return resp.json()["token"]

def headers(token):
    """Return auth headers"""
    return {"Authorization": f"Bearer {token}"}

def test_trip_reminder_emails():
    """Test trip reminder email feature"""
    print("\n" + "="*80)
    print("FEATURE 1: TRIP REMINDER EMAILS")
    print("="*80)
    
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    
    # Calculate dates: start_date = today + 2 days, end_date = today + 6 days
    today = datetime.now(timezone.utc).date()
    start_date = (today + timedelta(days=2)).isoformat()
    end_date = (today + timedelta(days=6)).isoformat()
    
    print(f"\n1️⃣  Creating trip with start_date={start_date}, end_date={end_date}")
    trip_data = {
        "place": "Reminder Test City",
        "start_date": start_date,
        "end_date": end_date,
        "budget": 1000,
        "members": [{"name": "Solo Tester", "contribution": 1000}],
        "origin_url": "https://example.com"
    }
    resp = requests.post(f"{BASE_URL}/trips", json=trip_data, headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Create trip failed: {resp.status_code} {resp.text}")
        return False
    
    trip = resp.json()
    trip_id = trip["id"]
    print(f"✅ Trip created: {trip_id}")
    
    # Verify reminder_sent is false or absent
    print(f"\n2️⃣  Verifying reminder_sent is false/absent")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Get trip failed: {resp.status_code} {resp.text}")
        return False
    
    trip = resp.json()
    reminder_sent = trip.get("reminder_sent", False)
    if reminder_sent:
        print(f"❌ reminder_sent should be false/absent, got: {reminder_sent}")
        return False
    print(f"✅ reminder_sent is {reminder_sent} (expected: false/absent)")
    
    # Send reminder (120s timeout for LLM call)
    print(f"\n3️⃣  Sending reminder email (120s timeout for LLM packing checklist)...")
    start_time = time.time()
    resp = requests.post(f"{BASE_URL}/trips/{trip_id}/send-reminder", headers=headers(smoke_token), timeout=120)
    elapsed = time.time() - start_time
    
    if resp.status_code != 200:
        print(f"❌ Send reminder failed: {resp.status_code} {resp.text}")
        return False
    
    result = resp.json()
    sent_list = result.get("sent", [])
    print(f"✅ Reminder sent in {elapsed:.2f}s to: {sent_list}")
    
    if SMOKE_EMAIL not in sent_list:
        print(f"❌ Expected {SMOKE_EMAIL} in sent list, got: {sent_list}")
        return False
    print(f"✅ {SMOKE_EMAIL} in sent list")
    
    # Verify reminder_sent is now true
    print(f"\n4️⃣  Verifying reminder_sent is now true")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Get trip failed: {resp.status_code} {resp.text}")
        return False
    
    trip = resp.json()
    reminder_sent = trip.get("reminder_sent", False)
    if not reminder_sent:
        print(f"❌ reminder_sent should be true, got: {reminder_sent}")
        return False
    print(f"✅ reminder_sent is now true")
    
    # Check notifications
    print(f"\n5️⃣  Checking notifications for reminder mention")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/notifications", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Get notifications failed: {resp.status_code} {resp.text}")
        return False
    
    notifications = resp.json()
    reminder_notif = None
    for n in notifications:
        if "hype email" in n.get("message", "").lower() or "packing checklist" in n.get("message", "").lower():
            reminder_notif = n
            break
    
    if not reminder_notif:
        print(f"❌ No reminder notification found. Notifications: {notifications}")
        return False
    print(f"✅ Reminder notification found: {reminder_notif['message']}")
    
    # Test auth/permissions
    print(f"\n6️⃣  Testing auth/permissions")
    
    # Without auth
    resp = requests.post(f"{BASE_URL}/trips/{trip_id}/send-reminder")
    if resp.status_code not in [401, 403]:
        print(f"❌ Expected 401/403 without auth, got: {resp.status_code}")
        return False
    print(f"✅ Without auth → {resp.status_code}")
    
    # Someone else's trip (friend tries to send reminder for smoke's trip)
    friend_token = login(FRIEND_EMAIL, FRIEND_PASSWORD)
    resp = requests.post(f"{BASE_URL}/trips/{trip_id}/send-reminder", headers=headers(friend_token))
    if resp.status_code != 404:
        print(f"❌ Expected 404 for other user's trip, got: {resp.status_code}")
        return False
    print(f"✅ Other user's trip → 404")
    
    # Bad trip ID
    resp = requests.post(f"{BASE_URL}/trips/nonexistent-id/send-reminder", headers=headers(smoke_token))
    if resp.status_code != 404:
        print(f"❌ Expected 404 for bad trip ID, got: {resp.status_code}")
        return False
    print(f"✅ Bad trip ID → 404")
    
    # Check scheduler logs for errors
    print(f"\n7️⃣  Checking backend logs for 'Reminder loop' errors")
    result = os.popen("grep 'Reminder loop' /var/log/supervisor/backend.err.log 2>/dev/null | tail -20").read()
    if "error" in result.lower() or "exception" in result.lower():
        print(f"❌ Found errors in reminder loop logs:\n{result}")
        return False
    print(f"✅ No 'Reminder loop' errors found in backend logs")
    
    # Cleanup
    print(f"\n8️⃣  Cleanup: Deleting trip")
    resp = requests.delete(f"{BASE_URL}/trips/{trip_id}", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"⚠️  Delete trip failed: {resp.status_code} {resp.text}")
    else:
        print(f"✅ Trip deleted")
    
    return True

def test_read_receipts():
    """Test read receipts feature"""
    print("\n" + "="*80)
    print("FEATURE 2: READ RECEIPTS")
    print("="*80)
    
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    friend_token = login(FRIEND_EMAIL, FRIEND_PASSWORD)
    
    # Get friend's user ID
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers(friend_token))
    if resp.status_code != 200:
        print(f"❌ Get friend user failed: {resp.status_code} {resp.text}")
        return False
    friend_user_id = resp.json()["id"]
    
    # Get first room for friend
    print(f"\n1️⃣  Getting first room for friend")
    resp = requests.get(f"{BASE_URL}/rooms", headers=headers(friend_token))
    if resp.status_code != 200:
        print(f"❌ Get rooms failed: {resp.status_code} {resp.text}")
        return False
    
    rooms = resp.json()
    if not rooms:
        print(f"❌ No rooms found for friend. Creating a test room...")
        # Create a room and have both users join
        resp = requests.post(f"{BASE_URL}/rooms", json={"name": "Read Receipt Test Room"}, headers=headers(smoke_token))
        if resp.status_code != 200:
            print(f"❌ Create room failed: {resp.status_code} {resp.text}")
            return False
        room = resp.json()
        room_id = room["id"]
        invite_code = room["invite_code"]
        
        # Friend joins
        resp = requests.post(f"{BASE_URL}/rooms/join", json={"invite_code": invite_code}, headers=headers(friend_token))
        if resp.status_code != 200:
            print(f"❌ Friend join room failed: {resp.status_code} {resp.text}")
            return False
        print(f"✅ Created and joined test room: {room_id}")
    else:
        # Find a room where both smoke and friend are members (member_count >= 2)
        room_id = None
        for r in rooms:
            if r.get("member_count", 0) >= 2:
                room_id = r["id"]
                break
        
        if not room_id:
            # Use first room and verify friend is a member
            room_id = rooms[0]["id"]
        
        print(f"✅ Using room: {room_id}")
    
    # Mark room as read (as friend)
    print(f"\n2️⃣  Marking room as read (as friend)")
    resp = requests.post(f"{BASE_URL}/rooms/{room_id}/read", headers=headers(friend_token))
    if resp.status_code != 200:
        print(f"❌ Mark room read failed: {resp.status_code} {resp.text}")
        return False
    
    result = resp.json()
    if result.get("ok") != True:
        print(f"❌ Expected {{ok: true}}, got: {result}")
        return False
    print(f"✅ Room marked as read: {result}")
    
    # Get read receipts (as smoke, who must also be a member)
    print(f"\n3️⃣  Getting read receipts (as smoke)")
    resp = requests.get(f"{BASE_URL}/rooms/{room_id}/reads", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Get reads failed: {resp.status_code} {resp.text}")
        return False
    
    reads = resp.json()
    print(f"✅ Read receipts: {reads}")
    
    # Verify friend's user_id is in reads with recent timestamp
    if friend_user_id not in reads:
        print(f"❌ Friend's user_id {friend_user_id} not in reads: {reads}")
        return False
    
    friend_read_time = reads[friend_user_id]
    try:
        read_dt = datetime.fromisoformat(friend_read_time.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)
        age_seconds = (now - read_dt).total_seconds()
        if age_seconds > 60:  # Should be within last 60 seconds
            print(f"❌ Friend's read timestamp too old: {friend_read_time} ({age_seconds:.1f}s ago)")
            return False
        print(f"✅ Friend's read timestamp is recent: {friend_read_time} ({age_seconds:.1f}s ago)")
    except Exception as e:
        print(f"❌ Failed to parse timestamp: {e}")
        return False
    
    # Mark as read again and verify timestamp updates
    print(f"\n4️⃣  Marking room as read again (timestamp should update)")
    time.sleep(1)  # Wait 1 second to ensure timestamp difference
    resp = requests.post(f"{BASE_URL}/rooms/{room_id}/read", headers=headers(friend_token))
    if resp.status_code != 200:
        print(f"❌ Mark room read again failed: {resp.status_code} {resp.text}")
        return False
    
    resp = requests.get(f"{BASE_URL}/rooms/{room_id}/reads", headers=headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Get reads failed: {resp.status_code} {resp.text}")
        return False
    
    new_reads = resp.json()
    new_friend_read_time = new_reads.get(friend_user_id)
    if not new_friend_read_time:
        print(f"❌ Friend's read timestamp missing after second read")
        return False
    
    if new_friend_read_time == friend_read_time:
        print(f"⚠️  Timestamp did not update (may be too fast): {new_friend_read_time}")
    else:
        print(f"✅ Timestamp updated: {friend_read_time} → {new_friend_read_time}")
    
    # Test permissions
    print(f"\n5️⃣  Testing permissions")
    
    # Register a fresh user (non-member)
    fresh_email = f"fresh-{int(time.time())}@travelo.app"
    fresh_password = "Fresh@1234"
    resp = requests.post(f"{BASE_URL}/auth/register", json={
        "name": "Fresh User",
        "email": fresh_email,
        "password": fresh_password
    })
    if resp.status_code != 200:
        print(f"❌ Register fresh user failed: {resp.status_code} {resp.text}")
        return False
    fresh_token = resp.json()["token"]
    print(f"✅ Registered fresh user: {fresh_email}")
    
    # Non-member POST read
    resp = requests.post(f"{BASE_URL}/rooms/{room_id}/read", headers=headers(fresh_token))
    if resp.status_code != 404:
        print(f"❌ Expected 404 for non-member POST read, got: {resp.status_code}")
        return False
    print(f"✅ Non-member POST read → 404")
    
    # Non-member GET reads
    resp = requests.get(f"{BASE_URL}/rooms/{room_id}/reads", headers=headers(fresh_token))
    if resp.status_code != 404:
        print(f"❌ Expected 404 for non-member GET reads, got: {resp.status_code}")
        return False
    print(f"✅ Non-member GET reads → 404")
    
    # Without auth POST read
    resp = requests.post(f"{BASE_URL}/rooms/{room_id}/read")
    if resp.status_code not in [401, 403]:
        print(f"❌ Expected 401/403 without auth POST read, got: {resp.status_code}")
        return False
    print(f"✅ Without auth POST read → {resp.status_code}")
    
    # Without auth GET reads
    resp = requests.get(f"{BASE_URL}/rooms/{room_id}/reads")
    if resp.status_code not in [401, 403]:
        print(f"❌ Expected 401/403 without auth GET reads, got: {resp.status_code}")
        return False
    print(f"✅ Without auth GET reads → {resp.status_code}")
    
    return True

def main():
    print("\n" + "="*80)
    print("TRAVELO BACKEND TESTING - 2 NEW FEATURES")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test users: {SMOKE_EMAIL}, {FRIEND_EMAIL}")
    
    results = {}
    
    # Test Feature 1: Trip Reminder Emails
    try:
        results["Trip Reminder Emails"] = test_trip_reminder_emails()
    except Exception as e:
        print(f"\n❌ EXCEPTION in Trip Reminder Emails: {e}")
        import traceback
        traceback.print_exc()
        results["Trip Reminder Emails"] = False
    
    # Test Feature 2: Read Receipts
    try:
        results["Read Receipts"] = test_read_receipts()
    except Exception as e:
        print(f"\n❌ EXCEPTION in Read Receipts: {e}")
        import traceback
        traceback.print_exc()
        results["Read Receipts"] = False
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    for feature, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {feature}")
    
    all_passed = all(results.values())
    print("\n" + "="*80)
    if all_passed:
        print("🎉 ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
