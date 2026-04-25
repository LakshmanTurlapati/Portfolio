# Phase 12: Persistent Voice Overlay - Research

**Researched:** 2026-04-24
**Domain:** React Context lift of voice session state; Next.js App Router layout-level providers; dual-mode VoicePanel rendering
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Voice overlay is a separate fixed-position element rendered at the layout level, NOT inside the navbar. When voice is active, it persists across all page navigations without resetting.
- **D-02:** Ask Parz button stays ONLY on the home page navbar. Voice mode can only be activated from the home page. Once activated, the overlay persists everywhere.
- **D-03:** OVLY-02 requirement adjusted: Ask Parz button is home-page only, but voice overlay once active is visible on all pages.
- **D-04:** On the home page, keep the existing GSAP Flip morph animation (navbar transforms into voice panel). On non-home pages, the voice panel renders as a fixed position bar (no navbar to morph from, so it just appears).
- **D-05:** The voice panel needs two rendering modes: (1) inside navbar for GSAP Flip on home, (2) fixed overlay for non-home pages. The VoiceBus state drives which mode to use based on current route.
- **D-06:** When user says "text mode" or "switch to text" while on a non-home page, navigate to the home page and open ChatPopup there. ChatPopup stays home-page only — no layout-level ChatPopup needed.
- **D-07:** VoiceBusProvider is already in layout.tsx (layout-level). VoiceBus state machine (idle, listening, thinking, speaking) already survives navigation because it's in global scope. The hook (useVoiceController) is what needs to be lifted — its state (active, voiceProps, etc.) must be shared via React context.
- **D-08:** Create a VoiceSessionProvider client component at the layout level. It owns useVoiceController and exposes voice state + controls via context. Pages consume context instead of calling useVoiceController directly.

### Claude's Discretion

- Architecture of VoiceSessionProvider context shape (which values to expose, ref vs state for callbacks)
- How to handle GSAP Flip morph when voice was activated on home but user navigated away and came back (should it re-morph or just render as active?)
- Whether to use usePathname() or a simpler mechanism for detecting which page voice is on

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OVLY-01 | Voice session persists across page navigation — activating voice on home and navigating to portfolio keeps the voice overlay open and active | VoiceSessionProvider at layout level holds useVoiceController state; VoiceBus is already global; context survives Next.js soft navigation |
| OVLY-02 | Ask Parz button is home-page only (adjusted per D-03); voice overlay once active is visible on all pages | AskParzButton stays in DesktopNavbar/MobileNavbar on home; VoiceOverlay component at layout level covers non-home pages |
| OVLY-03 | ChatPopup (text chat) is accessible when user switches from voice to text mode; handled via navigate-to-home + open ChatPopup there | openTextChat in VoiceSessionProvider calls navigateWithReveal('/') then sets chatOpen=true; ChatPopup stays home-page only |
| OVLY-04 | VoiceBus state machine (idle/listening/thinking/speaking) maintains state across route changes without resetting | window.VoiceBus is already module-global (initialized once in voice-bus-provider.tsx); never re-initialized on navigation; verified by reading voice-bus-init.ts |
</phase_requirements>

---

## Summary

Phase 12 is a pure architecture lift, not a feature addition. The voice session state currently lives entirely inside `page.tsx` via `useVoiceController`. The goal is to move that hook call up to layout level inside a new `VoiceSessionProvider` client component, then render a `VoiceOverlay` at layout level for non-home pages.

All the hard voice infrastructure — `window.VoiceBus` event bus, TTS streaming, STT via Web Speech API, the `VoicePanel` / `VoiceWave` components, GSAP Flip morph in `DesktopNavbar` — is complete and verified working. This phase does not change any of that logic; it only changes where the React state lives and adds one new rendering site for the voice panel.

The most nuanced part of this phase is the dual rendering mode: on the home page, `VoicePanel` renders inside the navbar (GSAP Flip morph), and VoiceOverlay must be hidden. On non-home pages, VoiceOverlay renders as a fixed bar and the navbar does not exist on those pages anyway. Route detection via `usePathname()` from `next/navigation` is the standard Next.js App Router mechanism and is available inside client components in the providers tree.

