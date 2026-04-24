# Architecture Research

**Domain:** Next.js App Router — persistent voice overlay, cross-page tool callbacks, ElevenLabs STT
**Researched:** 2026-04-24
**Confidence:** HIGH (all claims verified directly from codebase and installed package types)

---

## Current State Diagnosis

### What exists (verified in source)

| Component | Location | Role |
|-----------|----------|------|
| `window.VoiceBus` | `src/lib/voice-bus-init.ts` | Global event bus, state machine, AudioContext owner |
| `VoiceBusProvider` | `src/providers/voice-bus-provider.tsx` | React context mirror of `VoiceBus.state`; calls `initVoiceBus()` at module scope |
| `useVoiceController` | `src/lib/voice-controller.ts` | Full session hook — STT, TTS, AI agent, tour, history |
| `VoicePanel` | `src/components/voice-panel.tsx` | UI inside navbar when voice active |
| `VoiceWave` | `src/components/voice-wave.tsx` | Amplitude visualizer |
| `DesktopNavbar` | `src/components/desktop-navbar.tsx` | Hosts VoicePanel; GSAP Flip morph on `voiceActive` |
| `MobileNavbar` | `src/components/mobile-navbar.tsx` | Hosts VoicePanel; CSS height morph on `voiceActive` |
| `/api/tts` | `src/app/api/tts/route.ts` | ElevenLabs TTS proxy, `eleven_turbo_v2_5`, MP3 stream |
| `/api/chat` | `src/app/api/chat/route.ts` | xAI Grok-3-mini, AI SDK streaming |
| `layout.tsx` | `src/app/layout.tsx` | Wraps all pages: `ThemeProvider > TransitionProvider > VoiceBusProvider > {children}` |
| `page.tsx` (home) | `src/app/page.tsx` | Only place `useVoiceController()` is called; owns `voiceActive`, `voiceProps`, `micDenied` |

### The root problem

`useVoiceController` lives in `page.tsx`. When the user navigates to `/portfolio` or `/about`, `page.tsx` unmounts, destroying the voice session — audio stops, state resets, the navbar morph collapses. The navbars on other pages don't receive `voiceActive`/`voiceProps` at all because those page files don't call `useVoiceController`.

`window.VoiceBus` already survives navigation because it lives on `window`. The `VoiceBusProvider` React context also survives because it is in `layout.tsx`. But the hook that drives the session (`useVoiceController`) and the state that feeds the navbar props do not survive.

---

## Recommended Architecture

### System Overview

```
layout.tsx  (survives all navigation)
├── ThemeProvider
├── TransitionProvider
├── VoiceBusProvider               ← already here, keeps window.VoiceBus subscribed
└── VoiceSessionProvider  [NEW]    ← lifts useVoiceController() here
    │   owns: voiceActive, voiceProps, micDenied, currentPage
    │   exposes: useVoiceSession() hook
    │   exposes: registerToolCallbacks() for pages
    │
    ├── LayoutShell  [NEW]         ← renders navbars persistently
    │   ├── DesktopNavbar          ← consumes useVoiceSession()
    │   └── MobileNavbar           ← consumes useVoiceSession()
    │
    └── {children}                 ← page.tsx, portfolio/page.tsx, about/page.tsx
        │
        └── pages call useVoiceToolCallbacks() [NEW] on mount
            portfolio/page.tsx → openProject, openLink
            about/page.tsx     → scrollTo
            home page.tsx      → (none; navigate/goPage is layout-level)
```

### Component Boundaries (new vs modified)

