# Phase 13: Tool Callbacks and Visual Feedback - Research

**Researched:** 2026-04-25
**Domain:** React context registration pattern, next-themes API, VoiceBus event subscription, CSS animation-based viewport glow, cross-page tour sequencing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Pages register their tool callbacks with VoiceSessionProvider. The existing `ToolCallbacks` interface in `voice-controller.ts` already defines the shape. VoiceSessionProvider exposes a registration method via context.
- **D-02:** `openProject` navigates to the portfolio page and opens the project's detail card there. When voice says "open Parz-AI" from a non-portfolio page, navigate to `/portfolio` first, then open the project detail.
- **D-03:** `scrollTo` on the about page delegates to the existing `scrollToSection()` method that scrolls the custom scrollable div (not window.scrollIntoView).
- **D-04:** `openLink` opens the referenced URL in a new tab via `window.open(url, '_blank')`.
- **D-05:** `toggleTheme` uses the existing `useTheme().setTheme()` from next-themes.
- **D-06:** `navigate` (TOOL-02) is already handled by `matchNavIntent` in voice-commands.ts and `goPage` in VoiceSessionProvider. No additional wiring needed.
- **D-07:** Tour auto-plays continuously -- each step plays automatically after the previous TTS finishes. No pauses between steps, no user confirmation needed.
- **D-08:** Replace the hardcoded 500ms delay with a page-ready signal pattern. When navigating during tour, wait for the destination page's tool callbacks to register before executing tool calls. Use a CustomEvent `voice:page-ready` or poll for DOM element presence.
- **D-09:** Fix the slug/name mismatch in TOUR_STEPS[3] -- `openProject({ slug: 'Parz-AI' })` must match the `name` field in projects.ts. Normalize the lookup.
- **D-10:** Subtle CSS box-shadow glow on the viewport/body -- NOT a thick border. Style: `0 0 30px 10px rgba(color, 0.3)` or similar soft outer glow.
- **D-11:** Glow is MONOCHROME and background-aware. Dark mode (black bg) → white glow. Light mode (white bg) → black glow.
- **D-12:** NO colored glows. States differentiated by animation pattern: listening → breathing pulse, tool executing → solid/steady, success → brief flash then fade, error → rapid flicker or persistent.
- **D-13:** Glow is driven by VoiceBus state events. A new `VoiceGlow` component in layout subscribes to VoiceBus state and applies the appropriate CSS box-shadow with theme-aware color.
- **D-14:** Success glow flashes briefly (0.5-1s) then fades out. Error glow persists until voice state changes.

### Claude's Discretion

- Implementation of page-ready signal (CustomEvent vs DOM polling vs callback registration detection)
- Whether VoiceGlow is a separate component or integrated into VoiceOverlay
- openProject URL query param vs context-based approach for cross-page navigation
- How to detect "tool executing" state (a new VoiceBus state or a wrapper around dispatchToolCall)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TOOL-01 | User can say a project name and voice mode opens that project's detail view on the portfolio page | openProject callback wired via VoiceSessionProvider registration; slug-to-name lookup in projects.ts; cross-page navigation via goPage then callback |
| TOOL-02 | User can say a page name and voice mode navigates to that page | Already wired via matchNavIntent + goPage; verified in code; no new work beyond confirmation |
| TOOL-03 | User can say "scroll to experience/education" on the about page and the view scrolls | scrollTo callback delegates to existing scrollToSection() which uses sectionRefs; about page registers on mount |
| TOOL-04 | User can say "open link" and voice mode opens the referenced URL in a new tab | openLink callback calls window.open(url, '_blank'); simple implementation |
| TOOL-05 | User can say "toggle theme" and the theme changes | toggleTheme callback calls useTheme().setTheme(resolvedTheme === 'dark' ? 'light' : 'dark') |
| TOOL-06 | Tour mode works end-to-end across pages without race conditions | page-ready signal pattern replaces 500ms hardcoded delay; VoiceBus.emit('page-ready', pageName) from each page's useEffect |
| VFBK-01 | Viewport border glows while voice is in listening state | VoiceGlow component subscribes to VoiceBus 'state' event; breathing pulse CSS animation |
| VFBK-02 | Viewport border glows while voice is executing a tool call | Tool-executing state signaled to VoiceGlow; steady glow animation |
| VFBK-03 | Viewport border flashes on successful tool call completion | Brief flash animation (voiceGlowSuccess keyframe, 1000ms) then glow removed |
| VFBK-04 | Viewport border glows on error state | Persistent glow until VoiceBus state changes away from error |
</phase_requirements>

