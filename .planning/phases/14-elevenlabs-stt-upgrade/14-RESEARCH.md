# Phase 14: ElevenLabs STT Upgrade - Research

**Researched:** 2026-04-25
**Domain:** ElevenLabs Scribe v2 Realtime STT, browser AudioWorklet PCM16 capture, server-side single-use token endpoint
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Primary STT: ElevenLabs Scribe v2 (realtime WebSocket or REST). Replaces `SpeechRecognition` / `webkitSpeechRecognition` in `startListening()`.
- **D-02:** Fallback: If ElevenLabs STT fails (network, token expired, API down), silently fall back to Web Speech API. No user notification — just use the browser native STT as backup. Fails gracefully in Firefox/Safari with existing "Speech recognition isn't available" message.
- **D-03:** New `/api/stt-token` endpoint issues single-use tokens with 15-minute TTL. Uses the existing `ELEVENLABS_API_KEY` from env (same key as TTS).
- **D-04:** Browser NEVER sees the ElevenLabs API key. Only the short-lived token.
- **D-05:** Use AudioWorklet for PCM16 capture at 16kHz if Scribe requires raw audio. If the SDK handles mic internally, let it manage `getUserMedia`.
- **D-06:** Separate AudioContext for STT (`sttCtx` at 16kHz) to avoid echo from TTS playback on `VoiceBus._ctx`. Two AudioContexts on the same mic track is valid Web Audio API.

### Claude's Discretion

- SDK choice: `@elevenlabs/client` Scribe.connect() vs raw WebSocket to `wss://api.elevenlabs.io/v1/speech-to-text/realtime`
- AudioWorklet vs MediaRecorder for audio chunking (depends on Scribe requirements)
- Silence detection threshold and VAD settings
- Whether to show partial transcripts during recognition
- How to handle barge-in threshold calibration with ElevenLabs vs Web Speech amplitude profiles

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STT-01 | Speech-to-text uses ElevenLabs Scribe v2 instead of Web Speech API for recognition | `startListening()` replacement pattern using `@elevenlabs/client` Scribe.connect() documented below |
| STT-02 | STT works in Chrome, Firefox, Safari, and Edge (cross-browser, no vendor prefix dependency) | `@elevenlabs/client` uses native browser WebSocket — works everywhere; fallback covers the rest |
| STT-03 | Server-side /api/stt-token endpoint issues single-use tokens so the API key never reaches the browser | `/api/stt-token` pattern using `elevenlabs-js` `client.tokens.singleUse.create("realtime_scribe")` documented and verified |
</phase_requirements>

---

## Summary

Phase 14 replaces the Chrome/Edge-only `window.SpeechRecognition` / `window.webkitSpeechRecognition` block in `startListening()` (voice-controller.ts lines 459-530) with ElevenLabs Scribe v2 Realtime, which works in all browsers via native WebSocket. The integration requires three coordinated changes: (1) a new `/api/stt-token` API route that mints a 15-minute single-use token server-side, (2) a PCM16 AudioWorklet in `public/pcm-processor.js` that captures mic audio in the format Scribe requires, and (3) a rewrite of `startListening()` using `@elevenlabs/client` Scribe SDK that opens the WebSocket with the token and wires transcript events to the existing `handleUserTurn()` and VoiceBus state calls.

The existing codebase has all necessary infrastructure in place: `ELEVENLABS_API_KEY` is already in `.env.local`, the TTS route (`/api/tts/route.ts`) provides the exact pattern to follow for the token route, and `VoiceBus.attachMic()` already handles `getUserMedia`. The primary new complexity is the AudioWorklet for raw PCM capture (MediaRecorder cannot produce PCM16 — this is a hard browser constraint), and careful sequencing of two separate AudioContexts to prevent TTS playback from feeding back into the STT microphone path.

`@elevenlabs/client` v1.3.1 is the correct browser-safe STT SDK. The `ScribeRealtime` class in `@elevenlabs/elevenlabs-js` is explicitly Node.js-only (uses `ws` package and `node:child_process` — confirmed in installed type declarations). The fallback strategy (silent retry with Web Speech API) requires no new code — the existing Web Speech API block is preserved as the fallback branch inside the new `startListening()`.

