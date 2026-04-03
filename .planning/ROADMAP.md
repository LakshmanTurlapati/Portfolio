# Roadmap: Portfolio V2 -- Next.js Migration

## Overview

This roadmap migrates the existing Flutter portfolio at audienclature.com to Next.js with pixel-perfect visual fidelity. The work progresses from a bootable app shell with theme and navigation, through the complex canvas animation engine and home page, then content pages and chat integration, and finally page transitions and production deployment on AWS Amplify.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: App Shell and Navigation** - Bootable Next.js app with theme, responsive layout, fonts, and fully working navigation
- [x] **Phase 2: Home Page and Canvas Animations** - All canvas animations (particles, snow, dot matrix, spotlight, rotating text) composed into a complete home page
- [ ] **Phase 3: Content Pages and Chat** - Portfolio, About, and Chat pages with full content and xAI Grok API integration
- [ ] **Phase 4: Page Transitions and Deployment** - Circular reveal transitions between all pages and production deployment on AWS Amplify

## Phase Details

### Phase 1: App Shell and Navigation
**Goal**: Users can navigate between all four pages with working dark/light theme and responsive layout
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, NAV-01, NAV-02, NAV-03, NAV-04
**Success Criteria** (what must be TRUE):
  1. App loads with correct Lato font, no layout shift, and detects system theme preference on first visit
  2. User can toggle between dark and light theme without page reload, and theme colors apply consistently across all placeholder pages
  3. Desktop navbar shows Portfolio button, About Me link, and social icons; mobile navbar shows bottom bar with same elements -- both switch at 600px breakpoint
  4. Clicking any navigation link routes to the correct page; social icons open GitHub/LinkedIn/X in new tabs
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md -- Initialize Next.js 15 project with Tailwind v4, theme provider, fonts, and utilities
- [x] 01-02-PLAN.md -- Build theme toggle (sun/separator/moon) and author name components
- [x] 01-03-PLAN.md -- Build navigation bars, placeholder pages, and assemble home page

**UI hint**: yes

### Phase 2: Home Page and Canvas Animations
**Goal**: Home page displays all visual effects at 60fps matching the Flutter version's look and feel
**Depends on**: Phase 1
**Requirements**: ANIM-01, ANIM-02, ANIM-03, ANIM-04, ANIM-05, ANIM-06, ANIM-07, PAGE-01
**Success Criteria** (what must be TRUE):
  1. Home page renders particle background, snowfall, dot matrix, rotating circular text, and spotlight effect with correct layering matching the Flutter version
  2. All canvas animations run at 60fps on both desktop and mobile without jank or dropped frames
  3. Spotlight effect follows cursor on desktop and touch on mobile, matching Flutter's interpolation behavior
  4. Navigating away from the home page and returning does not leak memory -- animations clean up on unmount and reinitialize correctly
**Plans:** 4 plans

Plans:
- [x] 02-01-PLAN.md -- useCanvas hook, CSS custom properties, particle background, and snowfall canvas effects
- [x] 02-02-PLAN.md -- Dot matrix grid, rotating circular text SVG, and spotlight CSS overlay
- [x] 02-03-PLAN.md -- Scrolling text focal point with desktop and mobile variants
- [x] 02-04-PLAN.md -- Home page assembly wiring all effects with z-index layering

**UI hint**: yes

### Phase 3: Content Pages and Chat
**Goal**: Portfolio, About, and Chat pages are fully functional with content matching the Flutter version and working AI chat
**Depends on**: Phase 1
**Requirements**: PAGE-02, PAGE-03, PAGE-04, PAGE-05, PAGE-06, PAGE-07, PAGE-08, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06
**Success Criteria** (what must be TRUE):
  1. Portfolio page displays all projects in a staggered/masonry grid with images, names, and links matching the Flutter version layout
  2. About page displays bio, experience timeline/cards, and education section with scrollable section navigation matching Flutter version
  3. User can send a message in the chat and receive a streaming response from xAI Grok, with conversation history preserved during the session
  4. Chat API key is not exposed in the client bundle -- API calls go through a Next.js server-side route
  5. Error states in chat display user-friendly messages; links in chat responses are automatically detected and clickable
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md -- Portfolio page with masonry grid, project data, asset images, and snowfall overlay
- [x] 03-02-PLAN.md -- About page with bio, experience timeline, education, sidebar navigation, and spotlight overlay
- [x] 03-03-PLAN.md -- Chat page with xAI Grok API integration, streaming responses, and message UI

**UI hint**: yes

### Phase 4: Page Transitions and Deployment
**Goal**: All inter-page navigation uses circular reveal transitions and the application is live on AWS Amplify
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: TRANS-01, TRANS-02, TRANS-03, DEPLOY-01, DEPLOY-02, DEPLOY-03
**Success Criteria** (what must be TRUE):
  1. Navigating between any two pages triggers a circular reveal transition that originates from the clicked navigation element's position
  2. Circular reveal transition works correctly for both forward and backward navigation (including browser back button)
  3. Application builds, deploys, and serves correctly on AWS Amplify at the production domain with environment variables accessible to API routes
**Plans:** 2 plans

Plans:
- [ ] 04-01-PLAN.md -- Circular reveal page transitions with clip-path animation
- [x] 04-02-PLAN.md -- AWS Amplify deployment configuration with env var injection

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4
(Note: Phase 2 and Phase 3 depend only on Phase 1, so they could theoretically be worked in parallel, but sequential execution is recommended.)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. App Shell and Navigation | 3/3 | All plans complete | 2026-04-03 |
| 2. Home Page and Canvas Animations | 4/4 | All plans complete | 2026-04-03 |
| 3. Content Pages and Chat | 3/3 | All plans complete | 2026-04-03 |
| 4. Page Transitions and Deployment | 1/2 | In progress | - |
