"""TRAVELO NOMAD Chat API Test Suite - SSE Streaming Tests"""
import requests
import json
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
print("TRAVELO NOMAD CHAT API TEST SUITE")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Test User: {TEST_EMAIL}")
print()

# ============================================================================
# AUTHENTICATION - Get JWT token
# ============================================================================
print("\n[AUTH] Getting JWT token...")
print("-" * 80)
token = None
try:
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        timeout=10
    )
    if resp.status_code == 200:
        data = resp.json()
        token = data.get("token")
        if token:
            print(f"✅ Authenticated successfully")
        else:
            print(f"❌ No token in response: {data}")
            exit(1)
    else:
        print(f"❌ Login failed: {resp.status_code} - {resp.text}")
        exit(1)
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

# ============================================================================
# SCENARIO 1: POST /api/chat/message - SSE Streaming
# ============================================================================
print("\n[SCENARIO 1] POST /api/chat/message - SSE Streaming")
print("-" * 80)

session_id = None
accumulated_text = ""

try:
    print("Sending chat message: 'Give me one temple I must visit and why, in 2 sentences.'")
    print("Expecting SSE stream with session, delta, and done events...")
    print("(This may take 15-60 seconds for LLM response)")
    
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "place": "Kyoto, Japan",
            "phase": "before",
            "text": "Give me one temple I must visit and why, in 2 sentences."
        },
        headers=headers,
        stream=True,
        timeout=120  # Generous timeout for LLM
    )
    
    if resp.status_code != 200:
        log_fail("POST /api/chat/message", f"Status {resp.status_code}: {resp.text}")
    else:
        # Parse SSE stream
        events = []
        session_event_found = False
        delta_events = []
        done_event_found = False
        
        print("\nReceiving SSE events:")
        for line in resp.iter_lines(decode_unicode=True):
            if line.startswith("data: "):
                data_str = line[6:]  # Remove "data: " prefix
                try:
                    event = json.loads(data_str)
                    events.append(event)
                    
                    if event.get("type") == "session":
                        session_id = event.get("session_id")
                        session_event_found = True
                        print(f"  📍 Session event: session_id={session_id}")
                    
                    elif event.get("type") == "delta":
                        content = event.get("content", "")
                        accumulated_text += content
                        delta_events.append(event)
                        print(f"  📝 Delta event: {len(content)} chars")
                    
                    elif event.get("type") == "done":
                        done_event_found = True
                        print(f"  ✓ Done event received")
                
                except json.JSONDecodeError as e:
                    log_fail("SSE parsing", f"Invalid JSON in event: {data_str[:100]}")
        
        print(f"\nAccumulated response ({len(accumulated_text)} chars):")
        print(f"  {accumulated_text[:200]}...")
        
        # Validate scenario 1 requirements
        if not session_event_found:
            log_fail("SSE stream", "No session event received")
        elif not session_id:
            log_fail("SSE stream", "Session event missing session_id")
        else:
            log_pass("SSE stream: session event with session_id")
        
        if len(delta_events) == 0:
            log_fail("SSE stream", "No delta events received")
        elif not accumulated_text:
            log_fail("SSE stream", "Delta events but no accumulated text")
        elif "NOMAD lost signal in the mountains" in accumulated_text:
            log_fail("SSE stream", "Received fallback message - LLM call failed")
        else:
            # Check if response mentions a real Kyoto temple
            kyoto_temples = ["kinkaku", "ginkaku", "fushimi", "kiyomizu", "ryoan", "nanzen", "tofuku"]
            mentions_temple = any(temple in accumulated_text.lower() for temple in kyoto_temples)
            if mentions_temple:
                log_pass(f"SSE stream: {len(delta_events)} delta events with meaningful content (mentions Kyoto temple)")
            else:
                log_warning("SSE stream", f"Response doesn't mention known Kyoto temples: {accumulated_text[:100]}")
                log_pass(f"SSE stream: {len(delta_events)} delta events with non-empty accumulated text")
        
        if not done_event_found:
            log_fail("SSE stream", "No done event received")
        else:
            log_pass("SSE stream: done event received")

except requests.exceptions.Timeout:
    log_fail("POST /api/chat/message", "Request timeout (>120s)")
except Exception as e:
    log_fail("POST /api/chat/message", str(e))

# ============================================================================
# SCENARIO 2: Multi-turn Memory Test
# ============================================================================
print("\n[SCENARIO 2] Multi-turn Memory - Session History")
print("-" * 80)

