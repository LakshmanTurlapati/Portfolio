# Phase 14: ElevenLabs STT Upgrade - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace Web Speech API speech-to-text with ElevenLabs Scribe v2 for cross-browser recognition. Add server-side token endpoint. Keep existing VoiceBus integration and voice UX unchanged.

</domain>

<decisions>
## Implementation Decisions

### STT Engine
- **D-01:** Primary STT: ElevenLabs Scribe v2 (realtime WebSocket or REST). Replaces `SpeechRecognition` / `webkitSpeechRecognition` in `startListening()`.
- **D-02:** Fallback: If ElevenLabs STT fails (network, token expired, API down), silently fall back to Web Speech API. No user notification — just use the browser native STT as backup. Fails gracefully in Firefox/Safari with existing "Speech recognition isn't available" message.

### Token Security
- **D-03:** New `/api/stt-token` endpoint issues single-use tokens with 15-minute TTL. Uses the existing `ELEVENLABS_API_KEY` from env (same key as TTS).
- **D-04:** Browser NEVER sees the ElevenLabs API key. Only the short-lived token.

### Audio Capture
- **D-05:** Use AudioWorklet for PCM16 capture at 16kHz if Scribe requires raw audio. If the SDK handles mic internally, let it manage `getUserMedia`.
- **D-06:** Separate AudioContext for STT (`sttCtx` at 16kHz) to avoid echo from TTS playback on `VoiceBus._ctx`. Two AudioContexts on the same mic track is valid Web Audio API.

### Claude's Discretion
- SDK choice: `@elevenlabs/client` Scribe.connect() vs raw WebSocket to `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
- AudioWorklet vs MediaRecorder for audio chunking (depends on Scribe requirements)
- Silence detection threshold and VAD settings
- Whether to show partial transcripts during recognition
- How to handle barge-in threshold calibration with ElevenLabs vs Web Speech amplitude profiles

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Voice Controller
- `src/lib/voice-controller.ts` — `startListening()` function (lines 450-520) is the replacement target
- `src/lib/voice-bus-init.ts` — VoiceBus state machine, `attachMic()`, `_getCtx()`
- `src/providers/voice-session-provider.tsx` — Layout-level voice session

### API Routes
- `src/app/api/tts/route.ts` — Existing ElevenLabs TTS route (pattern to follow for stt-token)
- `src/lib/env.ts` — `hasEnvVar()` for API key validation

### Research
- `.planning/research/STACK.md` — ElevenLabs STT SDK details
- `.planning/research/PITFALLS.md` — AudioWorklet requirements, AudioContext echo, MediaRecorder PCM16 limitation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ELEVENLABS_API_KEY` already in env — same key for both TTS and STT
- `VoiceBus.attachMic()` — already handles getUserMedia and RMS amplitude visualization
- `/api/tts/route.ts` — pattern for ElevenLabs API route with key validation
- `hasEnvVar()` from `src/lib/env.ts`

### Established Patterns
- ElevenLabs client: `@elevenlabs/elevenlabs-js` v2.44.0 already installed
- Server-side API route pattern: validate key → call ElevenLabs → return response
- VoiceBus state: `listening` → mic active, `thinking` → processing, `speaking` → TTS playing

### Integration Points
- `startListening()` in voice-controller.ts — swap implementation, keep same interface
- `VoiceBus.attachMic()` — may need parallel mic stream for RMS visualization while Scribe handles recognition
- `handleUserTurn(finalTranscript)` — called with final text, unchanged interface

</code_context>

<specifics>
## Specific Ideas

- Silent fallback to Web Speech API — no user notification, just works (or doesn't in Firefox/Safari)
- Same voice UX — user shouldn't notice the STT engine change, just better quality and cross-browser support

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-elevenlabs-stt-upgrade*
*Context gathered: 2026-04-25*
