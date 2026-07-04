---
name: PS4 Hall Manager
description: Expo mobile app for Arabic-language PS4 gaming hall management — key decisions and gotchas.
---

# PS4 Hall Manager

**Why:** All persistence is AsyncStorage only — no backend, no SQLite, intentionally frontend-only per first_build.md guidance.

**Pricing formula:** effectiveRate = hourlyRate + max(0, players - 2) * extraControllerRate

**ID generation:** Date.now().toString() + Math.random().toString(36).substr(2, 5) — no uuid package (crashes on iOS).

**Real-time timers:** Single setInterval(1s) in AppContext updates a `tick` state; DeviceCard and other components depend on tick in useMemo to re-render without extra intervals.

**Session expiry alerts:** Tracked with a useRef Set (alertedSessions) in AppContext — prevents repeat alerts per session across re-renders.

**Tab workflow name:** `artifacts/mobile: expo` (not "PS4 Hall Manager").

**How to apply:** When adding features, keep all data in AsyncStorage. Do not introduce a database or API server unless explicitly requested.
