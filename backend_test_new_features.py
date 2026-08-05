#!/usr/bin/env python3
"""Backend tests for TRAVELO - 4 NEW features (Hindi voice, trip invites list, audio voice notes, receipt email wiring)"""
import os
import sys
import time
import requests
from datetime import datetime, timedelta
from pymongo import MongoClient
from gtts import gTTS
import tempfile

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
# FEATURE 1: HINDI VOICE MODE
# ============================================================================
def test_hindi_voice_mode():
    """Test Hindi voice transcription and Hindi chat replies"""
    global smoke_token
    
    print("\n" + "="*80)
    print("FEATURE 1: HINDI VOICE MODE")
    print("="*80)
    
    # Login
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    print("✅ Logged in as smoke user")
    
    # Test 1a: Generate Hindi speech and transcribe
    print("\n📝 Test 1a: Hindi voice transcription")
    hindi_text = "मुझे मनाली में बर्फ देखनी है"
    print(f"   Generating Hindi audio: '{hindi_text}'")
    
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
        tmp_path = tmp.name
        gTTS(hindi_text, lang='hi').save(tmp_path)
        print(f"   ✅ Generated audio file: {tmp_path}")
        
        # Transcribe with language="hi"
        with open(tmp_path, 'rb') as audio_file:
            files = {'file': ('hindi_test.mp3', audio_file, 'audio/mpeg')}
            data = {'language': 'hi'}
            resp = requests.post(
                f"{BASE_URL}/voice/transcribe",
                files=files,
                data=data,
                headers=auth_headers(smoke_token),
                timeout=60
            )
        
        os.unlink(tmp_path)
        
        assert resp.status_code == 200, f"POST /voice/transcribe failed: {resp.status_code} {resp.text}"
        result = resp.json()
        transcribed_text = result.get('text', '')
        print(f"   ✅ Transcribed text: '{transcribed_text}'")
        
        # Check if transcription contains Devanagari script and "मनाली" (accept close variants)
        has_devanagari = any('\u0900' <= c <= '\u097F' for c in transcribed_text)
        has_manali = 'मनाली' in transcribed_text or 'मनालि' in transcribed_text or 'manali' in transcribed_text.lower()
        
        assert has_devanagari, f"❌ Transcription should contain Devanagari script, got: {transcribed_text}"
        assert has_manali, f"❌ Transcription should contain 'मनाली' or variant, got: {transcribed_text}"
        print(f"   ✅ Transcription contains Devanagari and 'मनाली' (or variant)")
    
    # Test 1b: Chat in Hindi
    print("\n📝 Test 1b: NOMAD chat replies in Hindi")
    chat_data = {
        "place": "Manali",
        "phase": "before",
        "language": "hi",
        "text": "मनाली में 2 दिन का प्लान दो, छोटा जवाब"
    }
    
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json=chat_data,
        headers=auth_headers(smoke_token),
        timeout=90,
        stream=True
    )
    
    assert resp.status_code == 200, f"POST /chat/message failed: {resp.status_code} {resp.text}"
    
    # Accumulate SSE delta events
    accumulated_text = ""
    for line in resp.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                import json
                data = json.loads(line_str[6:])
                if data.get('type') == 'delta':
                    accumulated_text += data.get('content', '')
    
    print(f"   ✅ Accumulated reply: '{accumulated_text[:200]}...'")
    
    # Check if reply is primarily in Devanagari (Hindi), NOT English
    devanagari_count = sum(1 for c in accumulated_text if '\u0900' <= c <= '\u097F')
    latin_alpha_count = sum(1 for c in accumulated_text if c.isalpha() and c.isascii())
    
    print(f"   📊 Devanagari chars: {devanagari_count}, Latin alpha chars: {latin_alpha_count}")
    
    assert devanagari_count > 0, f"❌ Reply should contain Devanagari script (Hindi), got: {accumulated_text[:200]}"
    assert devanagari_count > latin_alpha_count, f"❌ Reply should be primarily in Hindi (Devanagari), not English. Devanagari: {devanagari_count}, Latin: {latin_alpha_count}"
    print(f"   ✅ Reply is primarily in Hindi (Devanagari script)")
    
    # Test 1c: Chat in English still works
    print("\n📝 Test 1c: NOMAD chat replies in English when language='en'")
    chat_data_en = {
        "place": "Manali",
        "phase": "before",
        "language": "en",
        "text": "Give me a 2-day plan for Manali, short answer"
    }
    
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json=chat_data_en,
        headers=auth_headers(smoke_token),
        timeout=90,
        stream=True
    )
    
    assert resp.status_code == 200, f"POST /chat/message (en) failed: {resp.status_code} {resp.text}"
    
    accumulated_text_en = ""
    for line in resp.iter_lines():
        if line:
            line_str = line.decode('utf-8')
            if line_str.startswith('data: '):
                import json
                data = json.loads(line_str[6:])
                if data.get('type') == 'delta':
                    accumulated_text_en += data.get('content', '')
    
    print(f"   ✅ Accumulated reply (en): '{accumulated_text_en[:200]}...'")
    
    # Check if reply is in English (mostly Latin alphabet)
    latin_alpha_count_en = sum(1 for c in accumulated_text_en if c.isalpha() and c.isascii())
    devanagari_count_en = sum(1 for c in accumulated_text_en if '\u0900' <= c <= '\u097F')
    
    print(f"   📊 Latin alpha chars: {latin_alpha_count_en}, Devanagari chars: {devanagari_count_en}")
    
    assert latin_alpha_count_en > 0, f"❌ Reply should contain English text, got: {accumulated_text_en[:200]}"
    assert latin_alpha_count_en > devanagari_count_en, f"❌ Reply should be primarily in English, not Hindi"
    print(f"   ✅ Reply is in English")
    
    print("\n✅ FEATURE 1 PASSED: Hindi voice mode working (transcribe + chat in Hindi)")