| Component | Status | Responsibility |
|-----------|--------|----------------|
| `VoiceSessionProvider` | NEW | Holds `useVoiceController()` state, exposes context |
| `LayoutShell` | NEW | Renders navbars using session context, wraps `{children}` |
| `useVoiceSession()` hook | NEW | Read access to `voiceActive`, `voiceProps`, `micDenied` |
| `useVoiceToolCallbacks()` hook | NEW | Pages push page-scoped callbacks into session on mount |
| `useVoiceController` | MODIFIED | `startListening` switches from Web Speech API to MediaRecorder + `/api/stt` |
| `DesktopNavbar` | MODIFIED | Sources voice props from context via LayoutShell, not from page.tsx props |
| `MobileNavbar` | MODIFIED | Same as DesktopNavbar |
| `page.tsx` (home) | MODIFIED | Removes `useVoiceController()` call; removes navbar renders; reads `useVoiceSession()` only for `handleAskParz` if needed |
| `portfolio/page.tsx` | MODIFIED | Adds `useVoiceToolCallbacks` for `openProject`/`openLink` |
| `about/page.tsx` | MODIFIED | Adds `useVoiceToolCallbacks` for `scrollTo` |
| `/api/stt` | NEW | ElevenLabs STT proxy (same `ELEVENLABS_API_KEY`) |
| `window.VoiceBus` | UNCHANGED | Already global; already survives navigation |
| `VoiceBusProvider` | UNCHANGED | No changes needed |
| `/api/tts` | UNCHANGED | No changes needed |
| `VoicePanel` | UNCHANGED | No changes needed |
| `VoiceWave` | UNCHANGED | No changes needed |
| `voice-bus-init.ts` | UNCHANGED | No changes needed |
| `voice-commands.ts` | UNCHANGED | No changes needed |

---

## Key Architecture Patterns

### Pattern 1: VoiceSessionProvider in layout.tsx

**What:** A React context provider that owns the voice controller hook. Replaces calling `useVoiceController` inside `page.tsx`.

**When to use:** Any state that must survive Next.js App Router page navigation must live in a layout-level provider, not in a page component.

**Trade-offs:** The provider needs `usePathname()` to know `currentPage`. This is valid inside a Client Component in the App Router — `usePathname` re-runs on every navigation and returns the current path. The provider is `'use client'` — this is fine since all voice logic is already client-only.

```typescript
// src/providers/voice-session-provider.tsx
'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTransition } from '@/providers/transition-provider';
import { useVoiceController, type ToolCallbacks } from '@/lib/voice-controller';

interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: ReturnType<typeof useVoiceController>['voiceProps'];
  micDenied: boolean;
  prefersReduced: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  registerToolCallbacks: (cbs: ToolCallbacks) => () => void;
}

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function useVoiceSession() {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error('useVoiceSession must be used within VoiceSessionProvider');
  return ctx;
}

export function VoiceSessionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { navigateWithReveal } = useTransition();
  const [chatOpen, setChatOpen] = useState(false);
  const toolCallbacksRef = useRef<ToolCallbacks>({});

  const currentPage =
    pathname === '/'          ? 'home'      :
    pathname === '/portfolio' ? 'portfolio' :
    pathname === '/about'     ? 'about'     : 'home';

  const goPage = useCallback((page: string) => {
    const paths: Record<string, string> = {
      home: '/', portfolio: '/portfolio', about: '/about',
    };
    navigateWithReveal(paths[page] ?? '/', window.innerWidth / 2, window.innerHeight / 2);
  }, [navigateWithReveal]);

  const openTextChat = useCallback(() => setChatOpen(true), []);

  // Forwarding proxy — delegates to whatever callbacks pages have registered
  const toolCallbacks: ToolCallbacks = {
    openProject: (args) => toolCallbacksRef.current.openProject?.(args),
    scrollTo:    (args) => toolCallbacksRef.current.scrollTo?.(args),
    openLink:    (args) => toolCallbacksRef.current.openLink?.(args),
    toggleTheme: ()     => toolCallbacksRef.current.toggleTheme?.(),
  };

  const { active, open, close, micDenied, prefersReduced, voiceProps } =
    useVoiceController({ goPage, openTextChat, currentPage, toolCallbacks });

  const registerToolCallbacks = useCallback((cbs: ToolCallbacks): (() => void) => {
    toolCallbacksRef.current = { ...toolCallbacksRef.current, ...cbs };
    return () => {
      const keys = Object.keys(cbs) as (keyof ToolCallbacks)[];
      keys.forEach((k) => { delete toolCallbacksRef.current[k]; });
    };
  }, []);

  return (
    <VoiceSessionContext.Provider value={{
      voiceActive: active, voiceProps, micDenied, prefersReduced,
      openVoice: open, closeVoice: close, registerToolCallbacks,
    }}>
      {children}
    </VoiceSessionContext.Provider>
  );
}
```