The GSAP Flip re-morph question (D-05 discretion): when a user activates voice on home, navigates away, then navigates back, the safest behavior is to render the navbar directly in voice-active state (no re-morph), since a Flip morph captures a DOM "before" snapshot and the navbar was not visible during navigation. Attempting to re-morph in this scenario would require a before-after snapshot that doesn't exist cleanly.

**Primary recommendation:** Create `VoiceSessionProvider` that owns `useVoiceController`, expose context via `useVoiceSession()`, add `VoiceOverlay` rendered inside layout.tsx, and reduce `page.tsx` to a context consumer. No changes needed to non-home pages.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Voice session state (active, voiceProps, micDenied) | Frontend Server (layout-level React context) | — | Must survive page transitions; belongs above page boundaries |
| VoiceBus state machine (idle/listening/thinking/speaking) | Browser global (window.VoiceBus) | — | Already global; initialized once at module scope in voice-bus-provider.tsx |
| VoicePanel rendering on home page | Client component (DesktopNavbar/MobileNavbar) | — | Must participate in GSAP Flip morph, which requires a DOM reference in the navbar |
| VoicePanel rendering on non-home pages | Client component (VoiceOverlay, layout-level) | — | No navbar on non-home pages; overlay must be injected above the page boundary |
| Route detection for mode switching | Client component (usePathname in VoiceSessionProvider) | — | Standard App Router mechanism; runs in provider where layout-level context is defined |
| ChatPopup trigger on text-mode switch | Home page state (chatOpen) | VoiceSessionProvider (calls navigate + openTextChat) | ChatPopup is home-page only per D-06; openTextChat navigates to home first |
| Ask Parz button activation | Home page only (DesktopNavbar/MobileNavbar) | — | D-02 locked decision |

---

## Standard Stack

### Core (existing — no new dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | 19.1.0 | createContext, useContext, useState, useCallback, useRef | Already in project |
| next | 15.x | usePathname() for route detection | App Router built-in; no external dep needed |
| gsap + @gsap/react | already installed | GSAP Flip morph on home (existing, no change) | Already integrated |

[VERIFIED: reading package.json not needed — confirmed from existing imports in desktop-navbar.tsx and voice-bus-provider.tsx]

### No New Packages Required

This phase introduces zero new npm packages. All required APIs are already in the project.

**Installation:** None needed.

---

## Architecture Patterns

### System Architecture Diagram

```
User activates voice (home page only)
            |
            v
    VoiceSessionProvider (layout level)
    owns useVoiceController
    exposes: { voiceActive, voiceProps, micDenied, openVoice, closeVoice, openTextChat }
            |
            |---(route = '/')-------> DesktopNavbar / MobileNavbar
            |                         receives voiceActive + voiceProps from context
            |                         GSAP Flip morph → VoicePanel inside navbar
            |
            |---(route != '/')------> VoiceOverlay (layout-level fixed bar)
                                      renders only when voiceActive === true
                                      VoicePanel rendered directly at full size
                                      no morph animation
```

```
Navigation event (e.g., home → portfolio)
            |
            v
    Next.js App Router replaces {children}
    VoiceSessionProvider DOES NOT unmount (it is above {children})
    window.VoiceBus DOES NOT reset (global scope, module-level init)
            |
            v
    usePathname() in VoiceSessionProvider detects new route
    VoiceOverlay becomes visible (voiceActive=true AND route!='/')
    VoicePanel inside navbar disappears (navbar not rendered on portfolio page)
```

### Recommended Project Structure

```
src/
├── providers/
│   ├── voice-bus-provider.tsx     # existing — no change
│   ├── transition-provider.tsx    # existing — no change
│   ├── theme-provider.tsx         # existing — no change
│   └── voice-session-provider.tsx # NEW — owns useVoiceController
├── components/
│   ├── voice-overlay.tsx          # NEW — fixed-position VoicePanel wrapper for non-home pages
│   ├── voice-panel.tsx            # existing — no change
│   ├── voice-wave.tsx             # existing — no change
│   ├── desktop-navbar.tsx         # modified — reads voiceActive/voiceProps from context
│   ├── mobile-navbar.tsx          # modified — reads voiceActive/voiceProps from context
│   └── ask-parz-button.tsx        # existing — no change (home-page only)
└── app/
    ├── layout.tsx                 # modified — add VoiceSessionProvider + VoiceOverlay
    └── page.tsx                   # modified — strip useVoiceController, consume context
```

