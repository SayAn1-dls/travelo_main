"""Backend test for TRAVELO invite email bug fix verification."""
import requests
import time
import subprocess

BASE_URL = "https://wanderlust-chaos.internal.stage-preview.emergentagent.com/api"
TEST_EMAIL = "smoke@travelo.app"
TEST_PASSWORD = "Test@1234"
OWNER_EMAIL = "sayanbhatt2005@gmail.com"  # Owner's inbox for real email test

def login():
    """Login and return auth token."""
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }, timeout=10)
    assert resp.status_code == 200, f"Login failed: {resp.status_code} {resp.text}"
    data = resp.json()
    return data["token"]

def get_backend_logs():
    """Get backend logs."""
    result = subprocess.run(
        ["tail", "-n", "100", "/var/log/supervisor/backend.err.log"],
        capture_output=True,
        text=True,
        timeout=5
    )
    return result.stdout

def count_log_pattern(logs, pattern):
    """Count occurrences of a pattern in logs."""
    return logs.count(pattern)

def test_invite_email_bug_fix():
    """Test the invite email bug fix with real SMTP verification."""
    print("\n" + "="*80)
    print("TESTING: Invite Email Bug Fix - Real Gmail SMTP Verification")
    print("="*80)
    
    token = login()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Get first trip
    print("\n[Test 1] GET /api/trips → get first trip id")
    resp = requests.get(f"{BASE_URL}/trips", headers=headers, timeout=10)
    assert resp.status_code == 200, f"Failed to get trips: {resp.status_code}"
    trips = resp.json()
    assert len(trips) > 0, "No trips found"
    trip_id = trips[0]["id"]
    print(f"✅ Got trip_id: {trip_id}")
    
    # Test 2: Count existing console fallback lines (baseline)
    print("\n[Test 2] Count existing '[EMAIL console fallback]' lines in logs (baseline)")
    logs_before = get_backend_logs()
    console_fallback_count_before = count_log_pattern(logs_before, "[EMAIL console fallback]")
    gmail_sent_count_before = count_log_pattern(logs_before, "[EMAIL sent via gmail]")
    print(f"✅ Baseline: {console_fallback_count_before} console fallback lines, {gmail_sent_count_before} gmail sent lines")
    
    # Test 3: Send invite email (CRITICAL TEST - 60s timeout for real SMTP)
    print(f"\n[Test 3] POST /api/trips/{trip_id}/invite with {OWNER_EMAIL} (60s timeout)")
    start_time = time.time()
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        headers=headers,
        json={
            "emails": [OWNER_EMAIL],
            "origin_url": "https://example.com"
        },
        timeout=60
    )
    elapsed = time.time() - start_time
    
    assert resp.status_code == 200, f"Invite failed: {resp.status_code} {resp.text}"
    data = resp.json()
    
    print(f"✅ Response received in {elapsed:.2f}s")
    print(f"   Response: {data}")
    
    # Verify response structure
    assert "sent" in data, "Response missing 'sent' field"
    assert "failed" in data, "Response missing 'failed' field"
    assert len(data["sent"]) == 1, f"Expected 1 sent email, got {len(data['sent'])}"
    assert len(data["failed"]) == 0, f"Expected 0 failed emails, got {len(data['failed'])}: {data['failed']}"
    
    sent_entry = data["sent"][0]
    assert sent_entry["email"] == OWNER_EMAIL, f"Wrong email: {sent_entry['email']}"
    assert "link" in sent_entry, "Missing 'link' in sent entry"
    assert "/invite/" in sent_entry["link"], f"Invalid link format: {sent_entry['link']}"
    
    # Extract token from link
    token_from_link = sent_entry["link"].split("/invite/")[-1]
    print(f"✅ Invite sent successfully with link: {sent_entry['link']}")
    print(f"   Token: {token_from_link}")
    
    # Verify real SMTP timing (should take >= 0.5s for real SMTP handshake)
    assert elapsed >= 0.5, f"Send took only {elapsed:.2f}s - too fast for real SMTP (expected >= 0.5s)"
    print(f"✅ Timing check passed: {elapsed:.2f}s >= 0.5s (real SMTP handshake)")
    
    # Test 4: CRITICAL LOG CHECK - verify "[EMAIL sent via gmail]" line exists
    print("\n[Test 4] CRITICAL: Check backend logs for '[EMAIL sent via gmail]' line")
    time.sleep(1)  # Give logs time to flush
    logs_after = get_backend_logs()
    
    gmail_sent_count_after = count_log_pattern(logs_after, "[EMAIL sent via gmail]")
    new_gmail_sent = gmail_sent_count_after - gmail_sent_count_before
    
    assert new_gmail_sent >= 1, f"FAILED: No new '[EMAIL sent via gmail]' line found. Before: {gmail_sent_count_before}, After: {gmail_sent_count_after}"
    print(f"✅ Found {new_gmail_sent} new '[EMAIL sent via gmail]' line(s)")
    
    # Extract the last gmail sent line
    gmail_lines = [line for line in logs_after.split("\n") if "[EMAIL sent via gmail]" in line]
    if gmail_lines:
        last_gmail_line = gmail_lines[-1]
        print(f"   Last line: {last_gmail_line}")
        assert OWNER_EMAIL in last_gmail_line, f"Email address not in log line: {last_gmail_line}"
        print(f"✅ Log line contains recipient email: {OWNER_EMAIL}")
    
    # Test 5: Verify NO NEW console fallback line was added
    print("\n[Test 5] Verify NO NEW '[EMAIL console fallback]' line was added")
    console_fallback_count_after = count_log_pattern(logs_after, "[EMAIL console fallback]")
    new_console_fallback = console_fallback_count_after - console_fallback_count_before
    
    assert new_console_fallback == 0, f"FAILED: New console fallback line detected! Before: {console_fallback_count_before}, After: {console_fallback_count_after}"
    print(f"✅ No new console fallback lines (still {console_fallback_count_after} total from old tests)")
    
    # Test 6: GET /api/trips/{trip_id}/invites → verify token field is present
    print(f"\n[Test 6] GET /api/trips/{trip_id}/invites → verify token field is present")
    resp = requests.get(f"{BASE_URL}/trips/{trip_id}/invites", headers=headers, timeout=10)
    assert resp.status_code == 200, f"Failed to get invites: {resp.status_code}"
    invites = resp.json()
    
    # Find the newest invite (should be the one we just sent)
    newest_invite = None
    for invite in invites:
        if invite["email"] == OWNER_EMAIL and invite["status"] == "pending":
            newest_invite = invite
            break
    
    assert newest_invite is not None, f"Could not find pending invite for {OWNER_EMAIL}"
    assert "token" in newest_invite, "Token field NOT present in invite (should be included per fix)"
    assert newest_invite["token"] == token_from_link, f"Token mismatch: {newest_invite['token']} != {token_from_link}"
    print(f"✅ Invite has token field: {newest_invite['token'][:20]}... (needed for copy-link fallback UI)")
    
    # Test 7: GET /api/invites/{token} (no auth) → verify invite info
    print(f"\n[Test 7] GET /api/invites/{token_from_link} (no auth) → verify invite info")
    resp = requests.get(f"{BASE_URL}/invites/{token_from_link}", timeout=10)
    assert resp.status_code == 200, f"Failed to get invite info: {resp.status_code}"
    invite_info = resp.json()
    
    assert invite_info["status"] == "pending", f"Wrong status: {invite_info['status']}"
    assert invite_info["email"] == OWNER_EMAIL, f"Wrong email: {invite_info['email']}"
    assert "trip" in invite_info, "Missing trip info"
    assert "place" in invite_info["trip"], "Missing trip place"
    print(f"✅ Invite info valid: status={invite_info['status']}, trip={invite_info['trip']['place']}")
    
    # Test 8: Regression - POST without auth → 401/403
    print(f"\n[Test 8] Regression: POST /api/trips/{trip_id}/invite without auth → 401/403")
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        json={"emails": ["test@example.com"], "origin_url": "https://example.com"},
        timeout=10
    )
    assert resp.status_code in [401, 403], f"Expected 401/403, got {resp.status_code}"
    print(f"✅ Without auth → {resp.status_code}")
    
    # Test 9: Regression - invalid email → 422
    print("\n[Test 9] Regression: POST with invalid email → 422")
    resp = requests.post(
        f"{BASE_URL}/trips/{trip_id}/invite",
        headers=headers,
        json={"emails": ["not-an-email"], "origin_url": "https://example.com"},
        timeout=10
    )
    assert resp.status_code == 422, f"Expected 422, got {resp.status_code}"
    print(f"✅ Invalid email → 422")
    
    print("\n" + "="*80)
    print("✅ ALL INVITE EMAIL BUG FIX TESTS PASSED (9/9)")
    print("="*80)
    print("\nSUMMARY:")
    print(f"  ✅ Real Gmail SMTP working (sent to {OWNER_EMAIL})")
    print(f"  ✅ '[EMAIL sent via gmail]' log line present")
    print(f"  ✅ NO new '[EMAIL console fallback]' line")
    print(f"  ✅ Invite response includes magic link")
    print(f"  ✅ GET /api/trips/{{id}}/invites includes token field (for copy-link UI)")
    print(f"  ✅ Magic link resolves to valid invite info")
    print(f"  ✅ Regression tests passed (auth required, email validation)")
    print("\nBUG FIX VERIFIED: Invite emails are now sent via real Gmail SMTP!")

if __name__ == "__main__":
    test_invite_email_bug_fix()
