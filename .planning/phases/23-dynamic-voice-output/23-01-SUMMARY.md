---
phase: 23
plan: 01
subsystem: voice
tags: [llm-greet, no-hardcoded-speech, regression-hotfix, barge-in]
key-files:
  - src/lib/voice-controller.ts
metrics:
  hardcoded_speech_strings_removed: 3
  regression_hotfixes: 1
  hardcoded_triggers_remaining_in_voice: 1   # isStopIntent — instant abort, justified
---

# Plan 23-01 Summary: Dynamic Voice Output + Phase-22 Regression Hotfix

## What Changed

### LLM-driven greet (H-1)
- `handleUserTurn` now accepts an optional `kind: 'user' | 'greet'`. Default `'user'` is unchanged.
- `kind === 'greet'`: skips appending the trigger to `historyRef` (synthetic, not user input), skips the `isStopIntent` early-return, builds messages from history + a one-shot synthetic trigger appended at the end. Assistant response is added to history so subsequent turns know Parz greeted.
- `open()` no longer ships hardcoded greet strings. The 480ms timer body now sends a page-aware kickoff trigger:
  ```ts
  const trigger = `[Voice mode just opened on the ${page} page. Greet briefly and offer help — under 2 sentences, voice channel: no markdown, no lists, no emoji.]`;
  void handleUserTurn(trigger, { kind: 'greet' });
  ```
- The trigger phrasing is a prompt to the LLM, not user-facing speech. Every word the user actually hears is now LLM-generated, varying turn-to-turn and page-to-page.

### Empty-response silence (H-2)
- Removed `else if (toolCalls.length === 0) { await speak("Hmm, I lost my train of thought."); }`.
- Replaced with `setState('idle'); setCaption('')`. If the LLM has nothing to say, we say nothing.

### Server-error caption (H-3)
- Removed the catch-block `await speak("My server's glitching. Give me a sec and try again.")`.
- Replaced with `setState('idle'); setCaption('Server hiccup — try again.')`. UI text only; no audio. The LLM is unreachable in this branch by definition.

### R-1 — Phase-22 barge-in regression hotfix
- **Symptom (user-reported on live deploy):** "I cannot hear anything... mic is working but speech isn't working." All TTS silenced.
- **Root cause:** `streamTTS` calls `setState('speaking')` before `/api/tts` finishes. `setState()` emits a fallback default level of `0.75` (since `_liveAudio` is false — no analyser yet). Barge-in subscriber sees `state === 'speaking' && 0.75 > 0.35` → fires `bargeIn()` → `cancelAllAudio()` → **aborts the in-flight TTS fetch** (Phase 22's AbortController integration). Every. Single. Turn.
- **Fix:** Gate the barge-in check on `window.VoiceBus._liveAudio === true` so it only reacts to actual analyser RMS readings, not to phantom default-level emissions from `setState`.
- **Why this didn't manifest pre-Phase-22:** old `bargeIn` only stopped a null source and went to listening; the fetch had no AbortController, so audio still played in the wrong state. Phase 22's stricter cancellation (with `AbortController`) made the failure complete and visible.

## Verification

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 12/12 tests pass across 2 files |
| `npx next build` | Succeeds, all 12 routes generated |
| `npx next lint --dir src` | No new warnings on `voice-controller.ts` |
| `grep -nE 'speak\("[^"]+"\)' src/lib/voice-controller.ts` | No matches |
| `curl -X POST https://portfolio-v4-test.fly.dev/api/tts ...` (pre-fix smoke) | 200 + valid MP3 (server-side was fine; bug was client-side abort) |

## Deviations

- The R-1 regression was discovered mid-phase when the user reported "speech isn't working" on the live deploy. Bundled into Phase 23 (same file, same theme) rather than spinning a separate hotfix phase.
- No new automated tests. Hardcoded-string removal is verified by grep. R-1 is timing-dependent and would require mocking `VoiceBus`, the level subscriber, and `fetch` lifecycle to reproduce in a unit test — high cost, low value compared to a live-deploy smoke check.

## Self-Check

PASSED. After Phase 23:
- 0 hardcoded speech strings remain in `src/lib/voice-controller.ts` (verified by grep).
- 1 hardcoded trigger remains overall: `isStopIntent` — for instant abort without a network round-trip, justified.
- Phase-22 R-1 regression closed: barge-in now only fires on live analyser readings, not on `setState`-default level emissions.
- Typecheck, tests, build are green.