### Pattern 2: LayoutShell — navbars rendered at layout level

**What:** A thin `'use client'` component that renders both navbars. Pages no longer render navbars. The layout owns them.

**When to use:** Any UI element that must be shared across pages and must not unmount on navigation. This is the standard pattern for persistent headers in Next.js App Router.

**Trade-offs:** Pages lose direct control of navbar props. This is the intended outcome — the navbar reads from context rather than from page-local state.

```typescript
// src/components/layout-shell.tsx
'use client';

import { useVoiceSession } from '@/providers/voice-session-provider';
import { DesktopNavbar } from '@/components/desktop-navbar';
import { MobileNavbar } from '@/components/mobile-navbar';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
  const handleAskParz = () => voiceActive ? closeVoice() : openVoice();

  return (
    <>
      <div className="hidden sm:block">
        <DesktopNavbar
          onAskParz={handleAskParz}
          voiceActive={voiceActive}
          voiceProps={voiceProps}
          micDenied={micDenied}
        />
      </div>
      <div className="sm:hidden">
        <MobileNavbar
          onAskParz={handleAskParz}
          voiceActive={voiceActive}
          voiceProps={voiceProps}
          micDenied={micDenied}
        />
      </div>
      {children}
    </>
  );
}
```

Then `layout.tsx` becomes:

```tsx
<VoiceBusProvider>
  <VoiceSessionProvider>
    <LayoutShell>
      {children}
    </LayoutShell>
  </VoiceSessionProvider>
</VoiceBusProvider>
```

### Pattern 3: useVoiceToolCallbacks — page-scoped tool registration

**What:** Each page calls this hook on mount to register its tool callbacks. The returned cleanup removes them on unmount.

**When to use:** `openProject` only makes sense on `/portfolio`; `scrollTo` only makes sense on `/about`. Rather than making the layout aware of page internals, each page self-registers and self-cleans.

**Trade-offs:** During the ~100ms gap between page unmount and next page mount, registered callbacks are absent. This is safe — no voice tool call fires during that window because TTS for any command queued during navigation has not started yet.

```typescript
// src/hooks/use-voice-tool-callbacks.ts
'use client';

import { useEffect } from 'react';
import { useVoiceSession } from '@/providers/voice-session-provider';
import type { ToolCallbacks } from '@/lib/voice-controller';

export function useVoiceToolCallbacks(callbacks: ToolCallbacks) {
  const { registerToolCallbacks } = useVoiceSession();
  useEffect(() => {
    return registerToolCallbacks(callbacks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — callbacks captured at mount
}
```

Usage in portfolio page:

```typescript
useVoiceToolCallbacks({
  openProject: ({ slug }) => {
    const project = projects.find((p) => p.name === slug || p.slug === slug);
    if (project) setSelectedProject(project);
  },
  openLink: ({ url }) => setViewer({ url, label: 'Visit' }),
});
```

Usage in about page:

```typescript
useVoiceToolCallbacks({
  scrollTo: ({ selector }) => {
    const el = document.querySelector(selector);
    el?.scrollIntoView({ behavior: 'smooth' });
  },
});
```

### Pattern 4: /api/stt — ElevenLabs STT proxy

**What:** A server-side route that accepts a multipart audio blob, forwards it to ElevenLabs `speechToText.convert()`, and returns the transcript string. `ELEVENLABS_API_KEY` stays server-side — same key already used by `/api/tts`.

