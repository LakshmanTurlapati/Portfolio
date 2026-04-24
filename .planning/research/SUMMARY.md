# Project Research Summary

**Project:** Portfolio V3 — Voice Mode Production (v4.0 Milestone)
**Domain:** ElevenLabs STT upgrade, persistent voice overlay, cross-page tool callbacks in Next.js App Router
**Researched:** 2026-04-24
**Confidence:** HIGH

## Executive Summary

This research covers the four gaps that prevent voice mode from being production-ready: (1) ElevenLabs Scribe v2 Realtime STT must replace the Web Speech API, which is Chrome/Edge-only and fails silently in Firefox and Safari; (2) the voice overlay must survive page navigation by lifting `useVoiceController` from `page.tsx` to the root layout via a new `VoiceSessionProvider` client component; (3) tool callbacks (`openProject`, `scrollTo`, `openLink`, `toggleTheme`) are currently stub `console.warn` calls and must be wired to actual page-level actions; (4) voice mode must be reachable and functional on portfolio, about, and chat pages, not just the home page. The base stack (Next.js 15, React 19, TypeScript, Tailwind CSS 4, GSAP, @ai-sdk/xai, @elevenlabs/elevenlabs-js v2.44.0) is proven and not revisited — only one new browser-side package is needed: `@elevenlabs/client` v1.3.1.

The recommended build order is strictly sequenced by dependency. The persistent overlay must come first because every other feature either requires it or is dramatically simpler once it exists. Without layout-level `useVoiceController`, the voice session destroys on every navigation, making tool callback wiring impossible and STT integration unstable. Once the overlay is persistent, tool callbacks are wired via a page-registration hook pattern (no new packages). STT is then swapped in-place in `voice-controller.ts`, and the final step is a deployment-environment verification of both API keys on AWS Amplify.

The critical risks are audio-technical, not architectural. The ElevenLabs STT WebSocket requires PCM16 at 16kHz — `MediaRecorder` cannot produce this format, and an `AudioWorklet` with manual Float32-to-Int16 conversion and downsampling is required. Sharing the existing `VoiceBus._ctx` AudioContext between TTS playback and STT microphone capture creates an echo feedback loop; a dedicated `sttCtx` is mandatory. The API key must never reach the browser bundle — a server-side `/api/stt-token` route issuing 15-minute single-use tokens is the required authentication pattern. With these constraints respected, the implementation is straightforward and uses no new architectural patterns beyond what the project already contains.

## Key Findings

### Recommended Stack

The existing stack handles v4.0 with one addition. `@elevenlabs/elevenlabs-js` v2.44.0 (already installed) handles TTS and will generate STT tokens server-side. Its `ScribeRealtime` class is Node.js-only (confirmed in installed type declarations) and cannot run in the browser. `@elevenlabs/client` v1.3.1 is ElevenLabs' separate browser-safe SDK that exports `Scribe.connect()` for client-side WebSocket STT. No other new packages are needed — persistent overlay uses React context (built-in), tool callback wiring uses React context + ref, and navigation uses the existing `TransitionProvider.navigateWithReveal()`.

**Core technologies for v4.0:**
- `@elevenlabs/client` v1.3.1: Browser-safe STT SDK — `Scribe.connect()` + `RealtimeEvents` for WebSocket-based transcription
- `@elevenlabs/elevenlabs-js` v2.44.0 (existing): Server-side `client.tokens.singleUse.create('realtime_scribe')` for auth token generation
- `VoiceSessionProvider` (new React context, no package): Lifts `useVoiceController` to layout level, survives Next.js App Router navigation
- `AudioWorklet` + `public/pcm-processor.js` (Web platform API, no package): PCM16 capture at 16kHz for ElevenLabs STT WebSocket

**Explicitly rejected for v4.0:**
- Zustand: Tool callback problem solved by React context + ref
- `@elevenlabs/react`: Conversational agent package, not an STT helper
- `ScribeRealtime` from `@elevenlabs/elevenlabs-js`: Node.js-only, cannot run in browser
- Deepgram/AssemblyAI/Whisper: Second vendor; ElevenLabs STT already paid for under existing key

### Expected Features

**Must have (table stakes — missing any = voice is broken):**
- STT works in all browsers — MEDIUM complexity (Web Speech API is Chrome/Edge only; Firefox gets nothing)
- Voice overlay stays open across page navigation — MEDIUM complexity (VoiceController currently per-page)
- `openProject` tool executes — LOW-MEDIUM complexity (tour step 4 currently only logs console.warn)
- Voice accessible from portfolio, about, chat pages — LOW complexity once overlay is persistent

