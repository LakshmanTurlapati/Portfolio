# Feature Landscape

**Domain:** Flutter-to-Next.js Portfolio Migration
**Researched:** 2026-04-02
**Confidence:** HIGH (based on Flutter source code analysis + current web ecosystem research)

## Table Stakes

Features that must exist for 1:1 parity. Missing any of these means the migration is incomplete.

### 1. Canvas-Based Particle Background (Floating Circles)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `AnimatedCircleBackground` using `CustomPaint` + `FloatingCirclePainter`. 7 circles with radial gradients (`RadialGradient` with 3 stops), `MaskFilter.blur` for soft edges, random velocities, boundary-wrapping logic. Driven by `AnimationController` repeating over 60 seconds. Positions update per frame via `_updateCirclePositions()`. |
| Next.js Approach | **HTML5 Canvas with `useRef` + `requestAnimationFrame`**. Create a `<canvas>` element, get 2D context via ref, run an animation loop. Each circle: `ctx.createRadialGradient()` with 3 color stops matching the gray-to-transparent gradient, `ctx.arc()` + `ctx.fill()` for drawing. The `MaskFilter.blur` maps to `ctx.filter = 'blur(Npx)'` or `ctx.shadowBlur`. Boundary wrapping and velocity logic translates directly from Dart to TypeScript. |
| Migration Complexity | **Medium**. Direct translation -- Flutter's `canvas.drawCircle()` maps 1:1 to `ctx.arc()` + `ctx.fill()`. Radial gradients exist natively in Canvas 2D. The main work is setting up the animation loop with proper cleanup (`cancelAnimationFrame` on unmount). |
| Key Considerations | Must be a client component (`'use client'`). Use `ResizeObserver` for responsive canvas sizing. Initialize circle positions relative to actual canvas dimensions (Flutter hardcodes 500x800 initial range). Store particle state in refs, not React state, to avoid re-renders during animation. |
| Dependencies | None -- pure Canvas API. |

### 2. Snowfall Effect (Multi-Layer, Mouse-Interactive)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `SnowfallEffect` wrapping `SnowfallBackground` with 3 `SnowfallLayer` instances. Back layer: 50 particles, speed 0.5-1.0, size 2-4px, blur 2.0. Middle: 70 particles, speed 0.5-1.5, size 0.5-3px, blur 0.1. Front: 100 particles, speed 2-3, size 1-2px, blur 1.0. Mouse X position drives horizontal drift via `MouseRegion.onHover` (normalized to -1..1 range). Colors invert with theme: black snow in dark mode, white in light mode. Each `SnowfallLayer` uses its own `AnimationController` at ~60fps (16ms duration). |
| Next.js Approach | **Custom Canvas component** with 3 rendering passes in a single `requestAnimationFrame` loop. Track mouse position via `onMouseMove` on a wrapper div, normalize to -1..1. For each layer, iterate particles: update Y by speed/1000, update X by drift + (driftFactor * 0.001), wrap horizontally and vertically. Draw as circles with `ctx.arc()`. Layer-specific blur: set `ctx.filter = 'blur(Npx)'` before each layer's draw pass and reset after. |
| Migration Complexity | **Medium**. 220 total particles is easily handled by Canvas. The 3-layer blur system is the nuance -- `ctx.filter` per layer works but resets between layers. Per-particle blur (as Flutter does via `MaskFilter`) can use `ctx.shadowBlur` + `ctx.shadowColor` as an alternative. Mouse interactivity is a simple `mousemove` handler. |
| Key Considerations | Inverted colors for dark/light mode (matches Flutter: black snow in dark mode, white in light mode with varying opacities per layer). The `react-snowfall` library could work but lacks the multi-layer depth system and mouse drift -- custom is safer for 1:1 parity. |
| Dependencies | None if custom. Optional: `react-snowfall` (~3KB) if customization needs are relaxed. |

