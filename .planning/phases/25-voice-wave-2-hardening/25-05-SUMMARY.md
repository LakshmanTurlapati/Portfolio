---
phase: 25-voice-wave-2-hardening
plan: 05
subsystem: voice-controller
tags: [voice, timeout, fallback, speech-synthesis, safari, guard-timer]
requires:
  - phase: 25-04
    provides: "sessionGuardRef + clearSessionGuard pattern that VOICE-07 mirrors for the synth fallback worst-case timer"
provides:
  - "synthGuardRef ref + clearSynthGuard() helper inside useVoiceController"
  - "Worst-case setTimeout armed inside the streamTTS .catch synth fallback that bounds the silent-no-op failure mode (Safari + any browser with disabled synth)"
  - "wrappedFinishSynth that clears the guard timer BEFORE delegating to the existing identity-checked finishSynth"
  - "Two clear sites composed end-to-end: wrappedFinishSynth (onend/onerror) and cancelAllAudio (external stop)"
affects:
  - "Phase 27 FSB-04 -- no event-shape change. The synth fallback is purely a recovery path; FSB caption tracking continues to subscribe to the same VoiceBus tool-* events"
tech-stack:
  added: []
  patterns:
    - "Identity-checked guard timer pattern reused from Plan 04 (sessionGuardRef) -- ref-tracked setTimeout with idempotent clear helper composed into cancelAllAudio"
    - "Wrapped event handler that clears the guard before calling the original finalizer -- preserves the existing identity check inside finishSynth as the second safety net"
    - "Text-length-aware timeout formula: Math.min(30000, Math.max(1000, text.length * 50)) -- 50ms/char with 1s floor and 30s cap"
key-files:
  created:
    - ".planning/phases/25-voice-wave-2-hardening/25-05-SUMMARY.md"
  modified:
    - "src/lib/voice-controller.ts: synthGuardRef declared at line 89; clearSynthGuard helper at lines 251-256; clearSynthGuard call inside cancelAllAudio at line 269; wrappedFinishSynth at lines 419-422; u.onend/u.onerror reassigned to wrappedFinishSynth at lines 423-424; guard armed at lines 431-436; synth.speak invoked at line 437"
key-decisions:
  - "wrappedFinishSynth chosen over mutating the existing finishSynth body -- keeps the identity-checked finalizer intact as the final safety net per RESEARCH Pitfall 3 (if both onend and guard fire, the second call no-ops on the existing identity check)"
  - "Guard arm placed AFTER speakingRef.current = true and immediately BEFORE synth.speak(u) -- the timer must be armed before speech starts so the silent-no-op failure mode is bounded from the moment the synth call is dispatched"
  - "cancelAllAudio NOT called from inside the synth fallback's onend/error path or from the guard fire path -- per RESEARCH Pitfall 6, cancelAllAudio is a sledgehammer that would also abort an unrelated in-flight TTS fetch. The fallback uses clearSynthGuard + finishSynth instead"
  - "synth.cancel() invoked in the guard fire path BEFORE finishSynth() -- mirrors the existing speakResolverRef cleanup ordering and ensures the synth queue drains in case the browser's onend never propagates"
  - "Comment 'cancelAllAudio' on line 430 is intentional documentation referencing the external clear site; it is text inside a comment, not a function call, so the no-cancelAllAudio-in-fallback rule is satisfied"
patterns-established:
  - "Wrapped onend/onerror pattern: when adding a guard timer to an event-driven async path, wrap the success/error handler in a helper that clears the guard before calling the original finalizer. The original finalizer's identity check remains the final safety net."
requirements-completed: [VOICE-07]

duration: ~6 min
completed: 2026-04-26
---

# Phase 25 Plan 05: VOICE-07 SpeechSynthesis Fallback Worst-Case Timeout Summary

**Text-length-aware worst-case timeout (50ms/char, 1s floor, 30s cap) bounds the SpeechSynthesis fallback path so Safari and any browser that silently no-ops synth.speak() cannot leave the speak() Promise hanging forever.**

## Performance

- **Duration:** ~6 min wall clock
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Closes VOICE-07 from `21-AUDIT.md` Wave 2: voice mode no longer hangs in 'speaking' indefinitely when the SpeechSynthesis fallback engine silently fails to fire onend/onerror.
- Worst-case timeout armed via `setTimeout(..., Math.min(30000, Math.max(1000, text.length * 50)))` immediately before `synth.speak(u)`. The duration is text-length-aware: 50 ms per character, with a 1 s floor and 30 s ceiling so pathological inputs cannot create huge timers.
- Guard fire path nulls the ref, calls `synth.cancel()` to drain the synth queue, then invokes the existing identity-checked `finishSynth()` so VoiceBus state, speakingRef, speechUtteranceRef, speakAbortRef, and speakResolverRef all unwind correctly and the outer `Promise<void>` from `streamTTS` resolves.
- Wrapped onend/onerror handlers (`wrappedFinishSynth`) clear the guard timer BEFORE delegating to `finishSynth`. This avoids the double-finalize race per RESEARCH Pitfall 3, and the existing identity check inside `finishSynth` (`speechUtteranceRef.current === u`) is preserved as the final safety net if both the native event and the guard fire.
- Composed cleanly with Plan 04: `cancelAllAudio` now clears both `sessionGuardRef` (Plan 04) and `synthGuardRef` (this plan) so an external stop while the synth fallback is mid-utterance does not leave a stale timer firing into a torn-down Promise.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add synthGuardRef + clearSynthGuard helper, integrate into cancelAllAudio** - `e0d036e` (feat)
2. **Task 2: Arm worst-case timeout in synth fallback and wrap onend/onerror** - `ecdc870` (feat)