# ============================================================================
# FEATURE 2: TRIP INVITES LIST
# ============================================================================
def test_trip_invites_list():
    """Test GET /api/trips/{id}/invites endpoint"""
    global smoke_token, friend_token
    
    print("\n" + "="*80)
    print("FEATURE 2: TRIP INVITES LIST")
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
                {"name": "Smoke Test", "contribution": 25000, "payment_handle": "smoke@upi"}
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
    
    # Send an invite to create invite records
    print(f"\n📧 Sending invite to create invite records...")
    invite_data = {
        "emails": ["test@example.com"],
        "origin_url": "https://example.com"
    }
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        json=invite_data,
        headers=auth_headers(smoke_token),
        timeout=30
    )
    assert resp.status_code == 200, f"POST /trips/{trip_id}/invite failed: {resp.status_code} {resp.text}"
    print(f"✅ Invite sent")
    
    # Test 2a: Get invites list as trip owner
    print("\n📝 Test 2a: GET /api/trips/{id}/invites as trip owner")
    resp = requests.get(
        f"{BASE_URL}/trips/{trip_id}/invites",
        headers=auth_headers(smoke_token),
        timeout=10
    )
    
    assert resp.status_code == 200, f"GET /trips/{trip_id}/invites failed: {resp.status_code} {resp.text}"
    invites = resp.json()
    print(f"   ✅ Got {len(invites)} invites")
    
    # Verify structure
    assert isinstance(invites, list), f"❌ Response should be an array, got: {type(invites)}"
    
    if invites:
        invite = invites[0]
        print(f"   📋 First invite: {invite}")
        
        # Check required fields
        assert 'email' in invite, "❌ Invite should have 'email' field"
        assert 'status' in invite, "❌ Invite should have 'status' field"
        assert 'created_at' in invite, "❌ Invite should have 'created_at' field"
        
        # Check status is valid
        assert invite['status'] in ['pending', 'accepted'], f"❌ Status should be 'pending' or 'accepted', got: {invite['status']}"
        
        # CRITICAL: Check that 'token' field is NOT exposed
        assert 'token' not in invite, f"❌ SECURITY ISSUE: 'token' field should NOT be exposed in invites list, got: {invite}"
        
        print(f"   ✅ Invite structure correct: email={invite['email']}, status={invite['status']}, created_at={invite['created_at']}")
        print(f"   ✅ SECURITY: 'token' field NOT exposed")
    
    # Test 2b: Without auth -> 401/403
    print("\n📝 Test 2b: GET /api/trips/{id}/invites without auth")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/invites", timeout=10)
    assert resp.status_code in [401, 403], f"❌ Should return 401/403 without auth, got: {resp.status_code}"
    print(f"   ✅ Returns {resp.status_code} without auth")
    
    # Test 2c: Other user's trip -> 404
    print("\n📝 Test 2c: GET /api/trips/{id}/invites for other user's trip")
    resp = requests.get(
        f"{BASE_URL}/trips/{trip_id}/invites",
        headers=auth_headers(friend_token),
        timeout=10
    )
    assert resp.status_code == 404, f"❌ Should return 404 for other user's trip, got: {resp.status_code}"
    print(f"   ✅ Returns 404 for other user's trip")
    
    print("\n✅ FEATURE 2 PASSED: Trip invites list endpoint working")