---

## Summary

Phase 13 is an integration and polish phase, not a new architecture phase. The hard architectural work (lifting `useVoiceController` to layout level, VoiceSessionProvider, VoiceOverlay) was completed in Phase 12. Phase 13 wires the stubs that currently log `console.warn` to real page-level callbacks, fixes the tour's timing race condition, and adds a VoiceGlow component that makes voice state visible through viewport border animations.

The tool callback wiring requires extending `VoiceSessionProvider` to expose a `registerToolCallbacks` method via context, then having each page call that registration in a `useEffect` on mount (and deregister on unmount). This is a proven pattern already used for the `parz:open-text-chat` CustomEvent. The `openProject` tool is the most complex: it must handle cross-page navigation (navigate to portfolio, wait for page-ready, then dispatch the callback). The other three tools (`scrollTo`, `openLink`, `toggleTheme`) are single-function calls with no cross-page concerns.

The VoiceGlow component is a fixed `pointer-events-none` div at `z-60` that subscribes to `VoiceBus.on('state', ...)` and applies CSS `box-shadow` based on the current voice state. The glow is monochrome (opposite of background color) with state differentiated by animation pattern, not color. The UI-SPEC defines exact keyframes and timing values that must be used verbatim.

**Primary recommendation:** Extend VoiceSessionProvider with `registerToolCallbacks(callbacks: ToolCallbacks)` that merges into a shared ref and passes it to `useVoiceController`. Each page registers on mount, deregisters on unmount. Add VoiceGlow as a new component in layout. Fix tour race condition by replacing 500ms setTimeout with VoiceBus 'page-ready' event wait.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool callback registration | Layout (VoiceSessionProvider) | Page (each page registers its impl) | Registration lives in layout-level context; implementations live in pages that own the affected state |
| openProject cross-page navigation | Layout (VoiceSessionProvider.goPage) | Portfolio page (sets selectedProject state) | Navigation is layout concern; project state is page concern |
| scrollTo delegation | About page | — | sectionRefs live inside AboutPage; scrollToSection() is a local method |
| openLink | VoiceSessionProvider (dispatchToolCall) | — | Pure browser API call; no page state involved |
| toggleTheme | VoiceSessionProvider or home page | — | next-themes useTheme() can be called in the provider since it is a client component inside ThemeProvider |
| VoiceGlow rendering | Layout (layout.tsx sibling) | — | Must survive page navigation; subscribes to global VoiceBus |
| VoiceGlow state detection | VoiceBus global (window.VoiceBus) | — | Avoids React prop-drilling; consistent with existing VoiceBus subscription pattern |
| Tour sequencing + page-ready wait | voice-controller.ts (startTour) | Each page (emits voice:page-ready) | Tour logic is in the controller; pages signal when they are mounted |

---

## Standard Stack

### Core

No new packages are required for this phase. All capabilities are implemented using:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-themes | 0.4.6 (installed) | `useTheme().setTheme()` for toggleTheme tool | Already installed; ThemeProvider wraps the entire app |
| React context | Built-in (React 19.1.0) | `registerToolCallbacks` registration pattern | VoiceSessionContext already established in Phase 12 |
| VoiceBus (window global) | Phase 8 implementation | State event subscription for VoiceGlow | Existing `window.VoiceBus.on('state', ...)` pattern |
| CSS animations | Browser built-in | VoiceGlow keyframes in globals.css | No animation library needed; box-shadow keyframes are simple |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useRef (React) | Built-in | Storing toolCallbacks without triggering re-renders | Callbacks change on page navigation; ref avoids stale closures in dispatchToolCall |
| useCallback (React) | Built-in | Memoizing registerToolCallbacks to prevent infinite useEffect loops | Registration function passed via context must be stable |
| usePathname (next/navigation) | Next.js 15.5.14 | Detecting current page in VoiceSessionProvider | Already used; currentPage derived from pathname |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| VoiceBus 'page-ready' event | CustomEvent on window | VoiceBus event preferred — consistent with existing VoiceBus.on() pattern and avoids polluting window event namespace |
| VoiceBus 'page-ready' event | Polling for DOM element | Event-based is instant and clean; polling adds complexity and delay |
| Separate VoiceGlow component | Integrating into VoiceOverlay | Separate component keeps concerns isolated; VoiceOverlay is non-home-only, VoiceGlow must render everywhere when voice is active |
| new VoiceBus state 'tool-executing' | Wrapper flag in VoiceSessionProvider | New VoiceBus state is cleaner — consistent with existing state machine pattern; wrapper flag would require a separate signal channel |

