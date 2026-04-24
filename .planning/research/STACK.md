# Stack Research

**Domain:** Voice mode production features for Next.js portfolio (v4.0 milestone)
**Researched:** 2026-04-24
**Confidence:** HIGH

> This is an addendum to the original STACK.md (2026-04-02). The base stack (Next.js 15,
> React 19, TypeScript, Tailwind CSS 4, GSAP, @ai-sdk/xai, @elevenlabs/elevenlabs-js v2.44.0)
> is validated and NOT re-researched here. This document covers only the NEW additions and
> changes needed for milestone v4.0: ElevenLabs STT, persistent voice overlay, and tool
> callback wiring.

---

## Summary: What Changes in v4.0

| Area | Current (v3) | Target (v4) | Change Required |
|------|-------------|-------------|-----------------|
| STT engine | Web Speech API (`SpeechRecognition`) | ElevenLabs Scribe v2 Realtime | Add `@elevenlabs/client` v1.3.1 |
| STT token auth | N/A | Server-side single-use token via `elevenlabs-js` | New API route `/api/stt-token` |
| Voice overlay location | Per-page (`page.tsx`) | Root layout (`layout.tsx`) | Lift `useVoiceController` to layout |
| Tool callbacks | Stubs with console.warn | Wired to page actions | Context pattern (no new package) |
| New package | — | `@elevenlabs/client` | One install |

---

## Core Addition: @elevenlabs/client

### Why a separate package from @elevenlabs/elevenlabs-js

The existing `@elevenlabs/elevenlabs-js` v2.44.0 already handles TTS via the server-side
`/api/tts` route. However, its `ScribeRealtime` class is **explicitly documented as Node.js
only** (uses the `ws` package and `child_process` — confirmed by reading the installed type
declaration at `wrapper/realtime/scribe.d.ts`, which states: "This class uses Node.js-specific
APIs (WebSocket from 'ws', child_process). It will not work in browsers, Deno, or Cloudflare
Workers without modifications.").

`@elevenlabs/client` is ElevenLabs' separate browser-safe SDK. It exports `Scribe` (a static
class with `Scribe.connect()`) and `RealtimeEvents` designed for browser microphone capture. It
is the package referenced in ElevenLabs' own client-side streaming guide.

### Package Details

| Package | Version | Source | Confidence |
|---------|---------|--------|------------|
| `@elevenlabs/client` | `1.3.1` | `npm view @elevenlabs/client version` (verified live) | HIGH |

```bash
npm install @elevenlabs/client
```

### What it exports (confirmed via ElevenLabs docs + deepwiki source analysis)

```typescript
import { Scribe, RealtimeEvents } from '@elevenlabs/client';
```

**`Scribe.connect(options)`** — static method, returns `RealtimeConnection` synchronously
(socket opens asynchronously). Takes either `MicrophoneOptions` (browser mic, no manual
chunking) or `AudioOptions` (manual PCM chunks).

**`MicrophoneOptions`:**
```typescript
{
  token: string;            // single-use token from /api/stt-token
  modelId: 'scribe_v2_realtime';
  commitStrategy?: CommitStrategy.VAD | CommitStrategy.MANUAL;  // default MANUAL
  vadSilenceThresholdSecs?: number;  // 0.3–3.0
  vadThreshold?: number;             // 0.1–0.9
  languageCode?: string;             // 'en' recommended
  microphone?: {
    echoCancellation?: boolean;   // default true
    noiseSuppression?: boolean;   // default true
    autoGainControl?: boolean;    // default true
    deviceId?: string;
  };
}
```

**`RealtimeEvents` enum** (key values):
- `SESSION_STARTED` — connection confirmed, safe to start mic
- `PARTIAL_TRANSCRIPT` — interim text as user speaks (show in UI)
- `COMMITTED_TRANSCRIPT` — final utterance, fire `handleUserTurn()`
- `ERROR`, `AUTH_ERROR`, `QUOTA_EXCEEDED` — error handling required
- `CLOSE` — connection ended

**`RealtimeConnection` methods:** `on(event, listener)`, `off(event, listener)`, `close()`

---

## New API Route: /api/stt-token

ElevenLabs requires a single-use token for browser-side STT (to avoid exposing the API key
in the client bundle). Tokens expire in 15 minutes and are consumed on first connection.

### Implementation pattern

```typescript
// src/app/api/stt-token/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export async function POST(_req: Request) {
  if (!process.env.ELEVENLABS_API_KEY) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const result = await client.tokens.singleUse.create('realtime_scribe');
  // result.token is a short-lived string
  return Response.json({ token: result.token });
}
```