### 3. Circular Reveal Page Transition

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `CircularRevealPageRoute<T>` extends `PageRouteBuilder`. Uses `ClipPath` with `_CircularRevealClipper` creating an oval path via `Path()..addOval(Rect.fromCircle())`. Animation 0->1 expands radius from `startRadius` (0) to `maxRadius` (pythagorean: `sqrt(maxX^2 + maxY^2)` from click offset). Duration: 500ms in and out. Click position captured via `GlobalKey` + `findRenderObject()` + `localToGlobal()`. Falls back to standard `MaterialPageRoute` if position unavailable. |
| Next.js Approach | **CSS `clip-path: circle()` with animated transitions**. On nav trigger: (1) Capture click coordinates via `getBoundingClientRect()` on button ref, (2) Render incoming page in an overlay `<div>` with `clip-path: circle(0px at Xpx Ypx)`, (3) Animate to `clip-path: circle(150vmax at Xpx Ypx)` over 500ms using CSS `transition: clip-path 500ms ease-in-out`, (4) After animation completes, update the route and remove overlay. For Next.js App Router, implement as a layout-level `TransitionProvider` that wraps page content and manages the overlay state. |
| Migration Complexity | **High**. This is the hardest feature. Next.js App Router unmounts the current page on navigation, making exit animations difficult. Solutions ranked by fidelity: (A) **Custom transition wrapper** -- most control, manually manages old/new page DOM (recommended), (B) **`next-transition-router`** -- library approach, handles exit animations in App Router, (C) **View Transitions API** (`experimental.viewTransition: true`) -- native but limited browser support (no Firefox, Safari 18+ only) and still experimental as of March 2026. Approach (A) is recommended for pixel-perfect control. The reverse animation (back navigation) adds another layer of complexity. |
| Key Considerations | The click origin must propagate from button press to the transition system (context or callback). `clip-path` circle animation is GPU-accelerated in Chrome, Edge, Safari. `150vmax` ensures the circle covers any screen size. The fallback to standard navigation (matching Flutter's `MaterialPageRoute` fallback) should be built in. |
| Dependencies | Custom implementation recommended. Optional: `next-transition-router`. |

### 4. Rotating Circular Text Animation

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `RotatingCircularText` with `_CircularTextPainter` using `PictureRecorder` for cached rendering. Characters are individually measured with `TextPainter`, then positioned around a circle using trigonometry (`cos`/`sin`). Text pairs (e.g., "Click Here" + bullet) repeat `numberOfPairs` times with even spacing. `Transform.rotate` driven by `AnimationController.repeat()` (default 10s). `RepaintBoundary` optimizes render. Two instances exist: `rotating_circular_text.dart` (with `startDelay` parameter) and `click_here.dart` (without delay, simpler variant). |
| Next.js Approach | **SVG `<textPath>` with CSS rotation**. Create an SVG with a circular `<path>` (arc commands: `M cx-r,cy a r,r 0 1,0 2r,0 a r,r 0 1,0 -2r,0`). Place text in `<textPath>` linking to the path. Repeat the text+bullet pairs along the path. Apply CSS `animation: rotate 10s linear infinite` where `@keyframes rotate { to { transform: rotate(360deg) } }`. For the `startDelay` variant, use `animation-delay`. SVG handles font measurement and circular positioning natively, eliminating all the manual trigonometry. |
| Migration Complexity | **Medium-Low**. SVG `textPath` is the natural web equivalent and is dramatically simpler than the Flutter Canvas approach. The character-by-character positioning from Flutter is unnecessary because SVG handles text-on-path natively. The rotation is pure CSS. |
| Key Considerations | The Flutter version uses `PictureRecorder` caching -- SVG doesn't need this because the browser's compositor handles it. Ensure the SVG `viewBox` matches `radius * 2` dimensions. For theme support, set SVG `fill` color via CSS custom properties or Tailwind classes. |
| Dependencies | None -- pure SVG + CSS. |

### 5. Dot Matrix Pattern (Interactive Grid)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `DotMatrixPattern`: 7 rows x 48 columns grid of `AnimatedContainer` widgets. Each cell gets a random intensity (0-1) on init for `Color.lerp` between two gray values. `MouseRegion` per cell detects hover, expanding dot size by 3px via `AnimatedContainer(duration: 300ms)`. Click opens LeetCode URL. Dark mode: lerps `#B0B0B0` to `#1A1A1A`. Light mode: lerps `grey[300]` to `grey[800]`. `BoxShape.rectangle` with rounded corners. |
| Next.js Approach | **CSS Grid with hover transitions**. Render `<div>` grid with `display: grid; grid-template-columns: repeat(48, auto)`. Each cell is a `<div>` with `width/height: 14px` (or `dotSize`), random `backgroundColor` generated once via `useMemo` + `Math.random()`, `border-radius: 20%`, `transition: transform 300ms, width 300ms, height 300ms`. On `:hover`, apply `transform: scale(1.2)` or increase width/height by 3px. Click handler: `window.open(url, '_blank')`. Dark/light colors via Tailwind `dark:` classes or inline style calculation. |
| Migration Complexity | **Low**. This is one of the simplest migrations. Flutter's individual `MouseRegion` + `AnimatedContainer` per cell maps directly to CSS `:hover` + `transition`. No Canvas needed. 336 DOM elements is trivial for browsers. |
| Key Considerations | Generate random intensities with `useMemo` to prevent regeneration on re-render. The color lerp (`Color.lerp` in Flutter) maps to a simple linear interpolation between RGB values or `color-mix()` in CSS. The `cursor: pointer` style replaces Flutter's `SystemMouseCursors.click`. |
| Dependencies | None. |

### 6. Spotlight Effect (Cursor Follow with Smooth Interpolation)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `SpotlightEffect` tracks mouse via `MouseRegion.onHover` (stores target position). Smooth interpolation: `Timer.periodic(20ms)` runs `Offset.lerp(_current, _target, 0.2)`. `SpotlightPainter` draws `RadialGradient` circle (radius 275px) at interpolated cursor position. Gradient: `rgba(0,0,0,0.09)` center to transparent edge (dark mode) or `rgba(255,255,255,0.1)` (light mode). `MaskFilter.blur(100)` for soft edge. `IgnorePointer` prevents blocking child interactions. Clears on mouse exit. |
| Next.js Approach | **CSS radial gradient overlay with smooth tracking**. Overlay `<div>` with `position: absolute; inset: 0; pointer-events: none`. Track mouse via `onMouseMove` on parent. For smooth interpolation: use `requestAnimationFrame` loop that lerps current position toward target at 0.2 factor (matching Flutter). Set `background: radial-gradient(circle 275px at ${x}px ${y}px, rgba(0,0,0,0.09), transparent)` via inline style. Add `filter: blur(100px)` for the soft edge. On mouse leave, clear the gradient. |
| Migration Complexity | **Low-Medium**. The radial gradient overlay is trivial. The smooth lerp (0.2 factor) needs a `requestAnimationFrame` loop with refs for current/target position -- about 15 lines of code. The blur filter is one CSS property. |
| Key Considerations | `pointer-events: none` is critical (matches Flutter's `IgnorePointer`). Store positions in refs (not state) to avoid re-renders during the animation loop. Theme-dependent gradient color switches between dark and light. |
| Dependencies | None. |

### 7. Animated Gradient Button (Portfolio Button)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `AnimatedGradientButton` with `AnimationController` (3s repeat). Three `BoxShadow` instances with colors `#002BFF` (blue), `#00FFCC` (cyan), `#FF4AD5` (magenta) orbit the button in circular motion at 120-degree offsets. Each shadow: opacity 0.4, blurRadius 18, spreadRadius 1. Shadow offset computed as `(radius * cos(t + phase), radius * sin(t + phase))` where radius=4px. Inner button is theme-colored with rounded corners. |
| Next.js Approach | **CSS `@keyframes` with animated pseudo-element**. Use a `::before` pseudo-element containing a rotating `conic-gradient(from var(--angle), #002BFF, #00FFCC, #FF4AD5, #002BFF)` with `filter: blur(18px)`. Animate `--angle` from 0 to 360deg over 3 seconds using `@property --angle { syntax: '<angle>'; inherits: false; initial-value: 0deg; }` and `@keyframes spin { to { --angle: 360deg } }`. The inner button sits on top with slightly inset dimensions. Alternatively, use 3 separate shadow layers animated with CSS transforms at 120-degree offsets matching the Flutter orbiting pattern. |
| Migration Complexity | **Low-Medium**. CSS `@property` for animated gradients is supported in Chrome/Edge/Safari. The `conic-gradient` approach is simpler than replicating 3 separate orbiting shadows but produces a slightly different visual. For exact parity, use JS-driven shadow animation with `requestAnimationFrame`. |
| Key Considerations | The 3-color orbiting glow is the portfolio's signature button effect. The `@property` + `conic-gradient` approach gives the closest visual match with pure CSS. Inner button background switches with theme. |
| Dependencies | None for CSS. Optional: `motion` for JS-driven orbit. |

### 8. Dark/Light Theme with System Detection

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `_MyAppState` manages `isDarkMode` boolean. `didChangePlatformBrightness()` callback detects system theme changes in real-time. `toggleTheme()` manually switches. Theme passed via constructor params to all children. Updates `<meta name="theme-color">` for Safari toolbar. No persistence -- runtime only (resets on page refresh). |
| Next.js Approach | **`next-themes` library** -- the established standard. Configuration: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>`. Use `useTheme()` hook in components. Tailwind CSS `dark:` variant handles all styling. `next-themes` automatically handles SSR flash prevention, `prefers-color-scheme` detection, and meta theme-color updates. To match Flutter's no-persistence behavior, set `storageKey` to a non-standard key or accept the small improvement of persisting user preference (better UX). |
| Migration Complexity | **Low**. `next-themes` is a 2-line setup and handles all complexity. The Flutter pattern of passing `isDarkMode` + `toggleTheme` as props to every widget is replaced by React context (`useTheme()` available anywhere). This is a significant simplification. |
| Key Considerations | Tailwind `dark:` classes replace all manual color conditionals (`widget.isDarkMode ? Colors.white : Colors.black`). Every Flutter color conditional becomes a single Tailwind utility: `text-black dark:text-white`. Configure Tailwind dark mode: `darkMode: 'class'` in `tailwind.config.ts`. |
| Dependencies | `next-themes` (~2KB). |

### 9. Scrolling Role Text Animation (Word Carousel)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `ScrollingText` uses `ListWheelScrollView` with `FixedExtentScrollPhysics` and `ListWheelChildLoopingListDelegate`. Creates a 3D barrel-roll text carousel. `Timer.periodic(1s)` auto-advances. `itemExtent: 30`, `perspective: 0.003`. `ShaderMask` with `LinearGradient` (transparent -> black -> transparent) creates fade at top/bottom. Roles: UI/UX Designer, Product Developer, Software Developer, Full-Stack Developer, Cloud Developer, AI Developer. Static text: "I'm an enthused [ROLE] from Texas!" |
| Next.js Approach | **CSS vertical text carousel with mask**. Container with `overflow: hidden` and fixed height (~150px). Inner div contains stacked role texts. Use `setInterval(1000)` to update index, animate `transform: translateY(-${index * itemHeight}px)` with `transition: transform 500ms ease-in-out`. Apply CSS `mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)` for the fade. For the 3D barrel effect, optionally add `perspective` + `rotateX` transforms to visible items. |
| Migration Complexity | **Low-Medium**. The basic vertical text carousel is straightforward. The Flutter `ListWheelScrollView` 3D perspective (`perspective: 0.003`) creates a subtle curved barrel effect that requires CSS `perspective` + per-item `rotateX` transforms to replicate precisely. For practical purposes, a flat vertical slide with fade mask is likely visually close enough. |
| Key Considerations | The 3D barrel look from Flutter is very subtle at `perspective: 0.003`. A flat vertical carousel with fade mask will be visually acceptable unless pixel-perfect barrel curvature is required. Use `useEffect` with `setInterval` and proper cleanup for the auto-advance timer. |
| Dependencies | None. |

### 10. AI Chat with Streaming Responses

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `ChatApiService` with static `generateResponse()` method. Sends HTTP POST to `https://api.x.ai/v1/chat/completions` using `grok-3-mini` model. API key imported from `env.dart` (exposed in client). Non-streaming JSON response. Conversation history: last 20 messages included. Massive system prompt with embedded JSON data store defining the "Parz" AI persona. Custom `sanitizeText()` strips emojis and special Unicode. `flutter_linkify` detects URLs in responses. `ChatMessage` data class with `isUser`, `text` fields. Friendly random error messages on failure. |
| Next.js Approach | **Vercel AI SDK (`ai` + `@ai-sdk/xai`)**. Route handler at `app/api/chat/route.ts` using `streamText()` with `xai('grok-3-mini')` model. The system prompt string (including the full JSON data store) goes in the route handler. Frontend uses `useChat()` hook which provides `messages`, `input`, `handleInputChange`, `handleSubmit`, `isLoading`, and automatic streaming display. API key via `process.env.XAI_API_KEY` (server-only). `sanitizeText()` reimplemented in TypeScript. Link detection via regex or `react-linkify-it`. |
| Migration Complexity | **Medium**. The AI SDK dramatically simplifies the implementation. Key work items: (A) Port the ~200-line system prompt string to the route handler, (B) Reimplement `sanitizeText()` in TypeScript (the regex is portable), (C) Build the chat UI (message list, input field, loading indicator, glassmorphism styling from Flutter), (D) Handle the error messages pattern. The AI SDK handles conversation history, streaming, and message state automatically -- eliminating ~100 lines of Flutter code. |
| Key Considerations | The Flutter version currently does NOT stream (despite xAI supporting it). The Next.js version with AI SDK will stream by default -- this is an improvement over Flutter. The system prompt contains personal data that should not be exposed to the client. The `@ai-sdk/xai` provider supports `grok-3-mini`, `grok-3`, `grok-4`, and newer models. The Flutter chat UI has a glassmorphism backdrop (`ImageFilter.blur`) that maps to CSS `backdrop-filter: blur()`. |
| Dependencies | `ai` (Vercel AI SDK), `@ai-sdk/xai` (xAI provider). |

### 11. Responsive Layout System (600px Breakpoint)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | Root `LayoutBuilder` in `main.dart` checks `constraints.maxWidth < 600`. Renders entirely different widget trees: `DesktopHome` vs `MobileHome`. Eight separate mobile files: `mobile.dart`, `mobile_portfolio.dart`, `mobile_about_page.dart`, `chat_mobile.dart`, `mobile_navbar.dart`, `mobile_home_text.dart`, `mobile_dot_matrix.dart`, `mobile_portfolio_button.dart`. |
| Next.js Approach | **Tailwind CSS responsive utilities with consolidated components**. Configure custom breakpoint in `tailwind.config.ts`: `screens: { 'dt': '600px' }` (or override `sm` to 600px). Use `dt:` prefix for desktop styles. Most mobile/desktop differences handled purely with Tailwind: `flex-col dt:flex-row`, `hidden dt:block`, etc. Only create separate components where layouts are fundamentally incompatible (navbar). This consolidates 8 mobile files into responsive variants of 4 main components. |
| Migration Complexity | **Low**. Tailwind's responsive utilities are far more powerful than Flutter's binary `LayoutBuilder` switch. The main decision is the breakpoint value. Eliminating 8 duplicate mobile files is a major DX improvement. For components needing runtime JS detection (e.g., conditional rendering in effects), use `window.matchMedia('(min-width: 600px)')` via a custom `useMediaQuery` hook. |
| Key Considerations | The 600px breakpoint is non-standard (Tailwind default `sm` is 640px). Must be explicitly configured. Server-side rendering cannot detect viewport width -- use `defaultValue` for the hook and let client hydration correct it. Consider a brief layout shift mitigation strategy (CSS-only responsive first, JS-enhanced second). |
| Dependencies | Tailwind CSS (already in stack). |

### 12. Navigation Bar (Desktop + Mobile Variants)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | Desktop `NavBar`: 630x60px rounded container, inverted bg color (white in dark mode, black in light mode at 0.8 opacity). Contains: animated gradient `PortfolioButton` (left), "About Me" text link (center), social icons -- GitHub, LinkedIn, X/Twitter via `font_awesome_flutter` (right). `GlobalKey` captures button position for circular reveal. Mobile `MobileNavBar`: different layout with compact design. Social links via `url_launcher`. |
| Next.js Approach | **Single responsive component with Tailwind**. Desktop: `flex` container, `max-w-[630px]`, `h-[60px]`, `rounded-3xl`, inverted theme background. Portfolio gradient button component, centered About link, right-aligned social icons using `react-icons` (includes FontAwesome set). Mobile: compact layout variant using responsive classes. Button refs for circular reveal position capture via `useRef` + `getBoundingClientRect()`. Social links as `<a href="..." target="_blank" rel="noopener noreferrer">`. |
| Migration Complexity | **Low-Medium**. The layout is standard flexbox. Key integrations: the animated gradient button (Feature #7), circular reveal trigger (Feature #3), and social icon library. The `Hero` animation tag on the portfolio button (shared element between pages) maps to View Transitions API named elements or can be simplified to a fade transition. |
| Key Considerations | `react-icons` includes `FaGithub`, `FaLinkedin`, `FaXTwitter` matching the Flutter `font_awesome_flutter` icons. The inverted background color (white in dark mode) is handled with `bg-white/80 dark:bg-black/80` in Tailwind -- note this is intentionally inverted from the typical dark-mode pattern. |
| Dependencies | `react-icons` for social icons. |

### 13. Staggered Masonry Grid (Portfolio Page)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | Uses `flutter_staggered_grid_view` with `MasonryGridView.count(crossAxisCount: 4)`. 20+ projects with images loaded from assets. Image aspect ratios loaded asynchronously, item heights calculated dynamically (`baseItemWidth / aspectRatio + containerPadding`, clamped 100-1050px). First 2 projects pinned (Software 3.0, Review Gate); rest shuffled on each page load. `ShaderMask` with `LinearGradient` creates fade at top/bottom (2%/98% stops). Page wrapped in `SnowfallEffect`. Scrolling uses `BouncingScrollPhysics`. |
| Next.js Approach | **CSS Columns or `masonic` library**. CSS approach: `columns: 4` with `break-inside: avoid` on items. Each item card contains `next/image` with dynamic sizing. For dynamic heights based on aspect ratio: use `next/image` with `fill` + `sizes` prop in a container with `aspect-ratio: auto` or calculated height. Alternatively, `masonic` library provides virtualized masonry with excellent performance for 20+ items. The fade mask: `mask-image: linear-gradient(to bottom, transparent, black 2%, black 98%, transparent)`. Pinned projects: simple array logic before render. Shuffle: `useMemo(() => shuffledArray, [])` to shuffle once on mount. |
| Migration Complexity | **Medium**. The core masonry layout is well-supported. The Flutter-specific complexity (async aspect ratio loading + dynamic height calculation) is simplified by Next.js `<Image>` which handles responsive sizing natively. The project card component (image, name, link icons overlay) needs custom styling. Image optimization via `next/image` is an upgrade over Flutter's asset loading. |
| Key Considerations | 20+ project images should use `next/image` for lazy loading, WebP conversion, and responsive srcset. Move images from Flutter `assets/` to Next.js `public/images/`. Project data becomes a TypeScript array constant. The "useIframe" flag on one project (X-Read) needs handling -- possibly an `<iframe>` embed or screenshot fallback. |
| Dependencies | `next/image` (built-in). Optional: `masonic` for virtualized masonry. |

### 14. About Page (Scrollable Sections)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | Scrollable page with bio section, experience timeline (work history with dates, roles, company details), and education section. Desktop and mobile variants in separate files (`about_page.dart`, `mobile_about_page.dart`). Standard text and layout widgets. |
| Next.js Approach | **Standard React page with Tailwind styling**. Structure bio, experience, and education as TypeScript data arrays. Render with `map()` and styled components. Scroll-based sections with optional `scroll-snap` or `IntersectionObserver` for active section highlighting. Responsive via Tailwind breakpoints. |
| Migration Complexity | **Low**. Standard content page with no complex animations. Mostly HTML structure + Tailwind classes. |
| Dependencies | None. |

### 15. Custom Theme Toggle (Sun/Moon Animated UI)

| Aspect | Detail |
|--------|--------|
| Flutter Implementation | `ThemeToggle` with `TickerProviderStateMixin` for two animation controllers. Sun: `SunCirclePainter` draws a circle + 8 rays with animated ray length (4px to 6px on hover, 300ms). Moon: rotating `nightlight_round` icon (size 24->26px on hover, -30deg rotation). `DashedLinePainter` draws vertical dashed separator. Hover triggers forward/reverse animations. |
| Next.js Approach | **SVG sun + CSS transitions + icon moon**. Sun: `<svg>` with `<circle>` (stroke, no fill) + 8 `<line>` rays. Animate ray length on hover using CSS `transition` on `x2`/`y2` attributes via CSS custom properties or `stroke-dashoffset`. Moon: icon (Lucide `Moon` or similar) with `transition: transform 300ms` for `rotate(-30deg)` and `scale(1.08)` on hover. Separator: `<div>` with `border-left: dashed 1px`. |
| Migration Complexity | **Low-Medium**. The sun painter is the main work -- translating `SunCirclePainter`'s circle + 8 directional rays to SVG elements. The hover animation (ray extension) needs CSS transitions on SVG attributes. |
| Key Considerations | SVG ray animation can use `stroke-dasharray` + `stroke-dashoffset` transitions, or simply animate the line endpoint positions. The dashed separator is trivial with CSS `border-style: dashed`. |
| Dependencies | None. |

## Differentiators

Features that could improve upon the Flutter version during migration. Not required for parity but achievable with minimal additional effort.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| True streaming chat | Flutter uses non-streaming JSON response. AI SDK enables real-time token-by-token streaming, making chat feel dramatically faster | Low (built into AI SDK) | Use `useChat()` with `streamText()` -- streaming is the default behavior |
| Server-side API key | Flutter exposes xAI API key in client-side minified JS. Next.js API route keeps it server-side | Zero (architectural) | `process.env.XAI_API_KEY` in route handler, never sent to browser |
| Automatic image optimization | Flutter loads raw PNGs/JPGs. `next/image` provides automatic WebP conversion, lazy loading, responsive srcset, blur placeholder | Zero (built-in) | Wrap project images in `<Image>` component |
| Faster initial page load | Flutter web loads a large WASM/JS runtime bundle. Next.js with SSR/SSG serves HTML immediately | Zero (architectural) | Static pages (About, Portfolio) can be fully SSG |
| Reduced codebase size | Flutter has 8 separate mobile files duplicating desktop logic. Tailwind responsive classes consolidate to single components | Negative (reduces work) | ~8 files eliminated, replaced by responsive utilities |

## Anti-Features

Features to explicitly NOT build in the migration.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Separate mobile component files | Flutter required 8+ duplicate files for mobile variants due to `LayoutBuilder` binary switch. Unnecessary in React/Tailwind | Use responsive Tailwind classes. Only split navbar where layouts are fundamentally different |
| Client-side API key exposure | Flutter's `env.dart` includes the xAI API key in minified client JS -- a security vulnerability | Use Next.js API route with `process.env.XAI_API_KEY` |
| Canvas-based fog effect | The `fog.dart` file is **entirely commented out** in the Flutter codebase. This feature is disabled and not active on the live site | Do not build. Skip entirely |
| Click counter analytics | `MobileHome._clickCount` tracks navigation clicks and prints to console. This is debug/development code | Do not port. If analytics are needed, use Vercel Analytics or similar |
| `ListWheelScrollView` 3D barrel | Flutter's 3D wheel perspective (`0.003`) on the role text creates a barely-perceptible curved effect | Use a flat vertical text carousel with fade mask. The 3D curve is not visibly impactful |
| `dart:html` / `dart:js` web interop | Flutter web-specific platform channel hacks | Use standard web APIs directly -- no interop layer needed |
| `Hero` animation on portfolio button | Shared element transition between navbar and portfolio page back button | Skip or simplify to View Transitions named element. The circular reveal already provides transition context |

## Feature Dependencies

Critical path -- features must be built in dependency order:

```
Theme System (next-themes + Tailwind dark:)
   |
   +--> ALL visual components depend on theme colors
   |
Responsive Layout System (Tailwind breakpoints + useMediaQuery)
   |
   +--> ALL pages depend on responsive structure
   |
Navigation Bar + Page Routing (Next.js App Router links)
   |
   +--> Circular Reveal Transition (enhances navigation, can be added after)
   |
Page Shell Components (layout, header, footer patterns)
   |
   +-- Home Page --> Particle Background, Snowfall, Rotating Text, Role Carousel, Dot Matrix, Spotlight
   |
   +-- Portfolio Page --> Masonry Grid + Project Cards + Image Loading
   |
   +-- About Page --> Bio + Experience + Education sections
   |
   +-- Chat Page --> AI SDK Route Handler + Chat UI + Streaming
```

## MVP Recommendation

### Phase 1 -- Foundation (build first):
1. **Theme system** (`next-themes` + Tailwind dark mode config) -- every component depends on this
2. **Responsive layout shell** -- page structure with 600px breakpoint, shared layout component
3. **Navigation bar** with basic page routing (standard Next.js links, no reveal yet)
4. **Home page text content** -- static text, role carousel

### Phase 2 -- Core Visual Identity (build second):
5. **Particle background** -- defines the site's visual character, proves canvas approach
6. **Snowfall effect** -- reuses the canvas pattern established by particles
7. **Rotating circular text** -- prominent home page SVG element
8. **Spotlight effect** -- cursor-following overlay

### Phase 3 -- Feature Pages (build third):
9. **Portfolio masonry grid** -- core content showcase with project cards and images
10. **About page** -- content page, lowest complexity
11. **Chat page with AI SDK** -- self-contained feature, most backend complexity

### Phase 4 -- Visual Polish (build last):
12. **Circular reveal page transitions** -- highest complexity animation, standard routing works as fallback during earlier phases
13. **Animated gradient button** -- polish effect for navbar
14. **Dot matrix pattern** -- decorative home page element
15. **Theme toggle animation** -- custom sun/moon SVG with hover effects

### Do Not Build:
- Fog effect (commented out, not active)
- Click counter (debug code)
- Hero shared element animation (negligible impact)

## Complexity Summary

| Complexity | Features | Count |
|------------|----------|-------|
| **High** | Circular reveal page transition | 1 |
| **Medium** | Particle background, Snowfall effect, AI chat integration, Staggered masonry grid, Rotating circular text | 5 |
| **Low-Medium** | Spotlight effect, Animated gradient button, Theme toggle animation, Scrolling role text, Navigation bar | 5 |
| **Low** | Dot matrix pattern, Dark/light theme system, Responsive layout, About page | 4 |

**Total estimated features: 15 (excluding anti-features)**
**High complexity: 1 | Medium: 5 | Low-Medium: 5 | Low: 4**

## Sources

- Flutter codebase analysis: `lib/particle_background.dart`, `lib/snow.dart`, `lib/fog.dart`, `lib/circular_reveal_page_route.dart`, `lib/rotating_circular_text.dart`, `lib/dot_matrix.dart`, `lib/spotlight.dart`, `lib/chat.dart`, `lib/portfolio.dart`, `lib/navbar.dart`, `lib/theme_toggle.dart`, `lib/home_text.dart`, `lib/click_here.dart`, `lib/portfolio_button.dart`
- [Next.js viewTransition docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) -- experimental flag for View Transitions API
- [CSS clip-path animation techniques (CSS-Tricks)](https://css-tricks.com/animating-with-clip-path/)
- [The Magic of Clip Path (Emil Kowalski)](https://emilkowal.ski/ui/the-magic-of-clip-path)
- [Vercel AI SDK xAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai) -- `@ai-sdk/xai` package supporting grok-3-mini through grok-4
- [Vercel x xAI Chatbot Template](https://vercel.com/templates/next.js/vercel-x-xai-chatbot)
- [xAI Streaming Response Guide](https://docs.x.ai/docs/guides/streaming-response)
- [next-themes (dark mode library)](https://github.com/pacocoursey/next-themes)
- [react-snowfall (canvas-based)](https://github.com/cahilfoley/react-snowfall)
- [Spotlight effect with CSS/JS (Vanaf1979)](https://dev.to/vanaf1979/create-a-spotlight-effect-with-css-and-javascript-or-gsap-3mp)
- [Modern spotlight effect with React/CSS (ibelick)](https://ibelick.com/blog/create-modern-spotlight-effect-with-react-css)
- [Spinning circular text with SVG (Kirupa)](https://www.kirupa.com/animations/spinning_circular_text.htm)
- [shadcn/ui Circular Text component](https://www.shadcn.io/text/circular-text)
- [MasonryGrid (1.4KB library)](https://dev.to/dangreen/masonry-grid-a-14-kb-library-that-actually-works-341n)
- [Masonic React masonry](https://github.com/jaredLunde/masonic)
- [next-transition-router](https://github.com/ismamz/next-transition-router)
- [Canvas particle animation tutorial (Cruip)](https://cruip.com/how-to-create-a-beautiful-particle-animation-with-html-canvas/)
- [shadcn/ui Rotating Text](https://www.shadcn.io/text/rotating-text)
- [Radial Clip Reveal Page Transition (CodePen)](https://codepen.io/alvarotrigo/pen/rNpEObo)

---

*Feature research: 2026-04-02*
