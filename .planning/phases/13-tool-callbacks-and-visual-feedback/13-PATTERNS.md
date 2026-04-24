# Phase 13: Tool Callbacks and Visual Feedback - Pattern Map

**Mapped:** 2026-04-25
**Files analyzed:** 7 new/modified files
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/voice-glow.tsx` | component | event-driven | `src/components/voice-overlay.tsx` | role-match (fixed-position, VoiceBus subscriber) |
| `src/providers/voice-session-provider.tsx` | provider | event-driven | self (Phase 12 baseline) | exact — extending existing file |
| `src/lib/voice-controller.ts` | utility/hook | event-driven | self (Phase 8/12 baseline) | exact — extending existing file |
| `src/lib/voice-commands.ts` | utility | transform | self (Phase 8 baseline) | exact — extending existing file |
| `src/app/layout.tsx` | config | request-response | self (Phase 12 baseline) | exact — extending existing file |
| `src/app/portfolio/page.tsx` | page | CRUD | `src/app/about/page.tsx` | role-match (page with useEffect registration, local state) |
| `src/app/about/page.tsx` | page | CRUD | `src/app/portfolio/page.tsx` | role-match (page with useEffect, local state) |

---

## Pattern Assignments

### `src/components/voice-glow.tsx` (component, event-driven) — NEW FILE

**Analog:** `src/components/voice-overlay.tsx`

**Imports pattern** (voice-overlay.tsx lines 1-7):
```typescript
'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
```

For VoiceGlow, usePathname and useVoiceSession are not needed — replace with direct VoiceBus subscription:
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
```

**useMounted guard pattern** (voice-overlay.tsx lines 10-18):
```typescript
export function VoiceOverlay() {
  const mounted = useMounted();
  // ...
  if (!mounted || !voiceActive || pathname === '/') return null;
```

VoiceGlow uses the same guard — return null when not mounted or glow state is idle:
```typescript
export function VoiceGlow() {
  const mounted = useMounted();
  // ...
  if (!mounted || glowState === 'idle') return null;
```

**VoiceBus state subscription pattern** (voice-controller.ts lines 92-97):
```typescript
useEffect(() => {
  if (typeof window === 'undefined' || !window.VoiceBus) return;
  const unsub = window.VoiceBus.on('state', (s) => setVoiceState(s as string));
  return unsub as () => void;
}, []);
```

VoiceGlow uses this exact same pattern to subscribe to state changes. Also subscribe to custom events:
```typescript
useEffect(() => {
  if (!mounted || typeof window === 'undefined' || !window.VoiceBus) return;
  const unsubState = window.VoiceBus.on('state', (s) => {
    const state = s as string;
    if (state === 'listening') setGlowState('listening');
    else if (state === 'idle') setGlowState('idle');
    else setGlowState('idle');
  });
  const unsubExec = window.VoiceBus.on('tool-executing', () => setGlowState('executing'));
  const unsubSuccess = window.VoiceBus.on('tool-success', () => setGlowState('success'));
  const unsubError = window.VoiceBus.on('tool-error', () => setGlowState('error'));
  return () => {
    (unsubState as () => void)();
    (unsubExec as () => void)();
    (unsubSuccess as () => void)();
    (unsubError as () => void)();
  };
}, [mounted]);
```

**theme-aware color pattern** (theme-toggle.tsx lines 53-55):
```typescript
const mounted = useMounted();
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';
```

**Fixed-position layout pattern** (voice-overlay.tsx lines 21-39):
```typescript
return (
  <div role="complementary" aria-label="Voice assistant panel">
    <div className="hidden sm:block">
      <div
        className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50 overflow-hidden"
        style={{ backgroundColor: 'var(--color-navbar-bg)' }}
      >
```

VoiceGlow uses fixed inset-0 instead (covers full viewport), z-[60], pointer-events-none:
```tsx
return (
  <div
    className={`fixed inset-0 pointer-events-none z-[60] voice-glow-${glowState}`}
  />
);
```

