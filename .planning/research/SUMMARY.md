# Project Research Summary

**Project:** Portfolio V2 -- Flutter-to-Next.js Migration
**Domain:** Portfolio website migration (Flutter/Dart to Next.js/React/TypeScript/Tailwind)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

This project is a 1:1 migration of an existing Flutter web portfolio to Next.js. The Flutter version features canvas-based background animations (particles with radial gradients, multi-layer mouse-interactive snowfall, dot matrix grid), a circular reveal page transition originating from click position, an AI chat powered by xAI Grok, and a dark/light theme toggle with system detection. The target stack is Next.js 15.5.x (App Router), React 19, TypeScript, Tailwind CSS v4, GSAP 3.14 for page transitions, and native HTML5 Canvas API for background effects, deployed on AWS Amplify.

The recommended approach follows a layered architecture: server component page shells in the App Router delegate to client component trees for interactivity. Canvas animations use a shared `useCanvas` hook with `requestAnimationFrame` and refs (never `useState`) for per-frame state. The chat system moves from a raw HTTP call with an exposed API key (security vulnerability in Flutter) to the Vercel AI SDK with a server-side Route Handler, enabling streaming responses as an improvement over Flutter's non-streaming implementation. The circular reveal page transition is the single hardest feature to implement because Next.js App Router does not expose exit animation hooks -- a CSS `clip-path` overlay managed by a custom `TransitionProvider` is the recommended approach.

The key risks are: (1) AWS Amplify caps Next.js at version 15 -- using `create-next-app` without pinning to v15 creates an undeployable project, (2) canvas blur effects (`ctx.filter = 'blur()'`) are software-rendered and extremely expensive at 60fps -- pre-rendered offscreen canvases are required, (3) Amplify environment variables configured in the Console are NOT available to the Lambda runtime executing API routes -- explicit injection via `amplify.yml` is mandatory, and (4) theme/responsive hydration mismatches will cause visible flashes unless handled with CSS-first approaches and the `mounted` guard pattern.

## Key Findings

### Recommended Stack

The stack is tightly constrained by the AWS Amplify deployment target (Next.js 12-15 only) and the project's existing Flutter feature set. All recommended libraries are actively maintained, verified on npm, and have HIGH confidence ratings.

