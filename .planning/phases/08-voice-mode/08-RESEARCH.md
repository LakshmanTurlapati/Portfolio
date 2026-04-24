# Phase 8: Voice Mode - Research

**Researched:** 2026-04-24
**Domain:** Voice AI pipeline — STT, TTS, VoiceBus state machine, GSAP navbar morph, particle breathing, agent loop
**Confidence:** HIGH (architecture verified against prototype source; library APIs verified via Context7 and npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** ElevenLabs streaming TTS via `/api/tts` proxy route. Endpoint: `/v1/text-to-speech/{voice_id}/stream`, model `eleven_turbo_v2_5`.
- **D-02:** Voice ID: `dMWVPH9DSxWOMrrrUso3`
- **D-03:** `ELEVENLABS_API_KEY` env var, server-side only, never in client bundle
- **D-04:** Model: `eleven_turbo_v2_5`
- **D-05:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for STT
- **D-06:** Hook live mic RMS into `VoiceBus.setLevel(rms)` via AudioContext + AnalyserNode
- **D-07:** Hybrid architecture — `window.VoiceBus` holds `level`, `attachMic()`, `attachTTS()`. React `VoiceBusProvider` context holds only `state` enum and `useVoiceBus()` hook
- **D-08:** TypeScript declarations in `src/types/voice-bus.d.ts`
- **D-09:** VoiceBusProvider added to provider stack in `src/app/layout.tsx`
- **D-10:** Particle breathing: two sine waves (1.6 Hz breath + 4.2 Hz ripple), weighted 65/35. Plus thinking state: 3.2 Hz pulse + expanded line_linked.distance
- **D-11:** Breathing rAF loop reads `window.VoiceBus.level` directly (no React)
- **D-12:** Desktop navbar morph: GSAP Flip captures pill rect, same DOM node morphs from pill to capsule state
- **D-13:** Mobile navbar morph: CSS `clip-path: inset()` expansion, bar grows to `h-[140px]`
- **D-14:** State indicators per voice state (idle green dot, listening red pulse + waveform bars, thinking yellow pulse, speaking green + waveform tied to TTS amplitude)
- **D-15:** Port `matchNavIntent(utterance)` regex router for navigation commands
- **D-16:** "text" / switch-to-text opens ChatPopup and closes voice mode
- **D-17:** "stop" / stop button exits voice mode, navbar reverts
- **D-18:** AI via Grok (xAI) through existing `/api/chat` route
- **D-19:** Tool calls: `navigate`, `openProject`, `scrollTo`, `openLink`, `toggleTheme`, `tourStep`, `endCall`
- **D-20:** Port `TOUR_STEPS` array. Detect tour triggers. Iterate with await. Visual highlight ring
- **D-21:** Barge-in via VAD (`@ricky0123/vad-web`) or mic energy threshold
- **D-22:** Persist rolling last-20 message history to `localStorage` under `pf-voice-history`
- **D-23:** Keyboard shortcuts: `Space` = push-to-talk, `Esc` = close
- **D-24:** Respect `prefers-reduced-motion`: skip morph animation, reduce particle amplitude to ≤ 0.2
- **D-25:** Mic-permission-denied state with clear recovery CTA

### Claude's Discretion
- Exact waveform visualization rendering (canvas bars vs SVG vs CSS)
- Audio chunk buffering strategy for ElevenLabs streaming
- Tour highlight ring visual style (reuse `.click-hint` or new `.vm-spotlight`)
- VAD library choice if `@ricky0123/vad-web` is problematic

### Deferred Ideas (OUT OF SCOPE)
- Custom voice cloning via ElevenLabs Voice Lab
- Deepgram or OpenAI Realtime as alternative STT providers
- Mobile voice controls (MOBV-01, MOBV-02 in Future Requirements)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VOIC-01 | Clicking Ask Parz opens voice mode where the navbar morphs into a voice control panel | GSAP Flip verified; D-12 desktop, D-13 mobile CSS morph |
| VOIC-02 | Voice mode uses Web Speech API (SpeechRecognition) for STT with live mic amplitude visualization | Web Speech API verified; AudioContext AnalyserNode RMS pattern from prototype source |
| VOIC-03 | Voice mode uses ElevenLabs streaming TTS (D-01 overrides baseline requirement) | ElevenLabs JS SDK `textToSpeech.stream()` verified via Context7; `/api/tts` proxy pattern from existing `/api/chat` route |
| VOIC-04 | VoiceBus manages state and drives particle mesh breathing animation | Full VoiceBus implementation from prototype source; particle breathing rAF loop verified |
| VOIC-05 | User can navigate pages, switch to text chat, or stop via voice commands | `matchNavIntent()` regex router verified; `navigateWithReveal()` in TransitionProvider ready to use |
</phase_requirements>

---

## Summary

Phase 8 delivers a full voice-mode experience: the navbar morphs into a voice control capsule (GSAP Flip on desktop, CSS clip-path on mobile), speech is captured via the Web Speech API (SpeechRecognition), AI responses are generated through the existing Grok `/api/chat` route, and audio is synthesized via ElevenLabs streaming TTS proxied through `/api/tts`. A `window.VoiceBus` singleton with a React `VoiceBusProvider` mirror drives all reactive UI state. The particle mesh "breathes" by reading `VoiceBus.level` in a rAF loop that modulates particles.js internals directly.

The prototype (`voice_mode.jsx`, `home.jsx`) is the canonical reference — it has been read and fully understood. The Next.js port adapts the vanilla JS prototype to TypeScript React components while preserving 1:1 visual and behavioral fidelity. The key architectural challenge is threading the `VoiceBus` global through a React provider tree, wiring GSAP Flip to the existing navbar DOM nodes, and implementing the ElevenLabs streaming pipeline server-side without exposing the API key.

Note on VOIC-03: The REQUIREMENTS.md baseline says "Web Speech Synthesis for TTS with fake amplitude envelope" — this reflects the prototype's placeholder. The user's locked decision (D-01) upgrades this to ElevenLabs streaming TTS. The planner should implement D-01 (ElevenLabs) and treat the baseline requirement as superseded.

**Primary recommendation:** Port `voice_mode.jsx` VoiceBus verbatim to TypeScript, mount VoiceBusProvider in layout.tsx, wire GSAP Flip into DesktopNavbar, implement `/api/tts` using the ElevenLabs JS SDK's streaming iterator, and integrate the particle breathing rAF loop into ParticleBackground alongside the existing pJSDom cleanup pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| VoiceBus state machine | Browser / Client | — | Real-time audio analysis via rAF; synchronous window global avoids React render cycle lag |
| VoiceState reactive UI | Browser / Client (Context) | — | React context mirrors window.VoiceBus.state for component-tree updates |
| ElevenLabs TTS proxy | API / Backend | — | API key must not leave server; streams audio bytes to client |
| STT (SpeechRecognition) | Browser / Client | — | Browser-native API; no server needed |
| Navbar morph animation | Browser / Client | — | GSAP Flip reads DOM layout; must run client-side |
| Particle breathing | Browser / Client | — | rAF loop on window.pJSDom; zero React involvement |
| AI response generation | API / Backend | — | Grok API call via existing `/api/chat`; key server-side |
| Voice command routing | Browser / Client | — | `matchNavIntent()` regex; calls `navigateWithReveal()` from TransitionContext |
| Voice history persistence | Browser / Client | — | localStorage under `pf-voice-history`; component state flush on close |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GSAP | 3.15.0 | Flip plugin for navbar morph | Already installed; Flip is the standard for DOM-state animation [VERIFIED: package.json] |
| @gsap/react | 2.1.2 | `useGSAP` hook for React integration | Already installed; provides automatic cleanup [VERIFIED: package.json] |
| @ricky0123/vad-web | 0.0.30 | VAD for barge-in detection (D-21) | Leading browser VAD; Silero model; locked in D-21 [VERIFIED: npm registry] |
| elevenlabs (`@elevenlabs/elevenlabs-js`) | 2.44.0 | ElevenLabs TTS client on server-side API route | Official SDK; `textToSpeech.stream()` returns async iterator [VERIFIED: npm registry, Context7] |
| Web Speech API | Browser-native | SpeechRecognition for STT (D-05) | Zero-cost; Chrome/Edge primary target; locked in D-05 [VERIFIED: prototype source] |
| Web Audio API | Browser-native | AudioContext + AnalyserNode for RMS amplitude | Standard browser API for mic/audio analysis [VERIFIED: prototype source] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| gsap Flip plugin | (bundled with gsap 3.15) | DOM-state animation for navbar morph | Desktop navbar morph only; import via `gsap/Flip` |
| localStorage | Browser-native | Persist voice history (D-22) | Rolling 20-message history under `pf-voice-history` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@ricky0123/vad-web` (D-21) | Energy threshold from AnalyserNode | VAD is more accurate at noise-gating; energy threshold is simpler but triggers on background noise. VAD is locked but has Turbopack complexity — energy threshold is a viable fallback |
| ElevenLabs proxy via raw fetch | ElevenLabs JS SDK | SDK adds abstraction; raw fetch gives more control over stream chunking. Either works for the proxy route |
| GSAP Flip (D-12) | CSS transition on width/height | Flip handles asymmetric growth from off-center origin cleanly; CSS transitions are simpler but don't handle the layout shift between content sets |

**Installation (new packages required):**
```bash
npm install @elevenlabs/elevenlabs-js @ricky0123/vad-web onnxruntime-web
```

Note: `onnxruntime-web` is a required peer dependency of `@ricky0123/vad-web`. [VERIFIED: npm registry peerDependencies field]

---

## Architecture Patterns

### System Architecture Diagram

```
User speaks
    |
    v
[SpeechRecognition]  ---------> interim transcript --> VoiceBus.setState('listening')
    |                                                    |
    | final transcript                                   v
    v                                            [ParticleBackground rAF loop]
[matchNavIntent()]                               reads window.VoiceBus.level
    |                                            writes pJSDom opacity/distance
    |-- navigation intent --> navigateWithReveal()
    |
    |-- stop/text intent --> close / open ChatPopup
    |
    |-- AI intent
        |
        v
    [/api/chat]  (Grok via xAI SDK)
        |
        v
    text response
        |
        v
    [/api/tts]  (ElevenLabs proxy, server-side)
        |-- ElevenLabsClient.textToSpeech.stream() --> ReadableStream of audio bytes
        |
        v
    [Client: fetch /api/tts]
        |-- AudioContext + AudioBufferSourceNode queue
        |-- AnalyserNode for RMS --> VoiceBus.setLevel(rms)
        |
        v
    VoiceBus.setState('speaking')
        |
        v
    [VoiceBusProvider context] -- state update --> [NavbarVoicePanel re-render]
                                                       |
                                                       v
                                               waveform bars, caption, state chip

User speaks while agent is speaking
    |
    v
[@ricky0123/vad-web] detects voice energy
    |
    v
cancel AudioBufferSourceNode
VoiceBus.setState('listening')
    (barge-in)
```

### Recommended Project Structure
```
src/
├── providers/
│   ├── theme-provider.tsx          # existing
│   ├── transition-provider.tsx     # existing
│   └── voice-bus-provider.tsx      # NEW — React context mirror of window.VoiceBus.state
├── types/
│   ├── index.ts                    # existing
│   └── voice-bus.d.ts              # NEW — window.VoiceBus TypeScript declarations
├── hooks/
│   └── use-voice-bus.ts            # NEW — convenience re-export of useVoiceBus()
├── components/
│   ├── desktop-navbar.tsx          # MODIFY — add voice-active morph state
│   ├── mobile-navbar.tsx           # MODIFY — add voice-active morph state
│   ├── ask-parz-button.tsx         # MODIFY — onClick triggers voice.open() instead of setChatOpen
│   ├── particle-background.tsx     # MODIFY — add VoiceBus breathing rAF loop
│   ├── voice-panel.tsx             # NEW — NavbarVoicePanel component (waveform, caption, buttons)
│   └── voice-wave.tsx              # NEW — 5-bar waveform driven by VoiceBus.level
├── lib/
│   └── voice-bus-init.ts           # NEW — window.VoiceBus initialization (IIFE → module)
└── app/
    ├── layout.tsx                  # MODIFY — add VoiceBusProvider
    ├── page.tsx                    # MODIFY — wire voice.open(), pass voiceActive+voiceProps to navbars
    └── api/
        ├── chat/route.ts           # existing (template for /api/tts)
        └── tts/route.ts            # NEW — ElevenLabs streaming proxy
```

### Pattern 1: VoiceBus Hybrid (window global + React context)

**What:** `window.VoiceBus` owns `level` (float), audio analysis methods (`attachMic`, `attachTTS`), and `setState`. A React context `VoiceBusProvider` holds only the reactive `state` string and exposes `useVoiceBus()`.

**When to use:** For all voice state reads in React components (use `useVoiceBus()`). For rAF loops and audio analysis (read `window.VoiceBus.level` directly, synchronously).

```typescript
// Source: voice_mode.jsx prototype + Context7 React patterns
// src/lib/voice-bus-init.ts
export function initVoiceBus() {
  if (typeof window === 'undefined' || window.VoiceBus) return;
  const listeners = new Map<string, Set<(p: unknown) => void>>();
  window.VoiceBus = {
    state: 'idle',
    level: 0,
    _liveAudio: false,
    _raf: null,
    _ctx: null,
    on(evt, fn) { /* ... */ },
    off(evt, fn) { /* ... */ },
    emit(evt, p) { /* ... */ },
    setState(s) {
      if (window.VoiceBus.state === s) return;
      window.VoiceBus.state = s;
      window.VoiceBus.emit('state', s);
      if (!window.VoiceBus._liveAudio) {
        const defaults: Record<string, number> = {
          idle: 0, listening: 0.35, thinking: 0.55, speaking: 0.75,
        };
        if (s in defaults) window.VoiceBus.setLevel(defaults[s]);
      }
    },
    setLevel(n) { /* clamp, emit 'level' */ },
    async attachMic() { /* getUserMedia + AnalyserNode RMS loop */ },
    attachTTSFake(utterance) { /* synthetic amplitude envelope for Web Speech fallback */ },
  };
}
```

```typescript
// src/providers/voice-bus-provider.tsx
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const VoiceBusContext = createContext<VoiceState>('idle');

export function VoiceBusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceState>('idle');
  useEffect(() => {
    // window.VoiceBus must be initialized before this mounts
    if (typeof window !== 'undefined' && window.VoiceBus) {
      return window.VoiceBus.on('state', setState as (s: unknown) => void);
    }
  }, []);
  return <VoiceBusContext.Provider value={state}>{children}</VoiceBusContext.Provider>;
}

