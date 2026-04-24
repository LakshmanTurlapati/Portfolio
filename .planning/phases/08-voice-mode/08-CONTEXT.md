# Phase 8: Voice Mode - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a **1:1 port** of the v3 design prototype's voice mode: navbar morphs into a voice control capsule, full STT/TTS pipeline with ElevenLabs streaming, VoiceBus state machine driving particle mesh breathing, voice commands for navigation, scripted tour, barge-in, persistent conversation memory, and accessibility. This is a faithful port of `voice_mode.jsx` and `VOICE_HANDOFF.md` — not a simplified version.

</domain>

<decisions>
## Implementation Decisions

### TTS Provider
- **D-01:** Use **ElevenLabs streaming TTS** via a proxy API route at `/api/tts`. The route proxies the ElevenLabs `/v1/text-to-speech/{voice_id}/stream` endpoint, injecting the API key server-side. Client streams audio chunks via `fetch` + `MediaSource API` or chunked `Blob` URL playback.
- **D-02:** Voice ID: `dMWVPH9DSxWOMrrrUso3` (locked from Phase 6 D-06).
- **D-03:** API key stored as `ELEVENLABS_API_KEY` environment variable, injected via AWS Amplify env vars (same pattern as `XAI_API_KEY` in `/api/chat`). **Never in client bundle.**
- **D-04:** Model: `eleven_turbo_v2_5` for low-latency streaming.

### STT Provider
- **D-05:** Use **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) for speech-to-text. This is browser-native, zero-cost, and sufficient for the portfolio's voice command + conversational use case. Chrome/Edge primary target.
- **D-06:** Hook live mic RMS into `VoiceBus.setLevel(rms)` via AudioContext + AnalyserNode for real-time waveform visualization during listening.

### VoiceBus Architecture
- **D-07:** **Hybrid architecture**: `window.VoiceBus` holds `level` (0-1 float), `attachMic()`, `attachTTS()`, and audio analysis methods as plain properties. A React `VoiceBusProvider` context in `src/providers/voice-bus-provider.tsx` holds only the `state` enum (idle/listening/thinking/speaking) and exposes `useVoiceBus()` hook. Window is source of truth; context is reactive mirror for UI components.
- **D-08:** TypeScript declarations for `window.VoiceBus` in `src/types/voice-bus.d.ts`.
- **D-09:** VoiceBusProvider added to provider stack in `src/app/layout.tsx` alongside ThemeProvider and TransitionProvider.

### Particle Mesh Breathing
- **D-10:** Port the prototype's particle breathing logic from `home.jsx`: two overlapping sine waves (1.6 Hz breath + 4.2 Hz thought ripple, weighted 65/35) modulating `line_linked.opacity` and per-particle `opacity.value` via `window.pJSDom`. Per-particle phase offset (`i * 0.18`) prevents lockstep pulsing. Baselines captured at init and restored when level returns to 0.
- **D-11:** Breathing rAF loop reads `window.VoiceBus.level` directly (synchronous, no React).

### Navbar Morph
- **D-12:** **Desktop**: GSAP Flip captures pill `getBoundingClientRect()`, navbar transitions from default state to voice capsule state (same DOM node, two states). Navbar items fade out, voice capsule content fades in. GSAP Flip handles asymmetric growth from the off-center pill position.
- **D-13:** **Mobile**: CSS `clip-path: inset()` expansion from centered pill in 70px bottom bar. Bar grows taller (e.g., `h-[140px]`) to accommodate capsule content.
- **D-14:** State indicators per voice state:
  - idle: green dot pulse, everything else hidden
  - listening: active mic (accent pulse), animated waveform bars, "Listening..." label, stop/close + switch-to-text visible
  - thinking: slow ambient wave, transcript visible, "Thinking..." label
  - speaking: waveform tied to TTS audio amplitude, streaming response text with shimmer, "Speaking..." label

### Voice Commands
- **D-15:** Port `matchNavIntent(utterance)` regex router from prototype for navigation commands ("open portfolio", "show my work", "take me home", "about page").
- **D-16:** "text" or click switch-to-text button opens the ChatPopup (from Phase 6) and closes voice mode.
- **D-17:** "stop" or click stop button exits voice mode, navbar reverts to default state.

### Agent Loop
- **D-18:** AI responses via **Grok (xAI)** through the existing `/api/chat` route. Voice mode sends the same system prompt + message history, receives text responses, then streams them through ElevenLabs TTS.
- **D-19:** Tool calls from VOICE_HANDOFF.md: `navigate`, `openProject`, `scrollTo`, `openLink`, `toggleTheme`, `tourStep`, `endCall`. Tools plumbed from App level via VoiceBus or props.

### Scripted Tour
- **D-20:** Port `TOUR_STEPS` array from VOICE_HANDOFF.md. Detect triggers ("give me a tour", "show me around"). Iterate steps, await each `speak()` to finish before advancing. Visual highlight ring on current target.

### Barge-in
- **D-21:** When user speaks while agent is mid-TTS, stop speaking immediately. Cancel audio source, switch to `listening` state. Use VAD (`@ricky0123/vad-web`) or mic energy threshold detection.

