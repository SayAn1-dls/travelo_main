# TRAVELO CHANGELOG

### fix(routing) SPA
- vercel.json rewrites: all paths → /index.html
- Prevents 404 on direct URL access to /dashboard, /trips/id etc.
- Static assets still served with 1yr immutable cache
- Security headers added: X-Frame-Options, nosniff
