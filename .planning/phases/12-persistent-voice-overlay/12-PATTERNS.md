# Phase 12: Persistent Voice Overlay - Pattern Map

**Mapped:** 2026-04-24
**Files analyzed:** 6 (2 new, 4 modified)
**Analogs found:** 6 / 6

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/providers/voice-session-provider.tsx` | provider | event-driven | `src/providers/voice-bus-provider.tsx` | exact |
| `src/components/voice-overlay.tsx` | component | event-driven | `src/components/voice-panel.tsx` + navbar layout pattern | role-match |
| `src/app/layout.tsx` | config | request-response | existing `src/app/layout.tsx` (modify in place) | exact |
| `src/app/page.tsx` | component | event-driven | existing `src/app/page.tsx` (modify in place) | exact |
| `src/components/desktop-navbar.tsx` | component | event-driven | existing `src/components/desktop-navbar.tsx` (modify in place) | exact |
| `src/components/mobile-navbar.tsx` | component | event-driven | existing `src/components/mobile-navbar.tsx` (modify in place) | exact |

---

## Pattern Assignments

### `src/providers/voice-session-provider.tsx` (provider, event-driven)

**Analog:** `src/providers/voice-bus-provider.tsx`

**Imports pattern** (lines 1-8 of voice-bus-provider.tsx — mirror this exactly, swap contents):
```typescript
'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useVoiceController } from '@/lib/voice-controller';
import { useTransition } from '@/providers/transition-provider';
import { usePathname } from 'next/navigation';
import type { VoicePanelProps } from '@/components/voice-panel';
```

**Context creation pattern** (lines 13-18 of voice-bus-provider.tsx):
```typescript
// voice-bus-provider.tsx — exact template to copy
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';
const VoiceBusContext = createContext<VoiceState>('idle');

export function useVoiceBus(): VoiceState {
  return useContext(VoiceBusContext);
}
```
For VoiceSessionProvider, replace the primitive context type with the object shape, and add the null-guard:
```typescript
// VoiceSessionProvider version — context holds a full object, not a scalar
type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
}

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function useVoiceSession(): VoiceSessionContextType {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error('useVoiceSession must be used inside VoiceSessionProvider');
  return ctx;
}
```

**Provider body pattern** (lines 20-34 of voice-bus-provider.tsx — mirror structure):
```typescript
// voice-bus-provider.tsx body — template shape to follow
export function VoiceBusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceState>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.VoiceBus) {
      return window.VoiceBus.on('state', setState as (s: unknown) => void);
    }
  }, []);

  return (
    <VoiceBusContext.Provider value={state}>
      {children}
    </VoiceBusContext.Provider>
  );
}
```
For VoiceSessionProvider, the body sources from `page.tsx` lines 31-53 (goPage + openTextChat + useVoiceController call), lifted up:
```typescript
// page.tsx lines 31-53 — move this block verbatim into VoiceSessionProvider
const goPage = useCallback(
  (page: string) => {
    const paths: Record<string, string> = { home: '/', portfolio: '/portfolio', about: '/about' };
    const path = paths[page] ?? '/';
    navigateWithReveal(path, window.innerWidth / 2, window.innerHeight / 2);
  },
  [navigateWithReveal]
);

const openTextChat = useCallback((_initialText?: string) => {
  setChatOpen(true);   // NOTE: replace with CustomEvent dispatch in provider version
}, []);

const {
  active: voiceActive,
  open: openVoice,
  close: closeVoice,
  micDenied,
  voiceProps,
} = useVoiceController({
  goPage,
  openTextChat,
  currentPage: 'home',  // NOTE: replace with pathname === '/' ? 'home' : pathname.slice(1)
});
```

**openTextChat cross-boundary signal pattern** (Pattern 3 from RESEARCH.md):
```typescript
// VoiceSessionProvider openTextChat — dispatch CustomEvent instead of setChatOpen
const openTextChat = useCallback((_initialText?: string) => {
  goPage('home');
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
  }, 100);  // NOTE: may need 300-500ms if View Transitions API is active (~500ms duration)
}, [goPage]);