## Files Created/Modified

- **`src/lib/voice-controller.ts`** -- modified
  - Line 89: `synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null)` declared immediately after `sessionGuardRef`.
  - Lines 251-256: `clearSynthGuard()` idempotent helper defined immediately after `clearSessionGuard`.
  - Line 269: `clearSynthGuard()` invoked inside `cancelAllAudio` after `clearSessionGuard()` and before the `speakAbortRef.current?.abort()` call.
  - Lines 419-422: `wrappedFinishSynth` arrow function that calls `clearSynthGuard()` before delegating to `finishSynth()`.
  - Lines 423-424: `u.onend = wrappedFinishSynth` and `u.onerror = wrappedFinishSynth` -- bare `finishSynth` assignments removed.
  - Lines 431-436: `synthGuardRef.current = setTimeout(...)` armed with `Math.min(30000, Math.max(1000, text.length * 50))` immediately before `synth.speak(u)`. Fire body: null ref, `synth.cancel()`, then `finishSynth()`.

## Decisions Made

- **`wrappedFinishSynth` over mutating `finishSynth` body:** Adding the `clearSynthGuard()` call inside `finishSynth` would have worked but obscured the wrap pattern. The wrapped form makes the contract explicit: native event handlers clear the guard first, then delegate. The existing identity check inside `finishSynth` stays the final safety net for the double-fire case (RESEARCH Pitfall 3).
- **No `cancelAllAudio()` from inside the fallback:** Tempting to call it for symmetry, but it is a sledgehammer that would also abort an unrelated in-flight `/api/tts` fetch (Phase 22's AbortController). The synth fallback's clear scope is exactly its own guard; `cancelAllAudio` runs only from external stop paths (stopAll, bargeIn, new turn).
- **Guard armed AFTER `speakingRef.current = true`, BEFORE `synth.speak(u)`:** The timer must be armed before speech starts so the silent-no-op failure mode is bounded from the dispatch moment. Placing it after `speakingRef.current = true` keeps it adjacent to the speak() invocation and matches the existing local convention of arming guards immediately before the awaited side effect.
- **`synth.cancel()` BEFORE `finishSynth()` in fire path:** If the synth engine is in a degraded state, calling `cancel()` first ensures the queue drains and any latent `onend`/`onerror` callbacks fire on a cancelled-state utterance (which the identity check inside `finishSynth` will then no-op on). Reversing the order would be a benign double-finalize but slower.
- **Text-length-aware formula matches CONTEXT.md exactly:** `Math.min(30000, Math.max(1000, text.length * 50))`. 50 ms/char is a generous upper bound for human-paced speech (typical TTS plays at 12-15 ms/char). 30 s cap covers the longest plausible Parz utterance; 1 s floor ensures even very short text gets a real-world timeout window before the guard fires.

## Deviations from Plan

None -- plan executed exactly as written.

The plan referenced `streamTTS .catch synth fallback (line 326+)` and `lines 326-364` based on a pre-25-01 line layout. The `runTool` refactor in Plan 01 plus the `sessionGuardRef`/`clearSessionGuard` additions in Plan 04 shifted the synth fallback down to lines 382-438 in the current file. The plan's anchor strings (`u.onend = finishSynth;`, `u.onerror = finishSynth;`, `const finishSynth = () =>`) all matched uniquely, so the line drift had no impact -- the edits applied at the intended structural sites.

## Issues Encountered

- The acceptance-criteria awk check for "no `cancelAllAudio` inside the synth fallback" matched the substring inside a documentation comment on line 430 ("Cleared by wrappedFinishSynth above and by clearSynthGuard() in cancelAllAudio."). A refined check searching for the function call form `cancelAllAudio()` (with parentheses) confirmed zero call-site matches in the fallback block (lines 382-438). The comment reference is intentional documentation pointing readers to the external clear site.

## User Setup Required

None -- this plan is purely an internal hardening of `src/lib/voice-controller.ts`. No new env vars, no dashboard configuration, no external service changes.

## Verification

- **Lint:** `npm run lint -- src/lib/voice-controller.ts` -- 0 errors, 0 warnings.
- **Build:** `npm run build` -- all 12 routes compile, no TypeScript errors. First Load JS unchanged (~467 kB on `/`).
- **Acceptance criteria (Task 1):**
  - `grep -c "const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);"` -> 1 (line 89)
  - `grep -c "const clearSynthGuard = () =>"` -> 1 (line 251)
  - `grep -c "VOICE-07"` -> 4 (declaration, helper, cancelAllAudio inline, plus guard arm comment after Task 2)
  - `awk` ordering: `sessionGuardRef` (84) BEFORE `synthGuardRef` (89) -> PASS
  - `awk` ordering: `clearSessionGuard` (241) BEFORE `clearSynthGuard` (251) -> PASS
  - `awk` ordering inside cancelAllAudio: `clearSessionGuard` (265) BEFORE `clearSynthGuard` (269) BEFORE `speakAbortRef.current?.abort` (272) -> PASS
- **Acceptance criteria (Task 2):**
  - `grep -c "Math.min(30000, Math.max(1000, text.length \* 50))"` -> 1 (line 431, exact CONTEXT formula)
  - `grep -c "const wrappedFinishSynth = () =>"` -> 1 (line 419)
  - `grep -c "u.onend = wrappedFinishSynth;"` -> 1 (line 423)
  - `grep -c "u.onerror = wrappedFinishSynth;"` -> 1 (line 424)
  - `grep -c "u.onend = finishSynth;"` -> 0 (bare assignment removed)
  - `grep -c "u.onerror = finishSynth;"` -> 0 (bare assignment removed)
  - `awk` ordering inside guard arm: `synth.cancel()` (434) BEFORE `finishSynth()` (435) -> PASS
  - `cancelAllAudio()` call NOT present inside synth fallback block (lines 386-438) -> PASS (the line-430 substring is in a comment, not a call site)
  - `grep -c "clearSynthGuard();"` -> 2 (cancelAllAudio at 269, wrappedFinishSynth at 420)
  - `grep "50ms/char"` -> 2 matches (lines 87, 426 -- declaration comment and guard arm comment)

## Known Stubs

None -- both tasks shipped behind real code paths. The synth fallback path is the existing `.catch` branch of `streamTTS` and was already wired before this plan; the guard hardens it without changing its trigger conditions.

## Threat Flags

None. The threat_model section in `25-05-PLAN.md` explicitly notes "no new external surface" and frames this work as a denial-of-service mitigation for the user (they can no longer be stuck in a non-recoverable speaking state when the browser's synth engine silently fails). The 30 s cap is a bounded internal guard, not a new network endpoint or trust-boundary surface.

## Next Phase Readiness

- VOICE-07 closed; the remaining v4.2 voice findings (VOICE-05 openTextChat race, VOICE-08 deregister contract) are independent of this plan.
- The wrapped-onend/onerror + identity-check pattern established here is the canonical template for any future async path in the file that gains a worst-case timeout: wrap the native finalizer, clear the guard first, delegate to the existing identity-checked finalizer.
- Phase 27 FSB-04 is unaffected -- no event-shape change. The synth fallback is purely a recovery path; FSB caption tracking continues to subscribe to the same VoiceBus tool-* events that flow through the normal `streamTTS` success path and `dispatchToolCall`.
- Two of the three Plan-04-pattern reuses (sessionGuardRef + synthGuardRef) are now landed in `cancelAllAudio`'s composable cleanup contract. Any future guard timer added to the file should follow the same shape.

## Self-Check: PASSED

Verified before writing this summary:

```
[ FOUND ] src/lib/voice-controller.ts:89  const synthGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);
[ FOUND ] src/lib/voice-controller.ts:251 const clearSynthGuard = () => {
[ FOUND ] src/lib/voice-controller.ts:269 clearSynthGuard();  (inside cancelAllAudio)
[ FOUND ] src/lib/voice-controller.ts:419 const wrappedFinishSynth = () => {
[ FOUND ] src/lib/voice-controller.ts:420 clearSynthGuard();  (inside wrappedFinishSynth)
[ FOUND ] src/lib/voice-controller.ts:423 u.onend = wrappedFinishSynth;
[ FOUND ] src/lib/voice-controller.ts:424 u.onerror = wrappedFinishSynth;
[ FOUND ] src/lib/voice-controller.ts:431 const guardMs = Math.min(30000, Math.max(1000, text.length * 50));
[ FOUND ] src/lib/voice-controller.ts:432 synthGuardRef.current = setTimeout(() => {
[ FOUND ] src/lib/voice-controller.ts:434 try { synth.cancel(); } catch {}
[ FOUND ] src/lib/voice-controller.ts:435 finishSynth(); // identity-checked finalizer
[ FOUND ] commit e0d036e -- feat(25-05): add synthGuardRef + clearSynthGuard helper, integrate into cancelAllAudio
[ FOUND ] commit ecdc870 -- feat(25-05): arm worst-case timeout in synth fallback and wrap onend/onerror
[ NOT FOUND ] u.onend = finishSynth;     (bare assignment removed)
[ NOT FOUND ] u.onerror = finishSynth;   (bare assignment removed)
[ NOT FOUND ] cancelAllAudio() call inside synth fallback (lines 386-438)
[ PASS ] npm run lint -- src/lib/voice-controller.ts (0 errors, 0 warnings)
[ PASS ] npm run build (12 routes compile, no TypeScript errors)
[ ORDER ] synth.cancel() at line 434 BEFORE finishSynth() at line 435 inside guard fire path
```

---
*Phase: 25-voice-wave-2-hardening*
*Plan: 05*
*Completed: 2026-04-26*
