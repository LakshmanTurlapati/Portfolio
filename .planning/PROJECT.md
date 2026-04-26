# Portfolio V2 -- Next.js Migration

## What This Is

A Next.js portfolio site (audienclature.com) with Tailwind CSS, featuring an interactive canvas-based background system, rich project detail overlays, AI chat persona, voice mode, and GitHub stats. Originally migrated 1:1 from Flutter, now evolving with a v3 design overhaul adding new visual effects and features.

## Core Value

A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona -- same creative energy as the Flutter version but with modern web capabilities.

## Current State

**Shipped:** v4.1 Parz Persona, Portfolio Context, and Site Control Refresh (2026-04-26)

v4.1 is complete and live at https://portfolio-v4-test.fly.dev/. Parz grounds answers in a typed `public-profile.ts` source of truth (current work, personality, flagship projects, refusal boundaries). About / Experience / project content shares the same approved facts as the system prompt, locked by Phase 20 contract tests. Project cards open approved targets directly in the inbuilt browser, and Parz can navigate, scroll, open projects, close the shell, and refuse third-party iframe control from any current page — all wrapped in a pointer-safe monochrome FSB control overlay. The voice pipeline was audited end-to-end and three additional waves of fixes (Phases 21-23) shipped: hardcoded tour scaffolding ripped out for LLM-driven walkthroughs, audio serialization rebuilt around a single `cancelAllAudio` primitive plus AbortController plus turn-generation counter, every word the user hears is now LLM-generated. Phase 24 closed out the mobile pass and iOS safe-area support (`viewport-fit=cover` + `env(safe-area-inset-*)` on all fixed mobile elements).

## Current Milestone: v4.2 Carry-forward Polish & Hardening

**Goal:** Close out v4.1's deferred items -- voice reliability hardening, mobile UX gaps, FSB overlay polish, and a chat UI redesign -- without regressing shipped behavior.

**Target features:**

- Voice Wave 2 hardening: F-05 openTextChat race, F-06 STT session-started timeout, F-07 SpeechSynthesis fallback timeout, F-08 registerToolCallbacks deregister, F-09 tool-callback exception wrapping (all from `21-AUDIT.md`)
- Mobile UX pass: particle-background mobile performance, chat input iOS keyboard handling, project-detail full-screen mobile layout
- FSB overlay polish: FSB-04 dynamic action captions, FSB-05 mobile-specific overlay treatment
- Chat UI redesign (CHAT-UI-01): visual / UX polish of the chat popup
- API-03 verification: live Amplify / custom-domain smoke test (gated on a reachable production URL; may stay deferred)

**Key context:** All scope is carry-forward from v4.1. Voice items batch well together. CHAT-UI-01 is design-driven and benefits from a UI-SPEC phase. API-03 is infra-blocked, not code-blocked -- it ships only if a reachable Amplify URL exists, otherwise it stays deferred with that reason logged.

## Requirements

### Validated

- Home page with particle background, animated text, dot matrix -- v1.0
- Portfolio page with masonry grid layout -- v1.0
- About page with bio, experience, education sections -- v1.0
- Chat page with xAI Grok API integration -- v1.0
- Responsive design with mobile/desktop breakpoints (600px) -- v1.0
- Dark/light theme with system preference detection -- v1.0
- Custom navigation bar (desktop and mobile variants) -- v1.0
- Rotating circular text animation -- v1.0
- Dot matrix visual effects -- v1.0
- Spotlight effects -- v1.0
- External link handling (GitHub, LinkedIn, X/Twitter) -- v1.0
- AWS Amplify deployment -- v1.0
- GitHub Stats pill on home page -- v3
- Ask Parz button in navbar with ambient orbs -- v3
- particles.js connected-node mesh -- v3
- Circular reveal page transition (View Transitions API) -- v3
- Voice mode foundation (VoiceBus, ElevenLabs TTS, Web Speech STT, navbar morph) -- v3
- About page spotlight cursor effect -- v3
- Full Parz persona with DATA_STORE (21 projects) -- v3
- Chat QoL (loading messages, friendly errors, suggestion chips) -- v3
- IframeViewer browser previews (Figma, YouTube, GitHub, fallback CTAs) -- v3

### Validated in v4.0

- ✓ Persistent voice overlay across page navigation — v4.0
- ✓ Voice tool callbacks for openProject, scrollTo, openLink, toggleTheme, navigate, and tour actions — v4.0
- ✓ Voice glow visual feedback for listening/executing/success/error states — v4.0
- ✓ ElevenLabs Scribe v2 STT with server-issued `/api/stt-token` tokens — v4.0
- ✓ Grok/ElevenLabs API routes verified on a reachable deployment, with live Amplify/custom-domain verification deferred — v4.0

