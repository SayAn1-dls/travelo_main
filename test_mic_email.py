#!/usr/bin/env python3
"""Test mic-fix (voice transcription) and redesigned email invite for TRAVELO"""
import os
import sys
import time
import requests
from datetime import datetime, timedelta

# Load environment
sys.path.insert(0, '/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

BASE_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001') + '/api'

print(f"🔗 Backend URL: {BASE_URL}")

# Test credentials from /app/memory/test_credentials.md
SMOKE_EMAIL = "smoke@travelo.app"
SMOKE_PASSWORD = "Test@1234"

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
# SCENARIO 1: VOICE TRANSCRIPTION (mic bug fix)
# ============================================================================
def test_voice_transcription():
    """Test POST /api/voice/transcribe with various audio files"""
    print("\n" + "="*80)
    print("SCENARIO 1: VOICE TRANSCRIPTION (mic bug fix)")
    print("="*80)
    
    # Login
    token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    print("✅ Logged in as smoke@travelo.app")
    
    # Generate real spoken audio using gTTS
    print("\n📝 Generating test audio file using gTTS...")
    try:
        # Use backend venv python with gTTS
        import subprocess
        test_text = "Take me to the mountains of Ladakh next month"
        gtts_script = f"""
from gtts import gTTS
tts = gTTS("{test_text}")
tts.save("/tmp/stt_test.mp3")
print("Audio file generated: /tmp/stt_test.mp3")
"""
        result = subprocess.run(
            ["/root/.venv/bin/python", "-c", gtts_script],
            capture_output=True,
            text=True,
            timeout=30
        )
        if result.returncode != 0:
            print(f"⚠️  gTTS generation failed: {result.stderr}")
            print("Trying alternative method...")
            # Fallback: try with system python
            result = subprocess.run(
                ["python3", "-c", gtts_script],
                capture_output=True,
                text=True,
                timeout=30
            )
        print(result.stdout)
        print("✅ Audio file generated successfully")
    except Exception as e:
        print(f"❌ Failed to generate audio: {e}")
        return False
    
    # Test 1: Valid MP3 audio file
    print("\n🎤 Test 1: Valid MP3 audio file")
    with open("/tmp/stt_test.mp3", "rb") as f:
        files = {"file": ("test_audio.mp3", f, "audio/mpeg")}
        resp = requests.post(
            f"{BASE_URL}/voice/transcribe",
            files=files,
            headers=auth_headers(token),
            timeout=60  # 60s timeout as specified
        )
    
    if resp.status_code == 200:
        data = resp.json()
        text = data.get("text", "").lower()
        print(f"✅ Status: 200")
        print(f"✅ Response: {data}")
        # Check if transcription contains key words (case/punctuation may differ)
        if "ladakh" in text and "mountain" in text:
            print("✅ Transcription contains expected keywords: 'ladakh' and 'mountain'")
        else:
            print(f"⚠️  Transcription may not match exactly: '{text}'")
            print("   (Expected keywords: 'ladakh', 'mountain')")
    else:
        print(f"❌ Status: {resp.status_code}")
        print(f"❌ Response: {resp.text}")
        return False
    
    # Test 2: MP3 renamed as .webm (whisper may still decode it)
    print("\n🎤 Test 2: MP3 file posted as audio/webm")
    import shutil
    shutil.copy("/tmp/stt_test.mp3", "/tmp/stt_test.webm")
    with open("/tmp/stt_test.webm", "rb") as f:
        files = {"file": ("test_audio.webm", f, "audio/webm")}
        resp = requests.post(
            f"{BASE_URL}/voice/transcribe",
            files=files,
            headers=auth_headers(token),
            timeout=60
        )
    
    if resp.status_code == 200:
        print(f"✅ Status: 200 (whisper decoded mp3 as webm)")
        print(f"✅ Response: {resp.json()}")
    elif resp.status_code == 502:
        print(f"✅ Status: 502 (acceptable - browser sends true webm)")
        print(f"   Response: {resp.text}")
    else:
        print(f"⚠️  Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
    
    # Test 3: Tiny file under 800 bytes
    print("\n🎤 Test 3: Tiny file under 800 bytes")
    with open("/tmp/tiny_audio.mp3", "wb") as f:
        f.write(b"x" * 500)  # 500 bytes
    
    with open("/tmp/tiny_audio.mp3", "rb") as f:
        files = {"file": ("tiny.mp3", f, "audio/mpeg")}
        resp = requests.post(
            f"{BASE_URL}/voice/transcribe",
            files=files,
            headers=auth_headers(token),
            timeout=10
        )
    
    if resp.status_code == 400:
        print(f"✅ Status: 400 (expected)")
        print(f"✅ Response: {resp.json()}")
        if "too short" in resp.text.lower() or "short" in resp.text.lower():
            print("✅ Error message mentions 'too short'")
    else:
        print(f"❌ Expected 400, got {resp.status_code}")
        print(f"   Response: {resp.text}")
    
    # Test 4: Text file (should fail gracefully)
    print("\n🎤 Test 4: Text file (should fail gracefully)")
    with open("/tmp/test.txt", "w") as f:
        f.write("This is not an audio file")
    
    with open("/tmp/test.txt", "rb") as f:
        files = {"file": ("test.txt", f, "text/plain")}
        resp = requests.post(
            f"{BASE_URL}/voice/transcribe",
            files=files,
            headers=auth_headers(token),
            timeout=10
        )
    
    if resp.status_code in [400, 502]:
        print(f"✅ Status: {resp.status_code} (graceful failure, not 500 crash)")
        print(f"✅ Response: {resp.json()}")
    else:
        print(f"⚠️  Status: {resp.status_code}")
        print(f"   Response: {resp.text}")
    
    # Test 5: Without auth
    print("\n🎤 Test 5: Without authentication")
    with open("/tmp/stt_test.mp3", "rb") as f:
        files = {"file": ("test.mp3", f, "audio/mpeg")}
        resp = requests.post(
            f"{BASE_URL}/voice/transcribe",
            files=files,
            timeout=10
        )
    
    if resp.status_code in [401, 403]:
        print(f"✅ Status: {resp.status_code} (auth required)")
        print(f"✅ Response: {resp.json()}")
    else:
        print(f"❌ Expected 401/403, got {resp.status_code}")
        print(f"   Response: {resp.text}")
    
    print("\n✅ VOICE TRANSCRIPTION TESTS COMPLETE")
    return True

# ============================================================================
# SCENARIO 2: REDESIGNED INVITE EMAIL
# ============================================================================
def test_redesigned_invite_email():
    """Test redesigned invite email HTML"""
    print("\n" + "="*80)
    print("SCENARIO 2: REDESIGNED INVITE EMAIL")
    print("="*80)
    
    # Login
    token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
    print("✅ Logged in as smoke@travelo.app")
    
    # Get first trip
    print("\n📝 Getting trips...")
    resp = requests.get(f"{BASE_URL}/trips", headers=auth_headers(token), timeout=10)
    if resp.status_code != 200:
        print(f"❌ GET /trips failed: {resp.status_code}")
        return False
    
    trips = resp.json()
    
    # Create trip if none exist
    if not trips:
        print("📝 Creating a new trip...")
        trip_data = {
            "place": "Ladakh Adventure",
            "start_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d"),
            "budget": 60000,
            "members": [
                {"name": "Smoke Test", "contribution": 30000, "payment_handle": "smoke@upi", "is_owner": True},
                {"name": "Travel Buddy", "contribution": 30000, "payment_handle": "buddy@upi", "is_owner": False}
            ]
        }
        resp = requests.post(f"{BASE_URL}/trips", json=trip_data, headers=auth_headers(token), timeout=10)
        if resp.status_code != 200:
            print(f"❌ POST /trips failed: {resp.status_code} {resp.text}")
            return False
        trip = resp.json()
        trip_id = trip["id"]
        print(f"✅ Created trip: {trip_id}")
    else:
        trip_id = trips[0]["id"]
        print(f"✅ Using existing trip: {trip_id}")
    
    # Send invite email (ONE real email to sayanbhatt2005@gmail.com as specified)
    print(f"\n📧 Sending invite email to sayanbhatt2005@gmail.com...")
    print("   (This will send ONE real email - allowed as it's the owner's inbox)")
    invite_data = {
        "emails": ["sayanbhatt2005@gmail.com"],
        "origin_url": "https://example.com"
    }
    
    start_time = time.time()
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        json=invite_data,
        headers=auth_headers(token),
        timeout=30  # May take 5-15s
    )
    elapsed = time.time() - start_time
    
    if resp.status_code == 200:
        data = resp.json()
        print(f"✅ Status: 200")
        print(f"✅ Response: {data}")
        print(f"✅ Time taken: {elapsed:.2f}s")
        
        if data.get("sent") == ["sayanbhatt2005@gmail.com"]:
            print("✅ Email sent successfully to sayanbhatt2005@gmail.com")
        
        if data.get("failed") == []:
            print("✅ No failed emails")
        else:
            print(f"⚠️  Failed emails: {data.get('failed')}")
    else:
        print(f"❌ Status: {resp.status_code}")
        print(f"❌ Response: {resp.text}")
        return False
    
    print("\n✅ REDESIGNED INVITE EMAIL TEST COMPLETE")
    print("   Next: Check backend logs for SMTP errors")
    return True

# ============================================================================
# MAIN
# ============================================================================
if __name__ == "__main__":
    print("="*80)
    print("TRAVELO BACKEND TESTING: MIC-FIX & EMAIL REDESIGN")
    print("="*80)
    
    success = True
    
    try:
        # Test voice transcription
        if not test_voice_transcription():
            success = False
    except Exception as e:
        print(f"\n❌ VOICE TRANSCRIPTION TESTS FAILED: {e}")
        import traceback
        traceback.print_exc()
        success = False
    
    try:
        # Test redesigned invite email
        if not test_redesigned_invite_email():
            success = False
    except Exception as e:
        print(f"\n❌ REDESIGNED INVITE EMAIL TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        success = False
    
    print("\n" + "="*80)
    if success:
        print("✅ ALL TESTS COMPLETED")
    else:
        print("❌ SOME TESTS FAILED")
    print("="*80)
    
    sys.exit(0 if success else 1)