### Persistent Memory
- **D-22:** Keep rolling last-20 message history in component state, persist to `localStorage` under `pf-voice-history`. Flush on close.

### Accessibility
- **D-23:** Keyboard shortcuts: `Space` = push-to-talk while held, `Esc` = close voice mode.
- **D-24:** Respect `prefers-reduced-motion`: skip morph animation (jump-cut capsule in), reduce particle wave amplitude to <= 0.2.
- **D-25:** Mic-permission-denied state with clear recovery CTA.

### Claude's Discretion
- Exact waveform visualization rendering (canvas bars vs SVG vs CSS)
- Audio chunk buffering strategy for ElevenLabs streaming
- Tour highlight ring visual style (reuse `.click-hint` or new `.vm-spotlight`)
- VAD library choice if `@ricky0123/vad-web` is problematic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### V3 Design Prototype (primary reference -- 1:1 port)
- `/tmp/design-extract/portfolio-v3/project/voice_mode.jsx` -- VoiceBus, VoiceOverlay, NavbarVoicePanel, matchNavIntent, audio analysis
- `/tmp/design-extract/portfolio-v3/project/VOICE_HANDOFF.md` -- Full architecture spec, tool calls, tour steps, testing checklist
- `/tmp/design-extract/portfolio-v3/project/home.jsx` -- Particle breathing integration with VoiceBus
- `/tmp/design-extract/portfolio-v3/project/styles.css` -- .vm-overlay, .vm-capsule, .vm-mic, .vm-wave, .vm-caption, vmMorphIn keyframes

### Existing Implementation (integration points)
- `src/components/ask-parz-button.tsx` -- Entry point for voice mode activation (onClick)
- `src/components/chat-popup.tsx` -- Text chat fallback (opened when user says "text")
- `src/components/particle-background.tsx` -- Particle mesh (needs VoiceBus breathing integration)
- `src/providers/transition-provider.tsx` -- navigateWithReveal for voice navigation commands
- `src/components/desktop-navbar.tsx` -- Desktop navbar (morphs into voice capsule)
- `src/components/mobile-navbar.tsx` -- Mobile navbar (morphs into voice capsule)
- `src/app/api/chat/route.ts` -- Existing Grok API route (template for /api/tts proxy)
- `src/data/system-prompt.ts` -- Parz persona system prompt

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ask-parz-button.tsx` -- Already has onClick prop, ambient orbs, green dot. Entry point for voice activation.
- `src/components/chat-popup.tsx` -- Text chat with useChat, suggestion chips, loading messages. Fallback when user says "text".
- `src/app/api/chat/route.ts` -- Grok API proxy pattern. Template for `/api/tts` ElevenLabs proxy.
- `src/components/particle-background.tsx` -- particles.js integration with `window.pJSDom` access pattern. Needs VoiceBus breathing rAF loop.
- GSAP already installed (`gsap`, `@gsap/react` in package.json) -- Flip plugin available.

### Established Patterns
- Provider pattern: `src/providers/` with ThemeProvider, TransitionProvider. VoiceBusProvider follows same pattern.
- API routes: `src/app/api/` with streaming response pattern (chat route).
- Theme detection: `useTheme()` + `useMounted()` guard.
- Window globals: `window.pJSDom` for particles.js access in rAF loops.

### Integration Points
- AskParzButton onClick currently opens ChatPopup. Voice mode replaces this: onClick activates voice mode instead. ChatPopup becomes the fallback when user says "text".
- ParticleBackground needs a new rAF loop reading `window.VoiceBus.level` for breathing animation.
- Desktop/Mobile navbars need voice mode state to trigger morph animation.
- TransitionProvider's `navigateWithReveal` used by voice `navigate` tool command.

</code_context>

<specifics>
## Specific Ideas

- Port voice_mode.jsx's VoiceBus implementation as closely as possible, adapting from vanilla JS to TypeScript with React hooks.
- The FLIP morph uses CSS custom properties (`--vm-ox/--vm-oy/--vm-ow/--vm-oh`) written from the origin rect. GSAP Flip in the Next.js version handles this automatically.
- ElevenLabs streaming: POST to `/v1/text-to-speech/{voice_id}/stream` with `model_id: "eleven_turbo_v2_5"`. Stream chunks into MediaSource / AudioBufferSourceNode queue. Hook audio to AnalyserNode for VoiceBus.setLevel(rms) during speaking.
- The prototype's `handleUserTurn` sends system prompt + message history to the AI. Reuse the existing Parz system prompt from `src/data/system-prompt.ts`.
- Tour steps from VOICE_HANDOFF.md: 5 steps covering home, particles, portfolio, Parz-AI project, and about page.

</specifics>

<deferred>
## Deferred Ideas

- Custom voice cloning via ElevenLabs Voice Lab (mentioned in VOICE_HANDOFF.md section 6)
- Deepgram or OpenAI Realtime as alternative STT providers
- Mobile voice controls (MOBV-01, MOBV-02 in Future Requirements)

</deferred>

---

*Phase: 08-voice-mode*
*Context gathered: 2026-04-24*
