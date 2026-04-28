---
phase: 25-voice-wave-2-hardening
verified: 2026-04-26T21:03:25Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
uat: deferred_post_milestone
human_verification:
  - test: "Voice -> text chat from /portfolio (and /about): trigger 'switch to text chat' via voice and confirm the chat popup mounts focused with the message landing in it. Repeat after toggling between View Transitions API path (Chrome) and the GSAP fallback path (Firefox) -- both completion sites must reach `parz:open-text-chat`."
    expected: "Chat popup opens fully every time on / from both /portfolio and /about; no empty popup, no dropped message"
    why_human: "Cross-browser View Transitions success vs GSAP fallback timing depends on real navigation; the page-ready emission and 1500 ms safety race cannot be replicated programmatically without driving a real browser."
  - test: "VOICE-06 Scribe stall recovery: in DevTools, monkey-patch `Scribe.connect` so the returned connection's `session-started` event never fires (e.g., wrap the real connect with a connection whose `.on('session-started', ...)` is a no-op). Trigger voice listening."
    expected: "Within 5 s the caption changes to 'Speech service slow -- switching to fallback' and Web Speech becomes the active STT path; user can speak and complete a turn without reload."
    why_human: "Requires forcing a Scribe SDK silent stall in a real browser session; cannot be deterministically simulated without DevTools instrumentation."
  - test: "VOICE-07 Safari synth no-op: open in Safari (or any browser) with `SpeechSynthesisUtterance.prototype.onend` patched to a no-op so it never fires. Force the synth fallback by failing /api/tts (DevTools network throttling or Mock Service Worker). Ask Parz a short question."
    expected: "After at most ~Math.min(30000, max(1000, text.length*50)) ms, the speak() Promise resolves, voiceState returns to 'idle', the queue drains, and a follow-up turn works."
    why_human: "Reproducing the silent synth no-op requires Safari (or instrumentation) plus a forced /api/tts failure; the worst-case proportional time is observable only in a real browser."
  - test: "VOICE-09 throwing tool callback: in DevTools, replace one provider tool callback with `() => { throw new Error('boom') }` (e.g., `siteControl.openProject = () => { throw new Error('boom') }`) and ask Parz to open a project."
    expected: "FSB overlay glow shows tool-error state for that tool, and Parz still finishes speaking the assistant response; the voice turn does NOT abort and does NOT crash subsequent turns."
    why_human: "FSB overlay visual glow is a UI behavior; voice-turn-continues-after-throw requires observing a full speak cycle in a real session."
  - test: "VOICE-08 contract-only check: confirm that even though `registerToolCallbacks` now returns a deregister fn, no current consumer needs to call it (provider-owned defaults install via the useEffect at lines 59-75 directly). Then verify a hand-written REPL register/deregister via the React DevTools or a temporary console hook deletes only the keys it registered."
    expected: "ownedKeys are deleted; provider-owned defaults survive; no console warnings about undefined tool handlers fire after deregister"
    why_human: "VOICE-08 success criterion mentions 'each page's callbacks are deregistered on unmount'; the contract is in place but no page consumer uses it yet. Confirming the contract behaves correctly under future adoption requires a hand-driven test."
---

# Phase 25: Voice Wave 2 Hardening Verification Report

**Phase Goal:** Voice mode no longer hangs, races, or aborts mid-turn under the five known P1 conditions from `21-AUDIT.md` Wave 2
**Verified:** 2026-04-26T21:03:25Z
**Status:** passed (manual UAT deferred post-milestone)
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP success criteria + plan must_haves)