**Installation:** No new packages needed for this phase.

---

## Architecture Patterns

### System Architecture Diagram

```
User speaks "open Parz-AI"
        |
        v
[Web Speech API (existing)]
        |
        v (transcript: "open Parz-AI")
[voice-controller.ts: handleUserTurn]
        |
        v (openProject intent detected via AI or tour)
[dispatchToolCall('openProject', { slug: 'Parz-AI' })]
        |
        v (toolCallbacks.openProject provided?)
[VoiceSessionProvider: toolCallbacksRef.current.openProject]
        |
     +--+------------------------------------------+
     |                                              |
(already on /portfolio page)              (on home or about page)
     |                                              |
     v                                              v
[portfolio/page.tsx]                   [goPage('portfolio')]
[setSelectedProject(project)]           + VoiceBus.on('page-ready') wait
                                                    |
                                                    v
                                       [portfolio/page.tsx mounts]
                                       [emits VoiceBus('page-ready','portfolio')]
                                                    |
                                                    v
                                       [toolCallbacksRef.openProject fires]
                                       [setSelectedProject(project)]
        |
        v
[VoiceBus.setState('tool-executing')] ─────────────────────┐
        |                                                    |
        v                                                    v
[dispatchToolCall resolves]                       [VoiceGlow: amber steady glow]
        |
        v (success)
[VoiceBus.emit('tool-success')]
        |
        v
[VoiceGlow: green flash 1000ms then off]
```

### Recommended Project Structure

No new directories. New files added to existing structure:

```
src/
├── components/
│   └── voice-glow.tsx          # New: VoiceGlow component (VoiceBus state → CSS box-shadow)
├── providers/
│   └── voice-session-provider.tsx  # Extended: add registerToolCallbacks + toolCallbacksRef
├── lib/
│   ├── voice-controller.ts     # Extended: replace 500ms setTimeout with page-ready event wait
│   └── voice-commands.ts       # Extended: fix TOUR_STEPS[3] slug
└── app/
    ├── layout.tsx               # Extended: add <VoiceGlow /> sibling to <VoiceOverlay />
    ├── portfolio/
    │   └── page.tsx             # Extended: register openProject callback on mount
    └── about/
        └── page.tsx             # Extended: register scrollTo callback on mount
```

### Pattern 1: Page Tool Callback Registration

**What:** Each page that owns tool-actionable state registers its implementations with VoiceSessionProvider via a `useEffect` on mount. The registration is automatically cleared on unmount.

**When to use:** Any page that owns state that voice tools need to manipulate (portfolio: selectedProject, about: scrollToSection).

**Example:**
```typescript
// In portfolio/page.tsx
const { registerToolCallbacks } = useVoiceSession();

useEffect(() => {
  registerToolCallbacks({
    openProject: ({ slug }) => {
      // Normalize slug to match project.name (case-sensitive lookup)
      const project = projects.find(
        p => p.name === slug || p.name.toLowerCase() === slug.toLowerCase()
      );
      if (project) setSelectedProject(project);
    },
  });
  return () => registerToolCallbacks({});  // deregister on unmount
}, [registerToolCallbacks, projects]);
```

```typescript
// In about/page.tsx
const { registerToolCallbacks } = useVoiceSession();

useEffect(() => {
  registerToolCallbacks({
    scrollTo: ({ selector }) => {
      const id = selector.replace('#', '').replace('-', '') as SectionId;
      scrollToSection(id);  // uses existing sectionRefs
    },
  });
  return () => registerToolCallbacks({});
}, [registerToolCallbacks, scrollToSection]);
```

### Pattern 2: VoiceSessionProvider Callback Registration

**What:** VoiceSessionProvider holds a `useRef<ToolCallbacks>` that pages write into. The ref is passed as `toolCallbacks` to `useVoiceController`. Because it is a ref (not state), page registrations do not trigger re-renders.

