---
phase: 22
status: passed
verified_at: 2026-04-26T00:50:00.000Z
---

# Phase 22 Verification

## Result

status: passed

Phase 22 satisfies its goal: voice audio is now serialized through a single `cancelAllAudio` primitive, `AbortController` aborts in-flight `/api/tts` fetches, identity checks prevent stale handlers from mutating state, and a turn-generation counter dedupes parallel `handleUserTurn` invocations. All five overlap modes catalogued in `22-AUDIT.md` (O-1 through O-5) are structurally closed.

## Goal Coverage

| Goal element | Evidence | Status |
|--------------|----------|--------|
| O-1 — stacked `BufferSource`s | `streamTTS` calls `cancelAllAudio()` at entry; `audioSourceRef` always points to the latest source | Passed |
| O-2 — `open()` greet vs push-to-talk | `setTimeout` body has three guards: `activeRef`, `speakingRef`, `VoiceBus.state !== 'idle'` | Passed |
| O-3 — Web Speech parallel turns | `turnGenerationRef` increments at entry; `myTurn !== current` checkpoint after SSE parse | Passed |
| O-4 — new turn vs in-flight TTS | `handleUserTurn` calls `cancelAllAudio()` before fetching `/api/chat` | Passed |
| O-5 — queued `SpeechSynthesisUtterance`s | Synth fallback calls `synth.cancel()` before `synth.speak(u)`; `cancelAllAudio` calls it on every cancel | Passed |
| `cancelAllAudio` does not mutate `VoiceBus.state` | Helper ends with `_stopLoop()` and `speakingRef = false`; no `setState` call | Passed |
| AbortController integration | `streamTTS` creates `ac`, passes `signal: ac.signal` to fetch, bails on `ac.signal.aborted` at three await boundaries | Passed |
| Identity checks | `BufferSource.onended` and synth `finishSynth` both wrap state mutation in identity checks | Passed |

## Commands Run

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 2 files / 12 tests passed |
| `npx next build` | Production build succeeded; 12 routes generated |
| `npx next lint --dir src` | Pre-existing warnings only; no new warnings on `voice-controller.ts` |

## Human Verification

The five overlap modes have user-observable behavior changes; manual smoke checks recommended after deploy:

1. **O-1 (stacked sources):** open voice → speak → barge-in mid-answer → speak again. Each new utterance should fully replace the previous. Previously: prior TTS could continue under the new one.
2. **O-2 (greet overlap):** click "Ask Parz" → immediately press Space (or speak) within 480ms. The greet should not play — the user's response/answer plays alone.
3. **O-3 (Web Speech multi-final):** if Scribe is unavailable and Web Speech fallback kicks in, speak with a deliberate mid-pause (e.g. "show me… the portfolio"). Only one response should play.
4. **O-4 (new turn vs prior TTS):** speak, wait for response to start, then quickly say a new utterance. The new response replaces the old; prior TTS halts cleanly.
5. **O-5 (synth fallback queue):** force `/api/tts` failures (block the route) → speak twice quickly. Only the second utterance plays; the first does not stack in the synth queue.

None of these block phase completion; they are post-deploy smoke checks.

## Deferred

- Bonus item from the original audit: barge-in debounce (P3 polish). Not in scope.
- Other Wave 2 P1 items still tracked in `21-AUDIT.md`: F-05 (openTextChat 400ms race), F-06 (STT session-started timeout), F-07 (SpeechSynthesis timeout), F-08 (registerToolCallbacks deregister), F-09 (tool callback try/catch).
