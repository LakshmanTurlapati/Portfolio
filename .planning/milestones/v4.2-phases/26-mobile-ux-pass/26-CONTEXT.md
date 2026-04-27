# Phase 26: Mobile UX Pass - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning
**Mode:** Smart discuss (3 areas, all recommendations accepted)

<domain>
## Phase Boundary

Smooth animations, sane keyboard handling, and uncramped layouts across the three known mobile pain points (MOB-01, MOB-02, MOB-03).

Scope: particle background mobile tuning, iOS chat-input keyboard handling, project-detail page responsive padding/grid.

Out of scope: any non-mobile changes; new mobile features beyond the three success criteria; tablet treatment as a separate breakpoint (tablet inherits desktop behavior here).

</domain>

<decisions>
## Implementation Decisions

### Mobile Particles (MOB-01)
- Particle count on mobile: **45** (mid-point of the ~40-50 target range from ROADMAP)
- Breathing rAF loop: no fps cap on mobile; let rAF run at native 60Hz refresh, just emit fewer particles
- Detection method: `window.matchMedia('(max-width: 768px)')` (matchMedia listener, not innerWidth polling)
- Tablet/iPad treatment: tablet (>768px) uses the desktop particle count (90); reduction only kicks in below 768px

### iOS Keyboard (MOB-02)
- `inputMode` attribute on chat input: `text`
- Scroll-into-view on focus: `onFocus` handler calls `scrollIntoView({block:'center', behavior:'smooth'})` after a small `setTimeout` so the keyboard has time to animate up
- Safe-area inset sides: `bottom` only (chat input is bottom-anchored; landscape notch handling deferred)
- Keyboard detection: focus event + small `setTimeout`; do NOT use the VisualViewport API for this iteration

### Project Detail Layout (MOB-03)
- Stats grid mobile layout: 2 columns (`grid-cols-2`) on mobile, existing larger layouts unchanged
- Cover image margin on mobile: full-bleed (`-mx-4 lg:mx-0`) so the image visually escapes the page padding
- Horizontal padding ladder: `px-4` (mobile) → `md:px-8` (mid) → `lg:px-14` (desktop)
- Body text / description padding: matches container padding (no extra inset)

### Claude's Discretion
- Exact animation/transition durations for scroll-into-view (pick something natural — 250-400ms range)
- Exact breakpoint pixel values where ROADMAP didn't specify (use Tailwind defaults: `md` = 768px, `lg` = 1024px)
- Internal file structure (helpers, hooks, where to colocate the matchMedia detection)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Particle background component already exists in `src/components/` — needs a `mobile` prop or internal matchMedia subscription
- Chat popup at `src/components/chat-popup.tsx` (modified by Phase 25 for VOICE-05 page-ready integration)
- Project detail page lives under `src/app/portfolio/[slug]/` (Next.js App Router)

### Established Patterns
- Tailwind v4 with project-local design tokens
- Next.js App Router — server components by default, `'use client'` for interactive bits
- VoiceBus pattern (Phase 19+) for cross-provider events; not relevant here but established codebase rhythm

### Integration Points
- Particle component: tweak particle count + emission cadence based on a matchMedia hook
- Chat input: probably in `chat-popup.tsx` — add `inputMode`, focus handler, safe-area class
- Project detail page: adjust top-level container `className` for the responsive padding ladder; tweak stats grid + cover image classes

</code_context>

<specifics>
## Specific Ideas

- Match the existing Tailwind ladder used elsewhere on the site for the `px-4 → md:px-8 → lg:px-14` rhythm
- The "no jank from breathing rAF loop" criterion (MOB-01) implies the existing breathing logic is fine as-is on mobile once particle count drops; do not introduce throttling unless profiling shows an issue
- Safe-area inset on iOS is exposed via `env(safe-area-inset-bottom)` in CSS

</specifics>

<deferred>
## Deferred Ideas

- Landscape iPhone notch handling (left/right safe-area insets)
- VisualViewport API integration for keyboard detection (more reliable but heavier)
- Tablet-specific particle count
- Throttling the breathing rAF loop on low-end mobile devices (deferred until measured jank exists)

</deferred>