### Validated in v4.1 Phase 16

- ✓ Public-safe Parz profile source of truth for current work, personality, flagship projects, approved links, and protected private categories — v4.1 Phase 16
- ✓ Parz prompt refreshed for direct-first, warm, practical, personality-grounded answers — v4.1 Phase 16
- ✓ About, Experience, FSB, GitFly, and Review Gate content refreshed around current public-safe facts — v4.1 Phase 16
- ✓ Guardrails added for hidden prompts/internal context, private GitFly source, non-public InfiniteChoice/Voyza details, secrets/config, voice internals, and bounded rude-user behavior — v4.1 Phase 16
- ✓ Project cards open approved public targets directly in the inbuilt browser instead of the right-side ProjectDetail panel — v4.1 Phase 17
- ✓ Canonical project aliases resolve FSB, Full Self Browsing, GitFly, Review Gate, T2S, and Parz-AI through local project records — v4.1 Phase 17
- ✓ Project opening is constrained to approved local project URLs, with GitFly linking only to https://gitfly.ai — v4.1 Phase 17
- ✓ Parz can open approved projects from any page through a global inbuilt-browser shell without navigating to portfolio first — v4.1 Phase 18
- ✓ Parz can navigate to home, portfolio, and about, then scroll About, Experience, or Academics through the about page's internal scroll container — v4.1 Phase 18
- ✓ Parz can close the inbuilt browser shell, open the current project externally, and honestly decline unsupported third-party iframe control — v4.1 Phase 18
- ✓ Parz site-control actions show a monochrome FSB-inspired overlay with bottom-left `powered by FSB` badge while keeping controls pointer-safe — v4.1 Phase 19
- ✓ Vitest contract suite (12 tests) plus a focused Playwright E2E spec verify persona, guardrails, source parity, project resolution, and shell control — v4.1 Phase 20
- ✓ Voice pipeline audited end-to-end (17 findings); hardcoded tour scaffolding ripped out; Wave 1 P0 fixes shipped (SSE buffer, prefers-reduced-motion barge-in, Space hijack) — v4.1 Phase 21
- ✓ Voice audio serialization rebuilt: `cancelAllAudio` primitive plus AbortController plus turn-generation counter close five overlap modes — v4.1 Phase 22
- ✓ All hardcoded `speak()` strings removed; greet is LLM-generated via synthetic kickoff turn; R-1 barge-in regression hotfix shipped — v4.1 Phase 23
- ✓ Mobile pass + iOS safe-area: `viewport-fit=cover`, `env(safe-area-inset-*)` on all fixed mobile elements, variant-aware AskParz button, portfolio image clipping, compact mobile voice panel — v4.1 Phase 24

### Active (v4.2 milestone)

- [ ] Wave 2 P1 voice audit findings (`21-AUDIT.md`): F-05 openTextChat 400ms race, F-06 STT session-started timeout, F-07 SpeechSynthesis fallback timeout, F-08 registerToolCallbacks deregister, F-09 tool-callback exception wrapping
- [ ] Particle-background mobile performance, chat input iOS keyboard handling, project-detail full-screen mobile UX
- [ ] FSB-04 overlay action captions, FSB-05 mobile-specific overlay treatment
- [ ] CHAT-UI-01 chat popup/page redesign (design-driven; UI-SPEC phase)
- [ ] API-03: Live Amplify / custom-domain smoke test against `audienclature.com` (script ready at `scripts/verify-amplify-apis.mjs`; gated on reachable production URL)

### Out of Scope

- New features or pages not in the v3 design prototype -- design-driven only
- Native mobile apps (Android/iOS) -- web only
- Backend database or user authentication -- not in current version
- SEO optimization beyond basic meta tags -- can be added post-v3
- Internationalization -- not in current version
- Live Amplify/custom-domain API smoke testing -- deferred until `audienclature.com` or the actual Amplify URL is publicly reachable
- GitFly source code or private implementation details -- source is private; portfolio/Parz should link only to the public platform at https://gitfly.ai
- Non-public InfiniteChoice/Voyza implementation details -- current role/product context only unless details are explicitly public
- Voice bot internal wiring details -- explain only high-level public behavior or public GitHub code-level details when applicable
- Right-side project detail panel as a primary project experience -- user said it was never part of the design; project opens now go to the inbuilt browser instead

## Context