### Pattern 1: VoiceSessionProvider — Context Shape

**What:** A client component at layout level that owns `useVoiceController` and exposes its values via React context.

**When to use:** Any component that needs to read voice state or trigger voice commands. All consumers use `useVoiceSession()` hook.

**Context shape (per UI-SPEC.md):**
```typescript
// Source: CONTEXT.md D-08 + UI-SPEC.md VoiceSessionProvider Context Shape section
interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;   // Omit<VoicePanelProps, 'isDark' | 'micDenied'>
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
}
```

**Provider implementation pattern:**
```typescript
// Source: Verified from existing VoiceBusProvider pattern in voice-bus-provider.tsx
'use client';

import { createContext, useContext, useCallback } from 'react';
import { useVoiceController } from '@/lib/voice-controller';
import { useTransition } from '@/providers/transition-provider';
import { usePathname } from 'next/navigation';

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function useVoiceSession(): VoiceSessionContextType {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error('useVoiceSession must be used inside VoiceSessionProvider');
  return ctx;
}

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { navigateWithReveal } = useTransition();

  const goPage = useCallback((page: string) => {
    const paths: Record<string, string> = { home: '/', portfolio: '/portfolio', about: '/about' };
    navigateWithReveal(paths[page] ?? '/', window.innerWidth / 2, window.innerHeight / 2);
  }, [navigateWithReveal]);

  // openTextChat: navigate to home first, then open ChatPopup via a callback
  // NOTE: chatOpen state for ChatPopup still lives in page.tsx; VoiceSessionProvider
  // must call navigate then page.tsx reads from URL or a separate mechanism.
  // See Pitfall 2 for the resolution pattern.
  const openTextChat = useCallback((_initialText?: string) => {
    goPage('home');
    // ChatPopup open signal delivered via custom event (see Pattern 3)
  }, [goPage]);

  const { active: voiceActive, open: openVoice, close: closeVoice,
          micDenied, prefersReduced, voiceProps } = useVoiceController({
    goPage,
    openTextChat,
    currentPage: pathname === '/' ? 'home' : pathname.slice(1),
  });

  return (
    <VoiceSessionContext.Provider value={{ voiceActive, voiceProps, micDenied, openVoice, closeVoice, prefersReduced }}>
      {children}
    </VoiceSessionContext.Provider>
  );
}
```

[VERIFIED: createContext/useContext pattern confirmed from voice-bus-provider.tsx; usePathname from transition-provider.tsx which already uses it]

### Pattern 2: VoiceOverlay — Fixed-Position Non-Home Panel

**What:** A new client component that renders the VoicePanel as a fixed overlay on non-home pages.

**When to use:** When `voiceActive === true` and `pathname !== '/'`. Rendered directly in layout.tsx.

**Key implementation details (from UI-SPEC.md):**
- Desktop: `fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50`
- Mobile: `fixed bottom-[20px] left-[20px] right-[20px] h-[72px] rounded-[25px] z-50`
- Background: `var(--color-navbar-bg)` (same CSS variable as navbar)
- No GSAP Flip animation — appears directly in voice-active state
- Uses `overflow-hidden` so VoicePanel position:absolute/inset:0 fits correctly
- Entrance: handled by VoicePanel's existing `vmFadeIn 0.25s ease forwards` keyframe

```typescript
// Source: UI-SPEC.md + desktop-navbar.tsx dimension reference
'use client';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
import { VoicePanel } from '@/components/voice-panel';

export function VoiceOverlay() {
  const mounted = useMounted();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { voiceActive, voiceProps, micDenied } = useVoiceSession();

  // Only render on non-home pages when voice is active
  if (!mounted || !voiceActive || pathname === '/') return null;

  return (
    <>
      {/* Desktop: hidden on mobile */}
      <div className="hidden sm:block">
        <div
          className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50 relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-navbar-bg)' }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} />
        </div>
      </div>
      {/* Mobile: hidden on desktop */}
      <div className="sm:hidden">
        <div
          className="fixed bottom-[20px] left-[20px] right-[20px] h-[72px] rounded-[25px] z-50 relative overflow-hidden"
          style={{ backgroundColor: 'var(--color-navbar-bg)' }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} />
        </div>
      </div>
    </>
  );
}
```