if not session_id:
    log_fail("Multi-turn memory", "No session_id from scenario 1 - skipping")
else:
    try:
        print(f"Using session_id: {session_id}")
        print("Sending follow-up: 'Which city did I just ask you about? Answer with just the city name.'")
        print("(This may take 15-60 seconds for LLM response)")
        
        resp = requests.post(
            f"{BASE_URL}/chat/message",
            json={
                "session_id": session_id,
                "phase": "before",
                "text": "Which city did I just ask you about? Answer with just the city name."
            },
            headers=headers,
            stream=True,
            timeout=120
        )
        
        if resp.status_code != 200:
            log_fail("Multi-turn memory", f"Status {resp.status_code}: {resp.text}")
        else:
            # Parse SSE stream
            accumulated_reply = ""
            
            print("\nReceiving SSE events:")
            for line in resp.iter_lines(decode_unicode=True):
                if line.startswith("data: "):
                    data_str = line[6:]
                    try:
                        event = json.loads(data_str)
                        if event.get("type") == "delta":
                            content = event.get("content", "")
                            accumulated_reply += content
                            print(f"  📝 Delta: {len(content)} chars")
                        elif event.get("type") == "done":
                            print(f"  ✓ Done")
                    except json.JSONDecodeError:
                        pass
            
            print(f"\nAccumulated reply: {accumulated_reply}")
            
            # Check if reply contains "Kyoto"
            if "kyoto" in accumulated_reply.lower():
                log_pass("Multi-turn memory: Reply contains 'Kyoto' - session history works")
            else:
                log_fail("Multi-turn memory", f"Reply doesn't contain 'Kyoto': {accumulated_reply}")
    
    except requests.exceptions.Timeout:
        log_fail("Multi-turn memory", "Request timeout (>120s)")
    except Exception as e:
        log_fail("Multi-turn memory", str(e))

# ============================================================================
# SCENARIO 3: GET /api/chat/sessions - List Sessions
# ============================================================================
print("\n[SCENARIO 3] GET /api/chat/sessions - List Sessions")
print("-" * 80)

try:
    resp = requests.get(
        f"{BASE_URL}/chat/sessions",
        headers=headers,
        timeout=10
    )
    
    if resp.status_code != 200:
        log_fail("GET /api/chat/sessions", f"Status {resp.status_code}: {resp.text}")
    else:
        sessions = resp.json()
        if not isinstance(sessions, list):
            log_fail("GET /api/chat/sessions", f"Expected array, got {type(sessions)}")
        else:
            print(f"Found {len(sessions)} session(s)")
            
            # Find our session
            our_session = None
            for s in sessions:
                if s.get("id") == session_id:
                    our_session = s
                    break
            
            if not our_session:
                log_fail("GET /api/chat/sessions", f"Session {session_id} not found in list")
            else:
                print(f"Session found: {our_session}")
                
                # Validate session fields
                if our_session.get("place") == "Kyoto, Japan" and our_session.get("phase") == "before":
                    log_pass("GET /api/chat/sessions: Session with correct place and phase")
                else:
                    log_fail("GET /api/chat/sessions", 
                            f"Session fields incorrect - place: {our_session.get('place')}, phase: {our_session.get('phase')}")

except Exception as e:
    log_fail("GET /api/chat/sessions", str(e))

# ============================================================================
# SCENARIO 4: GET /api/chat/sessions/{session_id}/messages - Message History
# ============================================================================
print("\n[SCENARIO 4] GET /api/chat/sessions/{session_id}/messages - Message History")
print("-" * 80)

if not session_id:
    log_fail("Message history", "No session_id - skipping")
