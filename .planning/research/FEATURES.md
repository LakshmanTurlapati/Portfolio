# Feature Landscape

**Domain:** Voice Mode Production — Portfolio AI Persona (v4.0 Milestone)
**Researched:** 2026-04-24
**Confidence:** HIGH (existing codebase analysis + ElevenLabs official docs + Next.js App Router docs)

---

## Context

This research covers four features needed to make voice mode production-ready. The existing
infrastructure (VoiceBus state machine, ElevenLabs TTS at /api/tts, voice-controller hook,
VoicePanel component, rolling localStorage history) is already built and working. The gaps are:

1. ElevenLabs Scribe STT replacing Web Speech API
2. Persistent voice overlay that survives page navigation
3. Tool callbacks (openProject, scrollTo, openLink, toggleTheme) actually wired and executing
4. Voice mode reachable and functional on portfolio, about, and chat pages (not just home)

---

## Table Stakes (Users Expect These)

Features that make voice mode functional at all. Missing any of these = voice is broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| STT works in all browsers | Users on Firefox or Safari get a broken mic with Web Speech API | MEDIUM | Web Speech API is Chrome/Edge only; Firefox = no SpeechRecognition |
| Voice overlay stays open across navigation | User says "show me portfolio" and the voice panel disappears mid-transit | MEDIUM | VoiceController is currently instantiated per-page (home only); moving to layout level fixes this |
| openProject tool executes | Tour step 4 calls `openProject({slug:'Parz-AI'})` — currently logs a console.warn because no callback is wired | LOW | PortfolioPage.openProject() exists; needs to be exposed via context or callback |
| navigate tool executes | matchNavIntent() and TOUR_STEPS both call goPage(); works on home but not on portfolio/about pages because VoiceController is not mounted | LOW | Follows from overlay persistence fix |
| Voice accessible from portfolio page | The Ask Parz button (or equivalent trigger) must exist on portfolio/about/chat | MEDIUM | Currently only DesktopNavbar and MobileNavbar on home page wire onAskParz |

---

## Differentiators (Competitive Advantage)

Features that make this voice mode distinctive for a portfolio AI persona.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| ElevenLabs Scribe v2 Realtime STT | 30-150ms latency, 93.5% accuracy across accents, 90+ languages — dramatically better than Web Speech API's recognition errors on technical terms (React, Tailwind, xAI) | MEDIUM | Requires /api/stt-token route (server-side token endpoint) + WebSocket client code replacing startListening() in voice-controller |
| Partial transcript display during speech | Show interim words as user speaks — Scribe emits partial_transcript events before committing | LOW | Already display transcript in VoicePanel; just wire Scribe's partial events to setTranscript |
| scrollTo tool for portfolio sections | "Scroll to GitHub projects" or "scroll to education" are natural voice commands a portfolio visitor would say | LOW | window.querySelector(selector).scrollIntoView() — trivial to implement once wired |
| openLink tool for external URLs | "Show me your GitHub" or "open the Figma design" — AI can trigger browser navigation | LOW | window.open(url) — also trivial once wired |
| toggleTheme tool | "Switch to dark mode" is a natural voice command that demos AI capability | LOW | ThemeContext.toggleTheme() already exists |
| Voice available on chat page | User can speak into chat page to send voice messages — coherent experience | LOW | Depends on overlay persistence; once layout-level, chat page gets it for free |
| Smooth transition: STT → TTS latency | User finishes speaking → AI response begins speaking with minimal dead air | LOW | Already architected correctly; Scribe's lower STT latency directly reduces the gap |

---

## Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| ElevenLabs Conversational AI (full duplex) | Sounds like the obvious "voice AI" product to use | Completely different architecture — replaces the entire VoiceBus + voice-controller system, loses Parz persona, loses tool call dispatch, loses history, locks to ElevenLabs for the AI model | Keep existing architecture: VoiceBus + Scribe STT + /api/chat + ElevenLabs TTS |
| @elevenlabs/client Scribe class | DeepWiki docs reference `Scribe.connect()` from @elevenlabs/client package | That package is NOT installed; it wraps the conversational AI SDK, not Scribe STT directly | Use raw WebSocket to wss://api.elevenlabs.io/v1/speech-to-text/realtime with a single-use token — this is what the installed elevenlabs-js SDK types already describe |
| Always-on ambient listening | Feels futuristic — mic is always open | Battery drain, privacy concerns, browser autoplay policy issues, continuous mic permission | Push-to-talk (Space) already works; add explicit tap-to-listen |
| Voice history export or sharing | "Download my conversation with Parz" | Not in scope for a portfolio persona | Rolling localStorage history (already built) is sufficient |
| Firebase/Supabase for conversation persistence | Cross-session memory for the AI persona | Backend dependency, auth complexity, GDPR concerns | localStorage rolling 20 messages is the right call for a public portfolio |
| Custom wake word detection | "Hey Parz" to activate hands-free | Requires always-on mic (see above anti-pattern) | Ask Parz button is the correct activation UX |
| Voice on mobile (mic permission) | Complete feature parity | MediaDevices.getUserMedia works on mobile, but UX is poor — tiny navbar panel, no visual feedback space, mic permission flow is disruptive | Graceful degradation: show mic-denied state (already built), document mobile limitation |