**Should have (differentiators):**
- ElevenLabs Scribe v2 Realtime STT: 30–150ms latency, 93.5% accuracy, 90+ languages — MEDIUM complexity
- Partial transcript display during speech — LOW complexity (Scribe emits PARTIAL_TRANSCRIPT events)
- `scrollTo` tool for about page sections — LOW complexity via existing `scrollToSection()` method
- `openLink` tool — LOW complexity (`window.open`)
- `toggleTheme` tool — LOW complexity (existing `ThemeContext.toggleTheme()`)

**Defer (v4.x and beyond):**
- Mobile voice overlay redesign (bottom-sheet) — HIGH complexity, secondary priority
- Voice analytics — MEDIUM complexity, informational only
- Custom wake word ("Hey Parz") — requires always-on mic, not appropriate for portfolio
- ElevenLabs Conversational AI (full duplex) — completely different architecture, loses Parz persona

### Architecture Approach

The v4.0 architecture change is a targeted lift of `useVoiceController` from page-level to layout-level. A new `VoiceSessionProvider` client component wraps `VoiceBusProvider`'s children in `layout.tsx`, holds the single `useVoiceController()` call, and exposes `voiceActive`, `voiceProps`, `micDenied`, `openVoice`, `closeVoice`, and `registerToolCallbacks` via React context. A new `LayoutShell` client component renders both navbars by consuming `useVoiceSession()` context, removing navbar rendering from all page components. Pages register their tool callbacks via a `useVoiceToolCallbacks()` hook on mount (auto-clean on unmount). Everything outside this critical path is unchanged.

**Major components:**
1. `VoiceSessionProvider` (NEW) — holds `useVoiceController`, exposes `useVoiceSession()` and `registerToolCallbacks()`
2. `LayoutShell` (NEW) — renders navbars from context; navbars never unmount across navigation
3. `useVoiceToolCallbacks` hook (NEW) — page-side registration; push on mount, remove on unmount
4. `/api/stt-token` route (NEW) — server-side single-use token; uses existing `ELEVENLABS_API_KEY`
5. `voice-controller.ts` (MODIFIED) — `startListening` body only: AudioWorklet + ElevenLabs WebSocket replaces Web Speech API
6. `layout.tsx` (MODIFIED) — adds `VoiceSessionProvider` and `LayoutShell` wrappers
7. `page.tsx`, `portfolio/page.tsx`, `about/page.tsx` (MODIFIED) — remove navbar renders; add tool registrations

### Critical Pitfalls

1. **MediaRecorder cannot produce PCM16 — AudioWorklet required** — `MediaRecorder` produces WebM/Opus or MP4/AAC; ElevenLabs Scribe requires PCM16 at 16kHz. Use `public/pcm-processor.js` (plain JS AudioWorklet) that converts Float32 to Int16 with downsampling. Prototype in isolation before integrating.

2. **Shared AudioContext between TTS and STT creates echo loop** — TTS playback leaks into the microphone capture path, causing Parz to hear its own voice. Keep `VoiceBus._ctx` for TTS only; create a separate `sttCtx = new AudioContext({ sampleRate: 16000 })` exclusively for the STT pipeline.

3. **API key must never reach the browser** — Browser opens the STT WebSocket directly; the server cannot proxy a microphone stream. Use `/api/stt-token` to issue 15-minute single-use tokens server-side. Never use `NEXT_PUBLIC_ELEVENLABS_API_KEY`.

4. **`useVoiceController` called per-page creates conflicting sessions** — Multiple instances clobber `VoiceBus.setState`, double-allocate AudioContexts, and reset state on every navigation. Single call site in `VoiceSessionProvider` only; pages use `useVoiceSession()` and `useVoiceToolCallbacks()`.

5. **Tool callback registration race during tour** — The tour's hardcoded 500ms wait after navigation does not guarantee the portfolio page has mounted and registered `openProject`. Replace with a `window.VoiceBus.emit('page-ready', 'portfolio')` signal from the portfolio page's `useEffect`, awaited in the tour with a 1500ms fallback.

6. **`scrollTo` on About page targets the wrong scroll container** — `window.scrollY` is always 0 on the about page; scrolling happens in a `div` with `overflow-y: auto`. The about page's `scrollTo` callback must use its existing `scrollToSection(id)` method, not `document.querySelector(selector)?.scrollIntoView()`.

## Implications for Roadmap

Based on the dependency chain from all four research files, the phase structure has a strict ordering driven by the persistent overlay prerequisite.