| #   | Truth (Roadmap SC)                                                                                                                                                                  | Status     | Evidence                                                                                                                                                                                                         |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Voice -> text chat lands in mounted chat popup every time -- no 400 ms race against View Transitions (VOICE-05)                                                                     | VERIFIED   | `src/providers/voice-session-provider.tsx:108` listens for `page-ready`; safety timer at line 111 set to 1500 ms; hardcoded `, 400);` is gone (grep returns 0). Three emit sites verified in transition-provider. |
| 2   | User does not get stuck in "Listening..." forever when Scribe stalls; within ~5 s controller falls back to Web Speech and surfaces caption (VOICE-06)                                | VERIFIED   | `src/lib/voice-controller.ts:769-774` arms 5000 ms guard after `Scribe.connect`; on fire nulls ref, closes connection, sets caption to `'Speech service slow \u2014 switching to fallback'`, calls `startListeningFallback()`. Cleared at 5 sites. |
| 3   | User on Safari (or any silent-no-op synth) sees voice exit `speaking` in worst-case proportional time, never permanently stuck (VOICE-07)                                            | VERIFIED   | `src/lib/voice-controller.ts:431` arms `Math.min(30000, Math.max(1000, text.length * 50))` ms timer; on fire calls `synth.cancel()` then `finishSynth()`; `wrappedFinishSynth` clears guard before delegating. |
| 4   | User who navigates between pages does not accumulate stale voice tool callbacks (VOICE-08)                                                                                         | VERIFIED   | `src/providers/voice-session-provider.tsx:46-54` -- `registerToolCallbacks` returns `(): () => void`; captures ownedKeys at registration; deregister deletes only ownedKeys. Provider-owned defaults installed directly via useEffect, untouched. |
| 5   | User triggering a tool whose callback throws sees the voice turn continue with `tool-error` glow (VOICE-09)                                                                         | VERIFIED   | `src/lib/voice-controller.ts:135-161` defines `runTool` with try/catch that emits `tool-error` instead of re-throwing; all 7 dispatchToolCall cases route through `runTool` (lines 173, 181, 189, 197, 205, 213, 221). |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Data Flow | Status |
| -------- | -------- | ------ | ----------- | ----- | --------- | ------ |
| `src/lib/voice-controller.ts` (runTool) | Helper wraps callback invocations, emits tool-* events, no re-throw | yes | yes | yes (7 callsites in dispatchToolCall) | n/a (pure logic) | VERIFIED |
| `src/lib/voice-controller.ts` (sessionGuardRef + clearSessionGuard + 5s arm) | Ref + helper + arm in startListening + 5 clear sites | yes | yes | yes (5 clearSessionGuard() invocations + 1 setTimeout arm) | n/a | VERIFIED |
| `src/lib/voice-controller.ts` (synthGuardRef + clearSynthGuard + worst-case arm) | Ref + helper + arm before synth.speak + wrappedFinishSynth + clear in cancelAllAudio | yes | yes | yes (2 clearSynthGuard() callsites + 1 setTimeout arm + wrapped onend/onerror) | n/a | VERIFIED |
| `src/providers/voice-session-provider.tsx` (registerToolCallbacks deregister return) | Returns `() => void` deleting captured ownedKeys | yes | yes | wired in interface (line 21) and impl (line 46) | n/a (no current consumer; future-facing contract) | VERIFIED |
| `src/providers/voice-session-provider.tsx` (event-driven openTextChat) | VoiceBus.on listener + 1500 ms safety + fired flag, no 400 ms | yes | yes | wired (listener attached before goPage) | n/a | VERIFIED |
| `src/providers/transition-provider.tsx` (emitPageReady + 3 emit sites) | Helper inside navigateWithReveal + 3 emit calls (View Transitions success, no-overlay branch, GSAP onComplete) | yes | yes | wired -- 3 invocations confirmed via grep at lines 112, 128, 150 | n/a | VERIFIED |

### Key Link Verification

| From                                                                  | To                                  | Via                                                                      | Status | Details                                                                                                                                                                                          |
| --------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| dispatchToolCall (7 cases)                                            | runTool helper                      | `runTool('<name>', () => toolCallbacks.X(...))`                          | WIRED  | grep matches all 7 expected tool names exactly: openProject (173), scrollTo (181), openLink (189), closeBrowser (197), openCurrentProjectExternal (205), unsupportedIframeControl (213), toggleTheme (221) |
| transition-provider navigateWithReveal completion paths               | VoiceBus 'page-ready' event         | `emitPageReady()` calls at View Transitions success / no-overlay / GSAP onComplete | WIRED  | 3 emit sites confirmed (lines 112, 128, 150). Helper at line 69 derives slug correctly (`/` -> `home`, otherwise strip leading slash).                                                            |
| voice-session-provider openTextChat                                   | `parz:open-text-chat` CustomEvent   | `page-ready` listener -> `fire()` (gated by `fired` flag) OR 1500 ms timer -> `fire()` | WIRED  | Listener at line 108, safety timer at line 111, dispatch at line 106. Listener attached BEFORE goPage on line 112 (verified order: 108 < 111 < 112).                                                |
| startListening 5 s guard fire path                                    | startListeningFallback              | guard timer body: null ref -> close connection -> setCaption -> startListeningFallback() | WIRED  | Lines 769-774 contain the full chain. `sessionGuardRef.current = null` at 770 BEFORE `connection.close()` at 771 (reentrancy-safe ordering).                                                       |
| cancelAllAudio                                                        | clearSessionGuard + clearSynthGuard | composed in cancelAllAudio body                                          | WIRED  | Line 265 calls clearSessionGuard, line 269 calls clearSynthGuard, both before existing audio cleanup.                                                                                              |
| streamTTS synth fallback                                              | wrappedFinishSynth                  | u.onend / u.onerror reassigned at lines 423-424; bare `finishSynth` assignments removed | WIRED  | grep `u.onend = finishSynth;` -> 0 matches. wrappedFinishSynth (419) calls clearSynthGuard then finishSynth.                                                                                        |

