# Phase 10: Circular Reveal Fix - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Debug and fix the circular reveal page transition. The Phase 7 implementation passed all 5 visual tests but broke during subsequent iterations. This phase must determine the root cause and deliver a working, cross-browser circular reveal with hero button morphing.

</domain>

<decisions>
## Implementation Decisions

### Diagnostic Context (from debugging session)
- **D-01:** The Phase 7 implementation (commit efc25b6) was verified working by the user — all 5 visual tests passed. The code used `experimental: { viewTransition: true }` + manual `document.startViewTransition(() => router.push(path))` + Web Animations API clip-path on `::view-transition-new(root)`.
- **D-02:** Adding `viewTransitionName: 'hero-nav-btn'` to both desktop and mobile PortfolioButton variants caused a duplicate `view-transition-name` error that aborted ALL transitions silently.
- **D-03:** Removing the hero names did NOT restore transitions — something else also broke during the iteration (possibly stale build cache, config changes, or code structure changes).
- **D-04:** The `experimental.viewTransition: true` flag comment says "top-level viewTransition: true is silently ignored" — this was verified when switching to top-level broke everything further.
- **D-05:** CSS `animation: none` on `::view-transition-old(root)` does NOT block Web Animations API (confirmed by MDN docs) — this was a red herring.
- **D-06:** The CSS-driven approach (`@keyframes reveal-in` reading CSS custom properties) did not produce visible animations either.
- **D-07:** Restoring the exact Phase 7 git content for all 3 files (next.config.ts, transition-provider.tsx, globals.css) still did not restore animations. This suggests the issue is NOT in those files alone — something else in the codebase changed.

### Investigation Strategy
- **D-08:** The researcher must diff the FULL codebase state at commit efc25b6 (working) vs HEAD (broken) to find what else changed. The transition provider, config, and CSS are necessary but not sufficient — other files may be interfering.
- **D-09:** Key suspects: (1) VoiceBusProvider added to layout.tsx provider stack may interfere with view transitions, (2) page.tsx changes for voice mode, (3) navbar component changes, (4) particle-background.tsx VoiceBus integration, (5) new dependencies (elevenlabs, etc.)
- **D-10:** The researcher should create a minimal reproduction: temporarily strip the TransitionProvider down to ONLY the startViewTransition + WAAPI code with zero other dependencies, test if that works, then add back dependencies one by one.

### Hero Morph Requirements
- **D-11:** Portfolio button must morph into back button during page transition (Flutter Hero equivalent). Use `view-transition-name` with media-query scoping to avoid duplicates (desktop class active at >=640px, mobile class at <640px).
- **D-12:** Back buttons on portfolio/about/chat pages get a separate class (`hero-nav-btn-dest`) since only one exists per page.
- **D-13:** `::view-transition-group(hero-nav-btn)` CSS rule times the morph at 500ms with same easing as the reveal.

### Claude's Discretion
- Whether to keep View Transitions API or switch to a pure GSAP/Framer Motion approach if VT API proves unreliable
- Whether `experimental.viewTransition: true` conflicts with manual `startViewTransition` or is actually required for it to work
- Exact minimal reproduction strategy

</decisions>

<canonical_refs>
## Canonical References

### Working State (commit efc25b6)
- Git commit `efc25b6` — the last verified working transition-provider.tsx
- Git commit `581960b` — the working globals.css + next.config.ts

### Current Implementation
- `src/providers/transition-provider.tsx` — TransitionProvider (restored to Phase 7 code + .catch() handlers)
- `src/app/globals.css` — View transition CSS rules
- `next.config.ts` — experimental.viewTransition flag
- `src/app/layout.tsx` — Provider stack (ThemeProvider > TransitionProvider > VoiceBusProvider)

### Files Changed Since Working State
- `src/app/layout.tsx` — VoiceBusProvider added
- `src/app/page.tsx` — voice mode integration, click counter changes
- `src/components/desktop-navbar.tsx` — voice mode props, GSAP Flip morph
- `src/components/mobile-navbar.tsx` — voice mode props
- `src/components/portfolio-button.tsx` — hero-nav-btn class added
- `src/components/particle-background.tsx` — VoiceBus breathing rAF loop
- Multiple new files added (voice-*, VoiceBus, etc.)

### Flutter Reference
- `lib/circular_reveal_page_route.dart` — ClipPath with expanding circle
- `lib/navbar.dart` — Hero(tag: 'portfolioButtonHero') on Portfolio button

</canonical_refs>

<code_context>
## Existing Code Insights

### What Works
- The circular reveal concept is proven — it worked in Phase 7
- View Transitions API is supported cross-browser (Chrome 111+, Edge 111+, Firefox 133+, Safari 18+)
- The circle math (sqrt maxX^2 + maxY^2) is correct
- The GSAP fallback path is intact

### What Doesn't Work
- The exact same code that worked in Phase 7 no longer produces visible animations
- This means something OUTSIDE the transition provider is interfering

### Suspects
1. VoiceBusProvider in layout.tsx — wraps children, may affect React rendering order during transitions
2. Voice mode state changes in page.tsx — additional state/effects may cause re-renders during transition
3. GSAP Flip in desktop-navbar.tsx — GSAP may be interfering with view transition pseudo-elements
4. New CSS rules (hero-nav-btn) — even with media-query scoping, may still cause issues
5. Build/cache state — Turbopack hot reload may have stale module state

</code_context>

<specifics>
## Specific Ideas

- Start with a git bisect approach: check out efc25b6, verify it works, then progressively apply changes to find the exact commit that breaks it
- If the Phase 7 code works at its original commit but not at HEAD, the issue is in the diff between those commits
- Consider testing in an incognito window to rule out cached service workers or stale JS

</specifics>

<deferred>
## Deferred Ideas

None — this is a focused debug phase.

</deferred>

---

*Phase: 10-circular-reveal-fix*
*Context gathered: 2026-04-24*
