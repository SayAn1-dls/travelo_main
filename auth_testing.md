# Auth Testing Playbook (Travelo)

Credentials in /app/memory/test_credentials.md

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`; indexes exist on users.email (unique) and login_attempts.identifier.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@travelo.app","password":"Travelo@2026"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```
Login returns {user, access_token} and sets access_token + refresh_token cookies. /me works with cookies or `Authorization: Bearer <access_token>`.

# Emergent Google Auth Testing (added with Google login feature)

## Create Test Session Directly in MongoDB
```
mongosh --eval "
use('test_database');
var sessionToken = 'test_session_' + Date.now();
var user = db.users.findOne({email: 'aarav@test.com'});
db.user_sessions.insertOne({
  user_id: user._id.str ? user._id.str : user._id.toString(),
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
  created_at: new Date().toISOString()
});
print('Session token: ' + sessionToken);
"
```
Note: user_sessions.user_id stores the STRING form of users._id (ObjectId hex).

## Test Backend
```
curl -X GET "$API_URL/api/auth/me" -H "Authorization: Bearer TEST_SESSION_TOKEN"
```
Should return the user. Session tokens also work as `session_token` httpOnly cookie.

## Browser Testing
Set cookie session_token=TEST_SESSION_TOKEN (httpOnly, secure, SameSite=None) then load /dashboard — should render without redirect.

## Real flow (manual only)
Google button on /auth redirects to https://auth.emergentagent.com/?redirect={origin}/dashboard → returns with #session_id=... → frontend AuthCallback POSTs /api/auth/google/session → cookie + token set. Cannot be automated (real Google login).

## Cleanup
```
mongosh --eval "use('test_database'); db.user_sessions.deleteMany({session_token: /test_session/});"
```