**ElevenLabs STT API facts (verified from installed package v2.44.0):**

- Method: `client.speechToText.convert({ file, modelId, languageCode })`
- `modelId` value for current model: `"scribe_v2"` (verified in type definitions)
- `file` field type: `core.file.Uploadable` — accepts `Blob`/`File` directly
- Response type: `SpeechToTextChunkResponseModel` for standard non-multichannel calls
- Response has `text: string` (the full transcript) and `languageCode: string`
- No streaming — this is a synchronous REST call returning a single JSON object
- File size limit: 3 GB; minimum audio length: 100ms

```typescript
// src/app/api/stt/route.ts
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';

export async function POST(req: Request) {
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return Response.json({ error: 'STT not configured' }, { status: 503 });
  }

  const formData = await req.formData();
  const audio = formData.get('audio');
  if (!(audio instanceof Blob)) {
    return Response.json({ error: 'audio field required' }, { status: 400 });
  }

  try {
    const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
    const result = await client.speechToText.convert({
      file: audio,
      modelId: 'scribe_v2',
      languageCode: 'en',
    });
    // SpeechToTextChunkResponseModel | MultichannelSpeechToTextResponseModel | SpeechToTextWebhookResponseModel
    const text = 'text' in result ? result.text : '';
    return Response.json({ text });
  } catch {
    return Response.json({ error: 'STT failed' }, { status: 500 });
  }
}
```

**Client side — replacing Web Speech API in `voice-controller.ts`:**

The current `startListening` uses `SpeechRecognition`. Replace it with MediaRecorder:

1. `navigator.mediaDevices.getUserMedia({ audio: true })` — get mic stream
2. `MediaRecorder` records until silence threshold is crossed
3. On stop: assemble `Blob`, POST as `FormData` to `/api/stt`
4. On response: call `handleUserTurn(result.text)`

The `attachMic`/`_startLoop`/`_stopLoop` amplitude path on `window.VoiceBus` stays entirely unchanged — it uses the raw audio stream for RMS visualization, independent of the STT transport.

Silence detection strategy: stop recording when `VoiceBus.level` drops below `0.05` for 1.5 seconds after having exceeded `0.15` (indicating the user finished speaking). This mirrors the barge-in threshold already in the codebase.

---

## Data Flow

### Voice Session Lifecycle (new flow after changes)

```
User taps "Ask Parz" (any page)
    ↓
LayoutShell.handleAskParz()
    ↓
VoiceSessionContext.openVoice()
    ↓
useVoiceController.open()
    → VoiceBus.setState('speaking')
    → streamTTS(greetMessage) → POST /api/tts → ElevenLabs TTS
    ← audio plays; VoiceWave in navbar reflects amplitude
```

### Navigation During Active Voice (preserved state)

```
Voice active on /home
    ↓
User says "show portfolio" → handleUserTurn → matchNavIntent → goPage('portfolio')
    ↓
navigateWithReveal('/portfolio') — View Transitions API clip-path reveal
    ↓
layout.tsx does NOT unmount — VoiceSessionProvider stays alive
    ↓
portfolio/page.tsx mounts → useVoiceToolCallbacks registers openProject/openLink
    ↓
Voice continues: navbar morph stays, audio continues, tour can proceed
```

### Tool Call Dispatch (wired flow)

```
AI response or TOUR_STEP: tool call "openProject" { slug: "Parz-AI" }
    ↓
dispatchToolCall("openProject", { slug: "Parz-AI" })  [in voice-controller.ts]
    ↓
toolCallbacks.openProject?.({ slug: "Parz-AI" })      [forwarding proxy in VoiceSessionProvider]
    ↓
toolCallbacksRef.current.openProject?.(...)            [registered by portfolio/page.tsx]
    ↓
setSelectedProject(project)  →  ProjectDetail overlay opens
```

### STT Flow (ElevenLabs upgrade)