Uses existing `@elevenlabs/elevenlabs-js` (already installed, already has server-side API
key access pattern). No new server-side package needed.

`elevenlabs-js` confirmed to have `client.tokens.singleUse.create(tokenType)` via official
ElevenLabs API reference (token_type: `'realtime_scribe'` or `'tts_websocket'`).

---

## STT Integration Pattern in voice-controller.ts

The `startListening` function in `src/lib/voice-controller.ts` currently uses Web Speech API
(`window.SpeechRecognition`). The replacement pattern:

```typescript
// Replaces the Web Speech API block in startListening()
async function startListeningElevenLabs() {
  // 1. Fetch single-use token from server
  const res = await fetch('/api/stt-token', { method: 'POST' });
  const { token } = await res.json();

  // 2. Connect — SDK handles getUserMedia internally
  const connection = Scribe.connect({
    token,
    modelId: 'scribe_v2_realtime',
    commitStrategy: CommitStrategy.VAD,   // auto-commit on silence
    vadSilenceThresholdSecs: 1.2,
    languageCode: 'en',
    microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });

  // 3. Wire events
  connection.on(RealtimeEvents.SESSION_STARTED, () => {
    window.VoiceBus.setState('listening');
    window.VoiceBus.attachMic();  // still needed for VoiceBus level visualization
  });
  connection.on(RealtimeEvents.PARTIAL_TRANSCRIPT, ({ text }) => {
    setTranscript(text);
    setCaption(text);
  });
  connection.on(RealtimeEvents.COMMITTED_TRANSCRIPT, ({ text }) => {
    if (text.trim()) handleUserTurn(text.trim());
  });
  connection.on(RealtimeEvents.AUTH_ERROR, () => {
    setMicDenied(true);  // re-use existing micDenied state
    setCaption('Auth error — retry.');
    window.VoiceBus.setState('idle');
  });
  connection.on(RealtimeEvents.ERROR, () => {
    setCaption('STT error. Try again.');
    window.VoiceBus.setState('idle');
  });
  connection.on(RealtimeEvents.CLOSE, () => {
    detachMicRef.current?.();
    detachMicRef.current = null;
    if (window.VoiceBus.state === 'listening') window.VoiceBus.setState('idle');
  });

  // Store connection ref for cleanup (analogous to current recogRef)
  connectionRef.current = connection;
}
```

Key integration note: `@elevenlabs/client` handles `getUserMedia` internally when
`microphone: {}` is passed. The existing `window.VoiceBus.attachMic()` call for RMS
visualization still runs separately (it taps a separate `AudioContext` source from the same
mic stream — this is fine, two AudioContext sources on the same MediaStreamTrack is allowed
by the Web Audio API).

---

## Persistent Voice Overlay Architecture

### Problem

Currently `useVoiceController` is instantiated in each `page.tsx`. When navigation occurs
(e.g., home → portfolio), the page component unmounts, `useVoiceController` runs cleanup,
and voice state is lost. The TTS playback stops and open/listening state resets.

### Solution: Lift to layout level — no new packages required

Next.js App Router layouts are NOT unmounted during same-segment navigation. The root layout
(`src/app/layout.tsx`) renders once and persists across all page transitions.

**Architecture change:** Move voice mode state and `useVoiceController` out of individual
pages and into a new `VoiceOverlayProvider` client component mounted in `layout.tsx`.

```
layout.tsx (server component, no change needed)
  └── VoiceOverlayProvider (new 'use client' provider)
      ├── VoiceBusProvider (existing)
      ├── ThemeProvider (existing)
      ├── TransitionProvider (existing)
      ├── {children}   ← page content renders here
      └── VoiceOverlay (renders navbar morph / VoicePanel at layout level)
```

**Key insight:** The `goPage` callback inside `useVoiceController` needs `navigateWithReveal`
from `TransitionProvider`. Since `VoiceOverlayProvider` wraps children inside `TransitionProvider`,
it can consume `useTransition()` without any changes to the provider tree. The `currentPage`
awareness can be derived from `usePathname()` (Next.js built-in, no package needed).

Pages pass tool callbacks up via a React context (new `VoiceToolsContext`) that the overlay
provider reads. Each page registers its available tools on mount and deregisters on unmount.

```typescript
// VoiceToolsContext pattern (no new packages)
const VoiceToolsContext = createContext<{
  registerTools: (tools: ToolCallbacks) => void;
  unregisterTools: () => void;
}>({ registerTools: () => {}, unregisterTools: () => {} });
```

