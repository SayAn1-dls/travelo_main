# TRAVELO CHANGELOG

### refactor(persistence)
- lib/persistence.js: getItem/setItem/removeItem wrappers
- Safe JSON.parse with try/catch fallback
- Consistent key namespace: travelo_*_v3
- Used across all pages for consistent storage access
