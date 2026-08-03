# TRAVELO CHANGELOG

### fix(auth) offline-first
- Removed all axios/fetch calls from frontend
- All state lives in localStorage — no CORS, no 500s, no timeouts
- Works fully offline on airplane mode
- Backend API bypass permanent until DB creds are wired
