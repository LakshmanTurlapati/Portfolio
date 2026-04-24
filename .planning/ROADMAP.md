# Roadmap: Portfolio V2 -- Next.js Migration

## Milestones

- ✅ **v1.0 Migration** - Phases 1-4 (in progress — Phase 4 partially complete)
- 🚧 **v3 Portfolio Redesign** - Phases 5-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 Migration (Phases 1-4)</summary>

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

</details>

---

### 🚧 v3 Portfolio Redesign (Phases 5-9)

**Milestone Goal:** Implement the v3 design overhaul -- interactive DataGrid portfolio, voice AI mode, faithful circular reveal transition, ambient home page backgrounds, and chat/about polish.

#### Phase 5: Portfolio Page and Data
**Goal**: Users can interact with a fully polished v3 portfolio -- DataGrid canvas background, per-project hover effects, slide-in detail overlays, and IframeViewer previews
**Depends on**: Phase 3
**Requirements**: PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07, PORT-08, DATA-01, DATA-02
**Success Criteria** (what must be TRUE):
  1. Portfolio page shows a pulsing dot grid background; hovering the canvas reveals nearby dots and a glow; pressing H opens the grid controls panel and R randomizes parameters
  2. Hovering a project card triggers that project's assigned signature effect on the DataGrid (each of 21 projects has a distinct effect type mapped)
  3. Clicking a project card slides in a detail overlay showing tagline, year, role, stack, stats, highlights, and rich sections -- content is filled for at least 13 key projects
  4. Clicking Website, GitHub, or Design links in the overlay opens the IframeViewer: Figma and web links embed directly, YouTube URLs convert to embed players, GitHub links show a rich repo card with README and metadata, and unembeddable hosts show a fallback CTA
**Plans:** 3 plans

Plans:
- [x] 05-01-PLAN.md -- GithubPreview component (PORT-08) and IframeViewer routing for GitHub URLs
- [ ] 05-02-PLAN.md -- Visual audit: Instrument Serif fonts, stats grid, dash bullets, card hover polish
- [ ] 05-03-PLAN.md -- Fill all 8 missing project detail writeups (DATA-01 complete coverage)

**UI hint**: yes

#### Phase 6: Home Page and Ambient Backgrounds
**Goal**: Users see a particles.js connected-node mesh on the home page and a GitHub Stats pill, and the navbar offers the Ask Parz entry point with ambient orbs
**Depends on**: Phase 2
**Requirements**: HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):
  1. Home page background is a monochrome connected-node mesh (particles.js) with grab and push mouse interactivity that reinitializes correctly when the user switches dark/light theme
  2. A GitHub Stats pill at bottom-center displays live contribution count, streak, star count, and repo count; hovering expands a detail panel
  3. Navbar shows an Ask Parz button with ambient blurred orbs, a green status dot, and hover amplification on both desktop and mobile
**Plans:** 2 plans

Plans:
- [x] 06-01-PLAN.md -- GitHub Stats live data pipeline: /api/github-stats route + wire github-stats.tsx to live fetch
- [x] 06-02-PLAN.md -- ChatPopup component, Ask Parz wiring (desktop + mobile), particle-background audit

**UI hint**: yes

#### Phase 7: Circular Reveal Transition
**Goal**: Navigating between pages produces a circular reveal that clips the incoming page content expanding from the origin point, matching Flutter's ClipPath behavior
**Depends on**: Phase 4
**Requirements**: TRAN-01, TRAN-02
**Success Criteria** (what must be TRUE):
  1. Clicking any navigation link triggers a circular reveal: the new page content is clipped inside an expanding circle that originates from the clicked element's screen position
  2. The old page remains visible outside the expanding circle throughout the animation -- it is not hidden, faded, or replaced until the circle fully covers the viewport
  3. The transition works for all navigation paths (home, portfolio, about, chat) and does not break on rapid successive clicks or browser back navigation
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md -- Rewrite TransitionProvider with View Transitions API + CSS reset + Next.js config flag
- [x] 07-02-PLAN.md -- Human visual verification of circular reveal across all navigation paths

