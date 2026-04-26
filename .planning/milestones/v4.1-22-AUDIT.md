# Voice Audio-Serialization Audit

**Date:** 2026-04-26
**Branch:** `nextjs` @ post-Phase-21
**Scope:** Overlapping voices / multiple concurrent TTS streams in the "Ask Parz" voice mode.
**Trigger:** User report — "sometimes... multiple calls go... overlapping voices.. and all that mess".

---

## Verdict

**The bug is still there.** Wave 1 (Phase 21) fixed the SSE chunk-boundary parser, the tour script overlap, the barge-in math under reduce-motion, and the Space-bar hijack. None of those touched the audio-serialization layer. Five distinct overlap modes can still produce concurrent voices.

---

## Overlap Modes

### O-1 — `streamTTS` does not cancel a prior in-flight source
**`src/lib/voice-controller.ts:219-261` (pre-fix)** — every call creates a fresh `BufferSource`, connects it to `ctx.destination`, and only updates `audioSourceRef.current` to point at the new one. The previous source stays connected and keeps playing. `audioSourceRef` only tracks the latest, so `stopAll` and `bargeIn` can't reach the older one — it plays out to its `onended`. Two rapid `speak()` calls = two voices in the room.

### O-2 — `open()` greet timer fires unconditionally
**`src/lib/voice-controller.ts:646-656` (pre-fix)** — `setTimeout(() => speak(greet), 480)` has no guard for "voice closed" or "another speak already running". If the user clicks Ask Parz and immediately push-to-talks (Space), `handleUserTurn` can be mid-response when the 480 ms timer fires. Greet stacks on top of the answer (compounded by O-1).

### O-3 — Web Speech `r.onresult` can fire `handleUserTurn` more than once per session
**`src/lib/voice-controller.ts:499-510`** — `if (finalT) handleUserTurn(finalT.trim())`. The Web Speech API can emit multiple final results in a single session (a pause + continued speech). Each one launches a parallel `handleUserTurn`. The Scribe primary path is mostly safe because we close the connection on entry, but the fallback path is exposed. Two parallel `handleUserTurn`s = two `/api/chat` round-trips = two `speak()` streams overlapping.

### O-4 — `handleUserTurn` doesn't cancel current TTS before starting a new turn
**`src/lib/voice-controller.ts:306-316` (pre-fix)** — closes the STT connection, but doesn't touch `audioSourceRef`, doesn't call `synth.cancel()`, doesn't reset the level loop. If the user barges in successfully, then a new turn starts before `bargeIn`'s teardown completes, you get overlap.

### O-5 — SpeechSynthesis fallback doesn't `cancel()` before `speak()`
**`src/lib/voice-controller.ts:266-290` (pre-fix)** (catch branch of `streamTTS`) — calls `synth.speak(u)` without first calling `synth.cancel()`. Browser synth queues utterances by default. If anything backed up (slow network → repeated `streamTTS` calls all falling to the synth catch), they all play one after another even after the user closed voice. `stopAll` *does* call `synth.cancel()`, but only on close — not at the start of a new speak.

---

## Why Wave 1 didn't fix this

Wave 1 was scoped to user-visible regressions in the existing happy path (SSE drops, scripted-tour overlap, a11y barge-in, Space hijack). The tour rip-out reduced exposure (no more `startTour() + speak()` racing), which probably made the symptom less frequent — but it didn't structurally close any of the five overlap modes. The overlap problem is one cohesive **"speak-serialization is missing"** issue that needs a centralised cancel primitive.

---

## Fix Strategy

Centralise audio cancellation. One helper, four call sites.

**1. `cancelAllAudio()` helper**
- Aborts any in-flight `/api/tts` fetch via tracked `AbortController`.
- Stops the current `BufferSource` (identity check in `onended` skips stale state mutations).
- Calls `synth.cancel()` and drops the tracked utterance.
- Unblocks any pending `speak()` Promise via tracked resolver so old `await speak()` calls don't hang.
- Stops the RMS loop and clears `speakingRef`.
- Does NOT change `VoiceBus.state` — caller decides the new state.

**2. New refs**
- `speakResolverRef` — current Promise resolver, so cancel can unblock awaiters.
- `speakAbortRef` — current `AbortController` for the `/api/tts` fetch.
- `speechUtteranceRef` — current `SpeechSynthesisUtterance` for identity checks in `onend`.
- `turnGenerationRef` — increments per `handleUserTurn`; older parallel turns bail at `await` checkpoints.

**3. Call sites**
- **Top of `streamTTS`** — closes O-1 and O-5. Each speak starts by killing the prior one.
- **Top of `handleUserTurn`** — closes O-4. A new turn can never inherit a still-talking response from the old turn.
- **Inside `bargeIn`** — replaces the bare `audioSourceRef.current?.stop()` with a full cancel.
- **Inside `stopAll`** — replaces the inline cancel block with the helper.
- **Inside `open()` greet timer** — guarded with `activeRef`, `speakingRef`, and `VoiceBus.state !== 'idle'`. Closes O-2.

**4. Stale-turn checkpoint in `handleUserTurn`**
- After SSE parse, before tool dispatch / speak: `if (myTurn !== turnGenerationRef.current) return;`
- Closes O-3: when Web Speech fires a parallel turn, only the latest survives to dispatch tools and speak.

---

## Estimated impact

- **5/5 overlap modes closed** by the fix.
- **~50 lines added, ~25 deleted** in `voice-controller.ts` (one helper, refactored `streamTTS`/`stopAll`/`bargeIn`/`handleUserTurn`/`open`).
- **No new dependencies, no API surface changes** for callers (`speak()` still returns `Promise<void>`).
- **No new tests** — Phase 20 contract suite continues to pass; the regression is timing-dependent and hard to reproduce in headless tests cheaply.