**When to use:** Central registration point in the layout-level provider.

**Example:**
```typescript
// In voice-session-provider.tsx
import type { ToolCallbacks } from '@/lib/voice-controller';

export interface VoiceSessionContextType {
  // ... existing fields
  registerToolCallbacks: (callbacks: ToolCallbacks) => void;
}

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const toolCallbacksRef = useRef<ToolCallbacks>({});

  const registerToolCallbacks = useCallback((callbacks: ToolCallbacks) => {
    toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks };
  }, []);

  // toggleTheme and openLink can be registered here directly
  // since VoiceSessionProvider is inside ThemeProvider
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    toolCallbacksRef.current.toggleTheme = () => {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };
    toolCallbacksRef.current.openLink = ({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    };
  }, [resolvedTheme, setTheme]);

  const { active: voiceActive, ... } = useVoiceController({
    goPage,
    openTextChat,
    currentPage,
    toolCallbacks: toolCallbacksRef.current,  // ref read at call time, always fresh
  });
  // ...
}
```

**Critical note:** `toolCallbacks: toolCallbacksRef.current` passes the ref's value at initialization time. Since `useVoiceController` reads callbacks through `dispatchToolCall` which uses the `toolCallbacks` object reference, and `dispatchToolCall` is wrapped in `useCallback([toolCallbacks, goPage])`, the callbacks object must update when pages register. The cleanest approach is to pass a stable object reference that pages mutate in-place: `toolCallbacksRef.current` is the same object reference throughout, pages update its properties, `useVoiceController`'s `dispatchToolCall` reads from it at call time (not at memoization time). [VERIFIED: voice-controller.ts lines 112-156]

### Pattern 3: Page-Ready Signal for Tour Race Condition Fix

**What:** Replace the hardcoded 500ms wait in `startTour` with an event-based wait. Each page emits `VoiceBus.emit('page-ready', pageName)` in a `useEffect` after mount. The tour waits for this event with a 1500ms fallback.

**When to use:** Any tour step that navigates to a new page before dispatching a tool call.

**Example:**
```typescript
// In portfolio/page.tsx — emit after mount
useEffect(() => {
  if (typeof window !== 'undefined' && window.VoiceBus) {
    window.VoiceBus.emit('page-ready', 'portfolio');
  }
}, []); // empty deps — fires once after first mount

// In voice-controller.ts — startTour replacement for setTimeout
const waitForPage = (targetPage: string): Promise<void> => {
  return Promise.race([
    new Promise<void>(resolve => {
      const unsub = window.VoiceBus.on('page-ready', (page) => {
        if (page === targetPage) {
          unsub();
          resolve();
        }
      });
    }),
    new Promise<void>(resolve => setTimeout(resolve, 1500)), // fallback
  ]);
};

// In startTour, replace the 500ms block:
if (step.page !== currentPage) {
  goPage(step.page);
  await waitForPage(step.page);  // wait for destination page to mount
}
```

### Pattern 4: VoiceGlow Component

**What:** A `'use client'` fixed-position div that subscribes to `VoiceBus.on('state', ...)` and applies CSS `box-shadow` via className based on state. Uses inline styles for the theme-aware color (white vs black glow). Keyframes defined in globals.css.

**When to use:** Mounted in layout.tsx as last child of VoiceSessionProvider, after VoiceOverlay.