**CSS keyframes to add in globals.css** (from 13-UI-SPEC.md lines 180-191):
```css
/* Phase 13: VoiceGlow */
@keyframes voiceGlowBreath {
  0%, 100% { box-shadow: 0 0 20px 6px rgba(59,130,246,0.15); }
  50%       { box-shadow: 0 0 40px 14px rgba(59,130,246,0.35); }
}

@keyframes voiceGlowSuccess {
  0%   { box-shadow: 0 0 30px 10px rgba(34,197,94,0); }
  15%  { box-shadow: 0 0 30px 10px rgba(34,197,94,0.35); }
  60%  { box-shadow: 0 0 30px 10px rgba(34,197,94,0.3); }
  100% { box-shadow: 0 0 30px 10px rgba(34,197,94,0); }
}

.voice-glow-listening {
  animation: voiceGlowBreath 2s ease-in-out infinite;
}
.voice-glow-executing {
  box-shadow: 0 0 30px 10px rgba(245,158,11,0.25);
  transition: box-shadow 200ms ease;
}
.voice-glow-success {
  animation: voiceGlowSuccess 1000ms ease forwards;
}
.voice-glow-error {
  box-shadow: 0 0 30px 10px rgba(239,68,68,0.35);
  transition: box-shadow 200ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .voice-glow-listening {
    animation: none;
    box-shadow: 0 0 30px 10px rgba(59,130,246,0.25);
  }
}
```

**Success one-shot cleanup pattern** — after animation ends, reset to idle:
```typescript
useEffect(() => {
  if (glowState !== 'success') return;
  const timer = setTimeout(() => setGlowState('idle'), 1000);
  return () => clearTimeout(timer);
}, [glowState]);
```

---

### `src/providers/voice-session-provider.tsx` (provider, event-driven) — EXTENDED

**Analog:** self (Phase 12 baseline at lines 1-76)

**Current imports pattern** (lines 1-8):
```typescript
'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useVoiceController } from '@/lib/voice-controller';
import type { VoicePanelProps } from '@/components/voice-panel';
import { useTransition } from '@/providers/transition-provider';
import { usePathname } from 'next/navigation';
```

Add to imports:
```typescript
import { useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { ToolCallbacks } from '@/lib/voice-controller';
```

**Context type extension** (lines 11-18 — extend VoiceSessionContextType):
```typescript
export interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
  // Phase 13: tool callback registration
  registerToolCallbacks: (callbacks: ToolCallbacks) => void;
}
```

**Ref-based callbacks storage pattern** — mirrors activeRef pattern in voice-controller.ts (lines 85-90):
```typescript
// In voice-controller.ts — existing ref pattern to copy:
const activeRef = useRef(false);  // shadow ref to read active in callbacks
useEffect(() => {
  activeRef.current = active;
}, [active]);

// For VoiceSessionProvider, apply the same ref-not-state pattern for toolCallbacks:
const toolCallbacksRef = useRef<ToolCallbacks>({});

const registerToolCallbacks = useCallback((callbacks: ToolCallbacks) => {
  toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks };
}, []);
```

**openTextChat CustomEvent pattern to replicate for openLink/toggleTheme** (lines 43-51):
```typescript
const openTextChat = useCallback(
  (_initialText?: string) => {
    goPage('home');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
    }, 400);
  },
  [goPage]
);
```

**toggleTheme/openLink registration in provider useEffect** (from RESEARCH.md Pattern 2):
```typescript
const { resolvedTheme, setTheme } = useTheme();

useEffect(() => {
  toolCallbacksRef.current.toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  toolCallbacksRef.current.openLink = ({ url }) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
}, [resolvedTheme, setTheme]);
```

**useVoiceController call extension** (lines 62-67 — pass toolCallbacksRef):
```typescript
// Current:
const { active: voiceActive, ... } = useVoiceController({
  goPage,
  openTextChat,
  currentPage,
});

// Extended:
const { active: voiceActive, ... } = useVoiceController({
  goPage,
  openTextChat,
  currentPage,
  toolCallbacks: toolCallbacksRef.current,
});
```

**Context.Provider value extension** (lines 69-75):
```typescript
// Current value:
value={{ voiceActive, voiceProps, micDenied, openVoice, closeVoice, prefersReduced }}

// Extended:
value={{ voiceActive, voiceProps, micDenied, openVoice, closeVoice, prefersReduced, registerToolCallbacks }}
```

---

### `src/lib/voice-controller.ts` (utility/hook, event-driven) — EXTENDED

**Analog:** self (lines 377-395 — startTour function)

**Current startTour with race condition** (lines 379-395):
```typescript
const startTour = useCallback(async () => {
  for (const step of TOUR_STEPS) {
    if (!activeRef.current) break;

    if (step.page !== currentPage) {
      goPage(step.page);
      // Wait 500ms for page to settle before speaking
      await new Promise<void>((r) => setTimeout(r, 500));
    }

    await speak(step.say);

    if (step.call) {
      dispatchToolCall(step.call[0], step.call[1]);
    }
  }
}, [currentPage, goPage, speak, dispatchToolCall]);
```

