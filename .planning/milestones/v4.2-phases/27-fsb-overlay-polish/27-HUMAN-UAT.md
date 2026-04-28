---
status: closed_deferred
phase: 27-fsb-overlay-polish
source: [27-VERIFICATION.md]
started: 2026-04-26T22:00:00Z
updated: 2026-04-27T07:20:00Z
closure_reason: "Milestone completed; manual checks retained as post-milestone QA, not active blockers."
---

## Current Test

[closed at milestone completion; deferred QA plan retained]

## Tests

### 1. FSB-04 caption fires for all 7 tools (incl. navigate after gap fix)
expected: Trigger each tool via Parz voice (or text equivalent) and observe the FSB overlay caption changing to the per-tool template. Tools to test: openProject ("Opening {projectName}…"), scrollTo ("Scrolling…"), closeBrowser ("Closing browser…"), toggleTheme ("Switching theme…"), openLink ("Opening link…"), openCurrentProjectExternal ("Opening externally…"), navigate ("Navigating to {page}…" — fixed in commit `6875df5`).
result: [deferred post-milestone QA]

### 2. Caption hold timing
expected: Caption stays visible for 1500ms after tool-success, then fades to "POWERED BY FSB". On tool-error, caption stays for 3000ms with the existing tool-error glow.
result: [deferred post-milestone QA]

### 3. Mobile overlay treatment (FSB-05)
expected: On mobile (<768px), the desktop scan grid is hidden; only the badge is visible. Badge has 44px hit-area minimum (WCAG 2.5.5), 11px font, 220px+ width to prevent caption layout shift. Pointer-events-none preserved (badge does not block underlying tap targets).
result: [deferred post-milestone QA]

### 4. Desktop pixel-identical regression check
expected: On desktop (>=1024px), the FSB overlay looks identical to Phase 19/23 baseline at idle. Monochrome styling intact, "powered by FSB" badge copy unchanged, scan grid still renders, pointer-safety preserved.
result: [deferred post-milestone QA]

### 5. Cross-fade visual timing
expected: When transitioning between captions during a multi-tool turn, the cross-fade feels smooth (~150-250ms ease-in-out). Captions should not jump abruptly.
result: [deferred post-milestone QA]

### 6. prefers-reduced-motion
expected: With OS-level "reduce motion" enabled, captions swap instantly without fade animations.
result: [deferred post-milestone QA]

### 7. Screen reader mirror
expected: Screen reader announces "Parz is {caption}." for each tool action via the sr-only span.
result: [deferred post-milestone QA]

### 8. Pixel diff vs Phase 23 baseline (commit e2a1383)
expected: Visual regression comparison against Phase 23 desktop snapshot shows no unintended changes — only the additive `min-width: 220px`, `text-align: center`, `box-sizing: border-box` on `.fsb-control-badge` should differ.
result: [deferred post-milestone QA]

## Summary

total: 8
passed: 0
issues: 0
pending: 0
deferred: 8
skipped: 0
blocked: 0

## Gaps

### FSB-04 navigate caption — RESOLVED
The verification report flagged that `handleUserTurn` bypassed `dispatchToolCall`
for the navigate case (called `goPage()` directly), so the navigate caption
never fired. Fixed in commit `6875df5` by routing navigate through
`dispatchToolCall('navigate', tc.args)`. Type-check passes.
status: resolved
resolved_in: 6875df5