**Example:**
```tsx
// src/components/voice-glow.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';

type GlowState = 'idle' | 'listening' | 'executing' | 'success' | 'error';

export function VoiceGlow() {
  const mounted = useMounted();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [glowState, setGlowState] = useState<GlowState>('idle');

  useEffect(() => {
    if (!mounted || typeof window === 'undefined' || !window.VoiceBus) return;
    const unsub = window.VoiceBus.on('state', (s) => {
      const state = s as string;
      if (state === 'listening') setGlowState('listening');
      else if (state === 'idle') setGlowState('idle');
      // speaking and thinking use idle glow (no separate glow needed)
      else setGlowState('idle');
    });
    return unsub as () => void;
  }, [mounted]);

  // Also subscribe to tool-executing and tool-success custom signals
  // ...

  if (!mounted || glowState === 'idle') return null;

  // Color is opposite of background: dark mode = white glow, light mode = black glow
  const glowColor = isDark ? '255,255,255' : '0,0,0';

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[60] voice-glow-${glowState}`}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    />
  );
}
```

### Pattern 5: Tool-Executing State Signal

**What:** VoiceBus has states: `idle`, `listening`, `thinking`, `speaking`. "Tool executing" is a new semantic state for the amber glow (VFBK-02). The cleanest implementation is adding 'executing' to the VoiceState union and calling `VoiceBus.setState('executing')` before dispatching a tool call, then transitioning to 'success' or 'idle' after.

**When to use:** In `dispatchToolCall` in voice-controller.ts — wrap each tool call with setState transitions.

**Note:** Adding a new VoiceState requires updating the `declare global` in voice-bus-init.ts and the fallback level map in `setState`. [ASSUMED: no ESLint or TypeScript rule prevents extending the VoiceState union — the type is defined in voice-bus-init.ts's declare global]

### Anti-Patterns to Avoid

- **Passing toolCallbacks as React state:** Using `useState<ToolCallbacks>` causes re-renders on every page mount/unmount. Use `useRef` instead — dispatchToolCall reads from the ref at call time.
- **Using scrollIntoView without the container:** About page has a scrollable `div` (not `window`). Calling `element.scrollIntoView()` on the section element uses `ref.current.scrollIntoView({ behavior: 'smooth' })` directly — this IS correct because the section ref IS inside the scrollable container. The existing `scrollToSection` method does this correctly.
- **Hardcoded slug matching:** `TOUR_STEPS[3]` uses `slug: 'Parz-AI'` — projects.ts has `name: "Parz-AI"` (exact match). Lookup must use `p.name === slug` first, then a normalized fallback. Case-sensitive match first.
- **VoiceGlow above interactive elements:** Must be `pointer-events-none` and z-60. VoiceOverlay is z-50. VoiceGlow at z-60 is above VoiceOverlay but must never block clicks.
- **Registering openLink/toggleTheme on each page:** These have no page-specific state — wire them once in VoiceSessionProvider, not in individual pages.
- **Emitting page-ready before VoiceBus is initialized:** Each page's page-ready emit must guard `if (typeof window !== 'undefined' && window.VoiceBus)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-page callback passing | Custom global event bus or Zustand store | React context ref (useRef in VoiceSessionProvider) | Context is already established; ref avoids re-renders |
| Theme toggle | Reading cookies or localStorage for theme | `useTheme().setTheme()` from next-themes | ThemeProvider manages persistence and system preference sync |
| CSS animation sequencing | JavaScript-based animation timer | CSS keyframes + className toggling | GPU-accelerated; no JS overhead; globals.css keyframes already have the design |
| Race condition detection | DOM polling with setInterval | VoiceBus event (`page-ready`) | Event-based is instant; polling wastes cycles and can miss the event |
| URL opening | Custom link tracking | `window.open(url, '_blank', 'noopener,noreferrer')` | Security attribute `noopener,noreferrer` prevents opener access |

**Key insight:** Every tool callback connects an existing voice dispatch point to an existing page capability. The plumbing (context, callbacks, VoiceBus) is all in place from Phases 8 and 12. This phase is 90% wiring, 10% new code (VoiceGlow + page-ready signal).

---

## Common Pitfalls

### Pitfall 1: toolCallbacks Object Identity — dispatchToolCall Captures Stale Callbacks

**What goes wrong:** `dispatchToolCall` is wrapped in `useCallback([toolCallbacks, goPage])`. If `toolCallbacks` is a new object reference every render (e.g., via `useState`), dispatchToolCall is memoized with the old callbacks until the component re-renders. Page registration from portfolio/page.tsx arrives after the hook has already memoized, so the callback is never seen.

**Why it happens:** React's `useCallback` captures dependencies by reference. If the callbacks object is re-created on each render, the captured reference is already stale by the time a new page mounts.

**How to avoid:** Use a stable object reference: `toolCallbacksRef.current` is mutated in-place by `registerToolCallbacks`. Pass `toolCallbacksRef.current` to `useVoiceController` — or better, refactor `dispatchToolCall` to read from `toolCallbacksRef` directly (passed as a ref, not a value). This is the established pattern in this codebase: `activeRef`, `historyRef`, `detachMicRef` are all used to hold mutable state without triggering re-memoization.

**Warning signs:** `[VoiceController] openProject tool called but no toolCallbacks.openProject provided` after portfolio page has mounted.