```
User speaks → attachMic() on VoiceBus starts RMS loop (amplitude visualization)
           → MediaRecorder captures audio chunks in parallel
    ↓
VoiceBus.level drops below 0.05 for 1.5s (silence detection)
    ↓
MediaRecorder.stop() → Blob assembled (webm/opus on Chrome, mp4/aac on Safari)
    ↓
POST /api/stt  FormData { audio: Blob }
    ↓
Server: ElevenLabsClient.speechToText.convert({ file: audio, modelId: 'scribe_v2' })
    ↓
{ text: "show me the portfolio" }
    ↓
handleUserTurn("show me the portfolio") → matchNavIntent / AI agent
```

---

## Integration Points

### New vs Modified vs Unchanged — Complete Map

| | File | Change |
|--|------|--------|
| NEW | `src/providers/voice-session-provider.tsx` | Create — lifts `useVoiceController` to layout level; owns session state; exposes `registerToolCallbacks` |
| NEW | `src/components/layout-shell.tsx` | Create — renders both navbars from context; wraps `{children}` |
| NEW | `src/hooks/use-voice-tool-callbacks.ts` | Create — page-side registration hook |
| NEW | `src/app/api/stt/route.ts` | Create — ElevenLabs STT proxy; accepts `FormData { audio: Blob }` |
| MODIFIED | `src/app/layout.tsx` | Add `VoiceSessionProvider` wrapping `VoiceBusProvider`'s children; add `LayoutShell` wrapping `{children}` |
| MODIFIED | `src/app/page.tsx` | Remove `useVoiceController` call; remove `DesktopNavbar`/`MobileNavbar` renders (LayoutShell owns them); call `useVoiceSession()` only if home page needs `handleAskParz` reference |
| MODIFIED | `src/app/portfolio/page.tsx` | Add `useVoiceToolCallbacks({ openProject, openLink })`; no navbar renders to add (LayoutShell covers it) |
| MODIFIED | `src/app/about/page.tsx` | Add `useVoiceToolCallbacks({ scrollTo })`; no navbar renders to add |
| MODIFIED | `src/lib/voice-controller.ts` | Replace `startListening` body: swap `SpeechRecognition` for MediaRecorder + fetch to `/api/stt`; keep all other code unchanged |
| UNCHANGED | `src/lib/voice-bus-init.ts` | `window.VoiceBus` already global; already survives navigation |
| UNCHANGED | `src/providers/voice-bus-provider.tsx` | No changes |
| UNCHANGED | `src/app/api/tts/route.ts` | No changes |
| UNCHANGED | `src/app/api/chat/route.ts` | No changes |
| UNCHANGED | `src/components/voice-panel.tsx` | No changes |
| UNCHANGED | `src/components/voice-wave.tsx` | No changes |
| UNCHANGED | `src/components/desktop-navbar.tsx` | Props interface unchanged; still receives `onAskParz/voiceActive/voiceProps/micDenied` — now from LayoutShell not page |
| UNCHANGED | `src/components/mobile-navbar.tsx` | Same as desktop-navbar |

### External Service Boundaries

| Service | Route | Auth | Notes |
|---------|-------|------|-------|
| ElevenLabs TTS | `/api/tts` | `ELEVENLABS_API_KEY` server-only | Already working; streams MP3 chunks |
| ElevenLabs STT | `/api/stt` (new) | Same `ELEVENLABS_API_KEY` | `scribe_v2`; REST; returns `{ text: string }` |
| xAI Grok | `/api/chat` | `XAI_API_KEY` server-only | Already working; unchanged |

---

## Recommended Build Order

Dependencies between the four milestone features determine sequencing:

### Step 1: VoiceSessionProvider + LayoutShell (overlay persistence prerequisite)

This must come first. Until `useVoiceController` lives in layout, the overlay cannot persist across navigation, tool callbacks have nowhere stable to live, and any STT work done in `page.tsx` will still unmount on navigation.