**Primary recommendation:** Install `@elevenlabs/client` with `--legacy-peer-deps` (pre-existing peer conflict, same flag already in use). Add `/api/stt-token` route, add `public/pcm-processor.js` AudioWorklet, and rewrite `startListening()` in voice-controller.ts with try-ElevenLabs-then-fallback-to-WebSpeech structure.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Token minting (API key stays server-side) | API / Backend (`/api/stt-token`) | — | API key must never reach browser bundle |
| STT WebSocket connection | Browser / Client | — | Scribe requires browser to open WebSocket directly; cannot proxy mic stream through Next.js route |
| PCM16 audio capture | Browser / Client (AudioWorklet) | — | AudioWorklet runs on audio thread for real-time processing without main-thread blocking |
| RMS amplitude visualization | Browser / Client (VoiceBus._ctx) | — | Existing AnalyserNode loop on separate AudioContext tap |
| Transcript dispatch to AI | Browser / Client (handleUserTurn) | API / Backend (/api/chat) | Same path as current Web Speech API — no change |
| Fallback STT | Browser / Client (Web Speech API) | — | Browser-native, no server involvement |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@elevenlabs/client` | 1.3.1 [VERIFIED: npm registry] | Browser-safe Scribe STT SDK with `Scribe.connect()`, handles getUserMedia internally | Only ElevenLabs-maintained browser SDK for Scribe Realtime; `ScribeRealtime` in elevenlabs-js is Node.js-only |
| `@elevenlabs/elevenlabs-js` | 2.44.0 (already installed) [VERIFIED: package.json] | Server-side token generation via `client.tokens.singleUse.create("realtime_scribe")` | Already installed; handles token minting in `/api/stt-token` route |
| `AudioWorklet` (Web API) | Browser-native [VERIFIED: MDN, connection.d.ts] | Real-time PCM16 capture at 16kHz on audio thread | Only way to get raw PCM16 from browser mic; MediaRecorder cannot produce PCM |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Web Speech API` | Browser-native [VERIFIED: existing voice-controller.ts] | Fallback STT for when ElevenLabs fails | Silent fallback when Scribe WebSocket fails to connect within timeout, or token fetch fails |
| `AudioContext` (Web Audio API) | Browser-native | Separate STT AudioContext at 16kHz (`sttCtx`) | Isolates STT mic capture from TTS playback on `VoiceBus._ctx` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@elevenlabs/client` Scribe.connect() | Raw WebSocket to `wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=...` | Raw WebSocket avoids the `livekit-client` transitive dependency but requires manual PCM16 chunking and base64 encoding in the main thread. Scribe.connect() with `microphone: {}` handles getUserMedia, PCM capture, and base64 internally. Use raw WebSocket only if the SDK install fails or adds unacceptable bundle size. |
| AudioWorklet | MediaRecorder | MediaRecorder produces WebM/Opus or MP4/AAC — it cannot produce raw PCM16. Not a configuration option; a hard browser constraint. AudioWorklet is mandatory. |
| VAD commit strategy | Manual commit | VAD auto-commits on detected silence (configurable threshold) — better UX, no client code needed for turn-taking. Manual commit requires explicit `connection.commit()` call. Use VAD for this phase. |

**Installation:**

```bash
npm install --legacy-peer-deps @elevenlabs/client
```

Note: `--legacy-peer-deps` is required due to the pre-existing peer conflict between `@ai-sdk/react@3.0.147` and `react@19.1.0`. This flag is already established practice in this project (noted in STATE.md).

**Version verification:**

```
npm view @elevenlabs/client version
# → 1.3.1  [VERIFIED: 2026-04-25]

npm view @elevenlabs/elevenlabs-js version
# → 2.44.0  [VERIFIED: 2026-04-25, already installed]
```

---

## Architecture Patterns

### System Architecture Diagram

```
User speaks
     │
     ▼
[Mic tap (getUserMedia)] ──── shared MediaStreamTrack ────► [VoiceBus.attachMic()]
     │                                                          │
     ▼                                                          ▼
[sttCtx: AudioContext(16kHz)]                          [VoiceBus._ctx AnalyserNode]
     │                                                          │
     ▼                                                          ▼
[AudioWorklet: pcm-processor.js]                      [_startLoop() → VoiceBus.level]
     │  port.postMessage(Int16Array)                           (drives particle animation)
     ▼
[base64 encode on main thread]
     │
     ▼