// page.tsx — listener for the event
useEffect(() => {
  const handler = () => setChatOpen(true);
  window.addEventListener('parz:open-text-chat', handler);
  return () => window.removeEventListener('parz:open-text-chat', handler);
}, []);
```

**currentPage dynamic derivation** — do NOT copy the static `'home'` string from page.tsx:
```typescript
// WRONG (copied from page.tsx, static):
currentPage: 'home',

// CORRECT (dynamic, using usePathname):
const pathname = usePathname();
// ...
currentPage: pathname === '/' ? 'home' : pathname.slice(1),
```

---

### `src/components/voice-overlay.tsx` (component, event-driven)

**Analog:** Layout + conditional rendering pattern from `src/components/desktop-navbar.tsx` lines 76-83 (SSR guard) and the VoicePanel rendering at lines 138-142.

**Imports pattern** — mirrors desktop-navbar.tsx imports, replaces GSAP/social/portfolio with voice-session context:
```typescript
// desktop-navbar.tsx lines 1-13 — template for what to import; voice-overlay.tsx needs these
'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
import { VoicePanel } from '@/components/voice-panel';
```

**SSR guard pattern** (desktop-navbar.tsx lines 76-83):
```typescript
// desktop-navbar.tsx — SSR guard that returns early before mount
if (!mounted) {
  // SSR placeholder matching navbar dimensions
  return (
    <div
      className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[630px] h-[60px] rounded-[25px] z-50"
    />
  );
}
```
For VoiceOverlay the guard returns null entirely — no placeholder needed:
```typescript
// VoiceOverlay guard: three-condition early return
if (!mounted || !voiceActive || pathname === '/') return null;
```

**Fixed positioning + VoicePanel render pattern** — dimensions from desktop-navbar.tsx line 88 and mobile-navbar.tsx line 56:
```typescript
// desktop-navbar.tsx line 88 — source of fixed positioning values
className={`fixed top-[10px] left-1/2 -translate-x-1/2 rounded-[25px] z-50 ... ${voiceActive ? 'w-[760px] h-[72px]' : ...}`}
style={{ backgroundColor: 'var(--color-navbar-bg)' }}

// mobile-navbar.tsx line 56 — source of mobile positioning values
className={`fixed bottom-[20px] left-[20px] right-[20px] rounded-[25px] z-50 ... ${voiceActive ? 'h-[140px]' : 'h-[70px]'}`}
style={{ backgroundColor: 'var(--color-navbar-bg)' }}
```

**VoicePanel render pattern** (desktop-navbar.tsx lines 138-142):
```typescript
// desktop-navbar.tsx lines 138-142 — exact VoicePanel render to copy
{voiceActive && voiceProps && (
  <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied ?? false} />
)}
```

**Mobile/desktop responsive split pattern** (page.tsx lines 115-143 — sm:block / sm:hidden pattern):
```typescript
// page.tsx lines 115-131 — responsive split used for navbar; mirror for VoiceOverlay
<div className="hidden sm:block">
  {/* Desktop variant */}
</div>
<div className="sm:hidden">
  {/* Mobile variant */}
</div>
```

---

### `src/app/layout.tsx` (config, modified)

**Analog:** Existing `src/app/layout.tsx` — this is an in-place modification.

**Current provider nesting** (layout.tsx lines 54-59 — the exact block to extend):
```typescript
// layout.tsx lines 54-59 — current nesting order
<ThemeProvider>
  <TransitionProvider>
    <VoiceBusProvider>
      {children}
    </VoiceBusProvider>
  </TransitionProvider>
</ThemeProvider>
```

**Target nesting after modification** (Pattern 4 from RESEARCH.md — VoiceSessionProvider inside VoiceBusProvider, VoiceOverlay as sibling to children):
```typescript
// layout.tsx — modified nesting; VoiceSessionProvider MUST be inside VoiceBusProvider
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

**New imports to add** (mirror existing import style in layout.tsx lines 3-6):
```typescript
// layout.tsx lines 3-6 — existing named import style to follow
import { ThemeProvider } from '@/providers/theme-provider';
import { TransitionProvider } from '@/providers/transition-provider';
import { VoiceBusProvider } from '@/providers/voice-bus-provider';
// ADD:
import { VoiceSessionProvider } from '@/providers/voice-session-provider';
import { VoiceOverlay } from '@/components/voice-overlay';
```