export function useVoiceBus() { return useContext(VoiceBusContext); }
```

### Pattern 2: ElevenLabs Streaming TTS Proxy Route

**What:** Next.js API route at `/api/tts` receives `{ text, voiceId }`, calls ElevenLabs server-side using `@elevenlabs/elevenlabs-js`, pipes the audio stream back as `Content-Type: audio/mpeg`.

**When to use:** All TTS calls must go through this proxy. Never call ElevenLabs from client code.

```typescript
// Source: Context7 /elevenlabs/elevenlabs-js + existing /api/chat/route.ts pattern
// src/app/api/tts/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST(req: Request) {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return new Response(JSON.stringify({ error: 'TTS not configured' }), { status: 503 });
  }
  const { text, voiceId } = await req.json();
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  
  try {
    const audioStream = await client.textToSpeech.stream(voiceId, {
      text,
      modelId: 'eleven_turbo_v2_5',
      outputFormat: 'mp3_44100_128',
    });
    
    // Convert async iterator to ReadableStream for Response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of audioStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });
    
    return new Response(stream, {
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'TTS failed' }), { status: 500 });
  }
}
```

### Pattern 3: Client-Side Audio Streaming via AudioBufferSourceNode Queue

**What:** Client fetches `/api/tts`, reads the response body as an `ArrayBuffer` stream, decodes each chunk via `AudioContext.decodeAudioData()`, queues `AudioBufferSourceNode` instances for gapless playback. An `AnalyserNode` on each source feeds `VoiceBus.setLevel(rms)`.

**When to use:** In the voice controller hook, replace the prototype's `attachTTSFake` with real audio analysis when ElevenLabs is active.

```typescript
// Source: [ASSUMED] — based on Web Audio API spec patterns + ElevenLabs streaming docs
// Simplified pattern (chunk-by-chunk decode and queue):
async function streamTTS(text: string): Promise<void> {
  window.VoiceBus.setState('speaking');
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceId: 'dMWVPH9DSxWOMrrrUso3' }),
  });
  if (!res.ok || !res.body) { window.VoiceBus.setState('idle'); return; }
  
  const ctx = window.VoiceBus._getCtx();
  // Read full buffer then decode (simpler; latency acceptable for ElevenLabs turbo model)
  const buffer = await res.arrayBuffer();
  const decoded = await ctx.decodeAudioData(buffer);
  const source = ctx.createBufferSource();
  source.buffer = decoded;
  
  // AnalyserNode for live RMS → VoiceBus.setLevel
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  
  window.VoiceBus._startLoop(analyser, 1.4);
  source.onended = () => { window.VoiceBus._stopLoop(); window.VoiceBus.setState('idle'); };
  source.start();
}
```

### Pattern 4: GSAP Flip Navbar Morph (Desktop)

**What:** Capture navbar pill state before voice activation, apply voice-active CSS class to expand, then GSAP Flip animates from old layout to new. Content crossfade (default nav items fade out, VoicePanel fades in) handled by CSS opacity transitions.

**When to use:** Desktop navbar (≥600px) voice mode open/close.

```typescript
// Source: Context7 /llmstxt/gsap_llms_txt Flip.getState + Flip.from pattern
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
gsap.registerPlugin(Flip);

