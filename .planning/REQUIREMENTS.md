# Requirements: Portfolio V2 -- Next.js Migration

**Defined:** 2026-04-02
**Core Value:** Pixel-perfect replication of the existing Flutter portfolio in Next.js

## v1 Requirements

Requirements for 1:1 migration from Flutter to Next.js.

### Foundation

- [ ] **FOUN-01**: Project initialized with Next.js 15.5.x, TypeScript, and Tailwind CSS v4
- [ ] **FOUN-02**: Dark/light theme toggles correctly with system preference detection on load
- [ ] **FOUN-03**: Theme toggle button switches theme at runtime without page reload
- [ ] **FOUN-04**: Responsive layout renders mobile variant below 600px and desktop variant at/above 600px
- [ ] **FOUN-05**: Google Fonts (Lato) loaded via next/font with no layout shift

### Navigation

- [ ] **NAV-01**: Desktop navbar displays page links (Home, Portfolio, About, Chat) and social icons (GitHub, LinkedIn, X/Twitter)
- [ ] **NAV-02**: Mobile navbar displays with hamburger menu and navigation drawer
- [ ] **NAV-03**: Navigation links route to correct pages
- [ ] **NAV-04**: Social icon links open in new tab to correct external URLs

### Canvas Animations

- [ ] **ANIM-01**: Particle background renders on home page with smooth 60fps animation
- [ ] **ANIM-02**: Snowfall effect renders with realistic particle physics matching Flutter version
- [ ] **ANIM-03**: Dot matrix effect renders matching Flutter version visual appearance
- [ ] **ANIM-04**: Rotating circular text animates smoothly using SVG textPath
- [ ] **ANIM-05**: Spotlight effect follows cursor/touch matching Flutter version behavior
- [ ] **ANIM-06**: All canvas animations clean up properly on component unmount (no memory leaks)
- [ ] **ANIM-07**: Canvas animations perform at 60fps on mobile devices without jank

### Pages

- [ ] **PAGE-01**: Home page assembles all animations (particles, snow, dot matrix, rotating text, spotlight) with correct layering
- [ ] **PAGE-02**: Portfolio page displays projects in masonry/staggered grid layout matching Flutter version
- [ ] **PAGE-03**: Portfolio project cards show image, name, and links matching Flutter data
- [ ] **PAGE-04**: About page displays bio section matching Flutter version content
- [ ] **PAGE-05**: About page displays experience section with timeline/cards matching Flutter version
- [ ] **PAGE-06**: About page displays education section matching Flutter version
- [ ] **PAGE-07**: About page sections are scrollable with section navigation
- [ ] **PAGE-08**: Chat page displays message interface matching Flutter version layout

### Chat

- [ ] **CHAT-01**: User can send messages and receive AI responses from xAI Grok API
- [ ] **CHAT-02**: API key is server-side only via Next.js API route (not exposed in client bundle)
- [ ] **CHAT-03**: Responses stream in real-time using Vercel AI SDK
- [ ] **CHAT-04**: Conversation history persists within the session
- [ ] **CHAT-05**: Error states display user-friendly messages (matching Flutter's error handling approach)
- [ ] **CHAT-06**: Links in chat messages are automatically detected and clickable

### Page Transitions

- [ ] **TRANS-01**: Circular reveal transition animates when navigating between pages
- [ ] **TRANS-02**: Reveal animation originates from the clicked navigation element's position
- [ ] **TRANS-03**: Transition works in both forward and backward navigation

### Deployment

- [ ] **DEPLOY-01**: Application builds and deploys successfully on AWS Amplify
- [ ] **DEPLOY-02**: Environment variables (xAI API key) are accessible to API routes at runtime
- [ ] **DEPLOY-03**: Application serves correctly at production domain

## v2 Requirements

Deferred to future. Not in current migration scope.

### Enhancements

- **ENH-01**: SEO optimization with structured data and dynamic meta tags
- **ENH-02**: Fog visual effect (currently disabled in Flutter version)
- **ENH-03**: Theme preference persistence across sessions via localStorage
- **ENH-04**: Page load animations and micro-interactions beyond Flutter parity
- **ENH-05**: Analytics integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native mobile apps | Web-only migration, Flutter native was never deployed |
| User authentication | Not in current Flutter version |
| CMS/database backend | Portfolio data stays hardcoded as in Flutter version |
| Internationalization | Not in current Flutter version |
| New pages or features | Strict 1:1 migration, new features are post-migration |
| Fog effect | Commented out/disabled in Flutter source code |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01 | Phase 1 | Pending |
| FOUN-02 | Phase 1 | Pending |
| FOUN-03 | Phase 1 | Pending |
| FOUN-04 | Phase 1 | Pending |
| FOUN-05 | Phase 1 | Pending |
| NAV-01 | Phase 1 | Pending |
| NAV-02 | Phase 1 | Pending |
| NAV-03 | Phase 1 | Pending |
| NAV-04 | Phase 1 | Pending |
| ANIM-01 | Phase 2 | Pending |
| ANIM-02 | Phase 2 | Pending |
| ANIM-03 | Phase 2 | Pending |
| ANIM-04 | Phase 2 | Pending |
| ANIM-05 | Phase 2 | Pending |
| ANIM-06 | Phase 2 | Pending |
| ANIM-07 | Phase 2 | Pending |
| PAGE-01 | Phase 2 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |
| PAGE-05 | Phase 3 | Pending |
| PAGE-06 | Phase 3 | Pending |
| PAGE-07 | Phase 3 | Pending |
| PAGE-08 | Phase 3 | Pending |
| CHAT-01 | Phase 3 | Pending |
| CHAT-02 | Phase 3 | Pending |
| CHAT-03 | Phase 3 | Pending |
| CHAT-04 | Phase 3 | Pending |
| CHAT-05 | Phase 3 | Pending |
| CHAT-06 | Phase 3 | Pending |
| TRANS-01 | Phase 4 | Pending |
| TRANS-02 | Phase 4 | Pending |
| TRANS-03 | Phase 4 | Pending |
| DEPLOY-01 | Phase 4 | Pending |
| DEPLOY-02 | Phase 4 | Pending |
| DEPLOY-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation (coarse 4-phase structure)*