---

### `src/app/page.tsx` (component, modified)

**Analog:** Existing `src/app/page.tsx` — in-place modification.

**Imports to change** (page.tsx lines 19-20 — remove useVoiceController, add useVoiceSession):
```typescript
// page.tsx lines 19-20 — REMOVE these two lines
import { useVoiceController } from '@/lib/voice-controller';
import { useTransition } from '@/providers/transition-provider';

// ADD this one line in their place
import { useVoiceSession } from '@/providers/voice-session-provider';
```

**Hook call replacement** (page.tsx lines 29-54 — the block to replace):
```typescript
// page.tsx lines 29-54 — REMOVE this entire block:
const { navigateWithReveal } = useTransition();

const goPage = useCallback(
  (page: string) => {
    const paths: Record<string, string> = { home: '/', portfolio: '/portfolio', about: '/about' };
    const path = paths[page] ?? '/';
    navigateWithReveal(path, window.innerWidth / 2, window.innerHeight / 2);
  },
  [navigateWithReveal]
);

const openTextChat = useCallback((_initialText?: string) => {
  setChatOpen(true);
}, []);

const {
  active: voiceActive,
  open: openVoice,
  close: closeVoice,
  micDenied,
  voiceProps,
} = useVoiceController({
  goPage,
  openTextChat,
  currentPage: 'home',
});

// REPLACE with:
const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
```

**CustomEvent listener addition** (new useEffect in page.tsx, Pattern 3 from RESEARCH.md):
```typescript
// page.tsx — ADD this useEffect alongside existing ones
useEffect(() => {
  const handler = () => setChatOpen(true);
  window.addEventListener('parz:open-text-chat', handler);
  return () => window.removeEventListener('parz:open-text-chat', handler);
}, []);
```

**Navbar usage stays the same** (page.tsx lines 122-143 — no change needed; same props):
```typescript
// page.tsx lines 122-143 — DesktopNavbar and MobileNavbar calls are UNCHANGED
<DesktopNavbar
  onAskParz={handleAskParz}
  voiceActive={voiceActive}
  voiceProps={voiceProps}
  micDenied={micDenied}
/>
// ...
<MobileNavbar
  onAskParz={handleAskParz}
  voiceActive={voiceActive}
  voiceProps={voiceProps}
  micDenied={micDenied}
/>
```

---

### `src/components/desktop-navbar.tsx` (component, modified)

**Analog:** Existing `src/components/desktop-navbar.tsx` — no structural change. Props interface and all internal logic remain identical. This file does NOT need to call `useVoiceSession()` — it continues to receive voice props from page.tsx as before (per Pattern 5 in RESEARCH.md, lowest-risk approach).

**What changes:** Nothing in this file changes in Phase 12. The GSAP Flip logic (lines 55-74) and prop interface (lines 26-31) are stable. The only behavioral change is that `voiceActive` coming from context via page.tsx is now layout-scoped, but the navbar doesn't know or care.

**Confirmation of no-change:** (desktop-navbar.tsx lines 26-31):
```typescript
// desktop-navbar.tsx lines 26-31 — interface stays exactly as-is
interface DesktopNavbarProps {
  onAskParz: () => void;
  voiceActive?: boolean;
  voiceProps?: VoiceNavProps;
  micDenied?: boolean;
}
```

**GSAP Flip Pitfall 3 note** (lines 55-74): When user returns to home while voice is active, `voiceActive` transitions from undefined to true. The Flip.from() call fires but produces a zero-diff because the navbar starts already in the 760×72 voice-active state. No guard needed — this is the correct no-op behavior.

---

### `src/components/mobile-navbar.tsx` (component, modified)

**Analog:** Existing `src/components/mobile-navbar.tsx` — same as desktop-navbar: no change. Props interface (lines 21-26) and all CSS morph logic remain identical for the same reason.