### Data-Flow Trace (Level 4)

Phase 25 ships internal hardening only; there are no rendered components or new dynamic data sources. Skipping Level 4 by category (purely-internal logic + event coordination).

### Behavioral Spot-Checks

| Behavior                                                                                                        | Command                                                                                                | Result                                          | Status |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ------ |
| TypeScript type check passes for the touched files                                                              | `npx tsc --noEmit`                                                                                     | exit 0                                          | PASS   |
| ESLint passes for the three modified files                                                                      | `npm run lint -- src/lib/voice-controller.ts src/providers/voice-session-provider.tsx src/providers/transition-provider.tsx` | 0 errors, 1 pre-existing warning (`_initialText`) | PASS   |
| `runTool('<name>', ...)` callsites match exactly the 7 wrapped tool names                                       | grep regex over 7 tool names                                                                           | 7 matches at 173, 181, 189, 197, 205, 213, 221  | PASS   |
| `clearSessionGuard()` callsites: 1 in cancelAllAudio + 3 event handlers + 1 outer catch = 5 (per Plan 04 spec)  | grep `clearSessionGuard();`                                                                            | 5 matches (lines 265, 778, 797, 805, 823)        | PASS   |
| `clearSynthGuard()` callsites: 1 in cancelAllAudio + 1 in wrappedFinishSynth = 2 (per Plan 05 spec)             | grep `clearSynthGuard();`                                                                              | 2 matches (lines 269, 420)                       | PASS   |
| `emitPageReady()` callsites: 3 transition completion paths                                                      | grep `emitPageReady()`                                                                                 | 3 matches (lines 112, 128, 150)                  | PASS   |
| Hardcoded `400 ms` setTimeout removed from openTextChat                                                         | grep `, 400);` in voice-session-provider.tsx                                                           | 0 matches                                       | PASS   |
| Bare `u.onend = finishSynth;` / `u.onerror = finishSynth;` removed (replaced by wrappedFinishSynth)             | grep `u.onend = finishSynth;`                                                                          | 0 matches                                       | PASS   |
| CLOSE handler intentionally NOT modified (anti-pattern per RESEARCH.md)                                         | inspect lines 811-816                                                                                  | confirmed: only sttCtx.close + detachMicRef + state reset; no clearSessionGuard call | PASS |
| Caption text matches CONTEXT.md decision                                                                        | grep `Speech service slow`                                                                             | 1 match at line 772 with `\u2014` en-dash       | PASS   |
| Worst-case timeout formula matches CONTEXT.md exactly                                                           | grep `Math.min(30000, Math.max(1000, text.length * 50))`                                               | 1 match at line 431                             | PASS   |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                          | Status    | Evidence                                                                                                                                                                                                |
| ----------- | ----------- | ---------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VOICE-05    | 25-03       | Replace hardcoded 400 ms setTimeout with VoiceBus `page-ready` listener                              | SATISFIED | transition-provider emits page-ready at 3 sites; voice-session-provider listens with 1500 ms safety + `fired` gate; old 400 ms gone.                                                                     |
| VOICE-06    | 25-04       | 5 s guard timer; falls back to Web Speech if SESSION_STARTED never fires                             | SATISFIED | sessionGuardRef armed for 5000 ms after Scribe.connect; cleared at 5 sites (SESSION_STARTED, AUTH_ERROR, ERROR, outer catch, cancelAllAudio); fire path closes Scribe + sets caption + calls fallback.   |
| VOICE-07    | 25-05       | Text-length-aware worst-case timeout in synth fallback                                               | SATISFIED | `Math.min(30000, Math.max(1000, text.length * 50))` ms armed before `synth.speak`; on fire calls synth.cancel() + finishSynth(); wrappedFinishSynth clears guard before delegating.                       |
| VOICE-08    | 25-02       | `registerToolCallbacks` returns deregister fn that removes its keys                                  | SATISFIED (contract only) | Interface and impl both updated; ownedKeys captured at registration; provider-owned defaults install directly through useEffect (not via registerToolCallbacks) so they survive any future deregister.   |
| VOICE-09    | 25-01       | `runTool()` helper wraps every tool callback with try/catch; emits `tool-executing` -> `tool-success`/`tool-error` | SATISFIED | runTool helper at line 135; all 7 dispatchToolCall callback cases routed through it; navigate / endCall / default intentionally bare per RESEARCH anti-pattern.                                          |

