---
status: closed_deferred
phase: 28-chat-ui-redesign
source: [28-VERIFICATION.md]
started: 2026-04-27T00:30:00Z
updated: 2026-04-27T07:20:00Z
closure_reason: "Milestone completed; manual checks retained as post-milestone QA, not active blockers."
---

## Current Test

[closed at milestone completion; deferred QA plan retained]

## Tests

### 1. Pixel-for-pixel desktop visual review
expected: Desktop chat popup matches the post-v4.2 DART-refined baseline — centered max-400px shell with 24px viewport breathing room, 56px header with Instrument Serif italic 22px "Parz" + Lato 12px subtitle, monochrome surface, 999px pill chips, 44x44 send button.
result: [deferred post-milestone QA]

### 2. iOS Safari real-device test (Phase 26 inheritance)
expected: On iOS Safari, focusing the chat input still scrolls into view above the keyboard with 300ms scrollIntoView({block:'center'}); inputMode=text shows standard keyboard; enterKeyHint=send shows Send key; safe-area-inset-bottom respected on notched devices. No regression from Phase 26.
result: [deferred post-milestone QA]

### 3. Live message send/receive + error states
expected: Sending and receiving messages works exactly as v4.1 (streaming response, suggestion chips appear when thread empty or after error, loading 3-dot pulse during response, error bubble + red input border on API failure, error border clears on first keystroke).
result: [deferred post-milestone QA]

### 4. Keyboard navigation + focus management
expected: Tab cycles input → send → close. Escape closes popup. Focus returns to invoking element after close. :focus-visible rings render on Tab nav but not on mouse click.
result: [deferred post-milestone QA]

### 5. Reduce-motion OS toggle
expected: With OS-level "reduce motion" enabled, popup entry/morph is instant, message appears instantly, loading dots are static (no pulse), send pulse animation skipped. Honors prefers-reduced-motion media query.
result: [deferred post-milestone QA]

### 6. Screen reader (VoiceOver / NVDA)
expected: Popup announces as dialog with aria-label "Message Parz". Message area is role="log" with assistant messages announced via aria-live polite. Loading state announces via role=status. Errors announce via role=alert. Suggestion chips announce as group.
result: [deferred post-milestone QA]

### 7. Voice → text handoff regression (Phase 25 inheritance)
expected: Saying "switch to text chat" from /portfolio or /about still lands in a focused, mounted chat popup with the message landing in it. Phase 25's page-ready event listener still fires.
result: [deferred post-milestone QA]

### 8. Tool-call regression (Parz drives the site)
expected: Asking Parz to "open the FSB project" / "scroll to about" / "switch theme" / etc. still routes through chat-popup's tool-call dispatch (handledToolCallsRef + 6 branches preserved). FSB overlay caption fires (from Phase 27).
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

(none — all automated checks passed; only real-device + screen-reader validation remains. DART transition/animation refinements are tracked separately as CHAT-ANIM-01.)