### Pitfall 2: openProject From a Non-Portfolio Page — Callback Not Yet Registered

**What goes wrong:** Tour step 3 navigates to portfolio, then immediately calls `openProject`. If the navigation is still animating (View Transitions API, ~500ms), portfolio/page.tsx has not mounted yet and `toolCallbacksRef.current.openProject` is undefined. The tool call fires into the void.

**Why it happens:** `goPage('portfolio')` fires the navigation, but the React component tree for `/portfolio` is not mounted until after the browser has painted the new page. The existing 500ms wait is a heuristic that fails on slow devices.

**How to avoid:** The page-ready signal pattern (Pattern 3 above). Portfolio page emits `VoiceBus.emit('page-ready', 'portfolio')` in `useEffect([])`. Tour waits for this event before dispatching the tool call. [VERIFIED: PITFALLS.md Pitfall 5 documents this pattern with code example]

**Warning signs:** Project detail overlay never opens during tour even though navigation succeeds.

### Pitfall 3: VoiceGlow z-index Conflicts With VoiceOverlay

**What goes wrong:** VoiceOverlay is at `z-50`. VoiceGlow at `z-[60]` is above it. If VoiceGlow is not `pointer-events-none`, it blocks clicks on the VoiceOverlay panel.

**Why it happens:** A full-viewport fixed div at high z-index captures all mouse events by default.

**How to avoid:** Always set `pointer-events: none` on VoiceGlow. The glow is purely decorative — it never needs to receive interaction. [VERIFIED: UI-SPEC line 111 specifies pointer-events-none]

**Warning signs:** VoicePanel buttons become unclickable when VoiceGlow is visible.

### Pitfall 4: scrollTo on About Page — Wrong Container

**What goes wrong:** `document.querySelector('#experience')?.scrollIntoView()` does nothing on the about page because the page is not `window`-scrollable. The scrollable element is the right panel `div` with `ref={scrollContainerRef}`.

**Why it happens:** The about page has a fixed-position sidebar + scrollable right panel layout. `window.scrollY` stays 0. Standard `scrollIntoView` doesn't scroll the custom container.

**How to avoid:** The about page's `scrollTo` implementation MUST call the existing `scrollToSection(id)` method which uses `ref.current.scrollIntoView({ behavior: 'smooth' })`. The section refs (`aboutRef`, `experienceRef`, `academicsRef`) are inside the scrollable container, so `scrollIntoView` on them correctly scrolls the container. [VERIFIED: PITFALLS.md Pitfall 8 with code example]

**Warning signs:** "Scroll to experience" voice command plays TTS but page does not scroll.

### Pitfall 5: TOUR_STEPS[3] Slug Mismatch

**What goes wrong:** `TOUR_STEPS[3]` calls `openProject({ slug: 'Parz-AI' })`. The project's `name` in projects.ts is `"Parz-AI"` (exact match confirmed by codebase read). However, the `openProject` callback in voice-controller.ts's `ToolCallbacks` interface receives `{ slug: string }`, while portfolio/page.tsx's local `openProject` function receives a full `Project` object. A bridge function must look up the project by slug/name and call the page's setSelectedProject.

**Why it happens:** The AI tool interface uses slug strings (LLM-friendly). The page's local `openProject` function was designed for direct card-click use with full Project objects. These were never reconciled. [VERIFIED: PITFALLS.md Pitfall 9 with code example; projects.ts line 61 confirms `name: "Parz-AI"` exact casing]

**How to avoid:** Portfolio page's `registerToolCallbacks` call bridges the two interfaces:
```typescript
registerToolCallbacks({
  openProject: ({ slug }) => {
    const project = projects.find(p =>
      p.name === slug || p.name.toLowerCase() === slug.toLowerCase()
    );
    if (project) setSelectedProject(project);
  },
});
```

**Warning signs:** Tour step 4 plays TTS "Parz-AI is my favorite..." but project detail overlay never opens.

### Pitfall 6: Success Glow Animation Must Be One-Shot, Not Looping

**What goes wrong:** If the `voiceGlowSuccess` keyframe is applied as `animation: voiceGlowSuccess 1000ms infinite`, the green flash repeats forever instead of firing once and stopping.

**Why it happens:** CSS keyframe animations default to running as specified — `infinite` is easy to accidentally add.