// In DesktopNavbar or page.tsx voice open handler:
function openVoiceMode(navRef: React.RefObject<HTMLElement>) {
  const state = Flip.getState(navRef.current);
  navRef.current?.classList.add('voice-active');
  Flip.from(state, {
    duration: 0.45,
    ease: 'power2.out',
    scale: false,
  });
}
```

### Pattern 5: Particle Breathing rAF Integration

**What:** After `particlesJS()` initializes, poll for `window.pJSDom` entry, capture baselines, then run a persistent rAF loop that writes modulated opacity/distance values into the pJS instance. Two branches: `thinking` state expands connection reach; non-zero `level` applies breath+ripple sine wave; level ≤ 0.01 restores baselines.

**When to use:** Add to `ParticleBackground` component, inside the existing `ensureParticlesScript().then(init)` callback, after `window.particlesJS(...)` call.

```typescript
// Source: home.jsx lines 70-155 (verified directly)
// Exact port of waitForInst + tick loop from prototype:
const waitForInst = (tries = 0) => {
  const entry = (window.pJSDom || []).slice(-1)[0];
  const inst = entry?.pJS;
  if (!inst?.particles?.array?.length) {
    if (tries < 40) return setTimeout(() => waitForInst(tries + 1), 50);
    return;
  }
  const baseLine = inst.particles.line_linked.opacity;
  const baseLineDist = inst.particles.line_linked.distance;
  const baseOps = inst.particles.array.map((p) =>
    typeof p.opacity === 'object' && p.opacity !== null ? p.opacity.value : p.opacity
  );
  let raf: number;
  const tick = () => {
    const bus = window.VoiceBus || {};
    const level = bus.level || 0;
    const vState = bus.state || 'idle';
    if (vState === 'thinking') {
      const t = performance.now() / 1000;
      const pulse = (Math.sin(t * 3.2) + 1) / 2;
      const spark = (Math.sin(t * 11 + 0.7) + 1) / 2;
      inst.particles.line_linked.distance = baseLineDist * (1.35 + pulse * 0.35);
      inst.particles.line_linked.opacity = Math.min(1, baseLine * (1.6 + pulse * 0.6 + spark * 0.2));
      // per-particle modulation ...
    } else if (level > 0.01) {
      const t = performance.now() / 1000;
      const breath = (Math.sin(t * 1.6) + 1) / 2;   // 1.6 Hz
      const ripple = (Math.sin(t * 4.2 + 1.3) + 1) / 2;  // 4.2 Hz
      const wave = breath * 0.65 + ripple * 0.35;
      inst.particles.line_linked.distance = baseLineDist * (1 + level * 0.25);
      inst.particles.line_linked.opacity = baseLine * (0.5 + wave * (0.8 + level));
      // per-particle: i * 0.18 phase offset
    } else {
      // restore baselines
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  // expose cancellation for cleanup
  if (containerRef.current) {
    (containerRef.current as HTMLDivElement & { __vmTick?: () => void }).__vmTick =
      () => { cancelAnimationFrame(raf); };
  }
};
```

### Pattern 6: REQUIREMENTS.md Discrepancy — VOIC-03

VOIC-03 in REQUIREMENTS.md says "Web Speech Synthesis for TTS with fake amplitude envelope." This was the prototype's placeholder implementation. CONTEXT.md D-01 locks ElevenLabs streaming TTS as the production implementation. **CONTEXT.md decisions take precedence.** The planner should implement ElevenLabs TTS (D-01) and satisfy VOIC-03 as "voice mode uses TTS with amplitude envelope" — ElevenLabs + real audio AnalyserNode satisfies this at higher quality than the fake envelope.

### Anti-Patterns to Avoid

- **Calling ElevenLabs from client code:** Never import or call ElevenLabs SDK in client components. All TTS must route through `/api/tts`. [VERIFIED: D-03]
- **Putting voice state in React-only state:** `level` changes at 60fps; storing in React state causes excessive re-renders. `window.VoiceBus.level` is the source of truth; rAF loops read it directly. [VERIFIED: D-07, D-11]
- **Multiple GSAP Flip registrations:** `gsap.registerPlugin(Flip)` must happen once. Put it at module scope or in a layout effect. [VERIFIED: GSAP docs]
- **Calling `particlesJS()` after VoiceBus init:** pJSDom must be populated before the breathing loop can run. The `waitForInst()` poll handles this but do not call breathing init before `particlesJS()` is called. [VERIFIED: home.jsx lines 79-88]
- **Forgetting VoiceBus init timing:** `window.VoiceBus` must be initialized before any client component mounts and tries to call `VoiceBus.on()`. Initialize via a client-only script effect in layout.tsx or early in the provider. [VERIFIED: voice_mode.jsx IIFE guard pattern]
- **`@ricky0123/vad-web` without WASM files in public/:** vad-web requires ONNX model files and WASM runtime files to be statically served. With Turbopack (no `CopyWebpackPlugin`), files must be manually copied to `public/` directory. See Pitfall 2 below. [VERIFIED: ricky0123/vad docs]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Navbar layout-state animation | Custom CSS width/height transitions between two content sets | GSAP Flip plugin | Flip handles the asymmetric growth from off-center pill automatically; CSS transitions break when content size changes non-linearly |
| Voice activity detection for barge-in | Energy threshold on AnalyserNode | `@ricky0123/vad-web` (Silero VAD) | Threshold triggers on background noise; Silero neural VAD is accurate. If vad-web has Turbopack issues, energy threshold IS a fallback (D-21 allows it) |
| Text-to-speech synthesis | Browser `speechSynthesis` (acceptable only as fallback) | ElevenLabs streaming (D-01) | `speechSynthesis` voices sound robotic; ElevenLabs `eleven_turbo_v2_5` is the locked production choice |
| Audio amplitude from ElevenLabs stream | Fake envelope (sin-wave synthesis) | Real AnalyserNode on decoded AudioBuffer | Real RMS gives mouth-like motion synced to actual audio; fake envelope is the fallback only if AudioContext fails |
| API key proxying | Storing `ELEVENLABS_API_KEY` in `NEXT_PUBLIC_*` | `/api/tts` route with `hasEnvVar()` check | Client-accessible env vars are visible in browser devtools and JS bundles |

**Key insight:** The VoiceBus architecture is deliberately split to avoid re-renders at audio analysis frequency (60fps). Never pull `level` into React state — it belongs in `window.VoiceBus.level` and is read synchronously by rAF loops.

---

## Common Pitfalls

### Pitfall 1: Web Speech API Chrome-Only Limitation
**What goes wrong:** `SpeechRecognition` is undefined in Firefox and Safari. `webkitSpeechRecognition` works in Chrome/Edge.
**Why it happens:** Web Speech API is a non-standard API that only Chromium implements.
**How to avoid:** Always check `const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { show fallback CTA }`. The prototype already handles this with a user-visible caption message.
**Warning signs:** User reports no mic activity in Firefox/Safari — check for the fallback CTA rendering.

### Pitfall 2: @ricky0123/vad-web WASM Assets with Turbopack
**What goes wrong:** VAD fails silently at runtime because ONNX model files (`silero_vad_v5.onnx`, `silero_vad_legacy.onnx`) and WASM runtime files (`onnxruntime-web/dist/*.wasm`) are not found.
**Why it happens:** Turbopack does not support `CopyWebpackPlugin`. The vad-web docs show Webpack config to copy assets, but this doesn't apply to the Turbopack build.
**How to avoid:** After installing `@ricky0123/vad-web` and `onnxruntime-web`, manually copy the required files to `public/`:
```bash
cp node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js public/
cp node_modules/@ricky0123/vad-web/dist/*.onnx public/
cp node_modules/onnxruntime-web/dist/*.wasm public/
```
Then configure `baseAssetPath: '/'` and `onnxWASMBasePath: '/'` when initializing the VAD. [VERIFIED: ricky0123/vad docs, Turbopack limitation is [ASSUMED] based on known Turbopack webpack plugin restrictions]
**Warning signs:** Console errors about failed WASM fetch or ONNX model load.

### Pitfall 3: VoiceBus Initialization Before React Tree Mounts
**What goes wrong:** `VoiceBusProvider` calls `window.VoiceBus.on('state', ...)` in a `useEffect`, but `window.VoiceBus` may not exist yet if `initVoiceBus()` hasn't run.
**Why it happens:** React providers mount asynchronously; if VoiceBus init is deferred to a component effect, race conditions occur.
**How to avoid:** Call `initVoiceBus()` at the top of `voice-bus-provider.tsx` (module-level import side effect), or in a `'use client'` script tag in `layout.tsx` that runs synchronously before the provider tree renders. [VERIFIED: prototype's IIFE `if (window.VoiceBus) return;` guard pattern]
**Warning signs:** `TypeError: Cannot read property 'on' of undefined` in VoiceBusProvider.

### Pitfall 4: pJSDom Array Race Condition After Theme Switch
**What goes wrong:** When the theme changes, `ParticleBackground` destroys and reinitializes the pJS instance. The breathing rAF loop holds stale `baseOps` and references to the old particle array.
**Why it happens:** The existing `destroypJS()` → clear → reinit pattern tears down the instance; the old baseline capture is now invalid.
**How to avoid:** Cancel the old rAF loop before reinitializing (`containerRef.current.__vmTick?.()` pattern from prototype line 153). The new `waitForInst()` call will re-capture baselines from the fresh instance.
**Warning signs:** Particles freeze or snap to wrong opacity values after a theme change while voice mode is active.

### Pitfall 5: GSAP Flip + React Strict Mode Double-Invoke
**What goes wrong:** In React Strict Mode (enabled), effects run twice in development. A Flip state captured in the first invocation is stale when the animation runs in the second.
**Why it happens:** `reactStrictMode: true` is set in `next.config.ts`.
**How to avoid:** Capture the Flip state immediately before applying the CSS class change, within the same synchronous callstack (not across render cycles). Use `useGSAP` for proper cleanup handling. This is strictly a dev-mode issue — production builds don't double-invoke.
**Warning signs:** Navbar jumps or flickers on voice open in dev only.

### Pitfall 6: ElevenLabs `decodeAudioData` on Partial MP3 Chunks
**What goes wrong:** Fetching the audio stream and trying to decode small chunks incrementally fails because `decodeAudioData` requires a complete, valid audio file.
**Why it happens:** MP3 is not designed for chunk-by-chunk decoding without a full frame boundary.
**How to avoid:** Use the "read full ArrayBuffer then decode" approach for the initial implementation. For lower latency, accumulate sufficient chunks (~32KB) before decoding. The prototype's fake TTS shows the latency is acceptable — don't over-optimize streaming granularity.
**Warning signs:** `EncodingError: Unable to decode audio data` in console.

---

## Code Examples

Verified patterns from official sources and prototype:

### VoiceBus TypeScript Declarations
```typescript
// Source: voice_mode.jsx + D-08
// src/types/voice-bus.d.ts
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceBusInstance {
  state: VoiceState;
  level: number;
  _liveAudio: boolean;
  _raf: number | null;
  _ctx: AudioContext | null;
  on(evt: string, fn: (payload: unknown) => void): () => void;
  off(evt: string, fn: (payload: unknown) => void): void;
  emit(evt: string, payload?: unknown): void;
  setState(s: VoiceState): void;
  setLevel(n: number): void;
  _getCtx(): AudioContext | null;
  _startLoop(analyser: AnalyserNode, gain?: number): void;
  _stopLoop(): void;
  attachMic(): Promise<() => void>;
  attachTTSFake(utterance: SpeechSynthesisUtterance): () => void;
}

declare global {
  interface Window {
    VoiceBus: VoiceBusInstance;
  }
}
export {};
```

### matchNavIntent Regex Router (from prototype, verified)
```typescript
// Source: voice_mode.jsx lines 354-362
function matchNavIntent(u: string): { page: string; say: string } | null {
  if (/(open|show|take me to|go to).*portfolio|show.*work|my work|projects page/.test(u))
    return { page: 'portfolio', say: 'Opening the portfolio.' };
  if (/(open|show|take me to|go to).*about|who are you|about page|bio/.test(u))
    return { page: 'about', say: "Here's the about page." };
  if (/home|back|main page|landing/.test(u))
    return { page: 'home', say: 'Back home.' };
  return null;
}
```

### VoiceWave 5-Bar Component (from prototype, verified)
```typescript
// Source: voice_mode.jsx lines 328-352
// 5 bars with baseHeights [0.32, 0.62, 1.0, 0.62, 0.32]
// Each bar: amp = clamp(base + level * 0.25 + wobble, 0.2, 1)
// wobble = 0.18 * sin(t * 2.4 + i * 0.5) + 0.12 * sin(t * 4.08 + i)
// Apply as CSS transform: scaleY(amp)
```

### Navbar CSS Voice State Classes (from prototype styles.css, verified)
```css
/* Voice-active morphed navbar dimensions */
.navbar.voice-active {
  width: 760px;
  height: 72px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
  transition: width 0.45s cubic-bezier(.22,1,.36,1), height 0.45s cubic-bezier(.22,1,.36,1);
}
/* State dot colors */
/* idle: #8fbcff */
/* listening: #ff8f8f (pulse animation) */
/* thinking: #ffd58f (pulse animation) */
/* speaking: #8fffb6 */
/* Mobile: width: calc(100% - 20px), height: 72px */
```

### TOUR_STEPS Array (from VOICE_HANDOFF.md, verified)
```typescript
// Source: VOICE_HANDOFF.md section 4
const TOUR_STEPS = [
  { page: 'home', say: "This is the landing. I'm Lakshman's digital twin…", highlight: '.hero' },
  { page: 'home', say: "Those floating particles? They react when I'm thinking.", highlight: '#pf-particles' },
  { page: 'portfolio', say: "Here's the portfolio — projects across AI, Flutter, and web.", highlight: '.portfolio-grid' },
  { page: 'portfolio', say: "Parz-AI is my favorite — a self-hostable LLM persona.", call: ['openProject', { slug: 'Parz-AI' }] },
  { page: 'about', say: "And the about page if you want the human version.", call: ['navigate', { page: 'about' }] },
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `speechSynthesis` (prototype placeholder) | ElevenLabs `eleven_turbo_v2_5` streaming | D-01 locked | Natural voice vs robotic synth |
| Fake amplitude envelope (sin-wave) | Real AnalyserNode on decoded audio | D-06 locked | Particle wave synced to actual speech |
| matchNavIntent regex (stub) | Tool-call router with `navigate`, `openProject`, etc. | D-19 locked | Structured actions instead of regex-only |
| Single-turn AI prompt | Rolling 20-message history in localStorage | D-22 locked | Persistent conversation context |
| Basic barge-in (none in prototype) | VAD (`@ricky0123/vad-web`) | D-21 locked | Accurate speech detection; barge-in within ~150ms |

**Deprecated/outdated:**
- `window.speechSynthesis` for production TTS: Use only as fallback if ElevenLabs proxy fails. The prototype uses it as a placeholder.
- `window.claude.complete()` from prototype: Replaced by existing `/api/chat` Grok route (D-18).
- CSS custom property FLIP (`--vm-ox/--vm-oy/--vm-ow/--vm-oh`): GSAP Flip handles this automatically in Next.js version (D-12).

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Manually copying vad-web WASM files to `public/` works with Turbopack (no `CopyWebpackPlugin`) | Common Pitfalls #2 | VAD silently fails; need energy threshold fallback instead |
| A2 | `AudioContext.decodeAudioData()` on a full ElevenLabs MP3 response buffer works without frame-boundary issues at typical response sizes | Code Examples (streamTTS) | Audio decode errors; need chunked approach or different output format |
| A3 | `ELEVENLABS_API_KEY` in AWS Amplify env vars is sufficient for production; no additional proxy layer needed beyond `/api/tts` | Standard Stack | API key exposure if Amplify env var handling changes |
| A4 | GSAP Flip performs acceptably in React Strict Mode dev (double-invoke causes flicker only, not breakage) | Common Pitfalls #5 | Persistent visual glitch in dev that may obscure real bugs |

---

## Open Questions

1. **ElevenLabs API key setup for development**
   - What we know: Production uses `ELEVENLABS_API_KEY` in Amplify Console.
   - What's unclear: Is there a `.env.local` with the key for dev, or does the developer need to set this up manually?
   - Recommendation: Wave 0 task should include `.env.local.example` with `ELEVENLABS_API_KEY=` placeholder and instructions for adding the key.

2. **vad-web vs. energy threshold for barge-in (D-21 allows fallback)**
   - What we know: `@ricky0123/vad-web` requires WASM asset copying in Turbopack projects.
   - What's unclear: Whether Turbopack in Next.js 15 blocks the WASM loading via `new URL()` imports.
   - Recommendation: Implement energy threshold barge-in first (simpler, works immediately), then layer vad-web on top if energy threshold triggers too many false positives. D-21 explicitly allows this.

3. **GSAP Flip on the mobile navbar (D-13 says CSS, not Flip)**
   - What we know: D-13 specifies CSS `clip-path: inset()` for mobile morph (not GSAP Flip).
   - What's unclear: Whether the mobile navbar's `h-[70px]` to `h-[140px]` transition also uses CSS or needs GSAP.
   - Recommendation: Use pure CSS transition on height + CSS clip-path animation for mobile. No GSAP needed. This is what D-13 specifies.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | `/api/tts` route | ✓ | v24.14.1 | — |
| GSAP Flip | Desktop navbar morph | ✓ (bundled in gsap 3.15) | 3.15.0 | — |
| `@elevenlabs/elevenlabs-js` | `/api/tts` route | ✗ (not installed) | 2.44.0 on registry | Install required |
| `@ricky0123/vad-web` | Barge-in (D-21) | ✗ (not installed) | 0.0.30 on registry | Energy threshold |
| `onnxruntime-web` | Peer dep of vad-web | ✗ (not installed) | latest on registry | Required with vad-web |
| Web Speech API | STT (D-05) | ✓ (Chrome/Edge browser) | Browser-native | Fallback CTA for Firefox/Safari |
| `ELEVENLABS_API_KEY` env var | `/api/tts` | Unknown | — | 503 response with `hasEnvVar()` guard |

**Missing dependencies with no fallback:**
- `@elevenlabs/elevenlabs-js` — required for production TTS; must be installed before `/api/tts` route can work.

**Missing dependencies with fallback:**
- `@ricky0123/vad-web` + `onnxruntime-web` — barge-in works with energy threshold from AnalyserNode if vad-web is too complex to configure.
- `ELEVENLABS_API_KEY` — `hasEnvVar()` guard returns 503; developer must supply key.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | Validate `text` and `voiceId` in `/api/tts` route before forwarding to ElevenLabs |
| V6 Cryptography | no | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| API key exposure in client bundle | Information Disclosure | Server-only `ELEVENLABS_API_KEY`; never `NEXT_PUBLIC_*`; `hasEnvVar()` guard in route |
| TTS proxy abuse (unlimited calls) | Denial of Service | Consider rate limiting on `/api/tts`; same concern as `/api/chat` — not blocking for v1 but note it |
| Malicious `text` injection to ElevenLabs | Tampering | Validate text field: non-empty string, reasonable max length (e.g., 500 chars); strip control characters |
| Malicious `voiceId` injection | Tampering | Allowlist: only accept locked voice ID `dMWVPH9DSxWOMrrrUso3` or validate against ElevenLabs voice ID format |
| Mic access abuse via autoplay | Elevation of Privilege | `getUserMedia` requires explicit user gesture (button click to open voice mode); no automic activation |

---

## Sources

### Primary (HIGH confidence)
- `voice_mode.jsx` (prototype source) — VoiceBus implementation, useVoiceController, NavbarVoicePanel, matchNavIntent, VoiceWave
- `home.jsx` (prototype source, lines 70-165) — Particle breathing rAF loop, waitForInst, baseline capture, thinking/speaking/level branches
- `styles.css` (prototype source, lines 1787-1892) — Complete voice mode CSS: `.navbar.voice-active`, `.navbar-voice`, `.nv-mic`, `.nv-wave`, `.nv-wave-bar`, `.nv-caption`, state dot colors, keyframes
- `VOICE_HANDOFF.md` — Tool call spec, TOUR_STEPS, testing checklist
- Context7 `/elevenlabs/elevenlabs-js` — `textToSpeech.stream()` API, ReadableStream piping pattern
- Context7 `/llmstxt/gsap_llms_txt` — `Flip.getState()`, `Flip.from()`, `useGSAP` registration
- Context7 `/ricky0123/vad` — VAD config, WASM asset paths, `baseAssetPath`/`onnxWASMBasePath`
- npm registry — Package versions verified: gsap@3.15.0, @gsap/react@2.1.2, @ricky0123/vad-web@0.0.30, @elevenlabs/elevenlabs-js@2.44.0
- `src/app/api/chat/route.ts` — Template pattern for `/api/tts` (hasEnvVar, streaming Response)
- `src/components/particle-background.tsx` — pJSDom cleanup pattern, existing rAF integration points
- `src/providers/transition-provider.tsx` — `navigateWithReveal()` signature for voice `navigate` tool
- `next.config.ts` — Turbopack confirmed (`--turbopack`), `reactStrictMode: true`
- `.planning/config.json` — `nyquist_validation: false` (validation section omitted)

### Secondary (MEDIUM confidence)
- Context7 `/webaudio/web-speech-api` — SpeechRecognition interface, `interimResults`, error handling
- Context7 `/websites/elevenlabs_io` — Streaming TTS proxy pattern, ReadableStream tee pattern

### Tertiary (LOW confidence)
- Turbopack `CopyWebpackPlugin` incompatibility for vad-web assets — known limitation from Turbopack docs/community, not verified with an official Next.js 15 + Turbopack + vad-web test

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all versions verified against npm registry; no external lookups needed
- Architecture: HIGH — prototype source read directly; patterns verified line-by-line
- Pitfalls: MEDIUM-HIGH — most verified from prototype or docs; vad-web/Turbopack is [ASSUMED]
- ElevenLabs streaming: HIGH — SDK API verified via Context7; ReadableStream pattern from official ElevenLabs guide

**Research date:** 2026-04-24
**Valid until:** 2026-05-24 (stable libraries; ElevenLabs API may update model IDs)
