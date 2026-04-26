---
phase: 25-voice-wave-2-hardening
plan: 04
subsystem: voice-controller
tags: [voice, timeout, fallback, scribe, stt, guard-timer]
requires:
  - phase: 25-01
    provides: "runTool helper inside useVoiceController so a throwing fallback no longer aborts the turn before the new caption can render"
provides:
  - "sessionGuardRef ref + clearSessionGuard() helper inside useVoiceController"
  - "5000 ms guard armed in startListening immediately after Scribe.connect that bounds the silent-stall failure mode"
  - "Reentrancy-safe guard fire path that nulls the ref BEFORE invoking connection.close()"
  - "Five clear sites composed end-to-end: SESSION_STARTED, AUTH_ERROR, ERROR, outer catch, cancelAllAudio"
affects:
  - "Phase 27 FSB-04 -- voice fallback caption changes are visible to FSB overlay subscribers (no event-shape change, just an extra setCaption call on stall)"
tech-stack:
  added: []
  patterns:
    - "Identity-checked guard timer with ref-based cleanup composed into cancelAllAudio (Phase 22 reuse)"
    - "Null-before-close ordering inside fire path to break CLOSE-handler reentrancy"
    - "Idempotent clearSessionGuard() callable from any of the five clear sites with no need to coordinate ordering"
key-files:
  created: []
  modified:
    - "src/lib/voice-controller.ts: sessionGuardRef declared at line 84; clearSessionGuard helper at lines 234-241; clearSessionGuard call as first line of cancelAllAudio (lines 248-250); guard armed at lines 729-737; clears at SESSION_STARTED (741), AUTH_ERROR (760), ERROR (768), outer catch (786)"
key-decisions:
  - "Caption text uses the unicode en-dash escape (\\u2014) to match the existing typography convention already used at multiple sites in voice-controller.ts (Listening\\u2026, Thinking\\u2026, etc.)"
  - "CLOSE handler intentionally NOT modified -- the guard fire path calls connection.close() which triggers CLOSE; adding clearSessionGuard there would mask reentrancy bugs because the guard already nulled itself before close() ran. RESEARCH.md anti-pattern confirmed."
  - "clearSessionGuard declared as a plain const arrow (not useCallback) -- it closes over a ref so it has no React-tracked dependencies; using useCallback would only add overhead with no behavior gain and would force callers to thread it through dep arrays."
  - "Guard armed via setTimeout (not AbortController) -- the existing Phase 22 pattern uses ref-tracked timers and AbortController only for in-flight fetches; following the established convention keeps cleanup composable with cancelAllAudio."
patterns-established:
  - "Identity-checked guard timer pattern: ref-tracked setTimeout + idempotent clear helper + composed into cancelAllAudio + null-before-close in fire path. Reusable for VOICE-07 synth fallback timeout in Phase 25 plan 03."
requirements-completed: [VOICE-06]

duration: ~5 min
completed: 2026-04-26
---

# Phase 25 Plan 04: VOICE-06 Scribe Session-Started Stall Guard Summary

**5000 ms identity-checked guard timer in startListening() bounds the silent-stall failure mode where Scribe accepts the WebSocket but never emits SESSION_STARTED, with five composed clear sites and reentrancy-safe fire ordering.**

## Performance

- **Duration:** ~5 min wall clock
- **Started:** 2026-04-26T20:07:00Z
- **Completed:** 2026-04-26T20:12:36Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Closes VOICE-06 from `21-AUDIT.md` Wave 2: voice mode no longer hangs in "Listening..." indefinitely when Scribe accepts the connection but stalls before SESSION_STARTED.
- 5000 ms guard armed immediately after Scribe.connect; on fire it closes the Scribe connection, surfaces caption "Speech service slow -- switching to fallback" (en-dash), and invokes startListeningFallback for Web Speech.
- Guard cleared at all five intended sites: SESSION_STARTED, AUTH_ERROR, ERROR, the outer try/catch (token-fetch failure), and from inside cancelAllAudio so a user-initiated stop while connecting also kills the timer.
- Reentrancy-safe fire ordering: the timer body sets sessionGuardRef.current = null BEFORE calling connection.close(). Since close() triggers the CLOSE handler synchronously in some SDK versions, this prevents any second pass into the guard cleanup and confirms the CLOSE handler does not need its own clearSessionGuard call (anti-pattern).