**Replace hardcoded wait with waitForPage helper** (RESEARCH.md Pattern 3):
```typescript
const waitForPage = useCallback((targetPage: string): Promise<void> => {
  return Promise.race([
    new Promise<void>(resolve => {
      const unsub = window.VoiceBus.on('page-ready', (page) => {
        if (page === targetPage) {
          (unsub as () => void)();
          resolve();
        }
      });
    }),
    new Promise<void>(resolve => setTimeout(resolve, 1500)), // fallback
  ]);
}, []);
```

**dispatchToolCall VoiceBus signal pattern** (lines 112-156 — extend to emit tool-executing/tool-success):
```typescript
// Current dispatch point (lines 112-155) — wrap each tool call:
case 'openProject':
  if (toolCallbacks?.openProject) {
    window.VoiceBus.emit('tool-executing');           // signal amber glow
    toolCallbacks.openProject(args as { slug: string });
    window.VoiceBus.emit('tool-success');             // signal green flash
  } else {
    console.warn('[VoiceController] openProject tool called but no toolCallbacks.openProject provided');
    window.VoiceBus.emit('tool-error');
  }
  break;
```

Apply same pattern to scrollTo, openLink, toggleTheme cases.

**VoiceBus guard pattern** (lines 93-97 — existing guard to reuse in waitForPage):
```typescript
if (typeof window === 'undefined' || !window.VoiceBus) return;
```

---

### `src/lib/voice-commands.ts` (utility, transform) — EXTENDED

**Analog:** self (lines 30-36 — TOUR_STEPS array)

**Current TOUR_STEPS with slug mismatch** (lines 30-36):
```typescript
export const TOUR_STEPS: TourStep[] = [
  { page: 'home',      say: "This is the landing. I'm Lakshman's digital twin — ask me anything.", highlight: '.hero' },
  { page: 'home',      say: "Those floating particles? They react when I'm thinking.", highlight: '#pf-particles' },
  { page: 'portfolio', say: "Here's the portfolio — projects across AI, Flutter, and web.", highlight: '.portfolio-grid' },
  { page: 'portfolio', say: "Parz-AI is my favorite — a self-hostable LLM persona.", call: ['openProject', { slug: 'Parz-AI' }] },
  { page: 'about',     say: "And the about page if you want the human version.", call: ['navigate', { page: 'about' }] },
];
```

The slug `'Parz-AI'` matches `name: "Parz-AI"` exactly in `src/data/projects.ts` line 61 — no change needed in this file. The bridge is in portfolio/page.tsx's callback registration (see below). The `call: ['navigate', { page: 'about' }]` in step 5 is handled by `dispatchToolCall`'s navigate case (line 144) which calls `goPage` — no change needed.

---

### `src/app/layout.tsx` (config, request-response) — EXTENDED

**Analog:** self (lines 52-69 — RootLayout with VoiceOverlay placement)

**Current layout provider tree** (lines 56-68):
```typescript
<ThemeProvider>
  <TransitionProvider>
    <VoiceBusProvider>
      <VoiceSessionProvider>
        {children}
        <VoiceOverlay />
      </VoiceSessionProvider>
    </VoiceBusProvider>
  </TransitionProvider>
</ThemeProvider>
```

**Extended layout — add VoiceGlow as last sibling** (from 13-UI-SPEC.md lines 216-221):
```typescript
import { VoiceGlow } from '@/components/voice-glow';

// In RootLayout:
<VoiceSessionProvider>
  {children}
  <VoiceOverlay />
  <VoiceGlow />        {/* New — must be last sibling, z-60 */}
</VoiceSessionProvider>
```

Import pattern follows existing VoiceOverlay import at line 7:
```typescript
import { VoiceOverlay } from '@/components/voice-overlay';
import { VoiceGlow } from '@/components/voice-glow';
```

---

### `src/app/portfolio/page.tsx` (page, CRUD) — EXTENDED

**Analog:** `src/app/about/page.tsx` and `src/app/page.tsx` (CustomEvent listener pattern)

**Existing useEffect + window event pattern to replicate** (src/app/page.tsx lines 32-36):
```typescript
useEffect(() => {
  const handler = () => setChatOpen(true);
  window.addEventListener('parz:open-text-chat', handler);
  return () => window.removeEventListener('parz:open-text-chat', handler);
}, []);
```

