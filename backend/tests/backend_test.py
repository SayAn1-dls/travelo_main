"""Backend tests for TRAVELO code review fixes"""
import requests
import io
import time
from PIL import Image

# Base URL from frontend/.env
BASE_URL = "https://trip-invite-bug.internal.stage-preview.emergentagent.com/api"

# Test credentials
SMOKE_EMAIL = "smoke@travelo.app"
SMOKE_PASSWORD = "Smoke@1234"

def login():
    """Login and return auth token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": SMOKE_EMAIL,
        "password": SMOKE_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.status_code} {response.text}"
    data = response.json()
    return data["token"]

def test_quotes_random():
    """Test 1: GET /api/quotes/random - verify secrets.choice works"""
    print("\n=== TEST 1: GET /api/quotes/random (secrets.choice fix) ===")
    
    for i in range(3):
        response = requests.get(f"{BASE_URL}/quotes/random")
        assert response.status_code == 200, f"Call {i+1} failed: {response.status_code}"
        data = response.json()
        assert "text" in data, f"Missing 'text' field in response: {data}"
        assert "author" in data, f"Missing 'author' field in response: {data}"
        assert isinstance(data["text"], str) and len(data["text"]) > 0, "text must be non-empty string"
        assert isinstance(data["author"], str) and len(data["author"]) > 0, "author must be non-empty string"
        print(f"  ✅ Call {i+1}: {response.status_code} - {data['text'][:50]}... by {data['author']}")
    
    print("  ✅ All 3 calls returned 200 with correct structure")

def test_media_upload_regression(token):
    """Test 2: Media upload regression - image, audio, text file"""
    print("\n=== TEST 2: Media upload regression (media_kind init fix) ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create a test room first
    print("  Creating test room...")
    response = requests.post(f"{BASE_URL}/rooms", 
                            json={"name": "Lint Fix Test"},
                            headers=headers)
    assert response.status_code == 200, f"Room creation failed: {response.status_code}"
    room_id = response.json()["id"]
    print(f"  ✅ Room created: {room_id}")
    
    # Test 2a: Upload PNG image
    print("  Testing PNG image upload...")
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/media",
        files={"file": ("test.png", img_bytes, "image/png")},
        headers=headers
    )
    assert response.status_code == 200, f"PNG upload failed: {response.status_code} {response.text}"
    data = response.json()
    assert data["type"] == "media", f"Expected type='media', got {data['type']}"
    assert data["media_type"] == "image", f"Expected media_type='image', got {data['media_type']}"
    media_url_png = data["media_url"]
    print(f"  ✅ PNG upload: 200, media_type='image', url={media_url_png}")
    
    # Test 2b: Upload JPEG image
    print("  Testing JPEG image upload...")
    img_jpeg = Image.new('RGB', (100, 100), color='blue')
    img_jpeg_bytes = io.BytesIO()
    img_jpeg.save(img_jpeg_bytes, format='JPEG')
    img_jpeg_bytes.seek(0)
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/media",
        files={"file": ("test.jpg", img_jpeg_bytes, "image/jpeg")},
        headers=headers
    )
    assert response.status_code == 200, f"JPEG upload failed: {response.status_code} {response.text}"
    data = response.json()
    assert data["media_type"] == "image", f"Expected media_type='image', got {data['media_type']}"
    print(f"  ✅ JPEG upload: 200, media_type='image'")
    
    # Test 2c: Upload MP3 audio (create a small fake MP3)
    print("  Testing MP3 audio upload...")
    # Create a minimal valid MP3 header (ID3v2 + minimal frame)
    mp3_data = b'ID3\x04\x00\x00\x00\x00\x00\x00' + b'\xff\xfb\x90\x00' * 100
    mp3_bytes = io.BytesIO(mp3_data)
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/media",
        files={"file": ("test.mp3", mp3_bytes, "audio/mpeg")},
        headers=headers
    )
    assert response.status_code == 200, f"MP3 upload failed: {response.status_code} {response.text}"
    data = response.json()
    assert data["media_type"] == "audio", f"Expected media_type='audio', got {data['media_type']}"
    media_url_audio = data["media_url"]
    print(f"  ✅ MP3 upload: 200, media_type='audio', url={media_url_audio}")
    
    # Test 2d: Upload WAV audio
    print("  Testing WAV audio upload...")
    # Minimal WAV header
    wav_data = b'RIFF' + b'\x24\x00\x00\x00' + b'WAVE' + b'fmt ' + b'\x10\x00\x00\x00' + b'\x01\x00\x01\x00\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00' + b'data' + b'\x00\x00\x00\x00'
    wav_bytes = io.BytesIO(wav_data)
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/media",
        files={"file": ("test.wav", wav_bytes, "audio/wav")},
        headers=headers
    )
    assert response.status_code == 200, f"WAV upload failed: {response.status_code} {response.text}"
    data = response.json()
    assert data["media_type"] == "audio", f"Expected media_type='audio', got {data['media_type']}"
    print(f"  ✅ WAV upload: 200, media_type='audio'")
    
    # Test 2e: Upload text file (should be rejected)
    print("  Testing text file rejection...")
    txt_bytes = io.BytesIO(b"This is a text file")
    
    response = requests.post(
        f"{BASE_URL}/rooms/{room_id}/media",
        files={"file": ("test.txt", txt_bytes, "text/plain")},
        headers=headers
    )
    assert response.status_code == 400, f"Expected 400 for text file, got {response.status_code}"
    print(f"  ✅ Text file rejected: 400")
    
    # Test 2f: Verify media retrieval
    print("  Testing media retrieval...")
    # media_url already includes /api/ prefix, so use base URL without /api
    base_without_api = BASE_URL.replace('/api', '')
    response = requests.get(f"{base_without_api}{media_url_png}")
    assert response.status_code == 200, f"PNG retrieval failed: {response.status_code}"
    assert response.headers.get("content-type", "").startswith("image/"), f"Wrong content-type for PNG: {response.headers.get('content-type')}"
    print(f"  ✅ PNG retrieval: 200, content-type={response.headers.get('content-type')}")
    
    response = requests.get(f"{base_without_api}{media_url_audio}")
    assert response.status_code == 200, f"Audio retrieval failed: {response.status_code}"
    assert response.headers.get("content-type", "").startswith("audio/"), f"Wrong content-type for audio: {response.headers.get('content-type')}"
    print(f"  ✅ Audio retrieval: 200, content-type={response.headers.get('content-type')}")
    
    print("  ✅ All media upload regression tests passed")

def test_destination_guide_cached():
    """Test 3: GET /api/destinations/goa/guide - cached response"""
    print("\n=== TEST 3: GET /api/destinations/goa/guide (isinstance check) ===")
    
    start = time.time()
    response = requests.get(f"{BASE_URL}/destinations/goa/guide")
    elapsed = time.time() - start
    
    assert response.status_code == 200, f"Guide request failed: {response.status_code} {response.text}"
    data = response.json()
    
    # Verify structure
    required_fields = ["overview", "top_spots", "underrated", "getting_there", "getting_around", "food", "tips"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    assert isinstance(data["overview"], str) and len(data["overview"]) > 100, "overview must be 100+ chars"
    assert isinstance(data["top_spots"], list) and len(data["top_spots"]) > 0, "top_spots must be non-empty list"
    assert isinstance(data["underrated"], list), "underrated must be a list"
    assert isinstance(data["food"], list), "food must be a list"
    assert isinstance(data["tips"], list), "tips must be a list"
    
    print(f"  ✅ Response: 200, elapsed={elapsed:.2f}s (cached: {elapsed < 3})")
    print(f"  ✅ Structure valid: overview={len(data['overview'])} chars, top_spots={len(data['top_spots'])}, underrated={len(data['underrated'])}")
    print(f"  ✅ isinstance(data, dict) check working (no TypeError)")

def test_quick_regressions(token):
    """Test 4: Quick regression tests"""
    print("\n=== TEST 4: Quick regression tests ===")
    
    # Test 4a: Contact with invalid email
    print("  Testing POST /api/contact with invalid email...")
    response = requests.post(f"{BASE_URL}/contact", json={
        "name": "Test User",
        "email": "notanemail",
        "message": "This should fail validation"
    })
    assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
    print(f"  ✅ Invalid email rejected: 422")
    
    # Test 4b: Root endpoint (operational check)
    print("  Testing GET /api/ (operational check)...")
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200, f"Root endpoint failed: {response.status_code}"
    data = response.json()
    assert "service" in data, "Root endpoint should return service info"
    print(f"  ✅ Root endpoint: 200, service={data.get('service')}")
    
    # Test 4c: Login with smoke credentials
    print("  Testing POST /api/auth/login with smoke credentials...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": SMOKE_EMAIL,
        "password": SMOKE_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.status_code}"
    data = response.json()
    assert "token" in data, "Login should return token"
    assert "user" in data, "Login should return user"
    print(f"  ✅ Login successful: 200, token present, user={data['user'].get('email')}")
    
    print("  ✅ All quick regression tests passed")

def main():
    print("=" * 70)
    print("TRAVELO CODE REVIEW FIXES - BACKEND TESTING")
    print("=" * 70)
    print(f"Base URL: {BASE_URL}")
    print(f"Test User: {SMOKE_EMAIL}")
    
    try:
        # Login first
        print("\n=== AUTHENTICATION ===")
        token = login()
        print(f"✅ Logged in successfully")
        
        # Run all tests
        test_quotes_random()
        test_media_upload_regression(token)
        test_destination_guide_cached()
        test_quick_regressions(token)
        
        print("\n" + "=" * 70)
        print("✅ ALL TESTS PASSED")
        print("=" * 70)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        raise
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        raise

if __name__ == "__main__":
    main()
