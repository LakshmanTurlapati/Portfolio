# Pitfalls Research

**Domain:** Voice mode production features — ElevenLabs STT, persistent overlay, cross-page voice, tool call wiring in Next.js App Router
**Researched:** 2026-04-24
**Confidence:** HIGH (codebase read + ElevenLabs docs + browser API documentation verified)

---

## Critical Pitfalls

Mistakes that cause rewrites, broken sessions, or silent failures.

---

### Pitfall 1: ElevenLabs STT Requires a New Server Endpoint — The API Key Cannot Be Used Client-Side

**What goes wrong:**
The existing TTS route (`/api/tts`) works because it proxies the ElevenLabs call entirely server-side. ElevenLabs STT via the Scribe Realtime v2 model is a WebSocket connection that the browser must open directly — the server cannot proxy a browser microphone stream through a Next.js API route without extreme complexity. This means the browser needs credentials. But using the raw `ELEVENLABS_API_KEY` in the browser violates the existing security model and would expose the key in client bundle or network traffic.

**Why it happens:**
The ElevenLabs STT realtime API requires the client to open a `wss://` WebSocket directly. The `/api/tts` pattern (HTTP POST → server fetches → proxied response) does not port to WebSocket. Developers assume the same pattern will work and either: (a) pass the API key directly to the client, or (b) try to proxy via a server WebSocket, adding a complex relay layer.

**How to avoid:**
Use ElevenLabs' single-use token endpoint. Add a new API route (`/api/stt-token`) that generates a short-lived token server-side via `elevenlabs.tokens.singleUse.create("realtime_scribe")`. The browser fetches this token (15-minute TTL), then opens the WebSocket using the token as a query parameter (`?token=...`). The token is useless after expiry, so exposure is low-risk.

```typescript
// /api/stt-token/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST() {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }
  const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
  const token = await client.tokens.singleUse.create('realtime_scribe');
  return Response.json(token);
}
```

**Warning signs:**
- Any code that passes `ELEVENLABS_API_KEY` to the client component
- `NEXT_PUBLIC_ELEVENLABS_API_KEY` appearing anywhere in the codebase
- WebSocket connection errors with 401 in the browser network tab

**Phase to address:** STT Upgrade phase (first task). The token endpoint must exist before the browser WebSocket can be tested.

---

### Pitfall 2: MediaRecorder Cannot Produce PCM16 — AudioWorklet Is Required

**What goes wrong:**
The current `window.VoiceBus.attachMic()` uses `getUserMedia` → `createMediaStreamSource` → `AnalyserNode` for amplitude visualization only. For Web Speech API STT, the browser handles audio capture internally. For ElevenLabs STT, audio data must be sent to the WebSocket as base64-encoded PCM16 at 16kHz. `MediaRecorder` (the obvious choice) produces WebM/Opus or MP4/AAC depending on browser — it cannot produce raw PCM16. This is a hard constraint, not a configuration option.

**Why it happens:**
Developers reach for `MediaRecorder` because it is the standard recording API and appears in every browser audio tutorial. The mismatch with STT API requirements is only discovered when the WebSocket rejects the audio format or produces garbled transcripts.

**How to avoid:**
Use an `AudioWorklet` to capture raw Float32 samples and convert them to Int16 PCM. The worklet runs on the audio thread, sends buffer messages via `port.postMessage` to the main thread, and the main thread base64-encodes them before sending to the WebSocket.

Critical implementation details:
- Browser native sample rate is 44100 Hz or 48000 Hz. ElevenLabs Scribe default is 16000 Hz (`PCM_16000`). The worklet must downsample.
- AudioWorklet scripts must be plain JavaScript — no TypeScript, no imports, no ESM. Serve from `public/` directory.
- The existing `VoiceBus._ctx` (AudioContext) is created with default sample rate. For STT worklets, create a separate AudioContext with `sampleRate: 16000` OR implement manual downsampling in the worklet.

```javascript
// public/pcm-processor.js (plain JS, no imports)
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
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
```

**Warning signs:**
- `MediaRecorder` appearing in any STT capture code
- Transcripts that are empty or gibberish despite audio being captured
- WebSocket receiving data but returning `CommittedTranscript` with empty text

**Phase to address:** STT Upgrade phase. Prototype the AudioWorklet capture in isolation before integrating with VoiceBus.

---