# ============================================================================
# FEATURE 3: AUDIO VOICE NOTES IN ROOMS
# ============================================================================
def test_audio_voice_notes():
    """Test audio voice notes in squad chat rooms"""
    global smoke_token, friend_token
    
    print("\n" + "="*80)
    print("FEATURE 3: AUDIO VOICE NOTES IN ROOMS")
    print("="*80)
    
    # Login both users
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    friend_token = login(FRIEND_EMAIL, FRIEND_PASSWORD)
    print("✅ Both users logged in")
    
    # Get friend's rooms
    resp = requests.get(f"{BASE_URL}/rooms", headers=auth_headers(friend_token), timeout=10)
    assert resp.status_code == 200, f"GET /rooms failed: {resp.status_code}"
    rooms = resp.json()
    
    # If no rooms, create one
    if not rooms:
        print("📝 Creating a new room for friend user...")
        room_data = {"name": "Audio Test Room"}
        resp = requests.post(f"{BASE_URL}/rooms", json=room_data, headers=auth_headers(friend_token), timeout=10)
        assert resp.status_code == 200, f"POST /rooms failed: {resp.status_code} {resp.text}"
        room = resp.json()
        room_id = room["id"]
        print(f"✅ Created room: {room_id}")
    else:
        room_id = rooms[0]["id"]
        print(f"✅ Using existing room: {room_id}")
    
    # Test 3a: Upload audio file (mp3)
    print("\n📝 Test 3a: POST /api/rooms/{id}/media with audio/mpeg")
    
    # Generate a small audio file using gTTS
    audio_text = "This is a test voice note for the squad"
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
        tmp_path = tmp.name
        gTTS(audio_text, lang='en').save(tmp_path)
        print(f"   ✅ Generated audio file: {tmp_path}")
        
        with open(tmp_path, 'rb') as audio_file:
            files = {'file': ('voice_note.mp3', audio_file, 'audio/mpeg')}
            resp = requests.post(
                f"{BASE_URL}/rooms/{room_id}/media",
                files=files,
                headers=auth_headers(friend_token),
                timeout=30
            )
        
        os.unlink(tmp_path)
    
    assert resp.status_code == 200, f"POST /rooms/{room_id}/media failed: {resp.status_code} {resp.text}"
    message = resp.json()
    print(f"   ✅ Uploaded audio, got message: {message}")
    
    # Verify message structure
    assert message['type'] == 'media', f"❌ Message type should be 'media', got: {message['type']}"
    assert message['media_type'] == 'audio', f"❌ Media type should be 'audio', got: {message['media_type']}"
    assert 'media_url' in message, "❌ Message should have 'media_url' field"
    
    media_url = message['media_url']
    print(f"   ✅ Message structure correct: type=media, media_type=audio, media_url={media_url}")
    
    # Test 3b: GET the media URL (no auth required)
    print("\n📝 Test 3b: GET media URL (no auth)")
    full_media_url = BASE_URL.replace('/api', '') + media_url
    resp = requests.get(full_media_url, timeout=10)
    
    assert resp.status_code == 200, f"GET {media_url} failed: {resp.status_code}"
    assert resp.headers.get('content-type', '').startswith('audio/'), f"❌ Content-Type should be audio/*, got: {resp.headers.get('content-type')}"
    print(f"   ✅ Media URL accessible (no auth), content-type: {resp.headers.get('content-type')}")
    
    # Test 3c: Check room's last_message.preview == "🎤 Voice note"
    print("\n📝 Test 3c: GET /api/rooms - check last_message.preview")
    resp = requests.get(f"{BASE_URL}/rooms", headers=auth_headers(friend_token), timeout=10)
    assert resp.status_code == 200, f"GET /rooms failed: {resp.status_code}"
    rooms = resp.json()
    
    room = next((r for r in rooms if r['id'] == room_id), None)
    assert room is not None, f"❌ Room {room_id} not found in rooms list"
    
    last_message = room.get('last_message', {})
    preview = last_message.get('preview', '')
    
    print(f"   📋 Room last_message: {last_message}")
    assert preview == "🎤 Voice note", f"❌ last_message.preview should be '🎤 Voice note', got: '{preview}'"
    print(f"   ✅ last_message.preview == '🎤 Voice note'")
    
    # Test 3d: Upload .txt file -> 400
    print("\n📝 Test 3d: POST /api/rooms/{id}/media with .txt file")
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False, mode='w') as tmp:
        tmp_path = tmp.name
        tmp.write("This is a text file, not media")
    
    with open(tmp_path, 'rb') as txt_file:
        files = {'file': ('test.txt', txt_file, 'text/plain')}
        resp = requests.post(
            f"{BASE_URL}/rooms/{room_id}/media",
            files=files,
            headers=auth_headers(friend_token),
            timeout=10
        )
    
    os.unlink(tmp_path)
    
    assert resp.status_code == 400, f"❌ Should return 400 for .txt file, got: {resp.status_code}"
    print(f"   ✅ Returns 400 for .txt file")
    
    print("\n✅ FEATURE 3 PASSED: Audio voice notes in rooms working")

