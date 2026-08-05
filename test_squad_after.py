"""Test Squad Chat 'after' parameter"""
import requests
import time

BASE_URL = "https://wanderlust-chaos.internal.stage-preview.emergentagent.com/api"

# Login
resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "smoke@travelo.app",
    "password": "Test@1234"
}, timeout=10)
smoke_token = resp.json().get("token")

resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "friend@travelo.app",
    "password": "Friend@1234"
}, timeout=10)
friend_token = resp.json().get("token")

# Create room
resp = requests.post(f"{BASE_URL}/rooms", 
                   json={"name": "After Test Room"},
                   headers={"Authorization": f"Bearer {smoke_token}"},
                   timeout=10)
room = resp.json()
room_id = room.get("id")
print(f"Created room: {room_id}")

# Friend joins
resp = requests.post(f"{BASE_URL}/rooms/join",
                   json={"code": room.get("invite_code")},
                   headers={"Authorization": f"Bearer {friend_token}"},
                   timeout=10)
print(f"Friend joined")

# Get all messages
resp = requests.get(f"{BASE_URL}/rooms/{room_id}/messages",
                  headers={"Authorization": f"Bearer {smoke_token}"},
                  timeout=10)
messages = resp.json()
print(f"\nAll messages ({len(messages)}):")
for msg in messages:
    print(f"  - {msg.get('type')}: {msg.get('text')[:50] if msg.get('text') else 'N/A'} | created_at: {msg.get('created_at')}")

# Send first message
time.sleep(0.5)
resp = requests.post(f"{BASE_URL}/rooms/{room_id}/messages",
                   json={"text": "first message"},
                   headers={"Authorization": f"Bearer {smoke_token}"},
                   timeout=10)
first_msg = resp.json()
first_created_at = first_msg.get("created_at")
print(f"\nFirst message created_at: {first_created_at}")

# Send second message
time.sleep(0.5)
resp = requests.post(f"{BASE_URL}/rooms/{room_id}/messages",
                   json={"text": "second message"},
                   headers={"Authorization": f"Bearer {friend_token}"},
                   timeout=10)
second_msg = resp.json()
second_created_at = second_msg.get("created_at")
print(f"Second message created_at: {second_created_at}")

# Get messages after first
resp = requests.get(f"{BASE_URL}/rooms/{room_id}/messages?after={first_created_at}",
                  headers={"Authorization": f"Bearer {smoke_token}"},
                  timeout=10)
after_messages = resp.json()
print(f"\nMessages after {first_created_at} ({len(after_messages)}):")
for msg in after_messages:
    print(f"  - {msg.get('type')}: {msg.get('text')[:50] if msg.get('text') else 'N/A'} | created_at: {msg.get('created_at')}")
    print(f"    Is after? {msg.get('created_at') > first_created_at}")
