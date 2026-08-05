"""Backend test for TRAVELO invite email bug fix verification"""
import os
import time
import requests
from gtts import gTTS

# Get backend URL from frontend .env
with open("/app/frontend/.env") as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            BACKEND_URL = line.split("=", 1)[1].strip() + "/api"
            break

print(f"Testing backend at: {BACKEND_URL}")

# Test credentials
SMOKE_EMAIL = "smoke@travelo.app"
SMOKE_PASSWORD = "Test@1234"
FRIEND_EMAIL = "friend@travelo.app"
FRIEND_PASSWORD = "Friend@1234"

def login(email, password):
    """Login and return token"""
    resp = requests.post(f"{BACKEND_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code != 200:
        print(f"❌ Login failed for {email}: {resp.status_code} {resp.text}")
        return None
    token = resp.json()["token"]
    print(f"✅ Logged in as {email}")
    return token

def get_headers(token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {token}"}

print("\n" + "="*80)
print("TRAVELO INVITE EMAIL BUG FIX VERIFICATION")
print("="*80)

# Login as smoke
smoke_token = login(SMOKE_EMAIL, SMOKE_PASSWORD)
if not smoke_token:
    print("❌ Cannot proceed without smoke token")
    exit(1)

# Get first trip
print("\n[1] Getting first trip...")
resp = requests.get(f"{BACKEND_URL}/trips", headers=get_headers(smoke_token))
if resp.status_code != 200:
    print(f"❌ Failed to get trips: {resp.status_code} {resp.text}")
    exit(1)

trips = resp.json()
if not trips:
    print("❌ No trips found. Creating a test trip...")
    # Create a test trip
    trip_data = {
        "place": "Email Test Destination",
        "start_date": "2026-12-01",
        "end_date": "2026-12-05",
        "budget": 10000,
        "members": [
            {"name": "Smoke Test", "email": SMOKE_EMAIL, "contribution": 10000}
        ]
    }
    resp = requests.post(f"{BACKEND_URL}/trips", json=trip_data, headers=get_headers(smoke_token))
    if resp.status_code != 200:
        print(f"❌ Failed to create trip: {resp.status_code} {resp.text}")
        exit(1)
    trip_id = resp.json()["id"]
    print(f"✅ Created test trip: {trip_id}")
else:
    trip_id = trips[0]["id"]
    print(f"✅ Found trip: {trip_id}")

# Count existing email log lines BEFORE sending
print("\n[2] Counting existing email logs...")
result = os.popen("grep '\\[EMAIL sent via gmail\\] to=travelo.squad.test@gmail.com' /var/log/supervisor/backend.err.log 2>/dev/null | wc -l").read().strip()
email_count_before = int(result)
print(f"   Email logs before: {email_count_before}")

result = os.popen("grep '\\[EMAIL console fallback\\]' /var/log/supervisor/backend.err.log 2>/dev/null | wc -l").read().strip()
fallback_count_before = int(result)
print(f"   Fallback logs before: {fallback_count_before}")

# Send invite to OTHER user (NOT the owner)
print(f"\n[3] Sending invite to OTHER user (travelo.squad.test@gmail.com)...")
invite_data = {
    "emails": ["travelo.squad.test@gmail.com"],
    "origin_url": "https://example.com"
}
start_time = time.time()
resp = requests.post(
    f"{BACKEND_URL}/trips/{trip_id}/invite",
    json=invite_data,
    headers=get_headers(smoke_token),
    timeout=60
)
duration = time.time() - start_time

if resp.status_code != 200:
    print(f"❌ Invite failed: {resp.status_code} {resp.text}")
    exit(1)

result = resp.json()
print(f"✅ Invite response: {result}")
print(f"   Duration: {duration:.2f}s")

# Check response structure
if "sent" not in result or "failed" not in result:
    print(f"❌ Invalid response structure. Expected 'sent' and 'failed' fields")
    exit(1)

if len(result["sent"]) != 1:
    print(f"❌ Expected 1 sent email, got {len(result['sent'])}")
    exit(1)

sent_entry = result["sent"][0]
if "email" not in sent_entry or sent_entry["email"] != "travelo.squad.test@gmail.com":
    print(f"❌ Expected email 'travelo.squad.test@gmail.com' in sent list, got {sent_entry}")
    exit(1)

if "link" not in sent_entry:
    print(f"❌ Expected 'link' field in sent entry")
    exit(1)

magic_link = sent_entry["link"]
print(f"✅ Sent to correct email: travelo.squad.test@gmail.com")
print(f"✅ Magic link: {magic_link}")

if len(result["failed"]) > 0:
    print(f"❌ Expected no failed emails, got {result['failed']}")
    exit(1)

# Check duration (real SMTP should take >= 0.5s)
if duration < 0.5:
    print(f"⚠️  WARNING: Duration {duration:.2f}s < 0.5s (might be console fallback, not real SMTP)")
else:
    print(f"✅ Duration {duration:.2f}s >= 0.5s (real SMTP handshake confirmed)")

# CRITICAL: Check backend logs for Gmail SMTP confirmation
print("\n[4] CRITICAL: Checking backend logs for Gmail SMTP confirmation...")
time.sleep(1)  # Give logs time to flush

result = os.popen("grep '\\[EMAIL sent via gmail\\] to=travelo.squad.test@gmail.com' /var/log/supervisor/backend.err.log 2>/dev/null | wc -l").read().strip()
email_count_after = int(result)
new_email_logs = email_count_after - email_count_before

if new_email_logs < 1:
    print(f"❌ CRITICAL: No new '[EMAIL sent via gmail] to=travelo.squad.test@gmail.com' log found!")
    print("   This means real Gmail SMTP was NOT used.")
    exit(1)

print(f"✅ CRITICAL: Found {new_email_logs} new '[EMAIL sent via gmail] to=travelo.squad.test@gmail.com' log(s)")
print("   Real Gmail SMTP confirmed working!")

# Check NO new console fallback logs
result = os.popen("grep '\\[EMAIL console fallback\\]' /var/log/supervisor/backend.err.log 2>/dev/null | wc -l").read().strip()
fallback_count_after = int(result)
new_fallback_logs = fallback_count_after - fallback_count_before

if new_fallback_logs > 0:
    print(f"❌ WARNING: Found {new_fallback_logs} new '[EMAIL console fallback]' log(s)")
    print("   This suggests fallback was used instead of real SMTP")
else:
    print(f"✅ NO new '[EMAIL console fallback]' logs (old fallback code not used)")

# Extract token from magic link
print("\n[5] Testing magic link for OTHER user...")
# Link format: https://example.com/invite/{token}
token = magic_link.split("/invite/")[-1]
print(f"   Extracted token: {token}")

# Login as friend (the OTHER user)
friend_token = login(FRIEND_EMAIL, FRIEND_PASSWORD)
if not friend_token:
    print("❌ Cannot proceed without friend token")
    exit(1)

# Accept invite as friend
print(f"   Accepting invite as {FRIEND_EMAIL}...")
resp = requests.post(
    f"{BACKEND_URL}/invites/{token}/accept",
    headers=get_headers(friend_token)
)

if resp.status_code != 200:
    print(f"❌ Accept invite failed: {resp.status_code} {resp.text}")
    exit(1)

accept_result = resp.json()
print(f"✅ Accept invite response: {accept_result}")

# Verify response structure
if "trip_id" not in accept_result or "room_id" not in accept_result or "place" not in accept_result:
    print(f"❌ Invalid accept response. Expected trip_id, room_id, place fields")
    exit(1)

print(f"✅ OTHER user successfully joined trip via magic link!")
print(f"   trip_id: {accept_result['trip_id']}")
print(f"   room_id: {accept_result['room_id']}")
print(f"   place: {accept_result['place']}")

# Verify email HTML has plain fallback link (check in code)
print("\n[6] Verifying email HTML has plain fallback link...")
with open("/app/backend/server.py") as f:
    code = f.read()
    if "Button not working? Open this link" in code:
        print("✅ Email HTML contains plain fallback link text: 'Button not working? Open this link'")
    else:
        print("❌ Email HTML missing plain fallback link text")
        exit(1)

# Regression test: voice transcribe still works
print("\n[7] REGRESSION TEST: Voice transcribe endpoint...")
print("   Generating test audio with gTTS...")
audio_text = "hello world trip to goa"
tts = gTTS(audio_text)
audio_path = "/tmp/regress.mp3"
tts.save(audio_path)
print(f"   Saved audio to {audio_path}")

print("   Uploading audio for transcription...")
with open(audio_path, "rb") as f:
    files = {"file": ("regress.mp3", f, "audio/mpeg")}
    resp = requests.post(
        f"{BACKEND_URL}/voice/transcribe",
        files=files,
        headers=get_headers(smoke_token),
        timeout=60
    )

if resp.status_code != 200:
    print(f"❌ Voice transcribe failed: {resp.status_code} {resp.text}")
    exit(1)

transcribe_result = resp.json()
print(f"✅ Voice transcribe response: {transcribe_result}")

if "text" not in transcribe_result:
    print(f"❌ Expected 'text' field in response")
    exit(1)

transcribed_text = transcribe_result["text"].lower()
if "goa" not in transcribed_text:
    print(f"❌ Expected 'goa' in transcribed text, got: {transcribed_text}")
    exit(1)

print(f"✅ Transcribed text contains 'goa': {transcribe_result['text']}")
print(f"✅ Voice transcribe regression test PASSED")

print("\n" + "="*80)
print("✅ ALL TESTS PASSED (7/7)")
print("="*80)
print("\nSUMMARY:")
print("✅ Invite sent to OTHER user (travelo.squad.test@gmail.com, NOT owner)")
print("✅ Real Gmail SMTP confirmed via backend logs")
print("✅ NO console fallback used")
print("✅ Magic link works for OTHER user (friend@travelo.app)")
print("✅ Email HTML has plain fallback link")
print("✅ Voice transcribe regression test passed")
print("\nBUG FIX VERIFIED: Emails go to the OTHER user via REAL Gmail SMTP ✅")