# ============================================================================
# FEATURE 4: RECEIPT EMAIL WIRING (origin_url in payment_transactions)
# ============================================================================
def test_receipt_email_wiring():
    """Test origin_url is stored in payment_transactions"""
    global smoke_token
    
    print("\n" + "="*80)
    print("FEATURE 4: RECEIPT EMAIL WIRING")
    print("="*80)
    
    # Login
    smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    print("✅ Logged in as smoke user")
    
    # Test 4a: Create booking
    print("\n📝 Test 4a: Create booking")
    booking_data = {
        "destination_id": "manali",
        "tier": "explorer",
        "travelers": 1,
        "start_date": "2026-11-10",
        "end_date": "2026-11-16"
    }
    
    resp = requests.post(
        f"{BASE_URL}/bookings",
        json=booking_data,
        headers=auth_headers(smoke_token),
        timeout=10
    )
    
    assert resp.status_code == 200, f"POST /bookings failed: {resp.status_code} {resp.text}"
    booking = resp.json()
    booking_id = booking['id']
    print(f"   ✅ Created booking: {booking_id}")
    
    # Test 4b: Create checkout session with origin_url
    print("\n📝 Test 4b: POST /api/payments/checkout with origin_url")
    checkout_data = {
        "booking_id": booking_id,
        "origin_url": "https://example.com"
    }
    
    resp = requests.post(
        f"{BASE_URL}/payments/checkout",
        json=checkout_data,
        headers=auth_headers(smoke_token),
        timeout=10
    )
    
    assert resp.status_code == 200, f"POST /payments/checkout failed: {resp.status_code} {resp.text}"
    checkout = resp.json()
    session_id = checkout['session_id']
    checkout_url = checkout['checkout_url']
    
    print(f"   ✅ Created checkout session: {session_id}")
    print(f"   ✅ Checkout URL: {checkout_url}")
    
    # Verify checkout_url is valid
    assert checkout_url.startswith('https://checkout.stripe.com'), f"❌ Invalid checkout URL: {checkout_url}"
    print(f"   ✅ Valid checkout URL")
    
    # Test 4c: GET payment status (should be pending)
    print("\n📝 Test 4c: GET /api/payments/status/{session_id}")
    resp = requests.get(
        f"{BASE_URL}/payments/status/{session_id}",
        headers=auth_headers(smoke_token),
        timeout=10
    )
    
    assert resp.status_code == 200, f"GET /payments/status/{session_id} failed: {resp.status_code} {resp.text}"
    status = resp.json()
    print(f"   ✅ Payment status: {status}")
    
    assert status['status'] in ['pending', 'initiated'], f"❌ Status should be 'pending' or 'initiated' (unpaid), got: {status['status']}"
    print(f"   ✅ Status is '{status['status']}' (expected for unpaid session)")
    
    # Test 4d: Verify origin_url in MongoDB payment_transactions
    print("\n📝 Test 4d: Verify origin_url in MongoDB payment_transactions")
    
    mongo_client = MongoClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    payment_transactions = db['payment_transactions']
    
    txn = payment_transactions.find_one({'session_id': session_id})
    
    assert txn is not None, f"❌ Payment transaction not found for session_id: {session_id}"
    print(f"   ✅ Found payment transaction in MongoDB")
    
    origin_url = txn.get('origin_url')
    assert origin_url == "https://example.com", f"❌ origin_url should be 'https://example.com', got: {origin_url}"
    print(f"   ✅ origin_url stored correctly: {origin_url}")
    
    mongo_client.close()
    
    print("\n✅ FEATURE 4 PASSED: Receipt email wiring (origin_url in payment_transactions)")

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    print("\n" + "="*80)
    print("🚀 TRAVELO BACKEND TESTS - 4 NEW FEATURES")
    print("="*80)
    
    try:
        test_hindi_voice_mode()
        test_trip_invites_list()
        test_audio_voice_notes()
        test_receipt_email_wiring()
        
        print("\n" + "="*80)
        print("✅ ALL 4 NEW FEATURES PASSED")
        print("="*80)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