This is standard React context — zero new dependencies.

---

## Tool Callback Wiring Pattern

Tool callbacks (`openProject`, `scrollTo`, `openLink`, `toggleTheme`) need page-level
refs/state. The pattern:

1. Page component registers tools via `useVoiceTools(callbacks)` hook on mount
2. `VoiceOverlayProvider` holds latest registered callbacks in a ref (not state, to avoid
   re-renders)
3. `useVoiceController` receives callbacks via the provider, dispatches to them via
   existing `dispatchToolCall()`

No routing of tool calls through Next.js API routes or Server Actions — these are
purely client-side DOM/state operations. The existing `dispatchToolCall` switch statement
in `voice-controller.ts` already has the correct structure; it just needs real callback
implementations passed in instead of stubs.

Example wiring for portfolio page:
```typescript
// src/app/portfolio/page.tsx
useVoiceTools({
  openProject: ({ slug }) => {
    const target = projects.find(p => p.slug === slug);
    if (target) setSelectedProject(target);
  },
  scrollTo: ({ selector }) => {
    document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
  },
});
```

---

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| Zustand | The tool callback problem is solved by React context + ref, not global store. Adding Zustand for this would be over-engineering. |
| `ws` (WebSocket library) | ElevenLabs STT is browser WebSocket — native `WebSocket` is used by `@elevenlabs/client` internally. No Node.js `ws` package needed in browser code. |
| `@elevenlabs/react` | This is the ElevenLabs conversational agent React package, not a STT helper. It bundles agent features this project doesn't use. `@elevenlabs/client` is the right package. |
| React Query / SWR | The STT token fetch is a one-off per listen session, not a data fetching pattern. `fetch()` in the hook is sufficient. |
| Any separate STT service (Deepgram, AssemblyAI, Whisper) | ElevenLabs STT (Scribe v2 Realtime) is already paid for as part of the ElevenLabs API key — using it avoids a second vendor key, second billing relationship, and integrates with the existing `ELEVENLABS_API_KEY` env var. |
| next/navigation `useRouter` in voice controller | Navigation already handled by `TransitionProvider.navigateWithReveal()` — do not add a competing router call inside the voice controller. |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| `@elevenlabs/client` | 1.3.1 | `@elevenlabs/elevenlabs-js` 2.44.0 | Different packages, no peer dependency conflict. Both can coexist. |
| `@elevenlabs/client` | 1.3.1 | Next.js 15, React 19 | Browser-only code behind `'use client'` — no SSR issue. |
| `@elevenlabs/elevenlabs-js` | 2.44.0 (existing) | `/api/stt-token` route | `client.tokens.singleUse.create()` is a server-side call, safe in Route Handler. |

---

## Environment Variables

No new environment variables needed. The existing `ELEVENLABS_API_KEY` is used by both the
`/api/tts` route (TTS) and the new `/api/stt-token` route (STT token generation).

---

## Sources

- `node_modules/@elevenlabs/elevenlabs-js/wrapper/realtime/scribe.d.ts` — confirmed Node.js-only restriction on `ScribeRealtime`, HIGH confidence
- `npm view @elevenlabs/client version` — confirmed v1.3.1, HIGH confidence
- [ElevenLabs Client-side STT streaming guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming) — `@elevenlabs/client` pattern, `Scribe.connect()`, `RealtimeEvents`, HIGH confidence
- [ElevenLabs Realtime WebSocket API reference](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime) — auth method (single-use token), audio format specs, HIGH confidence
- [ElevenLabs Tokens API reference](https://elevenlabs.io/docs/api-reference/tokens/create) — `POST /v1/single-use-token/realtime_scribe`, 15-minute expiry, HIGH confidence
- [deepwiki ScribeRealtime analysis](https://deepwiki.com/elevenlabs/packages/2.6-scribe-real-time-speech-to-text) — `RealtimeEvents` enum, `MicrophoneOptions` shape, MEDIUM confidence (third-party analysis of ElevenLabs source)
- Next.js App Router docs — layout persistence across navigation (built-in behavior, not unmounted), HIGH confidence
- Existing codebase audit (`src/lib/voice-controller.ts`, `src/lib/voice-bus-init.ts`, `src/providers/voice-bus-provider.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`) — current architecture confirmed via direct file reads

---

*Stack research for: voice mode production features (v4.0 milestone)*
*Researched: 2026-04-24*