---

## Feature Dependencies

```
[ElevenLabs STT — Scribe WebSocket]
    └──requires──> /api/stt-token route (server-side single-use token endpoint)
    └──requires──> voice-controller startListening() replaced with Scribe connection
    └──requires──> VoiceBus.attachMic() call path reused for amplitude visualization

[Persistent Voice Overlay]
    └──requires──> VoiceController moved from page-level to layout.tsx
    └──requires──> VoiceContext (React context) to expose open/close/state to all pages
    └──enables──>  Tool callbacks (goPage, openProject reachable from any page)
    └──enables──>  Ask Parz button on portfolio/about/chat pages

[Tool Callback Wiring]
    └──requires──> Persistent Voice Overlay (VoiceController at layout level)
    └──requires──> openProject: PortfolioPage state exposed via context or URL navigation
    └──requires──> scrollTo: window.querySelector + scrollIntoView (trivial)
    └──requires──> openLink: window.open (trivial)
    └──requires──> toggleTheme: ThemeContext.toggleTheme() via useTheme()

[Cross-Page Voice]
    └──requires──> Persistent Voice Overlay (VoiceController at layout level)
    └──requires──> Ask Parz button rendered in layout (or each page's navbar)
    └──enhances──> Tool callbacks (makes navigation commands meaningful on any page)
```

### Dependency Notes

- **Persistent overlay is the keystone**: Every other feature either requires it or is dramatically
  simpler once it exists. Do this first.

- **STT upgrade is independent**: Scribe STT can be implemented before or after overlay
  persistence. The interface is identical — `startListening()` is replaced in-place. But overlay
  persistence is higher-value and lower-risk, so sequence it first.

- **openProject is the hard tool call**: It requires either (a) lifting portfolio page state into
  a context so VoiceController can trigger it from layout level, or (b) using router navigation
  to `/portfolio?open=Parz-AI` and having PortfolioPage read the query param on mount. Option (b)
  is simpler and decoupled. The other tool calls (scrollTo, openLink, toggleTheme) are trivial
  browser API calls with no cross-component state issues.

- **ElevenLabs STT requires a new API route**: `/api/stt-token` calls
  `POST https://api.elevenlabs.io/v1/single-use-token/realtime_scribe` using the server-side
  ELEVENLABS_API_KEY and returns `{token: string}`. The client uses this token to open a WebSocket
  to `wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=<token>`. The installed
  elevenlabs-js SDK (v2.44) has the type definitions for this protocol but the actual WebSocket
  connection must be constructed manually — there is no `Scribe.connect()` helper in the installed
  package.

---

## MVP Definition

This is a milestone, not a greenfield product. "MVP" here means: the minimum set of work that
makes voice mode production-ready (all four stated goals met, no known-broken states).

### Ship With (v4.0)

- [ ] **Persistent voice overlay** — VoiceController in layout.tsx, VoiceContext, Ask Parz
  accessible from portfolio/about/chat — this is the highest-leverage change
- [ ] **Tool callbacks wired** — scrollTo, openLink, toggleTheme (trivial); openProject via
  URL query param strategy (decoupled, no context lifting)
- [ ] **ElevenLabs Scribe STT** — /api/stt-token endpoint + WebSocket-based startListening()
  replacing Web Speech API; partial/committed transcript events wired to VoicePanel display
- [ ] **Grok API key verification** — confirm NEXT_PUBLIC_XAI_API_KEY (or XAI_API_KEY) is set
  and /api/chat returns real responses; voice-controller's /api/chat call already correct

### Add After Validation (v4.x)

- [ ] **Mobile voice UX** — the VoicePanel in the navbar is visually cramped at 375px; a
  bottom-sheet voice overlay on mobile would be superior. Defer until desktop is proven.
- [ ] **Voice analytics** — track which commands users actually speak (stop, tour, navigate)
  to prioritize future improvements. Not needed for launch.

### Future Consideration (v5+)

