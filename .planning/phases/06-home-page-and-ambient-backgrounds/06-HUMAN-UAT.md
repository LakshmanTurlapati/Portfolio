---
status: partial
phase: 06-home-page-and-ambient-backgrounds
source: [06-VERIFICATION.md]
started: 2026-04-24T01:45:00Z
updated: 2026-04-24T01:45:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Particle mesh visual rendering
expected: Connected-node mesh renders on home page, grab/push mouse interactivity works, theme toggle reinitializes without canvas accumulation
result: [pending]

### 2. GitHub Stats pill live data
expected: Values update from fallback when network is available; hover expand animation works showing detail panel
result: [pending]

### 3. ChatPopup desktop flow
expected: Clicking Ask Parz opens popup with popupIn animation, greeting message shown, suggestion chips visible, streaming responses work, clicking backdrop or X closes popup
result: [pending]

### 4. ChatPopup mobile flow
expected: Mobile navbar shows Ask Parz button, clicking opens ChatPopup, popup opens and closes correctly on mobile viewport
result: [pending]

### 5. No canvas accumulation on theme toggle
expected: DevTools DOM inspection after toggling theme shows only one canvas element inside particle container (no stacked canvases)
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