## Task Commits

Each task was committed atomically:

1. **Task 1: Add sessionGuardRef + clearSessionGuard helper, integrate into cancelAllAudio** - `7ac22d8` (feat)
2. **Task 2: Arm 5000ms guard in startListening and clear at all event sites** - `514cd1c` (feat)

**Plan metadata:** _final commit follows_ (docs: complete plan)

## Files Created/Modified

- **`src/lib/voice-controller.ts`** -- modified
  - Line 84: `sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null)` declaration alongside the other voice-controller refs.
  - Lines 234-241: `clearSessionGuard()` idempotent helper defined immediately above `cancelAllAudio`.
  - Lines 248-250: `clearSessionGuard()` invoked as the FIRST statement inside `cancelAllAudio`.
  - Lines 729-737: 5000 ms `setTimeout` armed inside `startListening` immediately after `Scribe.connect()` returns. Fire body: null ref, close connection, set caption, call `startListeningFallback()`.
  - Line 741 (SESSION_STARTED), Line 760 (AUTH_ERROR), Line 768 (ERROR): `clearSessionGuard()` as the first line of each handler.
  - Line 786 (outer catch): `clearSessionGuard()` as the first statement of the catch body.
  - Line 774-779 (CLOSE handler): intentionally NOT modified -- documented anti-pattern.

## Decisions Made

- **En-dash escape (`\u2014`) over literal em-dash:** matches the existing typography convention already in use throughout `voice-controller.ts` (e.g., `'Listening\u2026'`, `'Thinking\u2026'`). Keeps the file consistent and avoids encoding ambiguity in source diffs.
- **CLOSE handler unchanged:** The guard's own fire path calls `connection.close()`, and the SDK delivers CLOSE synchronously in some build configurations. Calling `clearSessionGuard()` from CLOSE would either be a no-op (the guard already nulled itself before `close()`) or would mask a reentrancy bug. Per RESEARCH.md anti-pattern.
- **`clearSessionGuard` as plain arrow, not useCallback:** the helper closes over a ref (no React state), so memoizing it adds zero behavior gain and would force every caller to thread it through dependency arrays. Matches the codebase convention for ref-only helpers.
- **Guard armed via setTimeout (not AbortController):** AbortController is reserved for in-flight fetches in this file (per Phase 22). Ref-tracked timers are the established pattern for guard timeouts and they compose cleanly with `cancelAllAudio`'s existing cleanup contract.

## Deviations from Plan

None -- plan executed exactly as written.

The plan referenced source line numbers from before Phase 25-01's `runTool` refactor landed (which shifted everything in `dispatchToolCall` down by ~37 lines). The actual edit anchor strings from the plan still matched the file uniquely, so the line drift had no impact on execution -- both edits applied at the intended structural sites (declaration block, immediately above cancelAllAudio, first statement of cancelAllAudio body, immediately after Scribe.connect, and first statement of each event handler / outer catch).

## Issues Encountered

- **Worktree base mismatch:** the worktree was checked out at an old base; `git reset --soft eb5779f9...` followed by `git checkout HEAD -- .` restored both index and working tree to the target base (`eb5779f`, the Phase 25-01 completion commit). After the reset the worktree contained the post-25-01 source file structure required for this plan to apply cleanly.
- **node_modules missing:** the worktree was a fresh checkout, so `npm run lint` and `npm run build` could not run until `npm install --legacy-peer-deps` populated dependencies. This is a worktree environment quirk shared by every parallel agent in the wave; not a deviation.

## User Setup Required