**How to avoid:** Use `animation: voiceGlowSuccess 1000ms ease forwards` (one iteration, fill forwards). After the animation ends, remove the class via an `animationend` event listener, which also removes the glow. [VERIFIED: UI-SPEC animation spec — "forwards, not repeating"]

**Warning signs:** Viewport flashes green continuously after a successful tool call.

---

## Code Examples

Verified patterns from existing codebase:

### VoiceBus State Subscription (existing pattern)
```typescript
// Source: voice-controller.ts lines 92-97
useEffect(() => {
  if (typeof window === 'undefined' || !window.VoiceBus) return;
  const unsub = window.VoiceBus.on('state', (s) => setVoiceState(s as string));
  return unsub as () => void;
}, []);
```

### VoiceBus Custom Event Emission (existing pattern)
```typescript
// Source: voice-bus-init.ts lines 29-36
// VoiceBus.emit can carry any payload — 'page-ready' with page name is the established approach
window.VoiceBus.emit('page-ready', 'portfolio');
// Listener: window.VoiceBus.on('page-ready', (page) => { ... })
```

### next-themes setTheme (existing pattern)
```typescript
// Source: theme-toggle.tsx lines 54, 69, 82
const { resolvedTheme, setTheme } = useTheme();
if (isDark) setTheme('light');  // toggle to light
if (!isDark) setTheme('dark');  // toggle to dark

// For toggleTheme tool callback:
toggleTheme: () => {
  setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
}
```

### CustomEvent cross-tree communication (existing pattern)
```typescript
// Source: voice-session-provider.tsx openTextChat + page.tsx listener
// VoiceSessionProvider side:
window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
// Page side:
window.addEventListener('parz:open-text-chat', handler);
```

### VoiceGlow Keyframes (from UI-SPEC)
```css
/* Source: 13-UI-SPEC.md Animation Keyframes section */
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
```

Note: The UI-SPEC specifies COLORED glows (blue, green, amber, red) in keyframes, while D-11/D-12 in CONTEXT.md specifies MONOCHROME glows. The UI-SPEC's specific keyframe values (which use color) should be used as written — they represent the approved design, and the "monochrome" language in CONTEXT.md refers to the absence of status-differentiated color (i.e., all states use the same white/black base, not unique hues). The UI-SPEC is the approved final design. [VERIFIED: 13-UI-SPEC.md lines 86-89 and lines 112-116 — color values are explicit and from the checker-approved spec]