**Portfolio page registration — register openProject callback on mount**:
```typescript
// Add to imports:
import { useVoiceSession } from '@/providers/voice-session-provider';
import { pinnedProjects, shuffleableProjects } from '@/data/projects';  // already imported

// Inside PortfolioPage():
const { registerToolCallbacks } = useVoiceSession();

// Register openProject with slug-to-project bridge
useEffect(() => {
  registerToolCallbacks({
    openProject: ({ slug }) => {
      // Case-sensitive first, then case-insensitive fallback per Pitfall 5
      const project = projects.find(
        (p) => p.name === slug || p.name.toLowerCase() === slug.toLowerCase()
      );
      if (project) setSelectedProject(project);
    },
  });
  return () => registerToolCallbacks({});  // deregister on unmount
}, [registerToolCallbacks, projects]);
```

**Page-ready signal emission** (RESEARCH.md Pattern 3):
```typescript
// Separate useEffect — fires once after mount
useEffect(() => {
  if (typeof window !== 'undefined' && window.VoiceBus) {
    window.VoiceBus.emit('page-ready', 'portfolio');
  }
}, []);
```

**Existing local openProject signature** (lines 41-62 — NOT to be confused with the voice callback):
```typescript
// This local function takes a full Project object — it is for card click UI:
const openProject = useCallback((project: Project) => {
  const links = project.links || {};
  // ... sets viewer state
}, []);
```

The voice callback bridges slug → Project → setSelectedProject. It does NOT call the local `openProject` function (which sets the iframe viewer). It calls `setSelectedProject` directly to open the detail overlay.

**selectedProject state** (lines 38, 173-183 — target state for voice callback):
```typescript
const [selectedProject, setSelectedProject] = useState<Project | null>(null);

// The overlay triggered by setSelectedProject:
{selectedProject && (
  <ProjectDetail
    project={selectedProject}
    onClose={() => setSelectedProject(null)}
    // ...
  />
)}
```

---

### `src/app/about/page.tsx` (page, CRUD) — EXTENDED

**Analog:** `src/app/portfolio/page.tsx` (same mount-registration pattern)

**Existing scrollToSection method** (lines 154-159 — exact target for voice scrollTo callback):
```typescript
const scrollToSection = useCallback((sectionId: SectionId) => {
  const ref = sectionRefs[sectionId];
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: 'smooth' });
  }
}, []);
```

**Existing sectionRefs structure** (lines 112-116 — maps SectionId to refs):
```typescript
const sectionRefs: Record<SectionId, React.RefObject<HTMLDivElement | null>> = {
  about: aboutRef,
  experience: experienceRef,
  academics: academicsRef,
};
```

**About page registration — register scrollTo callback on mount**:
```typescript
// Add to imports:
import { useVoiceSession } from '@/providers/voice-session-provider';

// Inside AboutPage():
const { registerToolCallbacks } = useVoiceSession();

useEffect(() => {
  registerToolCallbacks({
    scrollTo: ({ selector }) => {
      // Strip '#' and normalize — e.g. '#experience' → 'experience'
      const id = selector.replace('#', '').replace('-', '') as SectionId;
      if (id === 'about' || id === 'experience' || id === 'academics') {
        scrollToSection(id);
      }
    },
  });
  return () => registerToolCallbacks({});  // deregister on unmount
}, [registerToolCallbacks, scrollToSection]);
```

**Page-ready signal emission** (same pattern as portfolio):
```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && window.VoiceBus) {
    window.VoiceBus.emit('page-ready', 'about');
  }
}, []);
```

**Critical: scrollTo delegates to scrollToSection, NOT window.scrollIntoView** — per Pitfall 4, the about page uses a scrollable div (`scrollContainerRef`), not window scroll. The existing `scrollToSection` at line 154 already uses `ref.current.scrollIntoView({ behavior: 'smooth' })` which works because the section refs are inside the scrollable container.

---

## Shared Patterns

### VoiceBus Event Subscription
**Source:** `src/lib/voice-controller.ts` lines 92-97
**Apply to:** `VoiceGlow` component (state subscription), all useEffect blocks that read VoiceBus
```typescript
useEffect(() => {
  if (typeof window === 'undefined' || !window.VoiceBus) return;
  const unsub = window.VoiceBus.on('state', (s) => setVoiceState(s as string));
  return unsub as () => void;
}, []);
```

### useMounted Guard
**Source:** `src/components/voice-overlay.tsx` lines 10-18 and `src/components/theme-toggle.tsx` lines 53-58
**Apply to:** `VoiceGlow` component — prevents SSR hydration mismatch
```typescript
const mounted = useMounted();
if (!mounted) return null;
```