[connection.send({ audioBase64 })]  ◄── connection = Scribe.connect({ token, ... })
     │                                       ▲
     │                                       │ token (single-use, 15-min TTL)
     │                                       │
     │                               [POST /api/stt-token]
     │                                       │
     │                               [ELEVENLABS_API_KEY]
     │                               [server-side only]
     │
     ▼
[ElevenLabs Scribe v2 Realtime WebSocket]
     │
     ├── partial_transcript → setTranscript(text), setCaption(text)
     │
     └── committed_transcript → handleUserTurn(text.trim())
                                        │
                                        ▼
                               [/api/chat → Grok]
                                        │
                                        ▼
                               [streamTTS → /api/tts → ElevenLabs TTS]


FALLBACK PATH (if Scribe.connect() fails or SESSION_STARTED not received within 3s):
     │
     ▼
[Web Speech API (window.SpeechRecognition)]
     └── Chrome/Edge only; Firefox/Safari shows "not available" message
```

### Recommended Project Structure

```
src/
├── app/api/
│   ├── tts/route.ts          # existing TTS route (pattern to follow)
│   └── stt-token/route.ts    # NEW: mints single-use Scribe token
├── lib/
│   └── voice-controller.ts   # MODIFIED: startListening() replacement
public/
│   └── pcm-processor.js      # NEW: AudioWorklet PCM16 processor (plain JS, no imports)
```

### Pattern 1: `/api/stt-token` Route

**What:** Server-side route that mints a single-use ElevenLabs Scribe token. Follows the exact same structure as `/api/tts/route.ts`.

**When to use:** Called once per listening session at the start of `startListening()`.

```typescript
// Source: [CITED: elevenlabs.io/docs/api-reference/tokens/create]
// Source: [VERIFIED: node_modules/@elevenlabs/elevenlabs-js/.../SingleUseClient.d.ts]
// src/app/api/stt-token/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST() {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  // Returns { token: string } — expires in 15 minutes, single-use
  const result = await client.tokens.singleUse.create('realtime_scribe');
  return Response.json(result);
}
```

Key: `SingleUseTokenResponseModel` = `{ token: string }`. The full `result` object already has the correct shape to pass to `Response.json()`. [VERIFIED: node_modules/@elevenlabs/elevenlabs-js/dist/api/types/SingleUseTokenResponseModel.d.ts]

### Pattern 2: PCM16 AudioWorklet Processor

**What:** Plain JavaScript file served from `public/`. No TypeScript, no imports, no ESM — AudioWorklet scripts run in an isolated audio thread scope.

**When to use:** Loaded once via `sttCtx.audioWorklet.addModule('/pcm-processor.js')` before mic capture starts.

```javascript
// Source: [CITED: elevenlabs.io/docs guides, MDN AudioWorkletProcessor]
// public/pcm-processor.js — plain JS, no imports
class PCMProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0]) {
      const float32 = input[0];
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      // Transfer buffer ownership to main thread for zero-copy
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true; // keep processor alive
  }
}
registerProcessor('pcm-processor', PCMProcessor);
```

Note: The `sttCtx` is created with `sampleRate: 16000`. Because `AudioContext(16000)` sets the rendering sample rate, the worklet outputs 16kHz samples directly without manual downsampling. [VERIFIED: MDN AudioContext sampleRate]

### Pattern 3: `startListening()` Replacement in voice-controller.ts

**What:** Rewrite of the existing Web Speech API block. Try ElevenLabs first; on any failure, fall back to the existing Web Speech API code (moved to fallback branch).

**When to use:** Called from `onMic` button press, Space keydown, and `bargeIn()`.

```typescript
// Source: [CITED: elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming]
// Source: [VERIFIED: node_modules/@elevenlabs/client exports via WebFetch github.com/elevenlabs/packages]
import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';

