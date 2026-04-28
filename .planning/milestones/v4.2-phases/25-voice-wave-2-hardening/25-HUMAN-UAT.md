---
status: closed_deferred
phase: 25-voice-wave-2-hardening
source: [25-VERIFICATION.md]
started: 2026-04-26T21:03:25Z
updated: 2026-04-27T07:20:00Z
closure_reason: "Milestone completed; manual checks retained as post-milestone QA, not active blockers."
---

## Current Test

[closed at milestone completion; deferred QA plan retained]

## Tests

### 1. VOICE-05: Voice -> text chat from /portfolio and /about
expected: Chat popup opens fully every time on / from both /portfolio and /about; no empty popup, no dropped message. Test on Chrome (View Transitions API path) and Firefox (GSAP fallback path).
result: [deferred post-milestone QA]

### 2. VOICE-06: Scribe stall recovery
expected: With Scribe.connect monkey-patched so SESSION_STARTED never fires, within 5s the caption changes to "Speech service slow — switching to fallback" and Web Speech becomes the active STT path; user can speak and complete a turn.
result: [deferred post-milestone QA]

### 3. VOICE-07: Safari synth no-op recovery
expected: With SpeechSynthesisUtterance.prototype.onend patched to no-op and /api/tts forced to fail, after at most ~Math.min(30000, max(1000, text.length*50)) ms the speak() Promise resolves, voiceState returns to 'idle', queue drains, follow-up turn works.
result: [deferred post-milestone QA]

### 4. VOICE-09: Throwing tool callback
expected: With one provider tool callback replaced to throw (e.g., siteControl.openProject), FSB overlay glow shows tool-error state for that tool, Parz still finishes speaking the assistant response; voice turn does NOT abort and does NOT crash subsequent turns.
result: [deferred post-milestone QA]

### 5. VOICE-08: registerToolCallbacks deregister contract
expected: Hand-written REPL register/deregister deletes only the keys it registered; provider-owned defaults survive; no console warnings about undefined tool handlers fire after deregister.
result: [deferred post-milestone QA]

## Summary

total: 5
passed: 0
issues: 0
pending: 0
deferred: 5
skipped: 0
blocked: 0

## Gaps