### Phase 1: Persistent Voice Overlay (VoiceSessionProvider + LayoutShell)
**Rationale:** This is the prerequisite gate. Every other v4.0 feature requires or benefits from the session surviving navigation. Highest structural risk; must come first. The architecture is fully specified in ARCHITECTURE.md with verified TypeScript.
**Delivers:** Voice session that survives navigation; navbars at layout level from context; Ask Parz reachable from all pages.
**Features addressed:** Persistent overlay (table stakes #2), voice on all pages (table stakes #4), navigate tool stable from any page
**Pitfalls to avoid:** Multiple `useVoiceController` instances; voice modules without `'use client'` breaking SSR
**Verification gate:** Open voice on home, navigate to portfolio — VoicePanel stays rendered, state machine does not reset

### Phase 2: Tool Callback Wiring
**Rationale:** With a stable layout-level session, wiring tool callbacks is low-risk. The page-ready signal pattern for the tour race condition belongs here. Validate the full dispatch chain before adding STT complexity.
**Delivers:** All tool calls produce visible effects; tour step 4 (`openProject`) works end-to-end.
**Features addressed:** `openProject` (table stakes #3), `scrollTo`, `openLink`, `toggleTheme` (differentiators)
**Pitfalls to avoid:** Tool registration race (page-ready event pattern); `scrollTo` targeting window instead of scroll panel; `openProject` slug/name mismatch (verify against `src/data/projects.ts` exact casing before writing)
**Verification gate:** "Give me a tour" — Parz-AI project detail opens, about sections scroll on command

### Phase 3: ElevenLabs Scribe STT Upgrade
**Rationale:** Independent of phases 1–2 structurally, but benefits from the stable layout-level session. Scoped entirely to `startListening()` in `voice-controller.ts`. AudioWorklet is the highest technical risk in the entire milestone — prototype in isolation first.
**Delivers:** Cross-browser STT (Firefox, Safari); partial transcript display; fresh per-session token fetch (no 15-minute expiry failures).
**Stack adds:** `@elevenlabs/client` v1.3.1, `public/pcm-processor.js`
**Pitfalls to avoid:** MediaRecorder format constraint; shared AudioContext echo; token caching; API key in browser bundle
**Verification gate:** Voice transcribes in Firefox and Safari; Parz does not respond to its own TTS output

### Phase 4: Deployment Verification and API Key Audit
**Rationale:** Orthogonal to phases 1–3. The existing `amplify.yml` env var injection pattern covers `XAI_API_KEY`; extend to `ELEVENLABS_API_KEY`. New `/api/stt-token` route must be smoke-tested in production.
**Delivers:** Confirmed working `/api/chat`, `/api/tts`, `/api/stt-token` on Amplify production. No 503s from missing env vars.
**Pitfalls to avoid:** `ELEVENLABS_API_KEY` missing in Lambda runtime; no rate limiting on token endpoint
**Verification gate:** `POST /api/stt-token` returns 200 with `{ token }` in production (not 503)

### Phase Ordering Rationale

- **Overlay persistence is the unambiguous prerequisite.** The dependency graph from FEATURES.md states it explicitly: tool callbacks need a stable context, STT benefits from a session that doesn't unmount, all pages need layout-level navbars.
- **Tool callbacks before STT** because validating the dispatch chain is simpler with the familiar Web Speech API than with the new WebSocket system. Phase 2 isolates tool logic from audio engineering risk.
- **STT last among the core three** because it has the most technical risk (AudioWorklet, format conversion, echo prevention). Phases 1 and 2 complete first so Phase 3 can focus entirely on audio engineering.
- **Deployment verification is evergreen** but triggered after Phase 3 since that phase adds the new route needing production validation.

### Research Flags

Phases needing deeper investigation during planning:
- **Phase 3 (STT Upgrade):** AudioWorklet implementation has multiple sharp edges — downsampling strategy (dedicated 16kHz AudioContext vs manual resampling in worklet), chunk size tuning (4–8KB), and barge-in threshold calibration for ElevenLabs TTS volume. Strongly recommend a standalone test script that opens the WebSocket and transcribes a fixed audio clip before touching the production hook.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Persistent Overlay):** Next.js App Router layout persistence and React context provider pattern are thoroughly documented. The `VoiceSessionProvider` code is fully specified in ARCHITECTURE.md with verified types.
- **Phase 2 (Tool Wiring):** All tool implementations are browser-native APIs or existing page state setters. Pattern fully specified in ARCHITECTURE.md.
- **Phase 4 (Deployment):** One-line `amplify.yml` extension of the existing `XAI_API_KEY` pattern.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | `@elevenlabs/client` v1.3.1 verified via npm. Node.js-only restriction on `ScribeRealtime` confirmed from installed type declarations at `wrapper/realtime/scribe.d.ts`. No other new packages needed — confirmed by negative analysis. |
| Features | HIGH | Derived from direct codebase reading of confirmed broken states: `console.warn` stubs in `dispatchToolCall`, single `useVoiceController` call site in `page.tsx`, Firefox STT failure confirmed via MDN. |
| Architecture | HIGH | All claims verified from installed package types and source reads of six production files. `VoiceSessionProvider` and `LayoutShell` code fully specified with working TypeScript in ARCHITECTURE.md. |
| Pitfalls | HIGH | MediaRecorder PCM format constraint is a hard browser API specification. AudioContext echo confirmed in Web Audio API spec. Token auth requirement documented in ElevenLabs API reference. Tour race condition identified from reading actual `setTimeout` in tour code. |

**Overall confidence:** HIGH

### Gaps to Address

- **AudioWorklet chunk size and downsampling strategy:** Research specifies 4–8KB chunks and a 16kHz AudioContext, but optimal values require profiling against actual Scribe WebSocket responses. Validate with an isolated test before integrating into `voice-controller.ts`.
- **`@elevenlabs/client` vs raw WebSocket:** STACK.md recommends `Scribe.connect()` from `@elevenlabs/client`; ARCHITECTURE.md describes raw WebSocket construction. The `@elevenlabs/client` SDK path is cleaner — verify it installs without peer dependency conflicts with the existing `@elevenlabs/elevenlabs-js` before committing to it.
- **`openProject` slug casing:** TOUR_STEPS uses `'Parz-AI'`. Must be verified against `src/data/projects.ts` field names before Phase 2 begins — silent failure if mismatched.
- **Barge-in threshold calibration:** ElevenLabs TTS has consistent full-volume output; the current 0.15 threshold may cause Parz to interrupt itself. Calibrate during Phase 3 — likely raise to 0.35 or disable during `speaking` state entirely.

## Sources

### Primary (HIGH confidence)
- `node_modules/@elevenlabs/elevenlabs-js/wrapper/realtime/scribe.d.ts` — Node.js-only restriction on `ScribeRealtime`
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/resources/speechToText/client/Client.d.ts` — `convert()` signature
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/types/SpeechToTextChunkResponseModel.d.ts` — `text: string` on response
- `npm view @elevenlabs/client version` — confirmed v1.3.1
- [ElevenLabs Client-Side STT Streaming Guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming) — `Scribe.connect()`, `RealtimeEvents`, token pattern
- [ElevenLabs Realtime STT API Reference](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime) — WebSocket endpoint, auth, audio format
- [ElevenLabs Tokens API Reference](https://elevenlabs.io/docs/api-reference/tokens/create) — 15-minute expiry, `realtime_scribe` scope
- [Next.js App Router Layout Docs](https://nextjs.org/docs/app/getting-started/layouts-and-pages) — layout persistence confirmed
- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) — Chrome/Edge only, no Firefox
- Direct codebase reads: `src/lib/voice-controller.ts`, `src/lib/voice-bus-init.ts`, `src/providers/voice-bus-provider.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx`, `src/app/api/tts/route.ts`

### Secondary (MEDIUM confidence)
- [deepwiki ScribeRealtime analysis](https://deepwiki.com/elevenlabs/packages/2.6-scribe-real-time-speech-to-text) — `RealtimeEvents` enum, `MicrophoneOptions` shape (third-party ElevenLabs source analysis)
- [LiveKit Agents Issue #4609](https://github.com/livekit/agents/issues/4609) — confirmed STT WebSocket does not auto-reconnect on token expiry
- [Streaming PCM16 from Browser](https://medium.com/developer-rants/streaming-audio-with-16-bit-mono-pcm-encoding-from-the-browser-and-how-to-mix-audio-while-we-are-f6a160409135) — MediaRecorder format limitation, AudioWorklet requirement
- [AudioWorklet Recorder reference implementation](https://github.com/alyssonbarrera/audio-worklet-recorder) — production PCM16 capture pattern

### Tertiary (LOW confidence — validate during implementation)
- Barge-in threshold value (0.35) for ElevenLabs TTS — inference from research, needs calibration
- 4–8KB chunk size for PCM WebSocket — derived from 125–250ms at 16kHz, needs profiling

---
*Research completed: 2026-04-24*
*Ready for roadmap: yes*
