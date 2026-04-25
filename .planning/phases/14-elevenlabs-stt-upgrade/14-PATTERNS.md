# Phase 14: ElevenLabs STT Upgrade - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 3 new/modified files
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/stt-token/route.ts` | api-route | request-response | `src/app/api/tts/route.ts` | exact |
| `public/pcm-processor.js` | utility | streaming | none (first AudioWorklet in project) | no analog |
| `src/lib/voice-controller.ts` | hook | event-driven | self (existing `startListening()`, lines 458-530) | self-modification |

---

## Pattern Assignments

### `src/app/api/stt-token/route.ts` (api-route, request-response)

**Analog:** `src/app/api/tts/route.ts`

**Imports pattern** (lines 1-6 of tts/route.ts):
```typescript
// src/app/api/tts/route.ts — copy this import block verbatim, change nothing
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';
```

**Auth/guard pattern** (lines 11-16 of tts/route.ts):
```typescript
// Key check at top of handler — exact same check, different key name string
if (!hasEnvVar('ELEVENLABS_API_KEY')) {
  return new Response(
    JSON.stringify({ error: 'TTS not configured' }),
    { status: 503, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Core pattern — token route diverges from TTS here:**
```typescript
// stt-token route uses Response.json() (not new Response()) — lighter form is valid
// The full result object from client.tokens.singleUse.create() IS already { token: string }
// No transformation needed — return result directly.
export async function POST() {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }
  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const result = await client.tokens.singleUse.create('realtime_scribe');
    return Response.json(result); // result = { token: string }
  } catch {
    return Response.json({ error: 'Failed to create STT token' }, { status: 500 });
  }
}
```

**Error handling pattern** (lines 50-56 of tts/route.ts):
```typescript
// Outer try/catch wraps all ElevenLabs client work — same in stt-token
} catch {
  return new Response(
    JSON.stringify({ error: 'TTS failed' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Key differences from TTS route:**
- Handler is `POST()` with no `req` parameter (no request body needed — token minting takes no input)
- No request body validation block (lines 18-37 of TTS route) — skip entirely
- Return `Response.json(result)` shorthand instead of `new Response(JSON.stringify(...), { headers })` — both are valid in Next.js App Router
- `token_type` argument to `client.tokens.singleUse.create()` is the string `'realtime_scribe'`

---

### `public/pcm-processor.js` (utility, streaming)

**Analog:** None — first AudioWorklet file in the project.

**No-analog constraints to enforce:**
- Plain JavaScript only — no TypeScript, no imports, no ESM `import`/`export`
- Must be served from `public/` root so it resolves as `/pcm-processor.js`
- `registerProcessor()` call is mandatory — AudioWorklet engine will not load the module without it
- The `process()` method must `return true` to keep the processor alive; returning `false` auto-terminates it

**Core pattern (from RESEARCH.md Pattern 2):**
```javascript
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

**Usage in voice-controller.ts (when SDK mic handling is insufficient):**
```typescript
// Create sttCtx BEFORE first await to stay in user gesture frame
const sttCtx = new AudioContext({ sampleRate: 16000 });
await sttCtx.audioWorklet.addModule('/pcm-processor.js');
```

Note: If `Scribe.connect({ microphone: {} })` handles mic capture internally (SDK path), this worklet is not loaded — it is only needed for the manual PCM chunking path.

---

### `src/lib/voice-controller.ts` — `startListening()` replacement (hook, event-driven)

**Analog:** Self — existing `startListening()` at lines 458-530. The modification is a surgical replacement of this one function plus two ref renames.

**Existing ref declaration to replace** (line 77):
```typescript
// BEFORE (line 77):
const recogRef = useRef<any>(null);

// AFTER — typed as RealtimeConnection | null, import from @elevenlabs/client:
import type { RealtimeConnection } from '@elevenlabs/client';
// ...
const connectionRef = useRef<RealtimeConnection | null>(null);
```

**Imports to add** (after existing imports at top of file):
```typescript
import { Scribe, RealtimeEvents, CommitStrategy } from '@elevenlabs/client';
import type { RealtimeConnection } from '@elevenlabs/client';
```

**Existing stopAll() — ref rename only** (lines 186-202):
```typescript
// BEFORE (lines 187, 200 in stopAll):
try { recogRef.current?.stop(); } catch {}

// AFTER:
try { connectionRef.current?.close(); } catch {}
connectionRef.current = null;
```

**Existing keyboard handler — void guard needed** (lines 588-611):
```typescript
// BEFORE (line 591):
startListening();

// AFTER — startListening() is now async, guard against unhandled rejection:
void startListening();

// BEFORE (line 600):
recogRef.current?.stop();

// AFTER:
connectionRef.current?.close();
connectionRef.current = null;
```

**New startListeningFallback() — extract existing body verbatim** (insert before startListening):
```typescript
// Extracted from existing startListening() — no logic changes
// Per D-02: silent fallback when ElevenLabs fails
const startListeningFallback = useCallback(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) {
    setCaption("Speech recognition isn't available in this browser. Try Chrome or Edge.");
    window.VoiceBus.setState('idle');
    return;
  }

  try { connectionRef.current?.close(); } catch {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = new SR() as any;
  r.continuous = false;
  r.interimResults = true;
  r.lang = 'en-US';

  r.onstart = () => {
    window.VoiceBus.setState('listening');
    setCaption('Listening\u2026');
    window.VoiceBus.attachMic().then((detach: () => void) => {
      if (window.VoiceBus.state !== 'listening') {
        try { detach(); } catch {}
        return;
      }
      detachMicRef.current = detach;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onresult = (ev: any) => {
    let interim = '';
    let finalT = '';
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const t = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) finalT += t;
      else interim += t;
    }
    setTranscript(interim || finalT);
    setCaption(interim || finalT);
    if (finalT) handleUserTurn(finalT.trim());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  r.onerror = (e: any) => {
    if (e.error === 'not-allowed') {
      setMicDenied(true);
      setCaption('Mic access denied. Click to retry.');
    } else {
      setCaption('Mic error: ' + e.error);
    }
    window.VoiceBus.setState('idle');
  };

  r.onend = () => {
    try {
      detachMicRef.current?.();
      detachMicRef.current = null;
    } catch {}
    if (window.VoiceBus.state === 'listening') {
      window.VoiceBus.setState('idle');
    }
  };

  connectionRef.current = r as unknown as RealtimeConnection;
  try { r.start(); } catch (e) {
    setCaption("Couldn't start mic: " + (e as Error).message);
  }
}, [handleUserTurn]);
```

**New startListening() — ElevenLabs primary path** (replaces lines 458-530):
```typescript
// startListening — ElevenLabs Scribe v2 primary, Web Speech API fallback (per D-01, D-02)
const startListening = useCallback(async () => {
  window.VoiceBus.setState('listening');
  setCaption('Listening\u2026');

  // Create AudioContext BEFORE first await — keeps creation in user gesture frame
  // per RESEARCH.md Pitfall 3: AudioContext autoplay policy
  const sttCtx = new AudioContext({ sampleRate: 16000 });

  try {
    // 1. Fetch single-use token — never cached, fresh per session (per D-03, D-04)
    const res = await fetch('/api/stt-token', { method: 'POST' });
    if (!res.ok) throw new Error(`stt-token ${res.status}`);
    const { token } = await res.json() as { token: string };

    // 2. Connect Scribe — SDK manages getUserMedia internally (per D-05)
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

    // 3. Wire transcript events
    connection.on(RealtimeEvents.SESSION_STARTED, () => {
      // Per D-06: attach VoiceBus mic AFTER session confirmed for RMS visualization
      // Mirrors existing r.onstart pattern (voice-controller.ts lines 476-488)
      window.VoiceBus.attachMic().then((detach: () => void) => {
        if (window.VoiceBus.state !== 'listening') { detach(); return; }
        detachMicRef.current = detach;
      });
    });

    connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (data) => {
      setTranscript((data as { text: string }).text);
      setCaption((data as { text: string }).text);
    });

    connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (data) => {
      const text = (data as { text: string }).text.trim();
      if (text) handleUserTurn(text);
    });

    connection.on(RealtimeEvents.AUTH_ERROR, () => {
      setMicDenied(true);
      setCaption('Mic access denied. Click to retry.');
      window.VoiceBus.setState('idle');
      connection.close();
    });

    connection.on(RealtimeEvents.ERROR, () => {
      window.VoiceBus.setState('idle');
      connection.close();
      startListeningFallback(); // per D-02: silent fallback
    });

    connection.on(RealtimeEvents.CLOSE, () => {
      sttCtx.close().catch(() => {});
      detachMicRef.current?.();
      detachMicRef.current = null;
      if (window.VoiceBus.state === 'listening') window.VoiceBus.setState('idle');
    });

    connectionRef.current = connection;

  } catch {
    // Token fetch failed or SDK unavailable — silent fallback to Web Speech API (per D-02)
    sttCtx.close().catch(() => {});
    startListeningFallback();
  }
}, [handleUserTurn, startListeningFallback]);
```

**bargeIn() — update to use connectionRef** (lines 532-539):
```typescript
// No logic change — just ref rename
const bargeIn = useCallback(() => {
  try { audioSourceRef.current?.stop(); } catch {}
  audioSourceRef.current = null;
  window.VoiceBus._stopLoop();
  window.VoiceBus.setState('listening');
  void startListening(); // void guard: startListening is now async
}, [startListening]);
```

**Barge-in threshold update** (line 552 — per RESEARCH.md Pitfall 6):
```typescript
// BEFORE:
if (window.VoiceBus.state === 'speaking' && effectiveLevel > 0.15) {

// AFTER — ElevenLabs TTS amplitude is higher and more consistent than Web Speech API:
if (window.VoiceBus.state === 'speaking' && effectiveLevel > 0.35) {
```

---

## Shared Patterns

### API Key Guard Pattern
**Source:** `src/app/api/tts/route.ts` lines 11-16
**Apply to:** `src/app/api/stt-token/route.ts`
```typescript
if (!hasEnvVar('ELEVENLABS_API_KEY')) {
  return Response.json({ error: 'STT not configured' }, { status: 503 });
}
```

### ElevenLabsClient Initialization
**Source:** `src/app/api/tts/route.ts` line 40
**Apply to:** `src/app/api/stt-token/route.ts`
```typescript
const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
```

### VoiceBus.attachMic() Deferred Call (after connection confirmed)
**Source:** `src/lib/voice-controller.ts` lines 480-487 (inside `r.onstart`)
**Apply to:** `SESSION_STARTED` handler in new `startListening()`
```typescript
window.VoiceBus.attachMic().then((detach: () => void) => {
  if (window.VoiceBus.state !== 'listening') {
    try { detach(); } catch {}
    return;
  }
  detachMicRef.current = detach;
});
```

### detachMicRef Cleanup Pattern
**Source:** `src/lib/voice-controller.ts` lines 516-523 (inside `r.onend`)
**Apply to:** `CLOSE` event handler in new `startListening()`
```typescript
try {
  detachMicRef.current?.();
  detachMicRef.current = null;
} catch {}
if (window.VoiceBus.state === 'listening') {
  window.VoiceBus.setState('idle');
}
```

### try/catch-wrapped Ref Stop in stopAll
**Source:** `src/lib/voice-controller.ts` line 187
**Apply to:** All places that were `recogRef.current?.stop()` — rename to `connectionRef.current?.close()`
```typescript
try { connectionRef.current?.close(); } catch {}
connectionRef.current = null;
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `public/pcm-processor.js` | utility | streaming | No AudioWorklet files exist in the project. Only needed if SDK mic path (`Scribe.connect({ microphone: {} })`) is insufficient; otherwise omit entirely. |

---

## Metadata

**Analog search scope:** `src/app/api/`, `src/lib/`, `public/`
**Files scanned:** 6 (tts/route.ts, chat/route.ts, github-stats/route.ts, env.ts, voice-controller.ts, voice-bus-init.ts)
**Pattern extraction date:** 2026-04-25

**Critical ordering constraint:** In `voice-controller.ts`, `startListeningFallback` must be declared before `startListening` in the file, because `startListening`'s `useCallback` dependency array includes `startListeningFallback`.