- [ ] **Custom wake word** — "Hey Parz" activation; requires always-on mic architecture change
- [ ] **Multi-turn tool execution** — AI agent loop that can chain tool calls ("open Parz-AI
  and scroll to the GitHub link") — requires richer tool schema in /api/chat system prompt
- [ ] **Voice transcript to text chat handoff** — seamlessly copy voice conversation into
  chat popup. Partial support exists (openTextChat callback), but needs UI polish.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Persistent voice overlay (layout-level) | HIGH — voice breaks on every navigation | MEDIUM — provider pattern, VoiceContext, layout wiring | P1 |
| Tool callbacks: scrollTo, openLink, toggleTheme | MEDIUM — demo value, expected to work | LOW — 3-5 lines each, browser APIs | P1 |
| Tool callback: openProject via URL param | HIGH — tour step 4 is the flagship demo | LOW-MEDIUM — query param pattern, PortfolioPage reads on mount | P1 |
| ElevenLabs Scribe STT upgrade | HIGH — Firefox/Safari users currently get zero STT | MEDIUM — new API route + WebSocket client code | P1 |
| Ask Parz button on portfolio/about/chat | MEDIUM — accessibility of feature | LOW — copy button from home page | P1 |
| Grok API key verification | HIGH — voice AI is broken if key is missing | LOW — env check, /api/chat smoke test | P1 |
| Mobile voice overlay redesign | LOW — mobile UX is secondary | HIGH — new component design | P3 |
| Voice analytics | LOW — informational only | MEDIUM — integration work | P3 |

---

## Technical Implementation Notes

### ElevenLabs Scribe STT — Token Flow

Token endpoint (server-side only):
```
POST https://api.elevenlabs.io/v1/single-use-token/realtime_scribe
Headers: { xi-api-key: process.env.ELEVENLABS_API_KEY }
Response: { token: string }  // expires in 15 minutes, single use
```

WebSocket connection (client-side):
```
wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=<token>
```

Audio format: PCM16 at 16000 Hz, base64-encoded chunks. The SDK's `_startLoop` already
captures raw PCM via AudioContext — reuse this path to send chunks to the WebSocket.

Event types (from installed SDK types in ReceiveTranscription.d.ts):
- `session_started` — connection confirmed
- `partial_transcript` — interim text as user speaks (display in VoicePanel)
- `committed_transcript` — final text (trigger handleUserTurn)
- Error payloads: ScribeAuthError, ScribeQuotaExceeded, ScribeRateLimited, etc.

Commit strategy: `vad` (voice activity detection) — the API detects silence and auto-commits.
This matches the Web Speech API's `continuous: false` behavior in startListening().

### Persistent Voice Overlay — Next.js Pattern

Next.js App Router `layout.tsx` is a Server Component by default. Providers must be Client
Components. The existing pattern in the project (VoiceBusProvider, ThemeProvider,
TransitionProvider all in layout.tsx) is correct and can be extended.

The correct pattern:
1. Create `VoiceProvider` ('use client') — holds VoiceController state, exposes `open`, `close`,
   `voiceActive`, `voiceProps`, `toolCallbacks` via React context
2. Add `VoiceProvider` to layout.tsx wrapping children
3. Render `VoiceOverlay` inside `VoiceProvider` — this is the persistent navbar morph component
   that currently lives inside DesktopNavbar on home page only
4. Each page's navbar just calls `useVoiceContext().open()` on Ask Parz click

The layout.tsx `{children}` already survives navigation — layouts do not remount on route changes
in Next.js App Router. The VoiceController state (active, voiceState, caption, history) persists
across navigation because it lives in the layout-level provider.

### openProject Tool — Decoupled Strategy

The problem: openProject needs to open a project detail overlay in PortfolioPage, but when
VoiceController is at layout level, it has no direct reference to PortfolioPage state.

The clean solution: navigate to `/portfolio?open=<slug>` instead of calling a callback.
PortfolioPage reads `useSearchParams().get('open')` on mount and opens the project matching
that slug. No context lifting required. Works from any page.

The voice-controller goPage function already handles navigation — `openProject` becomes a
specialized case of navigate:

```
case 'openProject':
  goPage('portfolio');
  // PortfolioPage reads ?open=slug from URL and triggers setSelectedProject
```

---

## Sources

- ElevenLabs Scribe v2 Realtime docs: https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime
- ElevenLabs client-side streaming guide: https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming
- ElevenLabs single-use token endpoint: https://elevenlabs.io/docs/api-reference/tokens/create
- Scribe v2 Realtime accuracy benchmarks: https://elevenlabs.io/realtime-speech-to-text
- Web Speech API browser support (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API — Chrome/Edge only, no Firefox
- Next.js App Router layout persistence: https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Next.js context provider pattern: https://vercel.com/kb/guide/react-context-state-management-nextjs
- Installed SDK types: node_modules/@elevenlabs/elevenlabs-js/api/resources/v1SpeechToTextRealtime/ (v2.44.0)
- Existing codebase analysis: src/lib/voice-controller.ts, src/types/voice-bus.d.ts, src/lib/voice-commands.ts, src/app/layout.tsx, src/app/page.tsx

---

*Feature research for: Voice Mode Production (v4.0 milestone)*
*Researched: 2026-04-24*
