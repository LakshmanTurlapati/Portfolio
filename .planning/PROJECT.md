# Portfolio V2 -- Next.js Migration

## What This Is

A 1:1 migration of an existing Flutter web portfolio site (audienclature.com) to Next.js with Tailwind CSS. The portfolio showcases projects, experience, education, and includes an AI chat feature powered by xAI Grok API. Every page, animation, and visual effect from the Flutter version must be faithfully reproduced in the Next.js version.

## Core Value

Pixel-perfect replication of the existing Flutter portfolio in Next.js -- same look, same feel, same features, nothing lost in translation.

## Requirements

### Validated

- Home page with particle background, snow/fog effects, animated text -- existing
- Portfolio page with staggered grid layout of projects -- existing
- About page with bio, experience, education sections -- existing
- Chat page with xAI Grok API integration -- existing
- Responsive design with mobile/desktop breakpoints (600px) -- existing
- Dark/light theme with system preference detection and manual toggle -- existing
- Circular reveal page transition animations -- existing
- Custom navigation bar (desktop and mobile variants) -- existing
- Rotating circular text animation -- existing
- Dot matrix visual effects -- existing
- Spotlight effects -- existing
- External link handling (GitHub, LinkedIn, X/Twitter) -- existing

### Active

- [ ] Migrate home page to Next.js with all animations (particles, snow, fog, rotating text, dot matrix)
- [ ] Migrate portfolio page with staggered grid layout
- [ ] Migrate about page with scrollable sections
- [ ] Migrate chat page with xAI Grok API via Next.js API route (server-side key)
- [ ] Migrate responsive layout system (mobile/desktop at 600px breakpoint)
- [ ] Migrate dark/light theme toggle with system preference detection
- [ ] Migrate circular reveal page transitions
- [ ] Migrate navigation bars (desktop and mobile)
- [ ] Migrate all visual effects (spotlight, click_here, portfolio_button)
- [ ] Deploy on AWS Amplify

### Out of Scope

- New features or pages not in the Flutter version -- migration only
- Native mobile apps (Android/iOS) -- web only
- Backend database or user authentication -- not in current version
- SEO optimization beyond basic meta tags -- can be added post-migration
- Internationalization -- not in current version

## Context

- Current stack: Flutter/Dart with Material Design, hosted as static web files
- Target stack: Next.js (App Router) with React, Tailwind CSS, TypeScript
- The Flutter version uses custom canvas-based animations (particles, snow, fog) that will need to be reimplemented using HTML5 Canvas or CSS/JS animations
- Chat feature currently exposes xAI API key in frontend code -- migration fixes this via Next.js API route
- Portfolio data is hardcoded in component files as lists of maps -- will become structured data in Next.js
- Theme state is runtime-only (no persistence) -- same approach in Next.js
- Deployed at audienclature.com, moving to AWS Amplify

## Constraints

- **Tech stack**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Visual fidelity**: Must match Flutter version pixel-for-pixel on all pages
- **Animations**: All custom animations (particle background, snow, fog, circular reveal, rotating text, dot matrix, spotlight) must be replicated
- **API security**: xAI Grok API key must be server-side only (Next.js API route)
- **Deployment**: AWS Amplify
- **Responsive**: Same 600px mobile/desktop breakpoint behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js App Router | Modern React patterns, server components, API routes | -- Pending |
| Tailwind CSS | Utility-first, fast development, excellent Next.js integration | -- Pending |
| TypeScript | Type safety, better DX, catches errors at compile time | -- Pending |
| API route for chat | Fixes security vulnerability of exposed API key in Flutter frontend | -- Pending |
| AWS Amplify deployment | User preference for hosting platform | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after initialization*