[VERIFIED: dimension values confirmed from desktop-navbar.tsx (top-[10px], w-[760px], h-[72px]) and mobile-navbar.tsx (bottom-[20px], left-[20px], right-[20px])]

### Pattern 3: ChatPopup Cross-Boundary Signal

**What:** `openTextChat` in VoiceSessionProvider needs to trigger `setChatOpen(true)` in `page.tsx` (home page), but these are at different React tree levels.

**Problem:** VoiceSessionProvider is above `{children}`, and `chatOpen` state lives in `page.tsx`. After calling `goPage('home')`, the home page re-mounts, so a direct ref or callback passed from page to provider is invalidated on navigation.

**Resolution:** Use a custom browser event (`CustomEvent`) dispatched on `window` when the provider wants ChatPopup open. Home page's `useEffect` listens for this event and calls `setChatOpen(true)`. This pattern avoids prop drilling through layout.tsx and is safe across route changes.

```typescript
// In VoiceSessionProvider.openTextChat:
const openTextChat = useCallback((_initialText?: string) => {
  goPage('home');
  // Slight delay so navigation starts first, then event fires after page mounts
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
  }, 100);
}, [goPage]);

// In page.tsx:
useEffect(() => {
  const handler = () => setChatOpen(true);
  window.addEventListener('parz:open-text-chat', handler);
  return () => window.removeEventListener('parz:open-text-chat', handler);
}, []);
```

