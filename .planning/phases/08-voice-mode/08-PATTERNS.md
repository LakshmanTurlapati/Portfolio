# Phase 8: Voice Mode - Pattern Map

**Mapped:** 2026-04-23
**Files analyzed:** 11 new/modified files
**Analogs found:** 10 / 11

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/voice-bus-init.ts` | utility | event-driven | `src/lib/env.ts` | role-match |
| `src/types/voice-bus.d.ts` | config | — | `src/types/index.ts` | role-match |
| `src/providers/voice-bus-provider.tsx` | provider | event-driven | `src/providers/transition-provider.tsx` | exact |
| `src/hooks/use-voice-bus.ts` | hook | event-driven | `src/hooks/use-mounted.ts` | role-match |
| `src/app/api/tts/route.ts` | API route | streaming | `src/app/api/chat/route.ts` | exact |
| `src/components/voice-panel.tsx` | component | event-driven | `src/components/chat-popup.tsx` | role-match |
| `src/components/voice-wave.tsx` | component | event-driven | `src/components/ask-parz-button.tsx` | role-match |
| `src/components/desktop-navbar.tsx` | component | request-response | `src/components/desktop-navbar.tsx` (self) | modify |
| `src/components/mobile-navbar.tsx` | component | request-response | `src/components/mobile-navbar.tsx` (self) | modify |
| `src/components/particle-background.tsx` | component | event-driven | `src/components/particle-background.tsx` (self) | modify |
| `src/app/layout.tsx` | config | — | `src/app/layout.tsx` (self) | modify |

---

## Pattern Assignments

### `src/lib/voice-bus-init.ts` (utility, event-driven)

**Analog:** `src/lib/env.ts` — module-level utility exporting a single named function, no imports, pure logic.

**Imports pattern** (`src/lib/env.ts` lines 1–4):
```typescript
// No imports — pure utility module
// src/lib/voice-bus-init.ts follows this: no React, no Next.js imports
// Only browser globals (window, AudioContext, AnalyserNode)
```

**Core pattern** (`src/lib/env.ts` lines 27–29):
```typescript
// Conditional guard before doing work — mirror this for VoiceBus:
export function hasEnvVar(name: string): boolean {
  return typeof process.env[name] === 'string' && process.env[name]!.length > 0;
}
// → VoiceBus version:
export function initVoiceBus(): void {
  if (typeof window === 'undefined' || window.VoiceBus) return;
  // ... initialize window.VoiceBus
}
```

**Error handling pattern** (`src/lib/env.ts` lines 8–15):
```typescript
// Descriptive thrown errors for server context; for VoiceBus use silent guard (no throw):
if (!xaiApiKey) {
  throw new Error('Missing required environment variable: XAI_API_KEY. ...');
}
// VoiceBus equivalent: early return guard (no throw — browser global may simply be absent):
if (typeof window === 'undefined' || window.VoiceBus) return;
```

---

### `src/types/voice-bus.d.ts` (config, declaration)

**Analog:** `src/types/index.ts` — TypeScript interface file, no imports, plain `export interface` declarations.

**Core pattern** (`src/types/index.ts` lines 1–8):
```typescript
// Pattern: define plain interfaces, export them; no 'use client', no imports
export interface NavLink {
  label: string;
  href: string;
}
// → VoiceBus equivalent uses declare global + export {} to augment Window:
declare global {
  interface Window {
    VoiceBus: VoiceBusInstance;
  }
}
export {};
```

---

### `src/providers/voice-bus-provider.tsx` (provider, event-driven)

**Analog:** `src/providers/transition-provider.tsx` — exact match. Same pattern: `'use client'`, `createContext`, `useContext`, named `export function Provider`, named `export function useHook`.

**Imports pattern** (`src/providers/transition-provider.tsx` lines 1–11):
```typescript
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
```

**Context creation pattern** (lines 16–28):
```typescript
interface TransitionContextType {
  navigateWithReveal: (path: string, originX: number, originY: number) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextType>({
  navigateWithReveal: () => {},
  isTransitioning: false,
});

export function useTransition() {
  return useContext(TransitionContext);
}
```

**Provider + useEffect subscription pattern** (lines 44–181):
```typescript
export function TransitionProvider({ children }: { children: ReactNode }) {
  const [isTransitioningState, setIsTransitioningState] = useState(false);
  useEffect(() => {
    const handlePopstate = () => { /* ... */ };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [navigateWithReveal]);

  return (
    <TransitionContext.Provider value={{ navigateWithReveal, isTransitioning: isTransitioningState }}>
      {children}
    </TransitionContext.Provider>
  );
}
```

**VoiceBusProvider adaptation:** Replace context value type with `VoiceState` string enum, subscribe to `window.VoiceBus.on('state', setState)` in `useEffect`, return the cleanup function from `VoiceBus.on`.

---

### `src/hooks/use-voice-bus.ts` (hook, event-driven)

**Analog:** `src/hooks/use-mounted.ts` — single-purpose hook, `'use client'`, `useState` + `useEffect`, minimal lines.

**Core pattern** (`src/hooks/use-mounted.ts` lines 1–9):
```typescript
'use client';

import { useState, useEffect } from 'react';

export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
// → VoiceBusHook re-exports from provider:
export { useVoiceBus } from '@/providers/voice-bus-provider';
// OR is a thin wrapper calling useContext directly
```

---

### `src/app/api/tts/route.ts` (API route, streaming)

**Analog:** `src/app/api/chat/route.ts` — exact match. Same file structure: named `export async function POST`, `hasEnvVar` guard at top, try/catch, streaming Response return.

**Imports pattern** (`src/app/api/chat/route.ts` lines 1–4):
```typescript
import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { xai } from '@ai-sdk/xai';
import { systemPrompt } from '@/data/system-prompt';
import { hasEnvVar } from '@/lib/env';
// → /api/tts imports:
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { hasEnvVar } from '@/lib/env';
```

**Guard pattern** (lines 12–21):
```typescript
export async function POST(req: Request) {
  if (!hasEnvVar('XAI_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'Chat service is not configured. Please try again later.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  // → /api/tts:
  if (!hasEnvVar('ELEVENLABS_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'TTS not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
```

**Error handling pattern** (lines 36–45):
```typescript
  } catch {
    const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
// → /api/tts catch (simpler, no random message):
  } catch {
    return new Response(JSON.stringify({ error: 'TTS failed' }), { status: 500 });
  }
```

**Streaming response pattern** (lines 24–35):
```typescript
  const result = streamText({ model: xai('grok-3-mini'), ... });
  return result.toUIMessageStreamResponse();
// → /api/tts streams raw audio bytes via ReadableStream:
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of audioStream) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'audio/mpeg' } });
```

---

### `src/components/voice-panel.tsx` (component, event-driven)

**Analog:** `src/components/chat-popup.tsx` — closest match for a floating UI panel with state-driven content, inline `<style>` keyframes, isDark theming via CSS variables, action buttons, and real-time status display.

**Imports pattern** (`src/components/chat-popup.tsx` lines 1–8):
```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { FaXmark, FaArrowUp } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
// → voice-panel.tsx imports:
import { useCallback, useEffect, useRef } from 'react';
import { useVoiceBus } from '@/providers/voice-bus-provider';
import { VoiceWave } from '@/components/voice-wave';
```

**Interface + props pattern** (lines 63–67):
```typescript
interface ChatPopupProps {
  isDark: boolean;
  onClose: () => void;
}
// → voice-panel.tsx:
interface VoicePanelProps {
  isDark: boolean;
  onClose: () => void;
  onSwitchToText: () => void;
  transcript: string;
  caption: string;
}
```

**Inline keyframes pattern** (lines 143–173):
```typescript
return (
  <>
    <style>{`
      @keyframes popupIn { ... }
      @keyframes fadeIn { ... }
      @keyframes dot-wave-popup { ... }
    `}</style>
    {/* ...JSX... */}
  </>
);
// VoicePanel uses same pattern for voice-specific keyframes (vm-pulse, vm-shimmer)
```

**isDark conditional styling pattern** (lines 200–204):
```typescript
background: isDark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.92)',
backdropFilter: 'blur(14px)',
border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
// VoicePanel uses same pattern for capsule background and border
```

**Error/fallback state pattern** (lines 350–367):
```typescript
{error && (
  <div style={{ ... backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', ... }}>
    {error.message}
  </div>
)}
// → VoicePanel mic-permission-denied state follows same pattern
```

---

### `src/components/voice-wave.tsx` (component, event-driven)

**Analog:** `src/components/ask-parz-button.tsx` — closest for a purely visual animated component driven by a rAF loop and React state, using `useRef` + `useEffect` + `useState` for frame-by-frame animation.

**Imports pattern** (`src/components/ask-parz-button.tsx` lines 1–3):
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
```

**rAF-driven animation pattern** (lines 27–49):
```typescript
useEffect(() => {
  let alive = true;
  const spawn = () => {
    if (!alive) return;
    // ... compute frame values ...
    setTimeout(spawn, next);
  };
  const t = setTimeout(spawn, 200);
  return () => { alive = false; clearTimeout(t); };
}, []);
// → VoiceWave uses requestAnimationFrame instead of setTimeout:
useEffect(() => {
  let raf: number;
  const tick = () => {
    const level = window.VoiceBus?.level ?? 0;
    const t = performance.now() / 1000;
    // compute bar heights...
    setBarHeights(heights);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, []);
```

**Rendered output pattern** (lines 51–111):
```typescript
return (
  <button ref={btnRef} ... onClick={onClick} ...>
    <span className="absolute inset-0 overflow-hidden ...">
      {orbs.map(o => <span key={o.id} style={{ ... }} />)}
    </span>
    <span className="relative z-[1] w-1.5 h-1.5 rounded-full" style={{ animation: '...' }} />
  </button>
);
// → VoiceWave renders 5 bar spans in a flex container, each with CSS transform scaleY(amp):
return (
  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '32px' }}>
    {barHeights.map((h, i) => (
      <span key={i} style={{ width: '4px', height: '100%', transform: `scaleY(${h})`, ... }} />
    ))}
  </div>
);
```

---

### `src/components/desktop-navbar.tsx` (MODIFY, component, request-response)

**Current file:** `src/components/desktop-navbar.tsx` — self-analog.

**Existing interface pattern** (lines 17–19):
```typescript
interface DesktopNavbarProps {
  onAskParz: () => void;
}
// → Add voice-active state props:
interface DesktopNavbarProps {
  onAskParz: () => void;
  voiceActive?: boolean;
  voiceProps?: VoicePanelProps;
}
```

**Existing nav element pattern** (lines 49–52):
```typescript
<nav
  className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[630px] h-[60px] rounded-[25px] z-50 flex items-center"
  style={{ backgroundColor: 'var(--color-navbar-bg)' }}
>
// → Add ref + voice-active class toggle for GSAP Flip:
const navRef = useRef<HTMLElement>(null);
<nav
  ref={navRef}
  className={`fixed top-[10px] left-1/2 -translate-x-1/2 rounded-[25px] z-50 flex items-center ${voiceActive ? 'voice-active' : ''}`}
  style={{ backgroundColor: 'var(--color-navbar-bg)' }}
>
```

**useGSAP pattern** — import `useGSAP` from `@gsap/react` (already installed), register Flip at module scope:
```typescript
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(Flip);
// In component: capture state before class change, animate with Flip.from(state, ...)
```

---

### `src/components/mobile-navbar.tsx` (MODIFY, component, request-response)

**Current file:** `src/components/mobile-navbar.tsx` — self-analog. Same structure as DesktopNavbar.

**Existing nav element pattern** (lines 48–50):
```typescript
<nav
  className="fixed bottom-[20px] left-[20px] right-[20px] h-[70px] rounded-[25px] z-50 flex items-center"
  style={{ backgroundColor: 'var(--color-navbar-bg)' }}
>
// → Voice-active CSS class expands height; no GSAP (D-13 specifies CSS transition):
<nav
  className={`fixed bottom-[20px] left-[20px] right-[20px] rounded-[25px] z-50 flex flex-col items-center transition-[height] duration-[450ms] ${voiceActive ? 'h-[140px]' : 'h-[70px]'}`}
  style={{ backgroundColor: 'var(--color-navbar-bg)' }}
>
```

---

### `src/components/particle-background.tsx` (MODIFY, component, event-driven)

**Current file:** `src/components/particle-background.tsx` — self-analog.

**Existing pJSDom cleanup pattern** (lines 54–60):
```typescript
if (window.pJSDom && window.pJSDom.length) {
  window.pJSDom.forEach((p) => {
    try { p.pJS.fn.vendors.destroypJS(); } catch { /* ignore */ }
  });
  window.pJSDom = [];
}
// VoiceBus breathing loop is added AFTER window.particlesJS() call in init():
// Cancel old rAF before destroy → reinit captures fresh baselines
(containerRef.current as HTMLDivElement & { __vmTick?: () => void }).__vmTick?.();
```

**Existing containerRef pattern** (lines 35–36):
```typescript
const containerRef = useRef<HTMLDivElement>(null);
// New breathing loop stores cancel handle on the same ref:
containerRef.current.__vmTick = () => cancelAnimationFrame(raf);
```

**Existing init callback pattern** (lines 44–90):
```typescript
const init = () => {
  if (destroyed || !containerRef.current || !window.particlesJS) return;
  // ... cleanup ... call particlesJS() ...
};
ensureParticlesScript().then(init).catch(() => { /* silently fail */ });
// → After particlesJS() call, invoke waitForInst() to start breathing loop
```

---

### `src/app/layout.tsx` (MODIFY, config)

**Current file:** `src/app/layout.tsx` — self-analog.

**Existing provider nesting pattern** (lines 53–57):
```typescript
<ThemeProvider>
  <TransitionProvider>
    {children}
  </TransitionProvider>
</ThemeProvider>
// → Add VoiceBusProvider as innermost wrapper:
<ThemeProvider>
  <TransitionProvider>
    <VoiceBusProvider>
      {children}
    </VoiceBusProvider>
  </TransitionProvider>
</ThemeProvider>
```

**Existing import pattern** (lines 1–6):
```typescript
import type { Metadata } from 'next';
import { Lato, Instrument_Serif } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import { TransitionProvider } from '@/providers/transition-provider';
import './globals.css';
// → Add:
import { VoiceBusProvider } from '@/providers/voice-bus-provider';
```

---

## Shared Patterns

### Provider pattern (`'use client'` + `createContext` + `useContext`)
**Source:** `src/providers/transition-provider.tsx` lines 1–28
**Apply to:** `src/providers/voice-bus-provider.tsx`
```typescript
'use client';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

const MyContext = createContext<MyType>(defaultValue);

export function useMyHook() {
  return useContext(MyContext);
}

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(defaultValue);
  useEffect(() => {
    // subscribe to external source
    return () => { /* unsubscribe cleanup */ };
  }, []);
  return <MyContext.Provider value={state}>{children}</MyContext.Provider>;
}
```

### API route guard pattern (hasEnvVar + 503)
**Source:** `src/app/api/chat/route.ts` lines 12–21
**Apply to:** `src/app/api/tts/route.ts`
```typescript
export async function POST(req: Request) {
  if (!hasEnvVar('SOME_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'Service not configured.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
  // ...
}
```

### API route error handling pattern
**Source:** `src/app/api/chat/route.ts` lines 36–45
**Apply to:** `src/app/api/tts/route.ts`
```typescript
  } catch {
    return new Response(
      JSON.stringify({ error: 'Descriptive error message' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
```

### useMounted SSR guard
**Source:** `src/hooks/use-mounted.ts` + `src/components/desktop-navbar.tsx` lines 39–46
**Apply to:** Any new client component touching `window.*` (voice-panel.tsx, voice-wave.tsx)
```typescript
const mounted = useMounted();
if (!mounted) return null; // or skeleton placeholder
// Only access window.VoiceBus after mounted === true
```

### isDark conditional inline style
**Source:** `src/components/chat-popup.tsx` lines 200–204, `src/components/ask-parz-button.tsx` lines 58–66
**Apply to:** `src/components/voice-panel.tsx`, `src/components/voice-wave.tsx`
```typescript
// Consistent pattern across all themed components:
background: isDark ? 'rgba(20,20,20,0.92)' : 'rgba(255,255,255,0.92)',
border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
color: isDark ? '#e8e4d8' : '#1a1a1a',
```

### Inline keyframe animation scoping
**Source:** `src/components/chat-popup.tsx` lines 143–173, `src/components/ask-parz-button.tsx` (uses global CSS in globals.css for `askParzPulse`)
**Apply to:** `src/components/voice-panel.tsx`
```typescript
return (
  <>
    <style>{`
      @keyframes vm-pulse { ... }
      @keyframes vm-shimmer { ... }
    `}</style>
    {/* JSX */}
  </>
);
```

### useRef for imperative DOM + rAF cancellation
**Source:** `src/components/particle-background.tsx` lines 35, 91–95
**Apply to:** `src/components/voice-wave.tsx`, `src/components/particle-background.tsx` (breathing loop)
```typescript
const containerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  let raf: number;
  const tick = () => { /* ... */ raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}, [dependency]);
```

### pJSDom cancel-before-reinit
**Source:** `src/components/particle-background.tsx` lines 54–60
**Apply to:** `src/components/particle-background.tsx` (VoiceBus breathing addition)
```typescript
// Cancel old breathing rAF before destroying pJS instance:
(containerRef.current as HTMLDivElement & { __vmTick?: () => void }).__vmTick?.();
// Then proceed with normal destroy → clear → reinit sequence
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/app/page.tsx` (MODIFY — wire voice.open()) | page | request-response | Existing file has the closest match but voice mode wiring is net-new behavior; the file itself is a self-analog, not listed separately since modification is additive |

No files are truly analog-less — all new files have at least a role-match analog in the codebase. The VoiceBus init module (`src/lib/voice-bus-init.ts`) is the most novel (window global singleton + event emitter), but `src/lib/env.ts` provides the module structure pattern.

---

## Metadata

**Analog search scope:** `src/providers/`, `src/components/`, `src/app/api/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/app/`
**Files scanned:** 18 source files read directly
**Pattern extraction date:** 2026-04-23
