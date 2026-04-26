---
phase: 22
plan: 01
subsystem: voice
tags: [audio, tts, cancellation, abortcontroller, serialization]
key-files:
  - src/lib/voice-controller.ts
metrics:
  overlap_modes_closed: 5
  new_refs: 4
  helper_added: cancelAllAudio
---

# Plan 22-01 Summary: Voice Audio Serialization

## What Changed

### `cancelAllAudio()` helper
Single source of truth for stopping in-flight TTS. Aborts the `/api/tts` fetch via tracked `AbortController`, stops the current `BufferSource`, drops the tracked `SpeechSynthesisUtterance` and calls `synth.cancel()`, unblocks any pending `speak()` Promise via the resolver ref, stops the RMS loop, and clears `speakingRef`. Does not mutate `VoiceBus.state` — the caller decides the new state.

### Four new refs
- `speakResolverRef` — Promise resolver; cancel uses this to unblock awaiters so old `await speak()` calls don't hang.
- `speakAbortRef` — `AbortController` for the in-flight `/api/tts` fetch; cancel aborts it; the fetch chain checks `signal.aborted` at every `await` and bails.
- `speechUtteranceRef` — current `SpeechSynthesisUtterance`; identity-checked in `onend` / `onerror` so a stale utterance doesn't reset state on top of a new speak.
- `turnGenerationRef` — counter incremented at the top of every `handleUserTurn`; older parallel turns bail at the post-SSE-parse checkpoint.

### `streamTTS` refactor
- Cancels prior speak at entry — closes O-1 (stacked `BufferSource`s) and O-5 (queued `SpeechSynthesisUtterance`s).
- AbortController-aware fetch chain bails on cancellation at three `await` boundaries (after fetch, after `arrayBuffer`, after `decodeAudioData`).
- `.catch` skips the synth fallback if the fetch was aborted (otherwise we'd spin up synth for a cancelled speak).
- Synth fallback now calls `synth.cancel()` before `synth.speak(u)` and identity-checks `u` in shared `finishSynth` handler.
- `BufferSource.onended` identity-checks the source — a cancelled source's late-firing `onended` no longer mutates state.

### `stopAll`, `bargeIn` refactor
- `stopAll`: closes Scribe, delegates audio teardown to `cancelAllAudio`, detaches mic, sets state to `'idle'`, clears UI strings.
- `bargeIn`: delegates to `cancelAllAudio`, sets state to `'listening'`, void-calls `startListening`.

### `handleUserTurn` guards
- Calls `cancelAllAudio()` after closing STT but before fetching `/api/chat` — closes O-4.
- Bumps `turnGenerationRef.current`; captures `myTurn`. Stale-turn checkpoint after SSE parse: `if (myTurn !== turnGenerationRef.current) return` — closes O-3 (Web Speech multi-final firing parallel turns).

### `open()` greet guard
- `setTimeout` body now bails on three conditions: voice closed in the interim, speak already in flight, or `VoiceBus.state !== 'idle'` — closes O-2 (greet overlapping a fast push-to-talk).

## Verification

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Clean (no output) |
| `npx vitest run` | 12/12 tests pass across 2 files |
| `npx next build` | Succeeds, all 12 routes generated |
| `npx next lint --dir src` | No new warnings on `voice-controller.ts` |

## Deviations

- No new automated tests. The overlap modes are timing-dependent and would require mocking `fetch` + `AudioContext` + `SpeechSynthesisUtterance` + `setTimeout` simultaneously to reproduce reliably. Manual smoke checks documented in `22-VERIFICATION.md`.
- The "barge-in debounce" item from the original audit is NOT in this phase. Existing state-guard (`if (state === 'speaking' && ...)`) prevents re-entry within a single barge-in window; explicit debounce is P3 polish.

## Self-Check

PASSED. All five overlap modes (O-1 through O-5) have shipped fixes. The audio pipeline now has a single cancellation primitive, an AbortController on the TTS fetch, identity checks on the source/utterance handlers, and a turn-generation counter on `handleUserTurn`. Typecheck, tests, and build are green.