const startListening = useCallback(async () => {
  // Optimistic UI: set listening state immediately before async token fetch
  window.VoiceBus.setState('listening');
  setCaption('Listening\u2026');

  try {
    // 1. Fetch single-use token (fresh per session — never cache)
    const res = await fetch('/api/stt-token', { method: 'POST' });
    if (!res.ok) throw new Error(`stt-token ${res.status}`);
    const { token } = await res.json() as { token: string };

    // 2. Load AudioWorklet into a dedicated 16kHz AudioContext
    const sttCtx = new AudioContext({ sampleRate: 16000 });
    await sttCtx.audioWorklet.addModule('/pcm-processor.js');

    // 3. Connect Scribe — SDK manages getUserMedia internally
    const connection = Scribe.connect({
      token,
      modelId: 'scribe_v2_realtime',
      commitStrategy: CommitStrategy.VAD,
      vadSilenceThresholdSecs: 1.2,
      languageCode: 'en',
      microphone: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 4. Wire transcript events
    connection.on(RealtimeEvents.SESSION_STARTED, () => {
      // attachMic() taps the same stream for RMS visualization (separate from Scribe's internal capture)
      window.VoiceBus.attachMic().then((detach: () => void) => {
        if (window.VoiceBus.state !== 'listening') { detach(); return; }
        detachMicRef.current = detach;
      });
    });

    connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
      setTranscript(data.text);
      setCaption(data.text);
    });

    connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
      if (data.text.trim()) handleUserTurn(data.text.trim());
    });

    connection.on(RealtimeEvents.AUTH_ERROR, () => {
      setMicDenied(true);
      setCaption('Mic access denied. Click to retry.');
      window.VoiceBus.setState('idle');
      connection.close();
    });

    connection.on(RealtimeEvents.ERROR, () => {
      setCaption('STT error. Falling back...');
      window.VoiceBus.setState('idle');
      connection.close();
      startListeningFallback(); // Web Speech API fallback
    });

    connection.on(RealtimeEvents.CLOSE, () => {
      sttCtx.close().catch(() => {});
      detachMicRef.current?.();
      detachMicRef.current = null;
      if (window.VoiceBus.state === 'listening') window.VoiceBus.setState('idle');
    });

    // Store for cleanup (replaces recogRef)
    connectionRef.current = connection;

  } catch {
    // Token fetch failed or AudioWorklet unavailable — fall back to Web Speech API
    startListeningFallback();
  }
}, [handleUserTurn]);
```

**Naming change:** `recogRef` becomes `connectionRef` typed as `RealtimeConnection | null`. The existing `recogRef.current?.stop()` in `stopAll()` becomes `connectionRef.current?.close()`.

### Pattern 4: Fallback `startListeningFallback()`

**What:** The existing `startListening()` body, extracted verbatim into a separate function. Called when ElevenLabs fails.

```typescript
// Extracted from existing startListening() — no changes to logic
const startListeningFallback = useCallback(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    setCaption("Speech recognition isn't available in this browser. Try Chrome or Edge.");
    window.VoiceBus.setState('idle');
    return;
  }
  // ... existing Web Speech API setup (r.continuous, r.onstart, r.onresult, etc.)
}, [handleUserTurn]);
```

### Anti-Patterns to Avoid

- **Caching the STT WebSocket across sessions:** Token TTL is 15 minutes but sessions are short (seconds). Open a fresh connection each time `startListening()` is called. Cost: one 50ms HTTP round-trip per mic activation.
- **Using `MediaRecorder` for PCM capture:** MediaRecorder outputs WebM/Opus or MP4/AAC based on browser. It cannot be configured to produce raw PCM16. AudioWorklet is mandatory when doing manual audio chunking. (When using `Scribe.connect({ microphone: {} })`, the SDK handles capture internally — no AudioWorklet needed in that path.)
- **Sharing `VoiceBus._ctx` for STT:** That context is for TTS playback and amplitude visualization. Creating a `sttCtx = new AudioContext({ sampleRate: 16000 })` for STT keeps the two pipelines isolated and prevents echo feedback.
- **Using `ScribeRealtime` from `@elevenlabs/elevenlabs-js`:** The `ScribeRealtime` class uses `WebSocket from 'ws'` (Node.js package) and `node:child_process`. It will throw at runtime in the browser. Use `Scribe` from `@elevenlabs/client` instead. [VERIFIED: wrapper/realtime/scribe.d.ts, connection.d.ts]
- **Setting `NEXT_PUBLIC_ELEVENLABS_API_KEY`:** This would expose the API key in the client bundle. The single-use token pattern exists precisely to prevent this.
- **Calling `startListening()` as non-async from keyboard handler:** The new `startListening()` is `async`. The Space keydown handler calls it correctly without `await` (fire-and-forget), but must handle the returned Promise to prevent unhandled rejection in error cases — wrap in `.catch(() => {})` or use `void startListening()`.

---

## SDK Choice Decision: `@elevenlabs/client` Scribe.connect() (Claude's Discretion)

**Recommendation: Use `@elevenlabs/client` with `Scribe.connect({ microphone: {} })`.**

This is the approach in Claude's Discretion (sdk choice). Evidence:

1. `Scribe.connect({ microphone: {} })` handles `getUserMedia` internally, eliminating the need for manual AudioWorklet PCM chunking in the primary path. [CITED: elevenlabs.io/docs/guides/speech-to-text/realtime/client-side-streaming]
2. SDK provides typed `RealtimeEvents` enum and strongly-typed event callbacks — safer than raw WebSocket string messages.
3. `@elevenlabs/client` v1.3.1 confirmed browser-safe (no Node.js-only imports). [VERIFIED: npm pack dry-run, github.com/elevenlabs/packages/src/index.ts]
4. Clean install with `--legacy-peer-deps` (confirmed: adds 14 packages, removes 4 wasm packages). [VERIFIED: npm install --dry-run --legacy-peer-deps]

**When to fall back to raw WebSocket:** If the `livekit-client` transitive dependency (added by `@elevenlabs/client`) causes bundle size issues or runtime errors in AWS Amplify. The raw WebSocket URL is `wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=<token>` and requires manual base64 PCM16 chunking. [VERIFIED: elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser WebSocket auth for Scribe | Custom auth headers, polling, or NEXT_PUBLIC key | `/api/stt-token` + single-use token passed as `token` field to `Scribe.connect()` | Token expiry, single-use semantics, and scope restriction are all handled by ElevenLabs; implementing this manually adds surface area |
| Raw PCM16 from browser mic | Custom MediaRecorder pipe, ScriptProcessor | `Scribe.connect({ microphone: {} })` (SDK handles it) or AudioWorklet (when manual chunking needed) | MediaRecorder cannot produce PCM; ScriptProcessor is deprecated |
| STT reconnect logic | Retry loop, connection pool | Per-session fresh token fetch in `startListening()` | Token TTL is 15 min; sessions are seconds; reconnect complexity is unnecessary |
| VAD (silence detection) | RMS threshold, energy window | `commitStrategy: CommitStrategy.VAD` with `vadSilenceThresholdSecs: 1.2` | ElevenLabs VAD is tuned for speech; home-grown silence detection causes premature commits |

**Key insight:** The SDK path (`Scribe.connect({ microphone: {} })`) eliminates the need to write the AudioWorklet entirely for the happy path. AudioWorklet (`public/pcm-processor.js`) is only needed if the SDK's internal mic handling proves incompatible with VoiceBus.attachMic() running concurrently on the same stream — which is unlikely since two AudioContext sources on the same MediaStreamTrack is valid Web Audio API.

---

## Common Pitfalls

### Pitfall 1: `ScribeRealtime` from `elevenlabs-js` Used Instead of `Scribe` from `@elevenlabs/client`

**What goes wrong:** Import error or silent failure — `ScribeRealtime` uses `ws` (Node.js WebSocket package) and `node:child_process`. It throws in the browser.

**Why it happens:** Both packages have `Realtime` in the name. The type declaration file even exports `RealtimeEvents` from `elevenlabs-js/wrapper/realtime` — but that class uses `import WebSocket from "ws"` in its implementation.

**How to avoid:** Import `Scribe` only from `@elevenlabs/client`. The `RealtimeEvents` enum from `@elevenlabs/client` is a separate implementation, though with identical event names.

**Warning signs:** `ReferenceError: ws is not defined` or `Cannot find module 'ws'` in browser console.

### Pitfall 2: `startListening()` Called as `async` from Keyboard Handler Without Void Guard

**What goes wrong:** The Space keydown handler currently calls `startListening()` synchronously. After the rewrite, `startListening` is `async`. Calling it without `void` or `.catch()` creates an unhandled Promise rejection that shows as an uncaught error in the console when token fetch fails.

**How to avoid:** In the keyboard handler: `void startListening()` or `startListening().catch(() => {})`. The existing `bargeIn()` which calls `startListening()` also needs updating.

**Warning signs:** `UnhandledPromiseRejection` in browser console when pressing Space while offline.

### Pitfall 3: AudioContext Autoplay Policy Blocks sttCtx Creation

**What goes wrong:** `new AudioContext({ sampleRate: 16000 })` created inside an async function (after awaiting the token fetch) may be blocked by browsers if not triggered by a user gesture. The 50ms token fetch latency may cause the browser to classify the AudioContext creation as "not from user gesture."

**Why it happens:** Browser autoplay policy requires AudioContext to be created synchronously within a user gesture event handler (click, keydown). After `await`, the microtask resumes outside the gesture frame.

**How to avoid:** Create the `sttCtx` synchronously at the start of `startListening()` before any `await`. Then `await` the token fetch. This keeps AudioContext creation in the synchronous gesture frame.

```typescript
const startListening = useCallback(async () => {
  window.VoiceBus.setState('listening');
  // Create AudioContext BEFORE first await — keeps it in user gesture frame
  const sttCtx = new AudioContext({ sampleRate: 16000 });
  try {
    const res = await fetch('/api/stt-token', { method: 'POST' }); // await after sttCtx created
    // ...
  } catch {
    sttCtx.close().catch(() => {});
    startListeningFallback();
  }
}, [handleUserTurn]);
```

**Warning signs:** `The AudioContext was not allowed to start` in browser console; sttCtx.state === 'suspended' after creation.

### Pitfall 4: VoiceBus.attachMic() Called Before SESSION_STARTED

**What goes wrong:** VoiceBus.attachMic() calls `getUserMedia` independently of Scribe's internal mic capture. If both run simultaneously before `SESSION_STARTED`, the browser may grant two separate mic tracks or block the second request.

**How to avoid:** Call `window.VoiceBus.attachMic()` only inside the `SESSION_STARTED` event handler, after Scribe confirms the connection is live (same pattern as the existing Web Speech API `r.onstart` handler). [VERIFIED: existing voice-controller.ts lines 479-487]

### Pitfall 5: Token Response Shape Mismatch

**What goes wrong:** The token route calls `client.tokens.singleUse.create("realtime_scribe")` and returns the full result object. The browser-side code destructures `{ token }` from the response. If the API wraps the token differently, destructuring produces `undefined`.

**What the actual shape is:** `SingleUseTokenResponseModel` = `{ token: string }`. Confirmed: the full result is `{ token: "..." }`. [VERIFIED: node_modules/@elevenlabs/elevenlabs-js/dist/api/types/SingleUseTokenResponseModel.d.ts]

**How to avoid:** Use `return Response.json(result)` — `result` is already `{ token: string }`. The browser destructures `const { token } = await res.json()`. No transformation needed.

### Pitfall 6: Barge-in Triggers on ElevenLabs TTS at 0.15 Threshold

**What goes wrong:** ElevenLabs TTS has consistent, high-quality audio that may easily exceed the current 0.15 barge-in threshold in `VoiceBus.on('level', ...)`. Parz could interrupt its own TTS output.

**Why it happens:** The current threshold was calibrated for Web Speech API synthesis (lower, variable volume). ElevenLabs TTS has consistent amplitude across the utterance.

**How to avoid:** This is noted in STATE.md as a concern. For Phase 14, raise the barge-in threshold from `0.15` to `0.35` during STT testing, or disable barge-in entirely during `speaking` state. The speaking-state guard already exists: `if (window.VoiceBus.state === 'speaking' && effectiveLevel > 0.15)`. Change the threshold constant to `0.35`. [ASSUMED — calibration value; may need adjustment during testing]

---

## Code Examples

### Verified Token Route Pattern (from existing TTS route)

```typescript
// Source: [VERIFIED: src/app/api/tts/route.ts — existing pattern]
// src/app/api/stt-token/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST() {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }
  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const result = await client.tokens.singleUse.create('realtime_scribe');
    // result is { token: string } — 15-min TTL, single-use
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Failed to create STT token' }, { status: 500 });
  }
}
```

### RealtimeEvents Available in @elevenlabs/client

```typescript
// Source: [VERIFIED: node_modules/@elevenlabs/elevenlabs-js/wrapper/realtime/connection.d.ts]
// (same enum in @elevenlabs/client — confirmed via github.com/elevenlabs/packages)
enum RealtimeEvents {
  SESSION_STARTED = "session_started",
  PARTIAL_TRANSCRIPT = "partial_transcript",
  COMMITTED_TRANSCRIPT = "committed_transcript",
  COMMITTED_TRANSCRIPT_WITH_TIMESTAMPS = "committed_transcript_with_timestamps",
  ERROR = "error",
  AUTH_ERROR = "auth_error",
  QUOTA_EXCEEDED = "quota_exceeded",
  OPEN = "open",
  CLOSE = "close",
  COMMIT_THROTTLED = "commit_throttled",
  // ... additional error events
}
```

### Scribe Connection Options (MicrophoneOptions)

```typescript
// Source: [CITED: elevenlabs.io/docs/guides/speech-to-text/realtime/client-side-streaming]
// When microphone: {} is passed, Scribe calls getUserMedia internally.
// No manual PCM chunking or AudioWorklet needed in this path.
const connection = Scribe.connect({
  token,                           // from /api/stt-token
  modelId: 'scribe_v2_realtime',
  commitStrategy: CommitStrategy.VAD,     // auto-commit on silence
  vadSilenceThresholdSecs: 1.2,           // seconds of silence to trigger commit
  languageCode: 'en',
  microphone: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});