- Current stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- v3 design prototype provided as HTML/React bundle from Claude Design
- Several v3 components already implemented: DataGrid, ProjectDetail, IframeViewer, GitHub Stats, Ask Parz, particles.js, portfolio page redesign, updated project data
- Circular reveal transition complete -- uses View Transitions API with clip-path on ::view-transition-new(root), matching Flutter's ClipPath behavior
- Voice mode is the largest new feature -- requires Web Speech API integration
- Deployment target remains AWS Amplify/audienclature.com; current live API smoke evidence is from the reachable Fly deployment, and `scripts/verify-amplify-apis.mjs` is ready for future Amplify/custom-domain verification
- Current work: Lakshman is an AI Enablement Engineer at InfiniteChoice, building Voyza, an AI-first hotel booking platform; Parz and visible site content keep this brief and public-safe.
- Current flagship projects: FSB / Full Self Browsing (public browser automation assistant at https://www.full-selfbrowsing.com) and GitFly (public platform at https://gitfly.ai; private source).
- GitHub profile context: Lakshman frames himself as an AI builder, open-source builder, full-stack engineer turned AI engineer, and creative technologist; public GitHub profile lists InfiniteChoice, Texas, parzival.live, full-selfbrowsing.com, and cmd-k.site.
- Personality target: Parz should be ambitious, curious, playful, kind, warm, high-energy, direct, practical, inclusive, confident but story-first, and never corporate, robotic, or overly formal.
- Deeper behavioral model: Lakshman's intensity is about alignment, internal standards, and noticing gaps between what is and what could be -- not just chasing success.
- Builder style: gap radar, ship-first instincts, aesthetic taste, AI leverage, and obsession loops once an idea catches.
- Conversation behavior: answer directly first; add personality through wording rather than unsolicited extra chatter; use humor only when the user is casual.
- Site-control goal: Parz should have meaningful control over the portfolio, not just scripted navigation. It should open project browser views directly, scroll/navigate precisely, and avoid unnecessary detours through the portfolio page when a project can be shown from the current page.
- Phase 17 browser foundation: project records now carry approved aliases and preferred browser targets, and portfolio-local project opens resolve through those records before opening the inbuilt browser.
- Phase 18 global control foundation: `SiteControlProvider` owns shell navigation, global project browser state, about-section scroll delegation, browser close/external-open actions, and unsupported iframe-control limitation handling for both text and voice Parz.
- Phase 19 FSB overlay foundation: `SiteControlProvider` now shows a pointer-safe monochrome overlay and bottom-left `powered by FSB` badge while Parz performs real shell-control actions.

## Constraints

- **Tech stack**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Design fidelity**: Must match v3 design prototype pixel-for-pixel
- **Animations**: DataGrid hover effects, circular reveal, voice wave visualization
- **API security**: xAI Grok API key must be server-side only
- **Deployment**: AWS Amplify
- **Responsive**: Same 600px mobile/desktop breakpoint behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern React patterns, server components, API routes | ✓ Good |
| Tailwind CSS | Utility-first, fast development, excellent Next.js integration | ✓ Good |
| TypeScript | Type safety, better DX, catches errors at compile time | ✓ Good |
| API route for chat | Fixes security vulnerability of exposed API key | ✓ Good |
| AWS Amplify deployment | User preference for hosting platform | ✓ Good |
| particles.js for home bg | Connected-node mesh with grab/push interactivity, theme-aware | ✓ Good |
| DataGrid for portfolio bg | Canvas-based pulsing dots with 10 hover effect types | -- Pending |
| View Transitions API reveal | Replaced overlay with View Transitions API + clip-path, matches Flutter | ✓ Good |
| Same UI, better brain for v4.1 | User explicitly chose chatbot/content intelligence over UI redesign | -- Pending |
| GitFly public link only | Source code is private; public platform should redirect only to https://gitfly.ai | -- Pending |
| Prompt evals required for persona refresh | Personality and guardrails need testable coverage, not just prompt edits | -- Pending |
| Remove right-side project panel | User clarified it was never part of the intended design; project display now uses the inbuilt browser | ✓ Good |
| FSB-inspired Parz control overlay | AI navigation/control should feel visible and intentional, with a monochrome overlay and "powered by FSB" badge | ✓ Good |
| Public-safe profile source of truth | Phase 16 centralized approved public facts and protected categories in `src/data/public-profile.ts` | ✓ Good |
| Global Parz site-control provider | Phase 18 centralized navigation, project opening, about-section scrolling, and browser shell actions in `src/providers/site-control-provider.tsx` | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-26 -- v4.2 Carry-forward Polish & Hardening milestone started*