**Core technologies:**
- **Next.js 15.5.x + React 19:** App Router provides server components, route handlers for the chat API proxy, and built-in image/font optimization. Pinned to v15 due to Amplify constraint (v16 unsupported, open GitHub issue #14600).
- **Tailwind CSS 4.2.x:** CSS-first configuration (no `tailwind.config.js`), 5x faster builds, native CSS variables for design tokens. Dark mode via `selector` strategy integrates with `next-themes`.
- **GSAP 3.14.x + @gsap/react 2.1.x:** Now 100% free for commercial use. Timeline model handles circular reveal clip-path transitions and sequenced DOM animations. The `useGSAP()` hook manages cleanup automatically.
- **Native HTML5 Canvas API:** Zero-dependency approach for particle background (7 circles), snowfall (220 particles across 3 layers), and dot matrix (336 cells). Custom canvas gives exact control to match Flutter's bespoke particle physics.
- **Vercel AI SDK 6.x + @ai-sdk/xai 3.x:** `useChat` hook (client) and `streamText` (server) handle streaming, message state, and error handling. Replaces raw HTTP with proper SDK. Supports `grok-3-mini` through `grok-4`.
- **next-themes 0.4.x:** Zero-flash dark/light mode toggle with system detection, localStorage persistence, and Tailwind class-based integration.

**Supporting:** react-icons 5.6.x (tree-shakeable, includes FontAwesome 6), clsx + tailwind-merge (conditional class utilities), next/font/google (self-hosted fonts, zero CLS).

**Explicitly rejected:** Next.js 16, Framer Motion/Motion, tsParticles, Three.js, shadcn/ui, CSS Modules, Zustand/Redux. See STACK.md for detailed rationale on each.

### Expected Features

**Must have (15 table stakes for 1:1 parity):**
- Canvas-based particle background (7 floating circles with radial gradients) -- Medium complexity
- Multi-layer mouse-interactive snowfall (220 particles, 3 depth layers) -- Medium complexity
- Circular reveal page transition from click origin -- HIGH complexity, hardest feature
- Rotating circular text (SVG textPath, CSS rotation) -- Medium-Low complexity
- Interactive dot matrix grid (336 cells, hover animation) -- Low complexity
- Spotlight cursor-follow effect (radial gradient overlay, lerp interpolation) -- Low-Medium complexity
- Animated gradient button (3-color orbiting glow) -- Low-Medium complexity
- Dark/light theme with system detection -- Low complexity
- Scrolling role text carousel (vertical word rotation with fade mask) -- Low-Medium complexity
- AI chat with streaming responses (xAI Grok, secure server-side key) -- Medium complexity
- Responsive layout system (600px breakpoint) -- Low complexity
- Navigation bar (desktop + mobile variants) -- Low-Medium complexity
- Staggered masonry grid for portfolio page -- Medium complexity
- About page (bio, experience, education sections) -- Low complexity
- Custom theme toggle (sun/moon animated SVG) -- Low-Medium complexity

**Differentiators (free improvements from migration):**
- True streaming chat (Flutter uses non-streaming JSON; AI SDK streams by default)
- Server-side API key (fixes security vulnerability in Flutter's client-side key exposure)
- Automatic image optimization via `next/image` (WebP, lazy loading, responsive srcset)
- Faster initial page load (SSR/SSG serves HTML immediately vs Flutter's WASM runtime)
- Reduced codebase (8 duplicate mobile files eliminated by Tailwind responsive utilities)

**Do not build (anti-features):**
- Fog effect (commented out in Flutter, not active on live site)
- Click counter analytics (debug code)
- Hero shared element animation (negligible visual impact)
- Separate mobile component files (use responsive Tailwind instead)
- 3D barrel effect on role carousel (barely perceptible at `perspective: 0.003`)

### Architecture Approach

The architecture uses a strict server/client component boundary at the page level. Page files in `app/` are minimal server components that export metadata and delegate to client content components. This is an interactive portfolio -- most leaf components need `"use client"` for canvas, animations, click handlers, and theme hooks. The key architectural decisions are: (1) a shared `useCanvas` hook that encapsulates `requestAnimationFrame` loop setup, high-DPI scaling, resize handling, and cleanup, (2) a `TransitionProvider` context that manages circular reveal clip-path animation state and coordinates with `TransitionLink` components in the navbar, (3) animation state stored exclusively in `useRef` (never `useState`) to prevent React re-renders during 60fps loops, and (4) the chat API proxied through `app/api/chat/route.ts` to keep the xAI key server-side.

**Major components by layer:**
1. **App Shell** (Layer 6) -- `layout.tsx` (ThemeProvider, fonts, metadata), `template.tsx` (transition wrapper), page routes
2. **Page Content** (Layer 5) -- `HomeContent`, `PortfolioContent`, `AboutContent`, `ChatContent` -- compose all child components per page
3. **Composition** (Layer 4) -- `Navbar`, `MobileNavbar` -- compose transition links, portfolio button, social icons, theme toggle
4. **Transition System** (Layer 3) -- `TransitionProvider` (context + clip-path overlay), `TransitionLink` (click position capture)
5. **Leaf Components** (Layer 2) -- `ParticleBackground`, `SnowfallEffect`, `DotMatrix`, `Spotlight`, `RotatingCircularText`, `ThemeToggle`, `PortfolioButton`
6. **Hooks** (Layer 1) -- `useCanvas` (canvas + rAF), `useResponsive` (viewport detection)
7. **Foundation** (Layer 0) -- TypeScript types, data files (projects, experience), `cn()` utility

### Critical Pitfalls

1. **Canvas memory leaks from requestAnimationFrame** -- Store the frame ID in a `useRef` and cancel via `cancelAnimationFrame(frameRef.current)` in the cleanup function. Closure-captured frame IDs go stale. With 3-4 simultaneous canvas animations, leaked loops accumulate rapidly on navigation.

2. **Circular reveal breaks with App Router** -- Next.js unmounts the outgoing page immediately on navigation. Exit animations via Framer Motion's `AnimatePresence` silently fail. Use a CSS `clip-path: circle()` overlay managed by a custom `TransitionProvider` that intercepts navigation, runs the animation, then triggers `router.push`. Alternatively, use the experimental View Transitions API (`experimental.viewTransition: true`).

3. **AWS Amplify environment variables invisible to Lambda runtime** -- Variables set in Amplify Console are available at build time but NOT at runtime for API routes. Must inject via `amplify.yml`: `echo "XAI_API_KEY=$XAI_API_KEY" >> .env.production` in the build phase. Without this, the chat feature silently fails in production while working perfectly in local dev.

4. **Theme hydration flash** -- Server cannot read `localStorage` or `prefers-color-scheme`. Use `next-themes` with a blocking `<script>` that sets the theme class before first paint. Components using `useTheme()` need a `mounted` state guard to avoid hydration mismatch.

5. **Canvas blur effects destroy performance** -- `ctx.filter = 'blur()'` is software-rendered and recalculated every frame. Pre-render blurred shapes to an offscreen canvas once, then stamp via `drawImage()` each frame. For snowfall blur layers, consider CSS `filter: blur()` on separate canvas elements.

## Implications for Roadmap

Based on combined research across all four files, here is the recommended phase structure with rationale.

### Phase 1: Foundation and App Shell
**Rationale:** Every component depends on theme colors and responsive layout. These must be correct before any visual work begins. A skeleton Amplify deployment should also be validated here to catch deployment pitfalls early.
**Delivers:** Bootable app with working theme toggle, responsive breakpoint, font loading, Tailwind configuration, and placeholder pages for all 4 routes.
**Features addressed:** Theme system (#8), responsive layout (#11), font loading
**Pitfalls to avoid:** Theme hydration flash (Pitfall 4 -- next-themes with blocking script), responsive hydration mismatch (Pitfall 7 -- CSS media queries first, not JS), Google Fonts FOUT (Pitfall 13 -- next/font/google), hardcoded pixel values (Pitfall 12 -- design token system in Tailwind config)
**Stack elements:** Next.js 15.5.x, React 19, Tailwind CSS 4.2.x, next-themes 0.4.x, next/font/google

### Phase 2: Navigation and Basic Routing
**Rationale:** Navigation is the skeleton that connects all pages. Standard Next.js `<Link>` navigation is sufficient here -- circular reveal transitions are added later. The navbar is a composition component that depends on foundational theme and responsive systems.
**Delivers:** Desktop and mobile navbars with working links between all 4 pages, social icons, portfolio button (static -- animated glow added in polish phase).
**Features addressed:** Navigation bar (#12), page routing
**Pitfalls to avoid:** Premature transition system (build standard routing first, enhance later)
**Stack elements:** react-icons 5.6.x

### Phase 3: Canvas Animation Engine
**Rationale:** The home page's visual identity is defined by its background effects. Canvas architecture decisions (single vs multiple canvas, blur strategy, particle count scaling) must be validated here because they are painful to change later. This phase proves the `useCanvas` hook pattern that all subsequent canvas components will follow.
**Delivers:** Particle background, snowfall effect, and dot matrix as reusable canvas components layered on the home page.
**Features addressed:** Particle background (#1), snowfall effect (#2), dot matrix (#5)
**Pitfalls to avoid:** Canvas memory leaks (Pitfall 1 -- useRef for frame IDs), useState for animation state (Pitfall 6 -- useRef only), canvas blur performance (Pitfall 9 -- pre-render to offscreen canvas), multiple canvases on mobile (Pitfall 8 -- consider single canvas loop, reduce particle counts on mobile, pause on tab hidden)
**Stack elements:** Native HTML5 Canvas API, custom useCanvas hook
**RESEARCH FLAG:** This phase needs deeper investigation during planning. Canvas blur performance on mobile, single vs multiple canvas strategy, and particle count scaling all require real-device benchmarking. The Flutter version runs 220+ animated particles simultaneously with blur -- this needs careful optimization.

### Phase 4: Home Page Assembly
**Rationale:** With canvas backgrounds in place, the remaining home page elements can be composed. These are CSS/SVG/DOM animations, not canvas, so they layer cleanly on top. The spotlight effect and rotating text define the visual identity alongside the canvas backgrounds.
**Delivers:** Complete home page with all visual elements: rotating circular text, spotlight cursor effect, scrolling role text carousel, click-here prompt.
**Features addressed:** Rotating circular text (#4), spotlight effect (#6), scrolling role text (#9)
**Pitfalls to avoid:** Spotlight lerp using useState instead of refs (store positions in refs for rAF loop)
**Stack elements:** SVG + CSS animations, requestAnimationFrame for spotlight interpolation

### Phase 5: Content Pages
**Rationale:** Portfolio and About pages are content-focused with simpler interactions. The portfolio masonry grid is the main implementation challenge. Building these after the home page validates the full component architecture with less complexity.
**Delivers:** Portfolio page with staggered project grid (20+ projects, images via next/image, shuffle logic), About page with bio/experience/education sections.
**Features addressed:** Staggered masonry grid (#13), about page (#14)
**Pitfalls to avoid:** CSS masonry spec (experimental, poor cross-browser support -- use CSS columns with `break-inside: avoid`)
**Stack elements:** next/image (built-in), CSS Grid/Columns

### Phase 6: Chat Integration
**Rationale:** The chat system is functionally independent of all other pages. It introduces the only backend integration (API Route Handler). Building it after content pages means the app is visually complete and this phase adds the last major feature.
**Delivers:** Working AI chat with streaming responses, server-side API key, glassmorphism UI, message history, sanitized output.
**Features addressed:** AI chat with streaming (#10)
**Pitfalls to avoid:** API key exposure (Pitfall 4 from ARCHITECTURE -- no NEXT_PUBLIC_ prefix), Amplify env var invisibility (Pitfall 3 -- test with deployed API route early), Lambda timeout (Pitfall 14 -- streaming solves this)
**Stack elements:** Vercel AI SDK 6.x, @ai-sdk/xai 3.x

### Phase 7: Page Transitions
**Rationale:** Circular reveal transitions are a cross-cutting concern that modifies navigation behavior app-wide. All pages must exist and work with standard routing before wrapping them in transition animations. Debugging page content is significantly harder with animations running during development. This is the highest-complexity single feature.
**Delivers:** Circular reveal transition on all inter-page navigation, originating from click position.
**Features addressed:** Circular reveal page transition (#3)
**Pitfalls to avoid:** App Router exit animation failure (Pitfall 2 -- use overlay approach, not AnimatePresence), FrozenRouter hacks (rely on unexposed internals, will break on updates)
**Stack elements:** GSAP 3.14.x for clip-path animation, CSS clip-path, custom TransitionProvider/TransitionLink
**RESEARCH FLAG:** This phase needs deeper investigation during planning. View Transitions API browser support (no Firefox as of research date, Safari 18+ only), GSAP clip-path behavior with App Router navigation, back button handling, and mobile Safari edge cases.

### Phase 8: Visual Polish and Deployment
**Rationale:** Final polish effects and production deployment. The animated gradient button, theme toggle animation, and visual fidelity audit against the Flutter version happen here. AWS Amplify deployment configuration is validated (env vars, SSR detection, Node.js runtime).
**Delivers:** Production-ready deployment on AWS Amplify with all visual polish effects.
**Features addressed:** Animated gradient button (#7), theme toggle animation (#15), visual fidelity audit
**Pitfalls to avoid:** Amplify SSR detection failure (Pitfall 5 -- baseDirectory: .next, files: '**/*'), Amplify env var injection (Pitfall 3 -- amplify.yml with echo step), Amplify deploying as static instead of SSR (do NOT set output: 'export')
**Stack elements:** AWS Amplify Gen 2

### Phase Ordering Rationale

- **Foundation before everything:** Theme colors and responsive breakpoints propagate to every component. Getting these wrong means reworking every component that uses `dark:` classes or responsive utilities.
- **Canvas before content:** The home page's visual character is defined by its animated backgrounds. Building text content over a blank white page makes visual fidelity comparison with the Flutter version impossible. Canvas architecture decisions (blur strategy, single vs multi canvas) are painful to change later.
- **Home before other pages:** The home page is the most complex page with 5+ layered effects. Getting it right validates the entire animation architecture. If canvas performance is unacceptable, the team finds out during Phase 3-4, not Phase 8.
- **Chat in isolation:** The chat system has zero dependencies on other pages and introduces the only backend integration. Building it independently reduces risk.
- **Transitions near-last:** All pages must exist and function before adding cross-cutting animation. Debugging pages with transition animations running is significantly harder.
- **Skeleton deploy in Phase 1:** Although full deployment is Phase 8, a skeleton deploy to Amplify should happen during Phase 1 to validate SSR detection, Node.js runtime, and basic configuration. This catches Pitfalls 3 and 5 early.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Canvas Animation Engine):** Canvas blur performance on mobile is the biggest technical uncertainty. Single vs multiple canvas strategy, particle count scaling, and `OffscreenCanvas` with Web Workers need benchmarking on real devices. The Flutter version runs 220+ particles with per-particle blur -- naive Canvas 2D translation will not perform.
- **Phase 7 (Page Transitions):** View Transitions API browser support is evolving. GSAP clip-path with App Router navigation needs prototyping. Back button handling and mobile Safari edge cases are not well-documented.
- **Phase 8 (Deployment):** Amplify env var injection and SSR detection must be validated early (skeleton deploy in Phase 1). The chat API Lambda timeout requires streaming to work correctly.

Phases with standard, well-documented patterns (skip research-phase):
- **Phase 1 (Foundation):** next-themes, Tailwind v4 dark mode, next/font -- all thoroughly documented.
- **Phase 2 (Navigation):** Standard Next.js App Router links and flexbox layout.
- **Phase 4 (Home Page Assembly):** SVG textPath and CSS animations are well-established patterns.
- **Phase 5 (Content Pages):** CSS columns masonry and next/image -- standard patterns.
- **Phase 6 (Chat Integration):** Vercel AI SDK has official xAI provider docs and a complete chatbot template.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (Core: Next.js, React, Tailwind) | HIGH | All versions verified via npm and official docs. Amplify v15 constraint confirmed via AWS docs and GitHub issue. |
| Stack (Animation: GSAP, Canvas) | HIGH | GSAP version verified, free license confirmed (Webflow acquisition April 2025). Canvas API is a web standard. |
| Stack (AI: Vercel AI SDK, xAI) | HIGH | Actively maintained (last published days before research). Official xAI provider with streaming support documented. |
| Features | HIGH | Direct 1:1 mapping from existing Flutter source code analysis. No ambiguity about what to build -- the target is the existing app. |
| Architecture | HIGH | Next.js App Router patterns are well-documented. Server/client boundaries are clear for this type of interactive portfolio. |
| Canvas Performance | MEDIUM | Architecture is sound, but mobile performance with 3+ simultaneous canvases running blur effects needs real-device testing. Pre-render strategy is proven but adds implementation complexity. |
| Page Transitions | MEDIUM | GSAP clip-path approach is proven in isolation. App Router integration has known friction points (Discussion #42658, Motion issue #2411). View Transitions API is experimental. |
| AWS Amplify Deployment | MEDIUM | Documentation is clear, but env var injection and SSR detection pitfalls are confirmed by multiple community reports. Needs early validation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Canvas performance benchmarking:** Single canvas vs multiple canvas on mobile devices. Need real-device testing during Phase 3. The decision between consolidating all effects into one canvas loop vs separate canvases affects component architecture.
- **View Transitions API browser support:** Experimental in Next.js 15. No Firefox support, Safari 18+ only. May need a pure GSAP/CSS fallback. Evaluate during Phase 7 planning.
- **Amplify Lambda timeout for streaming:** Default 10-second Lambda timeout may interfere with long xAI streaming responses. Validate with a test route during Phase 6 deployment.
- **Tailwind v4 dark mode + next-themes integration:** Tailwind v4 uses CSS-first configuration (no `tailwind.config.js` by default). The `darkMode: 'selector'` configuration path differs from v3. Verify during Phase 1 that `@variant dark` works correctly with next-themes class toggling.
- **Staggered grid visual fidelity:** CSS columns vs JavaScript-calculated masonry produce subtly different layouts from Flutter's `StaggeredGridView`. Compare visual output during Phase 5.
- **GSAP in React Server Components:** GSAP is client-only. Ensure all GSAP usage is confined to `"use client"` components. The `@gsap/react` `useGSAP` hook handles this, but layout-level GSAP would break SSR.

## Sources

### Primary (HIGH confidence)
- [Next.js 15 Official Docs](https://nextjs.org/docs/app/guides/upgrading/version-15) -- App Router, server/client components, metadata
- [AWS Amplify Next.js Support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html) -- confirms v12-15 only
- [AWS Amplify Next.js 16 Issue](https://github.com/aws-amplify/amplify-js/issues/14600) -- no timeline for v16 support
- [AWS Amplify SSR Environment Variables](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html) -- confirms env var Lambda problem
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) -- useChat, streamText, provider architecture
- [AI SDK xAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai) -- grok-3-mini through grok-4 support
- [GSAP npm](https://www.npmjs.com/package/gsap) -- v3.14.2, free license
- [Tailwind CSS v4 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config, performance
- [next-themes](https://github.com/pacocoursey/next-themes) -- v0.4.6, dark mode patterns
- [Next.js viewTransition Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) -- experimental flag
- Flutter codebase analysis -- all `lib/*.dart` files for 1:1 feature mapping

### Secondary (MEDIUM confidence)
- [Next.js App Router Transition Discussion #42658](https://github.com/vercel/next.js/discussions/42658) -- confirms exit animation limitation
- [Framer Motion exit animation issue #2411](https://github.com/framer/motion/issues/2411) -- confirms AnimatePresence broken with App Router
- [Frontend Memory Leaks: 500-Repository Study](https://stackinsight.dev/blog/memory-leak-empirical-study/) -- rAF leak severity data
- [Amplify Hosting Issue #3838](https://github.com/aws-amplify/amplify-hosting/issues/3838) -- deployment shows nothing
- [next-transition-router](https://github.com/ismamz/next-transition-router) -- community library for App Router transitions
- [CSS clip-path animation (CSS-Tricks)](https://css-tricks.com/animating-with-clip-path/)
- [The Magic of Clip Path (Emil Kowalski)](https://emilkowal.ski/ui/the-magic-of-clip-path)

### Tertiary (needs validation during implementation)
- CSS `masonry` layout spec -- experimental, cross-browser support uncertain
- `OffscreenCanvas` with Web Worker for particle calculations -- performance benefit unverified for this use case
- `@property` CSS custom property animation for gradient button -- browser support adequate but not tested with Tailwind v4

---

*Research completed: 2026-04-02*
*Ready for roadmap: yes*