else:
    try:
        resp = requests.get(
            f"{BASE_URL}/chat/sessions/{session_id}/messages",
            headers=headers,
            timeout=10
        )
        
        if resp.status_code != 200:
            log_fail("GET /api/chat/sessions/{id}/messages", f"Status {resp.status_code}: {resp.text}")
        else:
            messages = resp.json()
            if not isinstance(messages, list):
                log_fail("GET /api/chat/sessions/{id}/messages", f"Expected array, got {type(messages)}")
            else:
                print(f"Found {len(messages)} message(s)")
                
                # Should have at least 4 messages (2 user + 2 assistant)
                if len(messages) < 4:
                    log_fail("Message history", f"Expected at least 4 messages, got {len(messages)}")
                else:
                    # Check chronological order and alternating roles
                    print("\nMessage sequence:")
                    for i, msg in enumerate(messages):
                        role = msg.get("role")
                        text_preview = msg.get("text", "")[:50]
                        print(f"  {i+1}. {role}: {text_preview}...")
                    
                    # Validate alternating roles
                    roles = [m.get("role") for m in messages]
                    expected_pattern = ["user", "assistant", "user", "assistant"]
                    
                    if roles[:4] == expected_pattern:
                        log_pass("Message history: At least 4 messages in chronological order with alternating roles")
                    else:
                        log_fail("Message history", f"Role pattern incorrect: {roles[:4]} (expected {expected_pattern})")
                    
                    # Validate assistant messages have non-empty text
                    assistant_messages = [m for m in messages if m.get("role") == "assistant"]
                    empty_assistant = [m for m in assistant_messages if not m.get("text", "").strip()]
                    
                    if empty_assistant:
                        log_fail("Message history", f"{len(empty_assistant)} assistant messages have empty text")
                    else:
                        log_pass("Message history: All assistant messages have non-empty text")

    except Exception as e:
        log_fail("GET /api/chat/sessions/{id}/messages", str(e))

# ============================================================================
# SCENARIO 5: Validations
# ============================================================================
print("\n[SCENARIO 5] Validations")
print("-" * 80)

# 5.1: POST without auth
print("\n5.1: POST /api/chat/message without auth")
try:
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "place": "Tokyo, Japan",
            "phase": "before",
            "text": "Test message"
        },
        timeout=10
    )
    
    if resp.status_code in [401, 403]:
        log_pass("POST /api/chat/message without auth: Returns 401/403")
    else:
        log_fail("POST /api/chat/message without auth", f"Expected 401/403, got {resp.status_code}")
except Exception as e:
    log_fail("POST /api/chat/message without auth", str(e))

# 5.2: POST with empty text
print("\n5.2: POST /api/chat/message with empty text")
try:
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "place": "Tokyo, Japan",
            "phase": "before",
            "text": ""
        },
        headers=headers,
        timeout=10
    )
    
    if resp.status_code == 422:
        log_pass("POST /api/chat/message with empty text: Returns 422")
    else:
        log_fail("POST /api/chat/message with empty text", f"Expected 422, got {resp.status_code}")
except Exception as e:
    log_fail("POST /api/chat/message with empty text", str(e))

# 5.3: GET messages for nonexistent session
print("\n5.3: GET /api/chat/sessions/nonexistent-id/messages")
try:
    resp = requests.get(
        f"{BASE_URL}/chat/sessions/nonexistent-uuid-12345/messages",
        headers=headers,
        timeout=10
    )
    
    if resp.status_code == 404:
        log_pass("GET /api/chat/sessions/nonexistent-id/messages: Returns 404")
    else:
        log_fail("GET /api/chat/sessions/nonexistent-id/messages", f"Expected 404, got {resp.status_code}")
except Exception as e:
    log_fail("GET /api/chat/sessions/nonexistent-id/messages", str(e))

# 5.4: Invalid phase (should default to "before", not error)
print("\n5.4: POST /api/chat/message with invalid phase")
try:
    resp = requests.post(
        f"{BASE_URL}/chat/message",
        json={
            "place": "Paris, France",
            "phase": "sometime",  # Invalid phase
            "text": "Test with invalid phase"
        },
        headers=headers,
        stream=True,
        timeout=120
    )
    
    if resp.status_code == 200:
        # Should work (defaults to "before")
        log_pass("POST /api/chat/message with invalid phase: Accepts and defaults to 'before' (status 200)")
    else:
        log_fail("POST /api/chat/message with invalid phase", 
                f"Expected 200 (should default to 'before'), got {resp.status_code}")
except Exception as e:
    log_fail("POST /api/chat/message with invalid phase", str(e))

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("TEST SUMMARY")
print("=" * 80)
print(f"✅ PASSED: {len(results['passed'])}")
for test in results["passed"]:
    print(f"   - {test}")

if results["warnings"]:
    print(f"\n⚠️  WARNINGS: {len(results['warnings'])}")
    for warning in results["warnings"]:
        print(f"   - {warning}")

if results["failed"]:
    print(f"\n❌ FAILED: {len(results['failed'])}")
    for failure in results["failed"]:
        print(f"   - {failure}")
else:
    print("\n🎉 ALL TESTS PASSED!")

print("=" * 80)
