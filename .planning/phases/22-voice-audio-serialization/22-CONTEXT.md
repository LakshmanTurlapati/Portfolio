# Phase 22: Voice Audio Serialization - Context

**Gathered:** 2026-04-26
**Status:** Audit-driven follow-on to Phase 21 Wave 1.

<domain>
## Phase Boundary

Phase 22 fixes the "overlapping voices / multiple concurrent TTS" symptom that Wave 1 (Phase 21) did not touch. The bug surfaces as the user hearing two TTS streams playing at the same time — typically the greet overlapping a quick first answer, or a previous answer continuing while a new turn starts speaking.

Five distinct overlap modes (cataloged in `22-AUDIT.md` as O-1 through O-5) all share the same root cause: there is no central primitive for "cancel any in-flight TTS before starting another", and `streamTTS` was written as if it would only ever have one source live at a time.

Phase 22 introduces a `cancelAllAudio()` helper and wires it into every relevant entry point: `streamTTS` (preempts prior speaks), `handleUserTurn` (preempts prior responses), `bargeIn` (clean teardown when user interrupts), `stopAll` (close path), and the `open()` greet timer. It also adds a turn-generation counter so old `handleUserTurn` invocations bail at `await` checkpoints when a newer turn has started.

Phase 22 explicitly does NOT cover:
- Other Wave 2 P1 audit findings (STT/TTS timeouts, callback registration churn, exception wrapping, openTextChat 400ms race) — those defer to a future phase.
- Any voice UX redesign or new features.
- Any persona / safety / content changes.

</domain>

<decisions>
## Implementation Decisions

### One helper, four call sites
- Centralise cancellation in `cancelAllAudio()` so every entry point shares the same teardown semantics. Avoids the pattern where each call site partially cleans up and forgets a piece (e.g. `bargeIn` previously stopped the source but didn't cancel synth).

### AbortController for in-flight `/api/tts` fetches
- Without aborting the fetch, a slow `/api/tts` response can land after `cancelAllAudio` has resolved the Promise — the `.then` would create another `BufferSource` for an already-resolved speak, leaking an orphan source that plays unattributed.
- Each `streamTTS` invocation gets its own `AbortController` stored in `speakAbortRef`. `cancelAllAudio` aborts it; the fetch chain checks `ac.signal.aborted` at every `await` boundary and bails early.

### Identity checks in `onended` / `onend`
- A cancelled `BufferSource` will fire `onended` after `stop()` is called, even though we've moved on to a new source. Without an identity check, the cancelled source's handler would set state to `idle`, fight the new source's `speaking` state, and leak.
- The `onended` handler now wraps state mutations in `if (audioSourceRef.current === source)`. Stale sources resolve their Promise but skip state mutation.
- Same pattern for `SpeechSynthesisUtterance` via `speechUtteranceRef`.

### Promise resolver tracking
- An `await speak()` that gets cancelled mid-flight needs to resolve, not hang. `speakResolverRef` tracks the current resolver; `cancelAllAudio` calls it to unblock the awaiter. Then natural-completion paths still resolve their own Promise via the local `resolve` reference (idempotent — Promise resolution is no-op after first call).

### Turn generation counter
- Web Speech fallback (`r.onresult`) can fire `handleUserTurn` multiple times per session. Without a counter, both turns fetch `/api/chat`, dispatch tools, and speak — overlapping.
- `turnGenerationRef` increments on entry. After every `await` (specifically after the `/api/chat` SSE parse), the local `myTurn` is compared. Stale turns bail before dispatching tools or speaking. The `cancelAllAudio` call at the entry of the newer turn already kills any TTS the older turn started.

### `open()` greet guard
- The 480ms `setTimeout` is preserved (it lets the navbar morph settle before the first sound), but now guarded by three conditions: voice still active, no speak already in flight, and `VoiceBus.state === 'idle'`. Any of these false → skip the greet entirely. The user has clearly moved on (closed voice, push-to-talked, or some other speak started).

### State semantics
- `cancelAllAudio` deliberately does NOT mutate `VoiceBus.state`. The caller — `streamTTS`, `bargeIn`, `stopAll` — decides the new state. This avoids an idle/speaking flicker as `cancel` cleans up and the next call sets the new state.

### Verification approach
- Reuse Phase 20's contract suite; no new tests added. The five overlap modes are timing-dependent; reliably reproducing them in a unit test would require mocking `fetch`, `AudioContext`, `setTimeout`, and `SpeechSynthesisUtterance` — high cost, low value compared to a manual smoke check on the deployed test portfolio.
- Verification commands: typecheck, vitest, lint, next build. Manual smoke: open voice, immediately push-to-talk before greet (was overlap), barge-in mid-answer (was overlap), say two utterances quickly through Web Speech fallback (was overlap). All should now serialize cleanly.

### Claude's discretion
- Helper name `cancelAllAudio` (vs. `stopAllAudio`, `cancelTTS`).
- Whether to extract a stable-source helper or keep identity checks inline (kept inline for readability; only two such checks exist).

</decisions>

<code_context>
## Existing code insights

- `src/lib/voice-controller.ts` already had `audioSourceRef` and `speakingRef` from prior phases; Phase 22 adds four siblings (`speakResolverRef`, `speakAbortRef`, `speechUtteranceRef`, `turnGenerationRef`).
- `streamTTS` already returned a Promise but its lifecycle was not externally controllable. Phase 22 makes it controllable via the new refs without changing the call signature.
- The `/api/tts` route emits an MP3 byte stream. Aborting the fetch abandons whatever bytes haven't arrived; the partial buffer is discarded. No server-side cleanup needed.
- `VoiceBus._stopLoop` is idempotent. Calling it from `cancelAllAudio` and then again from a stale `onended` is safe.
- `window.speechSynthesis.cancel()` clears the queue across all utterances in the page, even ones from other React components. This is fine for this app — only `voice-controller` uses synth.

</code_context>
