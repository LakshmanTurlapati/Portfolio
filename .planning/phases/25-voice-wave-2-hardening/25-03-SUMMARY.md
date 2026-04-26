---
phase: 25-voice-wave-2-hardening
plan: 03
subsystem: voice
tags:
  - voice
  - navigation
  - events
requirements:
  - VOICE-05
dependency_graph:
  requires:
    - 25-02 (registerToolCallbacks deregister contract; sibling plan in same phase)
  provides:
    - VoiceBus 'page-ready' centralized emission contract from transition-provider
    - Event-driven openTextChat coordination pattern (consumer side)
  affects:
    - src/providers/transition-provider.tsx (page-ready emission at three completion sites)
    - src/providers/voice-session-provider.tsx (openTextChat replaced 400ms setTimeout with event-driven listener)
tech_stack:
  added: []
  patterns:
    - one-shot VoiceBus listener with safety fallback
    - fired-flag idempotency gate (event/timer race)
    - centralized transition-completion event emission
key_files:
  created: []
  modified:
    - src/providers/transition-provider.tsx
    - src/providers/voice-session-provider.tsx
decisions:
  - openTextChat subscribes to 'page-ready' synchronously BEFORE goPage so the listener is live before any router push
  - 1500ms safety timer covers View Transitions failures and missed emits; whichever fires first calls fire() exactly once
  - transition-provider does NOT emit page-ready from the safety-timer fallback path (page may not have mounted; emitting would lie). The consumer-side 1500ms safety covers that case.
  - popstate handler is unchanged because it routes through navigateWithReveal, so the existing three emission sites cover popstate without per-handler instrumentation
metrics:
  duration: ~5 minutes
  completed: 2026-04-26T20:49:28Z
  tasks: 2
  files_changed: 2
---

# Phase 25 Plan 03: openTextChat 400ms Race -> Event-Driven page-ready (VOICE-05) Summary

One-liner: The hardcoded 400ms setTimeout that raced View Transitions API (~500ms) is replaced by an event-driven coordination pattern where transition-provider emits VoiceBus 'page-ready' from every transition completion site and openTextChat subscribes one-shot with a 1500ms safety timer, gated by a `fired` flag so the dispatch fires exactly once.

## What Was Built

Audit finding F-05 (`21-AUDIT.md` Wave 2) flagged that `src/providers/voice-session-provider.tsx:82` hardcoded a 400ms setTimeout before dispatching `parz:open-text-chat`. The View Transitions API takes ~500ms to mount the destination page, so the popup got the event before ChatPopup had subscribed and the message was lost on /portfolio -> / and /about -> / transitions.

Plan 25-03 closes that with two coordinated changes:

1. **Producer (`src/providers/transition-provider.tsx`):** an `emitPageReady()` helper inside `navigateWithReveal` derives the destination slug ('/' -> 'home', otherwise strip leading '/') and emits `window.VoiceBus.emit('page-ready', slug)` at three completion sites:
   - View Transitions success: inside `transition.finished.then(() => { ... })`, after `setIsTransitioningState(false)`.
   - GSAP fallback no-overlay early return: inside `if (!overlay) { ... }`, after `setIsTransitioningState(false)`.
   - GSAP fallback onComplete: inside the inner setTimeout, after `setIsTransitioningState(false)`.
   The safety-timer fallback (line 89) intentionally does NOT emit -- the page may not have mounted, so emitting page-ready would be a lie. The consumer-side 1500ms safety timer covers that case.
2. **Consumer (`src/providers/voice-session-provider.tsx`):** `openTextChat` now declares `fired` + `safetyTimer` + `fire()`, subscribes to `VoiceBus.on('page-ready', ...)` synchronously BEFORE `goPage('home')`, and arms a 1500ms safety setTimeout. Whichever fires first calls `fire()` -- gated by the `fired` flag, it unsubscribes the listener, clears the timer, and dispatches `parz:open-text-chat` exactly once.