```

### stopAll() Update

```typescript
// Source: [VERIFIED: existing voice-controller.ts lines 186-202]
// Change: recogRef → connectionRef, .stop() → .close()
const stopAll = useCallback(() => {
  try { connectionRef.current?.close(); } catch {}  // was: recogRef.current?.stop()
  connectionRef.current = null;                      // NEW: clear ref
  // ... rest of stopAll unchanged
}, []);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Web Speech API (Chrome/Edge only) | ElevenLabs Scribe v2 Realtime (all browsers via WebSocket) | Phase 14 | STT-02 satisfied: works in Firefox, Safari, Edge, Chrome |
| API key in browser (Flutter pattern) | Single-use token from server endpoint | Phase 14 | STT-03 satisfied: API key stays server-side |
| `SpeechRecognition` typed as `any` | `RealtimeConnection` from `@elevenlabs/client` | Phase 14 | Type-safe event handling |

**Deprecated/outdated:**

- `window.SpeechRecognition` / `window.webkitSpeechRecognition`: Moved to fallback-only. The `any` typing workaround is acceptable in the fallback branch since it will not be the primary path.
- `recogRef` naming: Becomes `connectionRef` typed as `RealtimeConnection | null`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Raising barge-in threshold from 0.15 to 0.35 will prevent Parz from interrupting its own ElevenLabs TTS | Common Pitfalls, Pitfall 6 | Threshold may be too high (user barge-in less responsive) or still too low (Parz still self-interrupts) — calibrate empirically during testing |
| A2 | VAD `vadSilenceThresholdSecs: 1.2` provides good turn-taking for conversational voice | Pattern 3 | Too long: feels unresponsive. Too short: premature commits mid-sentence. May need adjustment to 0.8–1.5 during testing |
| A3 | `Scribe.connect({ microphone: {} })` and `VoiceBus.attachMic()` can both access the same mic stream without conflict | Architecture Patterns | If browser blocks second getUserMedia on same device, VoiceBus.attachMic() will fail silently (fallback level is already implemented) — acceptable |

