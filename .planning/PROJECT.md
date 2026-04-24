# Portfolio V2 -- Next.js Migration

## What This Is

A Next.js portfolio site (audienclature.com) with Tailwind CSS, featuring an interactive canvas-based background system, rich project detail overlays, AI chat persona, voice mode, and GitHub stats. Originally migrated 1:1 from Flutter, now evolving with a v3 design overhaul adding new visual effects and features.

## Core Value

A visually striking, interactive portfolio that showcases projects with rich detail, ambient animations, and an AI persona -- same creative energy as the Flutter version but with modern web capabilities.

## Current Milestone: v3 Portfolio Redesign

**Goal:** Implement the v3 design prototype -- interactive DataGrid backgrounds, project detail overlays, voice mode, GitHub stats, and circular reveal transitions.

**Target features:**
- Portfolio page with DataGrid canvas background and per-project hover effects
- Project detail overlay with rich metadata
- IframeViewer for embedding external links + GitHub repo preview
- GitHub Stats pill on home page
- Ask Parz navbar button with ambient orbs
- particles.js connected-node mesh
- Circular reveal page transition (Flutter-accurate)
- Voice mode (speech recognition, TTS, navbar morph)
- About page spotlight cursor effect
- Updated project data with detailed writeups
- Chat persona updates

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

### Active

- [ ] DataGrid canvas background with proximity reveal and hover effects
- [ ] Project detail overlay with rich metadata
- [ ] IframeViewer + GitHub repo preview
- [x] GitHub Stats pill on home page -- Validated in Phase 6
- [x] Ask Parz button in navbar -- Validated in Phase 6
- [x] particles.js connected-node mesh -- Validated in Phase 6
- [x] Circular reveal page transition fix -- Validated in Phase 7 (View Transitions API)
- [x] Voice mode (VoiceBus, speech recognition, TTS) -- Validated in Phase 8 (ElevenLabs + Web Speech API)
- [ ] About page spotlight cursor effect updates
- [ ] Updated project data with 21 projects and detail writeups
- [ ] Chat persona updates (full Parz system prompt)

### Out of Scope

- New features or pages not in the v3 design prototype -- design-driven only
- Native mobile apps (Android/iOS) -- web only
- Backend database or user authentication -- not in current version
- SEO optimization beyond basic meta tags -- can be added post-v3
- Internationalization -- not in current version

## Context

- Current stack: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4
- v3 design prototype provided as HTML/React bundle from Claude Design
- Several v3 components already implemented: DataGrid, ProjectDetail, IframeViewer, GitHub Stats, Ask Parz, particles.js, portfolio page redesign, updated project data
- Circular reveal transition complete -- uses View Transitions API with clip-path on ::view-transition-new(root), matching Flutter's ClipPath behavior
- Voice mode is the largest new feature -- requires Web Speech API integration
- Deployed at audienclature.com on AWS Amplify

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
*Last updated: 2026-04-24 after Phase 8 complete*