- Create `VoiceSessionProvider` with empty `toolCallbacks` forwarding proxy
- Create `LayoutShell` wrapping both navbars
- Update `layout.tsx` to nest `VoiceSessionProvider > LayoutShell > {children}`
- Strip `useVoiceController` call and navbar renders from `page.tsx`
- Verification gate: open voice on home, navigate to portfolio, voice stays active

### Step 2: Tool callback wiring

Now that the session is stable, wire the page callbacks. Gives the tour and AI tool calls actual effect.

- Create `useVoiceToolCallbacks` hook
- Add `openProject` + `openLink` to `portfolio/page.tsx`
- Add `scrollTo` to `about/page.tsx`
- Verification gate: say "give me a tour" — Parz-AI project card opens on portfolio page, about sections scroll on command

### Step 3: ElevenLabs STT route

Independent of steps 1 and 2 structurally, but benefits from the stable session in step 1 (microphone input stays alive across navigation).

- Create `src/app/api/stt/route.ts`
- Replace `startListening` in `voice-controller.ts`: MediaRecorder records audio, silence detection stops recording, POST blob to `/api/stt`, call `handleUserTurn` on response
- Keep `attachMic`/`_startLoop` amplitude path entirely untouched
- Verification gate: voice transcribes correctly in Firefox and Safari (not only Chrome)

### Step 4: Grok API key verification

Orthogonal to the above. An environment variable audit and a health-check call to verify both `XAI_API_KEY` and `ELEVENLABS_API_KEY` are present and functional in the deployment environment.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Calling useVoiceController in multiple pages

**What people do:** Copy the `useVoiceController` call into portfolio and about pages to "add voice support there."

**Why it's wrong:** Creates multiple independent voice sessions. When navigating, one session dies and another starts from idle. Two controllers calling `VoiceBus.setState` clobber each other. AudioContext may be double-allocated.

**Do this instead:** Single call in `VoiceSessionProvider` at layout level. Pages only call `useVoiceSession()` to read state or `useVoiceToolCallbacks()` to register actions.

### Anti-Pattern 2: Passing toolCallbacks as props through layout

**What people do:** Add `openProject` as a prop on `layout.tsx`, thread it through `LayoutShell`, through `VoiceSessionProvider`, into `useVoiceController`.

**Why it's wrong:** `layout.tsx` has no awareness of which page is active or what project data it holds. Props flow parent-to-child; you cannot push data upward from a page to the layout through props. You would be reinventing context to avoid context.

**Do this instead:** The `registerToolCallbacks` / `useVoiceToolCallbacks` pattern — pages push their handlers into a ref on mount, remove on unmount. The layout stays ignorant of page internals.

### Anti-Pattern 3: Keeping Web Speech API as the primary STT path

**What people do:** Keep `SpeechRecognition` as primary, add ElevenLabs as fallback only.

**Why it's wrong:** Web Speech API sends audio to Google regardless of the ElevenLabs integration, is unavailable in Firefox entirely, and returns an untyped event. The entire point of the upgrade is cross-browser support and quality.

**Do this instead:** MediaRecorder + `/api/stt` as the only path. Keep `SpeechSynthesisUtterance` as the TTS fallback (it already is in `streamTTS`) — not as an STT path.

### Anti-Pattern 4: Moving VoiceBus from window into React state

**What people do:** Propose refactoring `window.VoiceBus` into Zustand or a context ref inside the layout.

**Why it's wrong:** `window.VoiceBus` is intentionally global. The AudioContext, RAF loop, and mic stream live on it and do not belong in React's render cycle. React state would cause rerenders on every amplitude tick (60 fps). The existing design is correct — `VoiceBusProvider` React context mirrors only the `VoiceState` string; the raw audio internals stay on `window`.

**Do this instead:** Keep `window.VoiceBus` as-is. The only new React context needed is `VoiceSessionProvider` for `voiceActive`, `voiceProps`, and `micDenied`.

