# Portfolio V2 -- Next.js Migration

## What This Is

A Next.js portfolio site (audienclature.com) with Tailwind CSS, featuring an interactive canvas-based background system, rich project detail overlays, AI chat persona, voice mode, and GitHub stats. Originally migrated 1:1 from Flutter, now evolving with a v3 design overhaul adding new visual effects and features.

## Core Value

A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona -- same creative energy as the Flutter version but with modern web capabilities.

## Current State

**Shipped:** v4.0 Voice Mode Production (2026-04-26)

Voice mode is now production-ready in-app: the session persists across routes, tool callbacks execute real UI actions, ElevenLabs Scribe v2 handles STT through server-issued tokens, voice state has visual glow feedback, and API routes are wired to real xAI/ElevenLabs providers. Live Amplify/custom-domain smoke testing is deferred because the production domain is currently unavailable.

**Target features:**
- Wire all voice tool callbacks (openProject, scrollTo, openLink, toggleTheme, navigate) so tour and AI commands actually execute
- Upgrade STT from Web Speech API to ElevenLabs for better quality and cross-browser support
- Verify Grok API key is present and voice/chat reach xAI Grok on a reachable deployment; keep a repeatable Amplify verifier for the deferred custom-domain production check
- Persistent voice overlay that stays open across page navigation (layout-level, not page-level)
- Voice mode accessible from all pages (portfolio, about, chat) -- not just home

## Next Milestone Candidates

- API-03: Restore or identify a reachable Amplify production URL and run `scripts/verify-amplify-apis.mjs` against `/api/chat`, `/api/stt-token`, and `/api/tts`.
- Mobile voice mode refinements, if mobile UX becomes the next priority.
- Deferred portfolio DataGrid hover effects and project-card polish, if visual completion becomes the next priority.

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

### Active

- [ ] API-03: Run `scripts/verify-amplify-apis.mjs` against a reachable Amplify/custom-domain production URL

### Out of Scope

- New features or pages not in the v3 design prototype -- design-driven only
- Native mobile apps (Android/iOS) -- web only
- Backend database or user authentication -- not in current version
- SEO optimization beyond basic meta tags -- can be added post-v3
- Internationalization -- not in current version
- Live Amplify/custom-domain API smoke testing -- deferred until `audienclature.com` or the actual Amplify URL is publicly reachable

## Context

- Current stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- v3 design prototype provided as HTML/React bundle from Claude Design
- Several v3 components already implemented: DataGrid, ProjectDetail, IframeViewer, GitHub Stats, Ask Parz, particles.js, portfolio page redesign, updated project data
- Circular reveal transition complete -- uses View Transitions API with clip-path on ::view-transition-new(root), matching Flutter's ClipPath behavior
- Voice mode is the largest new feature -- requires Web Speech API integration
- Deployment target remains AWS Amplify/audienclature.com; current live API smoke evidence is from the reachable Fly deployment, and `scripts/verify-amplify-apis.mjs` is ready for future Amplify/custom-domain verification

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
*Last updated: 2026-04-26 after v4.0 milestone completion*