All 5 PLAN-declared requirement IDs (VOICE-05, VOICE-06, VOICE-07, VOICE-08, VOICE-09) are accounted for and SATISFIED. No orphaned requirements -- REQUIREMENTS.md maps these 5 IDs to Phase 25 and all 5 plans claim them.

### Anti-Patterns Found

| File                                          | Line(s)        | Pattern                                                                  | Severity | Impact                                                                                                                                                                                              |
| --------------------------------------------- | -------------- | ------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/providers/voice-session-provider.tsx`    | 95             | Unused parameter `_initialText` (intentional underscore)                | INFO     | Lint warning; out-of-scope cleanup. The voice path calls `openTextChat()` without an initial-text arg today; the underscore-prefixed param documents future intent without triggering an unused-variable error. |
| `src/providers/voice-session-provider.tsx`    | 46-54 vs 59-75 | `registerToolCallbacks` deregister can wipe provider-owned defaults if a future consumer registers any of the seven keys the provider's useEffect owns | INFO     | Latent (no consumer today). Documented in 25-REVIEW WR-01. Currently impossible to trigger because no page calls `registerToolCallbacks`. The contract's literal text is satisfied for VOICE-08; the soundness gap is a deferred design concern, not a Phase 25 gap. |
| `src/lib/voice-controller.ts`                 | 737-828        | `startListening` is async with multiple awaits; concurrent invocations can leak Scribe connection (REVIEW WR-02) | INFO     | Pre-existing edge case unrelated to VOICE-06's Scribe stall fix. The 5 s guard does not introduce or worsen this; it is captured in 25-REVIEW for a future hardening pass.                              |

No blocker or warning anti-patterns introduced by this phase. The two INFO items above are pre-existing or design-level concerns surfaced by the standalone code review (`25-REVIEW.md`), not regressions caused by Phase 25.

### Human Verification Required

Five behaviors require a real browser session to confirm. They are described in detail in the YAML `human_verification` section above and recapped here:

1. Voice -> text chat reliability across `/portfolio` and `/about` (VOICE-05): both View Transitions API path (Chrome) and GSAP fallback path (Firefox) must reliably mount the chat popup. The 1500 ms safety vs the page-ready event coordination is observable only in real navigation.
2. Scribe SESSION_STARTED stall recovery (VOICE-06): requires forcing Scribe to silently accept the WebSocket without emitting `session-started`; the 5 s caption flip and Web Speech fallback need to be observed live.
3. Safari synth no-op timeout (VOICE-07): requires a real Safari run (or `onend` patched to no-op in any browser) and a forced /api/tts failure to drive the synth fallback path; the worst-case proportional resolution time is observable only in browser.
4. Throwing tool callback (VOICE-09): requires monkey-patching a callback at runtime and observing both the FSB tool-error glow and continued speech of the assistant response.
5. VOICE-08 deregister behavior under hand-driven register/deregister: the contract is in place but has zero current consumers; manual REPL exercise validates that future page-level usage will behave as documented.

### Gaps Summary

No gaps blocking goal achievement. All five Wave 2 hardening targets (VOICE-05, VOICE-06, VOICE-07, VOICE-08, VOICE-09) ship correct primary logic, with appropriate identity checks, idempotent clearers, and safety nets, as documented in the 5 SUMMARY files and confirmed by direct grep / file inspection of the three modified source files. TypeScript and ESLint are clean (0 errors, 1 pre-existing warning).

The reason this verification returns `human_needed` rather than `passed` is structural: every one of the five success criteria describes a user-observable runtime behavior (chat popup mounts, listening doesn't hang, speaking exits, deregister actually removes, tool-error glow fires while the turn continues). Static code verification can confirm the code paths exist and compose correctly, but it cannot confirm that View Transitions timing, Safari synth quirks, or FSB overlay glow render as intended without a real browser run. Those are listed above for the developer's smoke pass.

---

_Verified: 2026-04-26T21:03:25Z_
_Verifier: Claude (gsd-verifier)_
