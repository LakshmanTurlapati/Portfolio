# Requirements: Portfolio V2 -- Next.js Migration

**Defined:** 2026-04-02
**Core Value:** Pixel-perfect replication of the existing Flutter portfolio in Next.js

## v1 Requirements

Requirements for 1:1 migration from Flutter to Next.js.

### Foundation

- [x] **FOUN-01**: Project initialized with Next.js 15.5.x, TypeScript, and Tailwind CSS v4
- [x] **FOUN-02**: Dark/light theme toggles correctly with system preference detection on load
- [x] **FOUN-03**: Theme toggle button switches theme at runtime without page reload
- [x] **FOUN-04**: Responsive layout renders mobile variant below 600px and desktop variant at/above 600px
- [x] **FOUN-05**: Google Fonts (Lato) loaded via next/font with no layout shift

### Navigation

- [x] **NAV-01**: Desktop navbar displays page links (Home, Portfolio, About, Chat) and social icons (GitHub, LinkedIn, X/Twitter)
- [x] **NAV-02**: Mobile navbar displays with hamburger menu and navigation drawer
- [x] **NAV-03**: Navigation links route to correct pages
- [x] **NAV-04**: Social icon links open in new tab to correct external URLs

### Canvas Animations

- [x] **ANIM-01**: Particle background renders on home page with smooth 60fps animation
- [x] **ANIM-02**: Snowfall effect renders with realistic particle physics matching Flutter version
- [x] **ANIM-03**: Dot matrix effect renders matching Flutter version visual appearance
- [x] **ANIM-04**: Rotating circular text animates smoothly using SVG textPath
- [x] **ANIM-05**: Spotlight effect follows cursor/touch matching Flutter version behavior
- [x] **ANIM-06**: All canvas animations clean up properly on component unmount (no memory leaks)
- [x] **ANIM-07**: Canvas animations perform at 60fps on mobile devices without jank

### Pages

- [x] **PAGE-01**: Home page assembles all animations (particles, snow, dot matrix, rotating text, spotlight) with correct layering
- [x] **PAGE-02**: Portfolio page displays projects in masonry/staggered grid layout matching Flutter version
- [x] **PAGE-03**: Portfolio project cards show image, name, and links matching Flutter data
- [ ] **PAGE-04**: About page displays bio section matching Flutter version content
- [ ] **PAGE-05**: About page displays experience section with timeline/cards matching Flutter version
- [ ] **PAGE-06**: About page displays education section matching Flutter version
- [ ] **PAGE-07**: About page sections are scrollable with section navigation
- [x] **PAGE-08**: Chat page displays message interface matching Flutter version layout

### Chat

- [x] **CHAT-01**: User can send messages and receive AI responses from xAI Grok API
- [x] **CHAT-02**: API key is server-side only via Next.js API route (not exposed in client bundle)
- [x] **CHAT-03**: Responses stream in real-time using Vercel AI SDK
- [x] **CHAT-04**: Conversation history persists within the session
- [x] **CHAT-05**: Error states display user-friendly messages (matching Flutter's error handling approach)
- [x] **CHAT-06**: Links in chat messages are automatically detected and clickable

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
| FOUN-01 | Phase 1 | Complete |
| FOUN-02 | Phase 1 | Complete |
| FOUN-03 | Phase 1 | Complete |
| FOUN-04 | Phase 1 | Complete |
| FOUN-05 | Phase 1 | Complete |
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| ANIM-01 | Phase 2 | Complete |
| ANIM-02 | Phase 2 | Complete |
| ANIM-03 | Phase 2 | Complete |
| ANIM-04 | Phase 2 | Complete |
| ANIM-05 | Phase 2 | Complete |
| ANIM-06 | Phase 2 | Complete |
| ANIM-07 | Phase 2 | Complete |
| PAGE-01 | Phase 2 | Complete |
| PAGE-02 | Phase 3 | Complete |
| PAGE-03 | Phase 3 | Complete |
| PAGE-04 | Phase 3 | Pending |
| PAGE-05 | Phase 3 | Pending |
| PAGE-06 | Phase 3 | Pending |
| PAGE-07 | Phase 3 | Pending |
| PAGE-08 | Phase 3 | Complete |
| CHAT-01 | Phase 3 | Complete |
| CHAT-02 | Phase 3 | Complete |
| CHAT-03 | Phase 3 | Complete |
| CHAT-04 | Phase 3 | Complete |
| CHAT-05 | Phase 3 | Complete |
| CHAT-06 | Phase 3 | Complete |
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
*Last updated: 2026-04-03 after Phase 3 Plan 01 completion*