**Confirmation of no-change:** (mobile-navbar.tsx lines 21-26):
```typescript
// mobile-navbar.tsx lines 21-26 — interface stays exactly as-is
interface MobileNavbarProps {
  onAskParz: () => void;
  voiceActive?: boolean;
  voiceProps?: VoiceNavProps;
  micDenied?: boolean;
}
```

---

## Shared Patterns

### `'use client'` Directive
**Source:** Every provider and component file in `src/providers/` and `src/components/`
**Apply to:** `voice-session-provider.tsx`, `voice-overlay.tsx`
```typescript
'use client';
// Must be the very first line — no blank lines before it
```

### createContext + useContext + named hook export
**Source:** `src/providers/voice-bus-provider.tsx` lines 14-18
```typescript
// voice-bus-provider.tsx — canonical pattern for all providers in this project
const VoiceBusContext = createContext<VoiceState>('idle');

export function useVoiceBus(): VoiceState {
  return useContext(VoiceBusContext);
}
```
For nullable contexts (VoiceSessionProvider), add the null-guard throw pattern.

### `{ children: ReactNode }` prop type
**Source:** `src/providers/voice-bus-provider.tsx` line 20, `src/providers/transition-provider.tsx` line 41
```typescript
export function VoiceBusProvider({ children }: { children: ReactNode }) {
```
All providers use this exact destructure pattern — no dedicated `Props` interface for children-only providers.

### useMounted SSR guard
**Source:** `src/hooks/use-mounted.ts`, used in `src/components/desktop-navbar.tsx` line 34 and `src/components/mobile-navbar.tsx` line 29
```typescript
// use-mounted.ts — hook returns false on server, true after first client render
const mounted = useMounted();
// ...
if (!mounted) return <div className="fixed ..." />;  // or return null for overlays
```
VoiceOverlay must call `useMounted()` and return `null` (not a placeholder) when not mounted.

### `var(--color-navbar-bg)` CSS variable for background
**Source:** `src/components/desktop-navbar.tsx` line 91, `src/components/mobile-navbar.tsx` line 59
```typescript
style={{ backgroundColor: 'var(--color-navbar-bg)' }}
```
VoiceOverlay must use the same CSS variable so it visually matches the navbar on all pages.

### usePathname in layout-level client provider
**Source:** `src/providers/transition-provider.tsx` line 43
```typescript
const pathname = usePathname();
```
This is safe in client components at any level. No `typeof window` guard needed for pathname.

### useCallback for all passed-down handlers
**Source:** `src/app/page.tsx` lines 31-42, `src/components/desktop-navbar.tsx` lines 40-50
```typescript
const goPage = useCallback(
  (page: string) => { /* ... */ },
  [navigateWithReveal]
);
```
All event handler functions that are passed as props or into hook options must be wrapped in `useCallback` with explicit dependency arrays.

### Fixed-position overlay z-index convention
**Source:** `src/components/desktop-navbar.tsx` line 88, `src/components/mobile-navbar.tsx` line 56
```typescript
className="fixed ... z-50 ..."
```
Navbar uses `z-50`. VoiceOverlay should also use `z-50` to match the same stacking layer as the navbar it replaces visually.

### `sm:block` / `sm:hidden` responsive split
**Source:** `src/app/page.tsx` lines 115-143
```typescript
<div className="hidden sm:block">
  {/* Desktop: >= 600px (Tailwind sm = 640px, project uses 600px breakpoint) */}
</div>
<div className="sm:hidden">
  {/* Mobile: < 600px */}
</div>
```
VoiceOverlay uses this exact split for desktop vs mobile positioning variants.

---

## No Analog Found

All files have close analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `src/providers/`, `src/components/`, `src/app/`, `src/hooks/`, `src/lib/`
**Files read:** 12 (voice-bus-provider.tsx, transition-provider.tsx, theme-provider.tsx, layout.tsx, page.tsx, desktop-navbar.tsx, mobile-navbar.tsx, voice-panel.tsx, voice-controller.ts, use-mounted.ts, 12-CONTEXT.md, 12-RESEARCH.md)
**Pattern extraction date:** 2026-04-24