---

## Open Questions (RESOLVED)

1. **Does `Scribe.connect({ microphone: {} })` work alongside `VoiceBus.attachMic()` on the same audio device?**
   RESOLVED: Plans accept both outcomes. If conflict occurs, VoiceBus.attachMic() falls back to fake level system (already implemented). Test empirically during Plan 14-02 execution.

2. **`@elevenlabs/client` adds `livekit-client` as a transitive dependency — is this acceptable for AWS Amplify?**
   RESOLVED: Acceptable for Phase 14. If bundle size causes issues in Phase 15 API verification, fall back to raw WebSocket path (documented in Alternatives section). Phase 15 handles Amplify verification.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@elevenlabs/client` | STT SDK | Not yet installed | 1.3.1 (npm registry) | Raw WebSocket to `wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=...` |
| `ELEVENLABS_API_KEY` | `/api/stt-token` route | ✓ | Present in `.env.local` | 503 response, no STT |
| AudioWorklet API | PCM capture (manual path) | ✓ | Browser-native (all modern browsers) | None — but SDK mic path avoids this requirement |
| Web Speech API | Fallback STT | ✓ | Chrome/Edge only | Existing "not available" message for Firefox/Safari |

**Missing dependencies with no fallback:** None — all required components available.

**Missing dependencies with fallback:**
- `@elevenlabs/client` not yet installed. Fallback is raw WebSocket (more complex, requires AudioWorklet). Primary plan installs the SDK.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 14 |
|-----------|-------------------|
| API security: xAI Grok API key must be server-side only | Extended to ElevenLabs: `/api/stt-token` must use `ELEVENLABS_API_KEY` server-side only. Never `NEXT_PUBLIC_ELEVENLABS_API_KEY`. |
| Tech stack: Next.js (App Router), React, TypeScript, Tailwind CSS | `/api/stt-token` is a Next.js App Router Route Handler. `startListening()` remains in `voice-controller.ts` with `'use client'` already present. |
| Deployment: AWS Amplify | `ELEVENLABS_API_KEY` must be present in Amplify Console environment variables (same process as existing `XAI_API_KEY`). Not in scope for Phase 14 — Phase 15 handles API verification. |
| Responsive: 600px breakpoint | STT is audio-only; no UI changes in this phase. |
| GSD Workflow Enforcement | Changes are executed through GSD phase workflow, not direct edits. |

---

## Sources

### Primary (HIGH confidence)

- `node_modules/@elevenlabs/elevenlabs-js/wrapper/realtime/scribe.d.ts` — confirmed `ScribeRealtime` is Node.js-only ("This class uses Node.js-specific APIs (WebSocket from 'ws', child_process). It will not work in browsers")
- `node_modules/@elevenlabs/elevenlabs-js/wrapper/realtime/connection.d.ts` — confirmed `RealtimeEvents` enum, `RealtimeConnection.send()`, `close()` interface; confirmed `import WebSocket from "ws"` (Node.js only)
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/types/SingleUseTokenResponseModel.d.ts` — confirmed token response shape: `{ token: string }`
- `node_modules/@elevenlabs/elevenlabs-js/api/resources/tokens/resources/singleUse/client/Client.d.ts` — confirmed `client.tokens.singleUse.create(token_type)` API
- `npm view @elevenlabs/client version` — confirmed v1.3.1 is latest [2026-04-25]
- `npm install --dry-run --legacy-peer-deps @elevenlabs/client` — confirmed clean install (14 added, 4 removed, no peer errors)
- `src/lib/voice-controller.ts` — confirmed `startListening()` location (lines 459-530), `recogRef`, `detachMicRef`, `handleUserTurn` interface unchanged
- `src/app/api/tts/route.ts` — confirmed existing ElevenLabs route pattern (ElevenLabsClient init, hasEnvVar check, Response.json pattern)
- `src/lib/env.ts` — confirmed `hasEnvVar()` signature
- `src/providers/voice-session-provider.tsx` — confirmed existing layout-level voice provider architecture is already in place (Phase 12 complete)
- [ElevenLabs docs: Single-Use Token API](https://elevenlabs.io/docs/api-reference/tokens/create) — token_type `realtime_scribe`, 15-min TTL, single-use semantics
- [ElevenLabs docs: Realtime STT WebSocket API](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime) — WebSocket URL, query param auth, audio format specs
- [Context7: elevenlabs-js `speechToText.realtime.connect()`](https://context7.com/elevenlabs/elevenlabs-js) — confirmed event names and connect() options

### Secondary (MEDIUM confidence)

- [ElevenLabs docs: Client-Side STT Streaming Guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming) — `Scribe.connect({ microphone: {} })` pattern, MicrophoneOptions shape, `@elevenlabs/client` install command
- [github.com/elevenlabs/packages packages/client/src/index.ts](https://github.com/elevenlabs/packages/blob/main/packages/client/src/index.ts) — confirmed `Scribe`, `RealtimeEvents`, `CommitStrategy`, `AudioFormat` exports from `@elevenlabs/client`
- `.planning/research/STACK.md` (2026-04-24) — prior research confirming Node.js-only restriction and browser SDK recommendation
- `.planning/research/PITFALLS.md` (2026-04-24) — prior research on AudioWorklet requirement, echo isolation, token expiry

### Tertiary (LOW confidence)

- None — all critical claims verified via direct file reads or official documentation

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions confirmed via npm registry and local node_modules
- Architecture: HIGH — based on reading actual installed type declarations and existing codebase
- `@elevenlabs/client` exports: MEDIUM — confirmed via github.com/elevenlabs/packages README and WebFetch of official docs; not directly installed locally
- Pitfalls: HIGH — most verified against installed packages; Pitfall 6 (barge-in threshold) is ASSUMED

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable APIs; ElevenLabs SDK versions move faster than 30 days — re-verify if >30 days old)