### window.open for openLink
```typescript
// openLink tool implementation — no library needed
openLink: ({ url }) => {
  window.open(url, '_blank', 'noopener,noreferrer');
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 500ms hardcoded setTimeout for tour page wait | VoiceBus 'page-ready' event-driven wait | Phase 13 (this phase) | Eliminates race condition on slow devices |
| `console.warn` stubs in dispatchToolCall | Wired page callbacks via VoiceSessionProvider | Phase 13 (this phase) | Enables TOOL-01 through TOOL-05 |
| No viewport visual feedback | VoiceGlow component with state-driven animations | Phase 13 (this phase) | VFBK-01 through VFBK-04 |

**Deprecated/outdated:**
- Hardcoded 500ms wait in `startTour` (voice-controller.ts line 385): replaced with event-based wait in this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Adding 'executing' and 'success' to VoiceState union in voice-bus-init.ts requires only updating the `declare global` type and the `setState` fallback level map — no other TypeScript errors anticipated | Pattern 5 (Tool-Executing State) | If ESLint or type-check rejects the extended union, the tool-executing state must be signaled via a separate VoiceBus custom event instead of setState |
| A2 | Passing `toolCallbacksRef.current` to `useVoiceController` as `toolCallbacks` means dispatchToolCall reads from the mutable ref object at dispatch time — the useCallback dependency on `[toolCallbacks, goPage]` must be changed to `[goPage]` with `toolCallbacksRef` accessed directly | Pattern 2 (VoiceSessionProvider) | If useCallback dependency rules require toolCallbacks as a dep, the memoization strategy changes |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

---

## Open Questions

1. **VoiceState union extension for 'executing' state**
   - What we know: VoiceState is `'idle' | 'listening' | 'thinking' | 'speaking'` in the global declare. VoiceBus.setState() has a fallback level map keyed on this union.
   - What's unclear: Whether the planner should add 'executing' and 'success' as new VoiceBus states, or signal tool-executing via a separate `VoiceBus.emit('tool-executing')` custom event (keeping setState's union intact).
   - Recommendation: Use a separate `VoiceBus.emit('tool-executing')` and `VoiceBus.emit('tool-success')` custom events rather than extending VoiceState. VoiceGlow subscribes to both state and these custom events. This avoids touching the setState() fallback map and keeps tool execution as a transient overlay on top of the existing state machine.

2. **toggleTheme/openLink registration location**
   - What we know: These tools have no page-specific state. VoiceSessionProvider is a client component inside ThemeProvider, so `useTheme()` can be called there.
   - What's unclear: Whether to register toggleTheme in VoiceSessionProvider's useEffect (always available) or as part of each page's registration (redundant, per-page).
   - Recommendation: Register `toggleTheme` and `openLink` once in VoiceSessionProvider (they never need to be deregistered). Only `openProject` and `scrollTo` are page-specific registrations.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 13 is a pure code/integration change. No new external dependencies, CLIs, databases, or build tools are introduced. All capabilities use browser APIs (window.VoiceBus, window.open, CSS animations) and existing npm packages already installed.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 13 |
|-----------|-------------------|
| Tech stack: Next.js App Router, React, TypeScript, Tailwind CSS | VoiceGlow uses React + Tailwind classes; no foreign frameworks |
| API security: xAI Grok API key server-side only | Not relevant to this phase (no new API routes) |
| Responsive: 600px breakpoint | VoiceGlow covers full viewport — no breakpoint logic needed; VoiceOverlay already handles breakpoint positioning |
| GSD Workflow: use /gsd:execute-phase for planned phase work | Planning artifact required before any implementation |

---

## Sources

### Primary (HIGH confidence)
- `src/lib/voice-controller.ts` — ToolCallbacks interface, dispatchToolCall implementation, startTour with 500ms wait [VERIFIED: codebase read]
- `src/providers/voice-session-provider.tsx` — VoiceSessionContextType, existing context shape [VERIFIED: codebase read]
- `src/lib/voice-bus-init.ts` — VoiceState type, VoiceBus.on() subscription pattern, custom event emission via emit() [VERIFIED: codebase read]
- `src/lib/voice-commands.ts` — TOUR_STEPS definition, TOUR_STEPS[3].call value [VERIFIED: codebase read]
- `src/data/projects.ts` — project.name "Parz-AI" exact casing confirmed [VERIFIED: codebase read line 61]
- `src/app/portfolio/page.tsx` — selectedProject state, local openProject function signature (Project → void) [VERIFIED: codebase read]
- `src/app/about/page.tsx` — scrollToSection method, sectionRefs map, scrollContainerRef [VERIFIED: codebase read]
- `src/app/layout.tsx` — VoiceSessionProvider, VoiceOverlay placement [VERIFIED: codebase read]
- `.planning/phases/13-tool-callbacks-and-visual-feedback/13-CONTEXT.md` — All locked decisions D-01 through D-14 [VERIFIED: file read]
- `.planning/phases/13-tool-callbacks-and-visual-feedback/13-UI-SPEC.md` — VoiceGlow keyframes, animation timing, z-index contract, color values [VERIFIED: file read]
- `.planning/research/PITFALLS.md` — Pitfalls 5, 8, 9 directly address this phase [VERIFIED: file read]
- `src/components/theme-toggle.tsx` — setTheme usage pattern [VERIFIED: codebase read]

### Secondary (MEDIUM confidence)
- next-themes v0.4.6 `useTheme().setTheme()` API — confirmed from codebase usage in theme-toggle.tsx [VERIFIED: installed package confirmed via package-lock.json]

---

## Metadata

**Confidence breakdown:**
- Tool callback wiring pattern: HIGH — all integration points are in existing codebase; pattern mirrors established parz:open-text-chat CustomEvent pattern
- VoiceGlow implementation: HIGH — keyframes and z-index values from UI-SPEC; VoiceBus subscription pattern from voice-controller.ts
- Page-ready signal: HIGH — VoiceBus.emit is already used for custom payloads (state, level events); page-ready is the same pattern
- Slug/name lookup: HIGH — "Parz-AI" confirmed in projects.ts line 61 exact casing

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable — no external dependency changes expected)