The order matters: listener-then-timer-then-goPage. Because `goPage` triggers `router.push` (asynchronous to event-loop tick), the synchronous listener attachment is sufficient to be live before any transition-provider emit fires. Per-page emits already on `/portfolio` and `/about` are kept (they remain idempotent under the `fired` gate -- if the user opens text chat from `/portfolio`, the `/portfolio` emit's payload is `'portfolio'` which fails the `page === 'home'` check, the listener stays armed for the 'home' emit that follows, and `fire()` runs exactly once).

## Files Modified

| File | Lines Touched | Purpose |
|------|--------------|---------|
| `src/providers/transition-provider.tsx` | 64-73 (helper), 112, 128, 150 (emit sites) | Centralized page-ready emission from three transition completion paths |
| `src/providers/voice-session-provider.tsx` | 88-115 (replaced 91-99) | Event-driven openTextChat with 1500ms safety timer |

### Specific Locations

- **transition-provider helper:** `src/providers/transition-provider.tsx:69-73` -- `const emitPageReady = () => { ... window.VoiceBus.emit('page-ready', slug); }`
- **Emission site 1 (View Transitions success):** `src/providers/transition-provider.tsx:112` -- inside `transition.finished.then(() => { ... emitPageReady(); })`
- **Emission site 2 (no-overlay fallback):** `src/providers/transition-provider.tsx:128` -- inside `if (!overlay) { ... emitPageReady(); return; }`
- **Emission site 3 (GSAP onComplete):** `src/providers/transition-provider.tsx:150` -- inside `gsap.to(...).onComplete -> setTimeout(() => { ... emitPageReady(); }, 100)`
- **Listener attachment:** `src/providers/voice-session-provider.tsx:108` -- `window.VoiceBus.on('page-ready', (page) => { if (page === 'home') fire(); })`
- **Safety timer:** `src/providers/voice-session-provider.tsx:111` -- `safetyTimer = setTimeout(fire, 1500);`
- **Idempotent dispatch:** `src/providers/voice-session-provider.tsx:106` -- `window.dispatchEvent(new CustomEvent('parz:open-text-chat'));` (gated by `fired` flag at line 99)

## Verification Run

Automated:
- `npm run lint -- src/providers/transition-provider.tsx`: 0 errors, 0 warnings.
- `npm run lint -- src/providers/voice-session-provider.tsx`: 0 errors, 1 pre-existing warning (`_initialText` unused -- intentionally underscore-prefixed).
- `npm run build`: succeeded (12 pages built, all routes intact).

Acceptance criteria from PLAN (all PASS):

Task 1:
- [x] `const emitPageReady = () =>` -- 1 match
- [x] `VoiceBus.emit('page-ready', slug)` -- 1 match (in helper body)
- [x] `emitPageReady();` -- 3 matches (lines 112, 128, 150)
- [x] `VOICE-05:` traceability comment -- 1 match
- [x] Slug derivation `path === '/' ? 'home' : path.replace` -- 1 match
- [x] Safety-timer branch does NOT emit -- first `emitPageReady` call (line 112) is inside `transition.finished.then`, NOT inside the safetyTimer setTimeout body (line 89-92)
- [x] Popstate handler unchanged -- handlePopstate still only delegates to navigateWithReveal; no inline emission added
- [x] Lint exit 0

Task 2:
- [x] `VOICE-05: event-driven coordination` -- 1 match
- [x] `let fired = false;` -- 1 match
- [x] `window.VoiceBus.on('page-ready', (page)` -- 1 match
- [x] `safetyTimer = setTimeout(fire, 1500);` -- 1 match
- [x] Hardcoded 400ms gone (`, 400);` -- 0 matches)
- [x] Old comment "400ms delay gives View Transitions" -- 0 matches
- [x] `parz:open-text-chat` dispatch preserved -- 1 match
- [x] Listener-before-goPage order: VoiceBus.on at line 108 < goPage at line 112
- [x] Lint exit 0
- [x] Build exit 0

## Deviations from Plan

None -- plan executed exactly as written. Both task action blocks were applied verbatim. The `try { unsub(); } catch {}` pattern in `fire()` is exactly as specified in the plan's action block.

### Pre-existing environment note (out of scope)

The repo's `node_modules` was missing `@elevenlabs/elevenlabs-js` (and other transitive deps) at execution start, causing the initial `npm run build` to fail with `Module not found`. Resolved by running `npm install --legacy-peer-deps` (project requires legacy peer deps because `@ai-sdk/react@3.0.147` lists React 19.1.2 as a peer but the project pins a different React 19 build). No source-tree change; this matches the same out-of-scope note in 25-02-SUMMARY.md.

## Decisions Made

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Helper defined inside `navigateWithReveal` (closure over `path`) | Each navigation derives its own slug from the captured `path`; avoids re-deriving from pathname after router.push has already shifted state | Implemented |
| No emission from safety-timer fallback at line 89 | Page may not have mounted when safety timer fires; emitting page-ready would be a lie. Consumer-side 1500ms safety covers this. | Implemented |
| No popstate-specific emission | Popstate handler routes through navigateWithReveal, so the three existing emission sites cover popstate without separate instrumentation (RESEARCH.md Open Question 1) | Implemented |
| Listener attached synchronously BEFORE setTimeout BEFORE goPage | `router.push` is async (event-loop tick); synchronous attach guarantees listener is live before transition-provider emits page-ready | Implemented |
| 1500ms safety timer (not 400ms or 500ms) | View Transitions ~500ms + buffer for slow devices + safety margin; fast enough that user perceives "instant" if event-path fails | Implemented |
| `fired` flag at the head of `fire()` not the listener | Both event path and timer path call `fire()` directly; gating inside `fire()` makes the idempotency contract local to one function instead of duplicated at two call sites | Implemented |
| `try { unsub(); } catch {}` swallows unsubscribe errors | If VoiceBus state is inconsistent, we still want the dispatch to fire; the listener leak risk is bounded (one per openTextChat call, GC'd with the closure) | Implemented |

## Self-Check: PASSED

- [x] FOUND: src/providers/transition-provider.tsx (modified)
- [x] FOUND: src/providers/voice-session-provider.tsx (modified)
- [x] FOUND: db529a5 (commit "feat(25-03): emit page-ready from transition-provider completion sites")
- [x] FOUND: 5a13274 (commit "feat(25-03): replace openTextChat 400ms setTimeout with event-driven listener")
- [x] FOUND: .planning/phases/25-voice-wave-2-hardening/25-03-SUMMARY.md (this file)

## Commits

| Task | Hash | Message |
|------|------|---------|
| 1 | db529a5 | feat(25-03): emit page-ready from transition-provider completion sites |
| 2 | 5a13274 | feat(25-03): replace openTextChat 400ms setTimeout with event-driven listener |