None -- this plan is purely an internal hardening of `src/lib/voice-controller.ts`. No new env vars, no dashboard configuration, no external service changes.

## Verification

- **Lint:** `npm run lint -- src/lib/voice-controller.ts` -- 0 errors, 0 warnings.
- **Build:** `npm run build` -- all 12 routes compile, no TypeScript errors. First Load JS unchanged (~467 kB on `/`).
- **Acceptance criteria (Task 1):**
  - `grep -c "const sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);"` -> 1
  - `grep -c "const clearSessionGuard = () =>"` -> 1
  - `grep -c "VOICE-06"` -> 4 (declaration comment, helper comment, cancelAllAudio inline comment, guard arm comment after Task 2)
  - `awk` ordering check: `clearSessionGuard` defined before `cancelAllAudio` -> PASS
  - `clearSessionGuard()` is the FIRST statement inside cancelAllAudio -> PASS
- **Acceptance criteria (Task 2):**
  - `grep -c "sessionGuardRef.current = setTimeout(() => {"` -> 1 (guard armed exactly once)
  - `grep -c "Speech service slow"` -> 1 (caption text present)
  - `grep -c "clearSessionGuard();"` -> 5 (cancelAllAudio + SESSION_STARTED + AUTH_ERROR + ERROR + outer catch)
  - `}, 5000);` present at line 737 (correct duration, correct site)
  - CLOSE handler does NOT contain `clearSessionGuard` -> PASS
  - `sessionGuardRef.current = null` (line 733) is BEFORE `connection.close()` (line 734) inside guard body -> PASS

## Known Stubs

None -- both tasks shipped behind real code paths. The fallback path (`startListeningFallback`) is the existing Web Speech API entry point and was already wired before this plan.

## Threat Flags

None. The threat_model section in `25-04-PLAN.md` explicitly notes "no new external surface" and frames this work as a denial-of-service mitigation for the user (they can no longer be stuck in a non-recoverable listening state). The 5000 ms timeout is a bounded internal guard, not a new network endpoint or trust-boundary surface.

## Next Phase Readiness

- VOICE-06 closed; the remaining v4.2 voice findings (VOICE-05 openTextChat race, VOICE-07 synth fallback timeout, VOICE-08 deregister contract) are independent and can land in any order.
- The identity-checked guard timer pattern established here is the template for VOICE-07 (synth fallback worst-case timeout), which uses the same setup-clear-cancelAllAudio-compose contract with a different duration formula (`Math.max(1000, text.length * 50)` capped at 30000 ms).
- Phase 27 FSB-04 is unaffected -- no event-shape change. The new caption ("Speech service slow -- switching to fallback") flows through the existing `setCaption` channel that FSB-04 will subscribe to via VoiceBus events.

## Self-Check: PASSED

Verified before writing this summary:

```
[ FOUND ] src/lib/voice-controller.ts:84 const sessionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
[ FOUND ] src/lib/voice-controller.ts:236 const clearSessionGuard = () => {
[ FOUND ] src/lib/voice-controller.ts:732 sessionGuardRef.current = setTimeout(() => {
[ FOUND ] src/lib/voice-controller.ts:735 setCaption('Speech service slow \u2014 switching to fallback');
[ FOUND ] commit 7ac22d8 -- feat(25-04): add sessionGuardRef + clearSessionGuard helper
[ FOUND ] commit 514cd1c -- feat(25-04): arm 5000ms Scribe stall guard with five clear sites
[ FOUND ] All 5 clearSessionGuard() call sites: 250, 741, 760, 768, 786
[ NOT FOUND ] clearSessionGuard inside CLOSE handler -- intentional, anti-pattern
[ PASS ] npm run lint -- src/lib/voice-controller.ts
[ PASS ] npm run build -- 12 routes compile
[ ORDER ] sessionGuardRef.current = null at line 733 BEFORE connection.close() at line 734 -- reentrancy-safe
```

---
*Phase: 25-voice-wave-2-hardening*
*Plan: 04*
*Completed: 2026-04-26*