---

## Recommended Project Structure (after changes)

```
src/
├── app/
│   ├── layout.tsx                    # Updated: VoiceSessionProvider + LayoutShell added
│   ├── page.tsx                      # Updated: removes voice controller + navbar renders
│   ├── portfolio/page.tsx            # Updated: adds useVoiceToolCallbacks
│   ├── about/page.tsx                # Updated: adds useVoiceToolCallbacks
│   ├── chat/page.tsx                 # No change
│   └── api/
│       ├── chat/route.ts             # No change
│       ├── tts/route.ts              # No change
│       └── stt/route.ts              # NEW
├── providers/
│   ├── theme-provider.tsx            # No change
│   ├── transition-provider.tsx       # No change
│   ├── voice-bus-provider.tsx        # No change
│   └── voice-session-provider.tsx    # NEW — owns useVoiceController
├── components/
│   ├── layout-shell.tsx              # NEW — renders navbars from context
│   ├── desktop-navbar.tsx            # Props interface unchanged
│   ├── mobile-navbar.tsx             # Props interface unchanged
│   ├── voice-panel.tsx               # No change
│   └── voice-wave.tsx                # No change
├── hooks/
│   ├── use-voice-bus.ts              # No change
│   └── use-voice-tool-callbacks.ts   # NEW
└── lib/
    ├── voice-controller.ts           # Modified: startListening body only
    ├── voice-bus-init.ts             # No change
    └── voice-commands.ts             # No change
```

---

## Scaling Considerations

This is a portfolio site — single user, single tab. Scale is not a concern. The architectural choices here are all about session lifecycle correctness:

- **`window.VoiceBus` as global** — correct for single-tab use; if multi-tab were needed, a `BroadcastChannel` bridge would be the extension point
- **No WebSocket for STT** — ElevenLabs Scribe v2 is a REST API (file upload, synchronous). Latency is ~500–1500ms per utterance depending on clip length. Acceptable for a portfolio. If lower latency is needed later, the ElevenLabs Conversational AI WebSocket API is the upgrade path — but that is a distinct product with a different billing model
- **History in localStorage** — 20-message cap is correct; no backend needed

---

## Sources

All claims verified directly from the codebase and installed package:

- `src/lib/voice-controller.ts` — session hook implementation, `ToolCallbacks` interface, `startListening` (Web Speech API path to replace)
- `src/lib/voice-bus-init.ts` — `initVoiceBus()` structure, confirms global singleton pattern
- `src/providers/voice-bus-provider.tsx` — confirms `VoiceBusProvider` is already in layout, mirrors only `VoiceState` string
- `src/app/layout.tsx` — confirmed provider nesting order; `VoiceBusProvider` is innermost before `{children}`
- `src/app/page.tsx` — confirmed single call site for `useVoiceController`; confirmed navbar renders in page (not layout)
- `src/app/portfolio/page.tsx` — confirmed `openProject` exists locally, not wired to voice
- `src/app/about/page.tsx` — confirmed `scrollToSection` exists locally, not wired to voice
- `node_modules/@elevenlabs/elevenlabs-js/dist/Client.d.ts` — confirms `speechToText` property on `ElevenLabsClient` (v2.44.0)
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/resources/speechToText/client/Client.d.ts` — confirms `convert()` method signature
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/resources/speechToText/client/requests/BodySpeechToTextV1SpeechToTextPost.d.ts` — confirms `file: core.file.Uploadable`, `modelId` field, `languageCode` field
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/types/SpeechToTextChunkResponseModel.d.ts` — confirms `text: string` on response
- `node_modules/@elevenlabs/elevenlabs-js/dist/api/resources/speechToText/types/SpeechToTextConvertResponse.d.ts` — confirms response union type

---

*Architecture research for: Voice Mode Production — persistent overlay, cross-page tool callbacks, ElevenLabs STT*
*Researched: 2026-04-24*