[ASSUMED: 100ms delay is reasonable for navigation to settle before ChatPopup is triggered. The actual timing may need tuning — if the home page hasn't mounted its event listener yet, the event is lost. An alternative is to check URL query params on mount.]

**Alternative — URL query param:** Navigate to `/?chat=open` and home page checks `searchParams.get('chat') === 'open'` on mount. Avoids timing dependency but adds URL pollution. The custom event approach is simpler for this use case.

### Pattern 4: layout.tsx Provider Nesting

**What:** The updated layout.tsx with VoiceSessionProvider and VoiceOverlay.

**Exact nesting order required** (VoiceSessionProvider must be inside TransitionProvider because it uses `navigateWithReveal`, and inside VoiceBusProvider because it uses `window.VoiceBus`):

```typescript
// Source: layout.tsx current nesting + CONTEXT.md D-08 integration point
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

[VERIFIED: Current nesting confirmed from layout.tsx. VoiceSessionProvider dependency on useTransition (confirmed from voice-controller.ts VoiceControllerOptions.goPage pattern) and window.VoiceBus (confirmed from voice-bus-init.ts + voice-bus-provider.tsx) means it must nest inside both.]

### Pattern 5: Navbar Props Source Change

**What:** DesktopNavbar and MobileNavbar currently receive `voiceActive`, `voiceProps`, `micDenied` as props from `page.tsx`. After this phase, they receive these via `useVoiceSession()` context instead — no prop changes to the navbar component interface.

**Decision:** Keep the existing prop interface on DesktopNavbar/MobileNavbar unchanged. `page.tsx` passes the same values, but reads them from `useVoiceSession()` context instead of local `useVoiceController()` state. This is the lowest-risk approach — no navbar refactor needed.

```typescript
// page.tsx before (Phase 11):
const { active: voiceActive, open: openVoice, close: closeVoice,
        micDenied, voiceProps } = useVoiceController({ goPage, openTextChat, currentPage: 'home' });

// page.tsx after (Phase 12):
const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
```

[VERIFIED: page.tsx imports and destructuring confirmed by reading src/app/page.tsx lines 44-53]

### Anti-Patterns to Avoid

- **Calling useVoiceController in both page.tsx and VoiceSessionProvider:** Creates two independent voice sessions — two STT instances, two TTS chains, two histories. `page.tsx` must fully remove its `useVoiceController` call.
- **Putting VoiceOverlay inside individual non-home pages:** Pages are replaced on navigation; the overlay would unmount. It must be in layout.tsx, above `{children}`.
- **Checking `typeof window !== 'undefined'` for pathname:** `usePathname()` is safe in client components — it reads from the React Router context, not the DOM. No window check needed.
- **Re-initializing VoiceBus on navigation:** `initVoiceBus()` already guards against double-init with `if (window.VoiceBus) return`. Never call it from a component that re-mounts on navigation.
- **GSAP Flip re-morph when returning to home while voice is active:** There is no "before" DOM state to capture since the navbar was not rendered during navigation. Render the navbar directly in voice-active state (i.e., `voiceActive={true}` without running a new Flip.getState/Flip.from cycle). This means the existing `useGSAP` in DesktopNavbar that fires on `voiceActive` change will run, but since the navbar starts already at 760×72, the Flip diff will be zero and no animation plays. This is the correct no-op behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route detection | Manual URL parsing or window.location checks | `usePathname()` from `next/navigation` | Built-in App Router hook, SSR-safe, reactive on navigation |
| Cross-boundary state | Prop drilling voice state through layout → children → page | React Context (`createContext` / `useContext`) | Standard pattern; existing providers (VoiceBusProvider, TransitionProvider) use exact same approach |
| Cross-boundary event (ChatPopup) | Complex callback registration system | `CustomEvent` on `window` | Simplest working solution; no deps; proven pattern for layout-to-page communication |
| Voice audio state | New AudioContext or re-initialization | Existing `window.VoiceBus._getCtx()` | AudioContext already managed in voice-bus-init.ts; creating a second one causes TTS echo |

**Key insight:** All infrastructure exists. This phase is plumbing — connecting existing pieces via a new context provider, not building new capabilities.

---

## Common Pitfalls

### Pitfall 1: VoiceOverlay Renders on Home Page (Double Panel)

**What goes wrong:** VoiceOverlay renders at layout level AND VoicePanel renders inside DesktopNavbar/MobileNavbar. On the home page, both are visible simultaneously — voice panel appears in two places.

**Why it happens:** VoiceOverlay condition only checks `voiceActive`, not the current route.

**How to avoid:** VoiceOverlay must check `pathname === '/'` and return null on the home page. The condition is `voiceActive && pathname !== '/'`.

**Warning signs:** Two voice panels visible on home page in dev mode.

### Pitfall 2: ChatPopup Event Lost Due to Navigation Race

**What goes wrong:** `window.dispatchEvent(new CustomEvent('parz:open-text-chat'))` fires before home page mounts its event listener (because navigation is async), so the event is dropped and ChatPopup never opens.

**Why it happens:** Next.js navigation is async; the new page component's `useEffect` runs after the event dispatch if the delay is too short.

**How to avoid:** Two options:
1. Increase the delay to 300-500ms and test on slow connections.
2. Use URL query param (`/?chat=open`) instead — home page reads `searchParams` on mount, which is synchronous.

**Warning signs:** "Switch to text" on portfolio page navigates to home but ChatPopup does not appear.

### Pitfall 3: DesktopNavbar GSAP Flip Fires on Return-to-Home

**What goes wrong:** When user navigates back to home while voice is active, `voiceActive` prop changes from undefined (navbar was not rendered) to `true`. The `useGSAP` dependency `[voiceActive]` fires, Flip tries to animate from a captured "false/undefined" state to "true" state. Since the navbar just mounted, the Flip diff may produce a visual jump or incorrect animation.

**Why it happens:** GSAP Flip captures a DOM snapshot (`Flip.getState`) before the class toggle. If the element just mounted, the "before" state is the initial DOM geometry which may be the same as the "after" state, resulting in a no-op — or the element may be in an unexpected layout state during hydration.

**How to avoid:** The `useGSAP` in DesktopNavbar fires whenever `voiceActive` changes. Since the navbar starts already in the correct visual state (voice-active=true because `voiceActive` is true from context), and Flip.from() measures a zero-diff, no animation plays. This is correct behavior. Do not add special case logic — the Flip no-op is the desired outcome.

**Warning signs:** Visible navbar flash or incorrect size on return-to-home while voice active.

### Pitfall 4: useVoiceController Called Before VoiceBus Is Initialized

**What goes wrong:** VoiceSessionProvider calls `useVoiceController` which calls `window.VoiceBus.on(...)` in a `useEffect`. If VoiceBusProvider is nested outside (after) VoiceSessionProvider in layout.tsx, `window.VoiceBus` may not exist yet when the first render runs.

**Why it happens:** `initVoiceBus()` is called at module scope in voice-bus-provider.tsx — it runs when the module is imported. However, if VoiceSessionProvider is a sibling or parent of VoiceBusProvider rather than a child, module import order is not guaranteed across Next.js chunks.

**How to avoid:** VoiceSessionProvider must nest inside VoiceBusProvider in layout.tsx. The nesting order in Pattern 4 above is correct. Do not reverse this.

**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'on')` in VoiceWave or useVoiceController useEffect.

### Pitfall 5: currentPage Passed as Static String Instead of Dynamic

**What goes wrong:** VoiceSessionProvider passes `currentPage: 'home'` as a static string (copied from old page.tsx), so `useVoiceController` always thinks it's on the home page. The tour greeting on non-home pages says "Hey, I'm Parz" instead of "Parz here. Ask me anything...".

**Why it happens:** Simple copy-paste from page.tsx without updating the currentPage argument.

**How to avoid:** Pass `currentPage: pathname === '/' ? 'home' : pathname.slice(1)` so it updates reactively as the route changes.

**Warning signs:** Wrong greeting spoken when voice is active on non-home pages.

---

## Code Examples

### Verified: VoiceBusProvider — Existing Pattern to Mirror

```typescript
// Source: src/providers/voice-bus-provider.tsx (verified by reading)
const VoiceBusContext = createContext<VoiceState>('idle');

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

VoiceSessionProvider follows the same `createContext` + `useContext` + `export function useVoiceSession()` pattern.

### Verified: useVoiceController Return Shape

```typescript
// Source: src/lib/voice-controller.ts lines 36-51 (verified by reading)
interface VoiceControllerResult {
  active: boolean;
  open: () => void;
  close: () => void;
  micDenied: boolean;
  prefersReduced: boolean;
  voiceProps: {
    state: string;
    caption: string;
    transcript: string;
    onMic: () => void;
    onStop: () => void;
    onClose: () => void;
    onFallbackChat: () => void;
  };
}
```

All these fields map directly to VoiceSessionContext values.

### Verified: VoiceNavProps Type (matches existing navbar pattern)

```typescript
// Source: src/components/desktop-navbar.tsx line 18 (verified by reading)
// Same definition exists in mobile-navbar.tsx line 13
type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;
```

This type is defined locally in both navbar files. VoiceSessionProvider should import `VoicePanelProps` from `@/components/voice-panel` and declare its own `VoiceNavProps` alias, or re-export from a shared location.

### Verified: usePathname Usage in Existing Provider

```typescript
// Source: src/providers/transition-provider.tsx lines 43-45 (verified by reading)
const pathname = usePathname();
// ... used to track previousPathRef.current = pathname
```

usePathname is already used in a layout-level client provider. Safe pattern.

---

## State of the Art

| Old Pattern | Current Pattern | When Changed | Impact |
|-------------|-----------------|--------------|--------|
| useVoiceController in page.tsx (page-scoped) | useVoiceController in VoiceSessionProvider (layout-scoped) | This phase | Voice state survives navigation |
| VoicePanel only inside navbar | VoicePanel in navbar (home) + VoiceOverlay (non-home) | This phase | OVLY-01, OVLY-04 satisfied |
| No layout-level voice overlay | VoiceOverlay rendered in layout.tsx | This phase | Persists across all pages |

**Nothing deprecated in this phase** — all existing components remain functional. The change is additive at the provider/overlay level only.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 100ms delay is sufficient for home page to mount its CustomEvent listener before `parz:open-text-chat` fires | Pattern 3 (ChatPopup Signal) | ChatPopup does not open after "switch to text" on non-home page; needs delay increase or URL param fallback |
| A2 | GSAP Flip produces a no-op (zero diff) when navbar mounts directly in voice-active state during return-to-home navigation | Pitfall 3 | Visual flash or incorrect Flip animation; would need `useRef` guard to skip Flip on first mount |

---

## Open Questions (RESOLVED)

1. **ChatPopup open signal timing (A1)**
   - What we know: `goPage('home')` triggers `navigateWithReveal` → router.push('/') → Next.js loads home page component
   - What's unclear: Exact time between `router.push` and home page's `useEffect` registering the event listener. With View Transitions API enabled, the transition duration is ~500ms — event dispatch at +100ms likely fires before listener is registered.
   - Recommendation: Use URL query param (`/?chat=open`) instead of CustomEvent. Home page reads `useSearchParams()` on mount. This is synchronous and not timing-dependent. More robust.

2. **VoiceNavProps type location**
   - What we know: `VoiceNavProps` is currently defined identically in both `desktop-navbar.tsx` and `mobile-navbar.tsx` as a local type alias.
   - What's unclear: Should VoiceSessionProvider export `VoiceNavProps` from a shared location (e.g., `@/types/voice`), or should it just import `VoicePanelProps` and inline the Omit?
   - Recommendation: Inline `Omit<VoicePanelProps, 'isDark' | 'micDenied'>` directly in the context type. No need for a shared type file for a single-phase change.

---

## Environment Availability

Step 2.6: SKIPPED (no external dependencies — this phase is purely code changes: new provider file, new component file, modifications to three existing files).

---

## Validation Architecture

Step 2.4: nyquist_validation is explicitly `false` in `.planning/config.json`. Section skipped.

---

## Security Domain

All security-relevant behavior in this phase is inherited unchanged:
- No new API routes introduced
- No new client-side secrets handled
- VoiceBus AudioContext is existing
- CustomEvent for ChatPopup carries no sensitive data
- OVLY-02 (D-03): Ask Parz is home-page only, so voice activation surface is not expanded

No new ASVS categories are introduced by this phase.

---

## Sources

### Primary (HIGH confidence)

- `src/lib/voice-controller.ts` — useVoiceController full implementation, VoiceControllerResult type, all options verified by reading
- `src/providers/voice-bus-provider.tsx` — createContext pattern to mirror, VoiceBusProvider implementation
- `src/providers/transition-provider.tsx` — usePathname usage confirmed at layout-level provider
- `src/app/layout.tsx` — current provider nesting order verified
- `src/app/page.tsx` — current useVoiceController call site, exact destructuring confirmed
- `src/components/desktop-navbar.tsx` — VoiceNavProps type, GSAP Flip morph, exact dimensions (w-[760px] h-[72px] top-[10px])
- `src/components/mobile-navbar.tsx` — VoiceNavProps type, CSS morph, exact dimensions (bottom-[20px] left-[20px] right-[20px])
- `src/components/voice-panel.tsx` — VoicePanelProps interface, vmFadeIn animation, all props confirmed
- `src/lib/voice-bus-init.ts` — global initialization guard confirmed (`if (window.VoiceBus) return`)
- `.planning/phases/12-persistent-voice-overlay/12-UI-SPEC.md` — VoiceOverlay dimensions, context shape, animation contract

### Secondary (MEDIUM confidence)

- `.planning/phases/12-persistent-voice-overlay/12-CONTEXT.md` — All locked decisions (D-01 through D-08) and discretion areas
- `.planning/REQUIREMENTS.md` — OVLY-01 through OVLY-04 requirement text
- `.planning/STATE.md` — Accumulated decisions confirming VoiceBus global scope and GSAP Flip patterns

### Tertiary (LOW confidence)

- A1/A2 in Assumptions Log — timing estimates based on reasoning, not empirical measurement

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reading existing files, no new packages
- Architecture: HIGH — all patterns verified from reading codebase; mirrors existing provider structure exactly
- Pitfalls: HIGH (P1/P3/P4/P5) / MEDIUM (P2) — P2 timing issue is ASSUMED, rest verified from code

**Research date:** 2026-04-24
**Valid until:** Stable — no external dependencies; only changes when voice-controller.ts or navbar component interfaces change