### Pitfall 3: Sharing the VoiceBus AudioContext Between TTS Playback and STT Capture Causes Echo and State Conflicts

**What goes wrong:**
The current `VoiceBus._ctx` is a single `AudioContext` instance used for TTS audio decoding and playback (`decodeAudioData`, `createBufferSource`), amplitude analysis (`_startLoop`, AnalyserNode), and now potentially STT capture (AudioWorklet + microphone source). When ElevenLabs TTS is playing and the microphone is simultaneously active, the playback audio feeds back into the microphone capture path, producing an echo loop in the transcription. This manifests as Parz "hearing" its own speech and trying to respond to it.

**Why it happens:**
Sharing one AudioContext seems elegant — the `_getCtx()` helper already lazy-creates it, and Web Audio API allows routing both inputs (mic) and outputs (TTS playback) through the same graph. But `createMediaStreamSource` (mic input) and `createBufferSource` (TTS output) in the same AudioContext with an AnalyserNode can route mic audio back into the analysis loop. Browser `echoCancellation` on `getUserMedia` only suppresses echo in WebRTC/MediaRecorder contexts, not in AudioContext graphs.

**How to avoid:**
Use separate AudioContexts for TTS output and STT input. Keep `VoiceBus._ctx` for TTS playback and amplitude visualization exclusively. For STT, create a dedicated `sttCtx = new AudioContext({ sampleRate: 16000 })` that is only used for microphone capture → AudioWorklet → WebSocket pipeline. This context never connects to the destination (no speaker output), so there is no path for TTS audio to leak into it.

Additionally, implement the state guard already implied by `VoiceBus.state`: only open the STT WebSocket when state is `listening`, close it when state transitions to `speaking`. Never have both the STT WebSocket and the TTS AudioBufferSourceNode active simultaneously.

**Warning signs:**
- Parz responding to its own TTS output mid-sentence (barge-in triggering on its own voice)
- Transcript containing text that matches the TTS caption
- `detachMicRef` not being called before TTS playback starts

**Phase to address:** STT Upgrade phase. Add explicit mic-detach → TTS-start sequencing in `startListening` / `streamTTS` transition.

---

### Pitfall 4: The Voice Controller Is Instantiated per Page — Moving It to Layout Level Requires Architectural Surgery

**What goes wrong:**
`useVoiceController` is currently called inside `Home` (page-level component). The voice overlay (`VoicePanel`) is rendered inside `DesktopNavbar`, which is also page-level. When the user navigates from home to portfolio while voice is active, the entire voice session is destroyed: React unmounts the home page component, `useVoiceController` teardown runs (which calls `stopAll()`), TTS mid-sentence cuts off, the WebSocket drops, and the navbar reverts to default appearance. Voice mode does not survive navigation.

**Why it happens:**
This was the v3 design: voice was home-only. Moving it to layout-level is a justified architectural change but requires lifting the hook call (and all its state) into the root layout or a layout-level client component — which the current architecture does not have. The root layout (`layout.tsx`) is a server component and cannot call hooks.

**How to avoid:**
Create a dedicated client component, e.g., `VoiceController.tsx`, that wraps `useVoiceController` and renders the `DesktopNavbar` + `MobileNavbar`. Mount it in the root layout as a persistent client component. This component is never unmounted across navigations. Pages register their tool callbacks into a shared context (or directly into VoiceBus) via `useEffect` on mount/unmount.