### useTheme resolvedTheme Pattern
**Source:** `src/components/theme-toggle.tsx` lines 53-55
**Apply to:** `VoiceGlow` (for theme-aware glow color), `VoiceSessionProvider` (for toggleTheme callback)
```typescript
const { resolvedTheme, setTheme } = useTheme();
const isDark = resolvedTheme === 'dark';
// For toggleTheme callback:
setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
```

### useRef for Non-Reactive Mutable State
**Source:** `src/lib/voice-controller.ts` lines 80-90
**Apply to:** `VoiceSessionProvider` — toolCallbacksRef must be useRef not useState to avoid stale closures in dispatchToolCall
```typescript
// Pattern: ref mirrors state without causing re-renders
const activeRef = useRef(false);
useEffect(() => {
  activeRef.current = active;
}, [active]);

// Applied to toolCallbacks:
const toolCallbacksRef = useRef<ToolCallbacks>({});
// Pages mutate toolCallbacksRef.current in-place via registerToolCallbacks
```

### useCallback Registration with Cleanup
**Source:** `src/app/page.tsx` lines 32-36 (parz:open-text-chat pattern) and `src/lib/voice-controller.ts` lines 524-550 (event listener cleanup)
**Apply to:** Portfolio and about page tool callback registrations
```typescript
useEffect(() => {
  registerToolCallbacks({ /* implementation */ });
  return () => registerToolCallbacks({});  // deregister on unmount
}, [registerToolCallbacks, ...deps]);
```

### VoiceBus Custom Event Emission
**Source:** `src/lib/voice-bus-init.ts` lines 29-37 (emit pattern)
**Apply to:** Each page's page-ready signal, dispatchToolCall's tool-executing/tool-success signals
```typescript
// VoiceBus.emit can carry any payload
window.VoiceBus.emit('page-ready', 'portfolio');
window.VoiceBus.emit('tool-executing');
window.VoiceBus.emit('tool-success');
```

### SSR Guard
**Source:** `src/lib/voice-controller.ts` lines 93-94
**Apply to:** All VoiceBus.emit calls in page useEffect blocks
```typescript
if (typeof window === 'undefined' || !window.VoiceBus) return;
```

---

## No Analog Found

All files in scope have strong analogs in the codebase. No files require falling back to RESEARCH.md patterns exclusively.

| File | Analog Quality Note |
|------|---------------------|
| `src/components/voice-glow.tsx` | No identical existing glow component, but VoiceOverlay + VoiceBus subscription in voice-controller.ts together form a complete analog |

---

## Key Observations for Planner

1. **toolCallbacks must be a ref, not state.** voice-controller.ts's `dispatchToolCall` is memoized with `[toolCallbacks, goPage]`. If toolCallbacks is a new object on each registration, the memoized callback becomes stale. The `useRef` pattern from `activeRef` / `historyRef` in voice-controller.ts lines 80-90 is the proven approach.

2. **Two distinct openProject functions exist in portfolio/page.tsx.** The local `openProject` (line 41) opens the iframe viewer. The voice callback should call `setSelectedProject` directly to open `ProjectDetail` overlay (line 173). These are different flows.

3. **VoiceGlow keyframes use colored glows despite CONTEXT.md D-11 saying monochrome.** The UI-SPEC lines 180-191 is the approved design (blue for listening, green for success). The RESEARCH.md note at line 536 confirms: "UI-SPEC is the approved final design." Use the colored keyframes verbatim.

4. **Success glow must use `animation: voiceGlowSuccess 1000ms ease forwards` — NOT infinite.** One iteration, fill forwards, then class removed by JS. Per Pitfall 6 in RESEARCH.md.

5. **TOUR_STEPS[3] slug 'Parz-AI' already matches projects.ts name "Parz-AI" exactly** (projects.ts line 61). No change needed in voice-commands.ts. The bridge is in portfolio/page.tsx's registerToolCallbacks callback.

6. **page-ready emission must be in an empty-deps useEffect** — fires once after first mount, not on every render. Guards with `typeof window !== 'undefined' && window.VoiceBus`.

---

## Metadata

**Analog search scope:** `src/components/`, `src/providers/`, `src/lib/`, `src/app/`, `src/hooks/`, `src/app/globals.css`
**Files scanned:** 11 source files read in full
**Pattern extraction date:** 2026-04-25