**UI hint**: yes

#### Phase 8: Voice Mode
**Goal**: Users can speak to Parz -- voice mode activates from the navbar, the navbar morphs into a voice panel, and the full speech-to-text/text-to-speech pipeline runs with visual feedback
**Depends on**: Phase 6
**Requirements**: VOIC-01, VOIC-02, VOIC-03, VOIC-04, VOIC-05
**Success Criteria** (what must be TRUE):
  1. Clicking Ask Parz activates voice mode and the navbar visually morphs into a voice control panel showing current state (idle, listening, thinking, speaking)
  2. In listening state, the mic captures speech via Web Speech API and displays a live amplitude waveform visualization; the recognized transcript is visible before submission
  3. After a voice query, Parz responds with synthesized speech (ElevenLabs eleven_turbo_v2_5 via /api/tts proxy) with a real amplitude envelope animation; the particles mesh breathes in sync with VoiceBus state
  4. User can say a page name to navigate, say "text" or click to switch to the chat text interface, or say "stop" / click to exit voice mode
**Plans:** 5 plans

Plans:
- [x] 08-01-PLAN.md -- VoiceBus types, init module, provider, and ElevenLabs TTS proxy route
- [x] 08-02-PLAN.md -- Voice controller hook: STT, AI agent loop, voice commands, tour, barge-in, memory, accessibility
- [x] 08-03-PLAN.md -- VoiceWave + VoicePanel components, desktop GSAP Flip morph, mobile CSS morph, page.tsx wiring
- [x] 08-04-PLAN.md -- Particle breathing rAF loop integration in ParticleBackground
- [x] 08-05-PLAN.md -- Human visual verification of full voice mode

**UI hint**: yes

#### Phase 9: Chat, About, and Polish
**Goal**: Chat uses the full Parz persona with complete data store, quality-of-life improvements are live, and the About page has a cursor spotlight effect
**Depends on**: Phase 5, Phase 6, Phase 7, Phase 8
**Requirements**: CHAT-01, CHAT-02, CHAT-03, ABUT-01
**Success Criteria** (what must be TRUE):
  1. Sending a message to Parz produces responses grounded in the full DATA_STORE (bio, education, experience, all 21 projects, hobbies, philosophy) -- Parz answers accurately about specific projects and background
  2. While waiting for a response, the user sees a rotating loading message; if the API fails, a random friendly error message appears (not a raw error string)
  3. The suggestion pool shows one small and one big question chip at the start of a conversation; chips disappear after the user sends 2 messages
  4. Moving the cursor over the About page produces a soft spotlight that follows the cursor position via CSS custom properties
**Plans:** 3 plans

Plans:
- [x] 09-01-PLAN.md -- Parz error messages array, DATA_STORE project name audit (all 21 projects), verify chips and loading
- [x] 09-02-PLAN.md -- About page spotlight rewrite to CSS custom property approach (--mx/--my)
- [x] 09-03-PLAN.md -- Human visual verification of all Phase 9 changes

**UI hint**: yes

## Progress

**Execution Order:**
v1.0 phases 1-4 execute first, then v3 phases 5-9 in numeric order.
5 → 6 → 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. App Shell and Navigation | v1.0 | 3/3 | Complete | 2026-04-03 |
| 2. Home Page and Canvas Animations | v1.0 | 4/4 | Complete | 2026-04-03 |
| 3. Content Pages and Chat | v1.0 | 3/3 | Complete | 2026-04-03 |
| 4. Page Transitions and Deployment | v1.0 | 1/2 | In progress | - |
| 5. Portfolio Page and Data | v3 | 0/3 | Not started | - |
| 6. Home Page and Ambient Backgrounds | v3 | 0/2 | Not started | - |
| 7. Circular Reveal Transition | v3 | 2/2 | Complete | 2026-04-24 |
| 8. Voice Mode | v3 | 5/5 | Complete | 2026-04-23 |
| 9. Chat, About, and Polish | v3 | 3/3 | Complete | 2026-04-24 |