```tsx
// src/components/voice-controller.tsx  ('use client')
export function VoiceController({ children }: { children: React.ReactNode }) {
  const { navigateWithReveal } = useTransition();
  const { resolvedTheme } = useTheme();
  // ... voice state and useVoiceController call
  return (
    <>
      <DesktopNavbar ... />
      <MobileNavbar ... />
      {children}
    </>
  );
}

// src/app/layout.tsx (server component)
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>
          <TransitionProvider>
            <VoiceBusProvider>
              <VoiceController>
                {children}  {/* pages mount/unmount here */}
              </VoiceController>
            </VoiceBusProvider>
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Pages then push their callbacks into a context provided by `VoiceController`:

```tsx
// Portfolio page
const { registerTools } = useVoiceTools();
useEffect(() => {
  registerTools({ openProject: (args) => setSelectedProject(findProject(args.slug)) });
  return () => registerTools({});  // deregister on unmount
}, []);
```

**Warning signs:**
- Voice state resetting when user navigates while voice is active
- `VoicePanel` disappearing on page change
- `useVoiceController` being called in any page component (`page.tsx`)

**Phase to address:** Layout Lift phase. This is the highest-risk structural change and must be done before tool callbacks are wired.

---

### Pitfall 5: Tool Callback Registration Race — Page Unmounts Before Voice Completes Its Tool Call

**What goes wrong:**
During the tour, `TOUR_STEPS[3]` calls `openProject({ slug: 'Parz-AI' })`. The tour is navigating pages sequentially. If the portfolio page is not yet mounted when this call fires (because the navigation transition is still in progress), `toolCallbacks.openProject` is either undefined (portfolio not mounted, no registration) or points to a stale closure from a previously mounted page. The project detail overlay either fails to open silently (`console.warn`) or opens on the wrong page.

**Why it happens:**
The `startTour` function navigates then waits 500ms (`await new Promise(r => setTimeout(r, 500))`), then calls `speak`, then fires `dispatchToolCall`. The 500ms hardcoded delay is a heuristic that does not guarantee the new page has mounted and registered its tool callbacks. On slow devices or after a View Transitions animation, the portfolio page may take longer than 500ms to mount.

**How to avoid:**
Replace the fixed `setTimeout` delay with a promise that resolves when the target page signals readiness. Use a context value or VoiceBus event. Portfolio page fires `window.VoiceBus.emit('page-ready', 'portfolio')` in a `useEffect` with no deps (runs after first mount). The tour waits for this event with a timeout fallback.

```typescript
// In startTour, replace the 500ms wait:
await Promise.race([
  new Promise<void>(res => {
    const unsub = window.VoiceBus.on('page-ready', (page) => {
      if (page === step.page) { unsub(); res(); }
    });
  }),
  new Promise<void>(res => setTimeout(res, 1500)), // fallback
]);
```

Additionally, `dispatchToolCall` should check `activeRef.current` before executing — if voice was closed during the wait, abort.

**Warning signs:**
- `[VoiceController] openProject tool called but no toolCallbacks.openProject provided` in console during tour
- Tour completing but project detail overlay never appearing
- Race condition logs where tool fires before page mounts

**Phase to address:** Tool Wiring phase. Implement the page-ready signal pattern when wiring `openProject` on the portfolio page.

---

### Pitfall 6: VoiceBus `declare global` Type Leaks Into SSR — Server Components Will Throw

**What goes wrong:**
`window.VoiceBus` is typed via `declare global { interface Window { VoiceBus: ... } }`. This works in client components because `typeof window !== 'undefined'` guards are in place. However, if any file that imports from `voice-bus-init.ts` or `voice-controller.ts` ends up in the server component graph (e.g., a layout import without `'use client'`), TypeScript will emit the type but Next.js will throw at runtime because `window` does not exist on the server. The `declare global` adds `VoiceBus` to `Window` globally for TypeScript, which does not cause a compile error even in server context.

**Why it happens:**
When `VoiceController.tsx` is added as a layout-level component without `'use client'`, or when a server component imports anything from the voice module chain, the server execution touches `window.VoiceBus`. The `initVoiceBus()` call at module scope in `voice-bus-provider.tsx` has a `typeof window === 'undefined'` guard, but the `declare global` type pattern gives a false sense of safety.

**How to avoid:**
- `VoiceController.tsx` must have `'use client'` as its first line.
- `voice-bus-init.ts`, `voice-controller.ts`, `voice-commands.ts` must all be client-only. Add `'use client'` to any of these that do not already have it, or confirm they are only ever imported from client components.
- Keep the server layout thin: only import providers that are themselves `'use client'` wrappers.
- Run `next build` and check for "You're importing a component that needs `useState`..." errors as a verification step.

**Warning signs:**
- `ReferenceError: window is not defined` in server-side stack traces
- Build output showing voice files in the server bundle
- Pages that work on client navigation but crash on hard refresh (which triggers SSR)

**Phase to address:** Layout Lift phase. Audit `'use client'` directives as part of moving voice components into the layout.

---

### Pitfall 7: The 15-Minute STT Token Expires During a Long Voice Session — WebSocket Closes Silently

**What goes wrong:**
ElevenLabs single-use STT tokens expire after 15 minutes. If a user opens voice mode and leaves it in the background (tab open, voice idle), the WebSocket established with that token will close with an auth error after 15 minutes. The next time the user speaks, `startListening` tries to reuse the existing WebSocket (if cached), which is closed. Transcripts stop arriving. The UX state machine stalls in `listening` forever because `onend` was never fired for the stale socket.

**Why it happens:**
Token generation happens once at session start (`open()` or first `startListening()`). Web Speech API had no concept of token expiry — the browser manages its own auth. ElevenLabs STT requires explicit token refresh. The LiveKit agents repository has documented this exact reconnection failure: `SpeechStream._run()` does not automatically reconnect after mid-stream WebSocket drops.

**How to avoid:**
Do not cache the STT WebSocket across calls to `startListening`. Open a fresh WebSocket (with a fresh token) on each listening session. Since the STT WebSocket is only open during active listening (not during thinking/speaking/idle), the 15-minute window is effectively irrelevant — a fresh token is fetched on each mic activation. The cost is one extra `/api/stt-token` HTTP round-trip per listening session (~50ms), which is acceptable.

```typescript
// In startListening, always fetch a fresh token:
const startListening = useCallback(async () => {
  const res = await fetch('/api/stt-token', { method: 'POST' });
  const { token } = await res.json();
  const ws = new WebSocket(`wss://api.elevenlabs.io/v1/speech-to-text/realtime?token=${token}&audio_format=pcm_16000`);
  // ... setup handlers, close on session end
}, []);
```

**Warning signs:**
- STT stops working after extended idle periods (>15 min)
- WebSocket `close` event with code 4001 or 4003 (auth failure)
- `listening` state stuck with no transcript arriving

**Phase to address:** STT Upgrade phase. Do not implement token caching; design for per-session token fetch from the start.

---

### Pitfall 8: `scrollTo` Tool on the About Page Targets a Scoped Scrollable Div, Not `window`

**What goes wrong:**
The about page uses a custom scrollable right panel (`ref={scrollContainerRef}`) that is a `div` with `overflow-y: auto` — not the browser window. The `scrollTo` tool in `dispatchToolCall` will call `toolCallbacks.scrollTo({ selector: '#experience' })`. A naive implementation does `document.querySelector(selector)?.scrollIntoView()` which calls the browser's default `scrollIntoView` on `window`. On the about page, this does nothing visible because the page is not window-scrollable — the right panel is.

**Why it happens:**
The about page layout is `position: fixed` sidebar + scrollable right panel. `window.scrollY` is always 0. `scrollIntoView()` with default behavior scrolls the nearest scrollable ancestor, which is the right panel `div`. But if the `selector` targets the section `data-section="experience"`, `scrollIntoView` may not scroll the custom container as expected if the container is not a scrolling ancestor of the element in the DOM hierarchy.

**How to avoid:**
The about page's `scrollTo` implementation must be custom — it must call `ref.current.scrollIntoView({ behavior: 'smooth' })` using the existing `sectionRefs` map (already present at lines 112-116 in `about/page.tsx`). When the about page registers its `scrollTo` tool callback, it passes its own implementation that understands the section refs:

```typescript
registerTools({
  scrollTo: ({ selector }) => {
    const id = selector.replace('#', '') as SectionId;
    scrollToSection(id);  // existing method, already works
  },
});
```

**Warning signs:**
- Voice command "scroll to experience" plays the TTS response but the page does not scroll
- `window.scrollY` remaining 0 throughout the about page session
- `scrollIntoView` calls in browser console with no visible effect

**Phase to address:** Tool Wiring phase, specifically the about page's tool registration.

---

### Pitfall 9: `openProject` Tool Uses a `slug` But Portfolio Cards Are Matched by `name` — Data Shape Mismatch

**What goes wrong:**
`TOUR_STEPS[3]` calls `openProject({ slug: 'Parz-AI' })`. The portfolio page's `openProject` callback (line 41 in `portfolio/page.tsx`) receives a `Project` object and extracts URLs from it. The tour's `openProject` tool passes `{ slug: string }`, but the portfolio page's `openProject` is typed as `(project: Project) => void`. The tool callback interface in `ToolCallbacks` (`openProject?: (args: { slug: string }) => void`) does not match the page's own `openProject` callback. The wiring requires a lookup: find the project by slug, then call the page's handler with the full `Project` object.

**Why it happens:**
The AI tool interface was designed with string-based slugs (LLM-friendly), while the UI was designed with full typed objects (React-friendly). The disconnect was never resolved because `openProject` was never actually wired in v3.

**How to avoid:**
The portfolio page's tool registration must bridge the two interfaces:

```typescript
// In portfolio/page.tsx tool registration
registerTools({
  openProject: ({ slug }) => {
    const project = projects.find(p => p.name === slug || p.slug === slug);
    if (project) setSelectedProject(project);
  },
});
```

Also verify the slug values in `TOUR_STEPS` match actual project names in the data store. `'Parz-AI'` must match a `project.name` exactly (case-sensitive). Check `src/data/projects.ts` for the exact casing.

**Warning signs:**
- `openProject` tool fires but `selectedProject` remains null
- `console.warn` about no project found for slug
- Project detail overlay never opening during tour step 4

**Phase to address:** Tool Wiring phase. Verify slug-to-name mapping before writing the tool registration.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded 500ms navigation wait in `startTour` | Simple to implement, works on fast machines | Race condition on slow devices — tool calls fire before page mounts | Never for production; replace with page-ready signal |
| Using `window.VoiceBus` global instead of React context for tool callbacks | Works across any component without prop drilling | Difficult to TypeScript-type; bypasses React rendering model; callbacks can be stale | Acceptable for state/level events; avoid for tool callbacks |
| Caching STT WebSocket across listening sessions | Saves one round-trip per activation | Silent failure after 15-minute token expiry | Never; per-session token fetch is cheap enough |
| `any` type for `SpeechRecognition` in `voice-controller.ts` (lines 79, 400, 410) | Avoids complex `@types/webdomspeech` installation | Type errors in Web Speech API calls are invisible; won't be needed after ElevenLabs STT replaces it | Acceptable temporarily; eliminate when Web Speech API code is removed |
| Inline `setTimeout(r, 500)` for tour pacing | Predictable tour pacing in controlled environment | Breaks on slow navigation transitions or slow devices | Only for a prototype demo; replace with event-driven wait |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| ElevenLabs STT (Scribe Realtime) | Passing raw API key to browser WebSocket | Fetch single-use token from `/api/stt-token`, use `?token=` query parameter |
| ElevenLabs STT WebSocket | Using MediaRecorder for audio capture | Use AudioWorklet with PCM16 conversion; MediaRecorder cannot produce raw PCM |
| ElevenLabs STT audio format | Sending 48kHz Float32 directly | Convert to 16kHz Int16 PCM first; Scribe expects `pcm_16000` by default |
| ElevenLabs STT + TTS | Sharing one AudioContext for both mic input and speaker output | Separate AudioContexts: `VoiceBus._ctx` for TTS only, dedicated `sttCtx` for microphone capture |
| ElevenLabs TTS streaming | Calling `decodeAudioData` on a stream mid-flight | The current implementation waits for full `arrayBuffer()` before decode — correct but adds latency; acceptable tradeoff for MVP |
| Amplify env vars | Missing `ELEVENLABS_API_KEY` in Lambda runtime | Add `echo "ELEVENLABS_API_KEY=$ELEVENLABS_API_KEY" >> .env.production` to `amplify.yml` build phase (same pattern as existing `XAI_API_KEY`) |

---

## Performance Traps

Patterns that work at small scale but fail under real usage.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| PCM16 conversion on main thread (no AudioWorklet) | UI jank during listening; animation stutter | Always use AudioWorklet for audio processing; it runs on separate audio thread | Immediately on any device; audio thread misses deadlines if on main thread |
| Resubscribing to VoiceBus events on every render | Duplicate event handlers accumulate; state machine fires N times per event | Store unsubscribe functions in `useRef`; verify cleanup functions are called | After ~20 renders of the controller component |
| Sending large PCM chunks (>8KB) to ElevenLabs WebSocket | Transcript latency increases; backpressure on WebSocket | Send chunks of 4-8KB maximum (maps to ~125-250ms of audio at 16kHz) | Noticeable delay in transcription when chunks exceed 250ms of audio |
| Tour's sequential `await speak()` calls blocking close | User cannot exit mid-tour; voice stays in `speaking` state | Always check `activeRef.current` at the start of each tour step | Any time user closes voice during a long tour step |
| `historyRef.current` growing unboundedly during long sessions | localStorage write fails (5MB limit); JSON serialization slow | Existing `slice(-20)` on save is correct; also enforce during append | After ~100 turns in a single session if slice-on-save is missed |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Using `NEXT_PUBLIC_ELEVENLABS_API_KEY` to avoid building `/api/stt-token` route | API key fully exposed in browser bundle; anyone can make unlimited STT requests on your account | Always use single-use token endpoint; the 15-minute TTL and single-use semantics limit exposure |
| Not allowlisting the STT token scope | Token could be reused for other ElevenLabs API operations | Use `elevenlabs.tokens.singleUse.create("realtime_scribe")` with the specific scope |
| Logging transcript content server-side | User speech content visible in Amplify CloudWatch logs | Do not log transcript payloads; log only connection events and error codes |
| Missing rate limiting on `/api/stt-token` | Attacker floods the endpoint, burning ElevenLabs quota | Add request-based rate limiting or require session validation before issuing tokens |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback while fetching STT token | User taps mic, sees nothing for 1-2 seconds, taps again | Set VoiceBus state to `listening` optimistically on mic tap; update if token fetch fails |
| Barge-in threshold too sensitive with ElevenLabs TTS | Parz interrupts itself when TTS volume fluctuates above 0.15 | Disable barge-in detection entirely during TTS playback (silence the level listener when `state === 'speaking'`) — OR raise threshold to 0.35 for ElevenLabs audio which has consistent volume |
| Voice overlay disappearing during circular reveal transition | Voice capsule morphs back to navbar during the 500ms clip-path animation | Ensure `VoiceController` is in the layout (persistent), not in the page; the reveal only animates page content |
| No fallback when ElevenLabs STT WebSocket fails to connect | User sees the UI stuck in `listening` state permanently | Always have a fallback path back to Web Speech API (`window.SpeechRecognition`) when the STT WebSocket does not emit `SessionStarted` within 3 seconds |
| `CommittedTranscript` arrives after `onend` in Web Speech API replacement | `handleUserTurn` called with empty string | ElevenLabs STT fires `CommittedTranscript` asynchronously; wire it to `handleUserTurn` only on `CommittedTranscript` messages, not on WebSocket `close` |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **ElevenLabs STT:** Token endpoint exists and returns a valid token — verify token can actually open a WebSocket connection (test with `wscat` or a small standalone script before integrating)
- [ ] **AudioWorklet:** Worklet file is in `public/` and served correctly — verify `audioContext.audioWorklet.addModule('/pcm-processor.js')` resolves without 404
- [ ] **Voice overlay persistence:** Navigate home → portfolio while voice is active — verify `VoicePanel` stays rendered and state machine does not reset
- [ ] **`openProject` tool:** Tour step 4 fires and the project detail overlay opens on the portfolio page — not just a console.log
- [ ] **`scrollTo` tool:** "Scroll to experience" command scrolls the right panel on the about page, not `window`
- [ ] **`toggleTheme` tool:** Voice command "switch theme" actually toggles theme — verify `useTheme().setTheme` is called via the registered callback
- [ ] **`openLink` tool:** Verify it opens the URL in a new tab, not navigating away from the current page
- [ ] **Mic denied path:** Deny mic permission, try to activate voice, verify `micDenied` banner appears and retry works
- [ ] **Amplify env:** `ELEVENLABS_API_KEY` present in Lambda runtime — test `/api/stt-token` endpoint after deployment (not just local dev)
- [ ] **`navigate` tool (already wired):** Voice command "go to portfolio" fires `goPage('portfolio')` and transition plays — verify this still works after layout lift

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| API key exposed client-side | HIGH | Rotate ELEVENLABS_API_KEY immediately in ElevenLabs dashboard; add `/api/stt-token` endpoint; redeploy |
| VoiceController instantiated per-page (not layout) | MEDIUM | Move `useVoiceController` call and navbar rendering to a new `VoiceController.tsx` client component in layout; update all page components to remove their voice state |
| Web Speech API left as sole STT after ElevenLabs token endpoint is built | LOW | Token endpoint already exists; connect AudioWorklet capture pipeline; swap out `startListening` implementation |
| AudioContext conflict (STT mic + TTS playback echo) | MEDIUM | Split contexts immediately: keep `VoiceBus._ctx` for TTS, add `sttCtx` for mic; the VoiceBus API surface does not change |
| Tour stalls waiting for page mount (500ms race) | LOW | Add `window.VoiceBus.emit('page-ready', 'pageName')` in a `useEffect` in each page; add event wait before tour tool dispatch |
| `openProject` slug mismatch | LOW | Inspect `src/data/projects.ts` for exact `project.name` values; update `TOUR_STEPS[3]` to match |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| ElevenLabs STT token endpoint missing | Phase 1 (STT token + AudioWorklet setup) | `POST /api/stt-token` returns `{ token }` in curl test |
| MediaRecorder used for PCM capture | Phase 1 (STT token + AudioWorklet setup) | AudioWorklet `onmessage` fires with Int16Array data when mic is open |
| STT/TTS AudioContext echo conflict | Phase 1 (STT token + AudioWorklet setup) | Separate `sttCtx` reference in code; no audio route from mic to speakers |
| VoiceController per-page (not layout) | Phase 2 (Layout lift) | Navigate home→portfolio with voice active; VoicePanel stays mounted |
| Server component importing voice modules | Phase 2 (Layout lift) | `next build` completes without "cannot use useState" errors in voice files |
| Tool registration race (page not mounted) | Phase 3 (Tool wiring) | Tour step 3→4 successfully opens project detail on portfolio |
| `scrollTo` targeting window instead of panel | Phase 3 (Tool wiring) | "Scroll to experience" scrolls the about page right panel |
| `openProject` slug/name mismatch | Phase 3 (Tool wiring) | Tour step 4 opens Parz-AI project detail |
| STT token expiry after 15 minutes | Phase 1 (STT token + AudioWorklet setup) | Per-session token fetch in `startListening` — no caching |
| Amplify missing `ELEVENLABS_API_KEY` in Lambda | Phase 4 (Deployment verification) | `/api/stt-token` returns 200 (not 503) in production |

---

## Sources

- [ElevenLabs Realtime STT API Reference](https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime) — WebSocket endpoint, auth, audio format, message schema
- [ElevenLabs Client-Side STT Streaming Guide](https://elevenlabs.io/docs/eleven-api/guides/how-to/speech-to-text/realtime/client-side-streaming) — single-use token pattern, Scribe.connect() SDK usage
- [ElevenLabs Create Single Use Token](https://elevenlabs.io/docs/api-reference/tokens/create) — token expiry, scope parameter
- [LiveKit Agents Issue #4609 — ElevenLabs STT does not reconnect after WebSocket disconnect](https://github.com/livekit/agents/issues/4609) — confirmed reconnection limitation
- [Streaming PCM16 from Browser — Medium](https://medium.com/developer-rants/streaming-audio-with-16-bit-mono-pcm-encoding-from-the-browser-and-how-to-mix-audio-while-we-are-f6a160409135) — MediaRecorder cannot produce PCM; AudioWorklet required
- [Getting Monochannel 16-bit PCM from browser microphone — Medium](https://medium.com/@ragymorkos/gettineg-monochannel-16-bit-signed-integer-pcm-audio-samples-from-the-microphone-in-the-browser-8d4abf81164d) — Float32 to Int16 conversion implementation
- [Web Audio API Best Practices — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) — AudioContext autoplay policy, user gesture requirements
- [AudioWorklet Recorder (reference implementation)](https://github.com/alyssonbarrera/audio-worklet-recorder) — production PCM16 capture pattern for STT APIs
- [Next.js Layouts and Pages — Official Docs](https://nextjs.org/docs/app/getting-started/layouts-and-pages) — layout persistence across navigations confirmed
- [A Deep Dive into Web Speech API — AddPipe Blog](https://blog.addpipe.com/a-deep-dive-into-the-web-speech-api/) — `isFinal` flag, 60-second timeout limitations
- [Real-time transcription debouncing — AssemblyAI](https://www.assemblyai.com/blog/best-api-models-for-real-time-speech-recognition-and-transcription) — interim message volume and debounce requirement
- Codebase reading: `src/lib/voice-controller.ts`, `src/lib/voice-bus-init.ts`, `src/app/page.tsx`, `src/app/portfolio/page.tsx`, `src/app/about/page.tsx`, `src/providers/voice-bus-provider.tsx`, `src/app/api/tts/route.ts`

---

*Pitfalls research for: ElevenLabs STT upgrade, persistent voice overlay, cross-page tool wiring in Next.js App Router*
*Researched: 2026-04-24*
