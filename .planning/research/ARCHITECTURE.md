# Architecture Patterns

**Domain:** Portfolio website migration (Flutter to Next.js App Router)
**Researched:** 2026-04-02
**Confidence:** HIGH (Next.js App Router patterns well-documented, animation patterns verified from multiple sources)

## Recommended Architecture

### High-Level Structure

```
src/
  app/                          # Next.js App Router (routes, layouts, API)
    layout.tsx                  # Root layout (ThemeProvider, fonts, metadata)
    template.tsx                # Root template (page transition animation wrapper)
    page.tsx                    # Home page (server component shell)
    portfolio/
      page.tsx                  # Portfolio page
    about/
      page.tsx                  # About page
    chat/
      page.tsx                  # Chat page
    api/
      chat/
        route.ts                # xAI Grok API proxy (server-side key)
    globals.css                 # Global styles, Tailwind directives, theme variables
  components/
    layout/                     # Structural components
      Navbar.tsx                # Desktop navigation bar (client)
      MobileNavbar.tsx          # Mobile navigation bar (client)
      ResponsiveShell.tsx       # 600px breakpoint switcher (client)
    canvas/                     # HTML5 Canvas animation components
      ParticleBackground.tsx    # Floating circle particles (client)
      SnowfallEffect.tsx        # Mouse-reactive snowfall (client)
      DotMatrix.tsx             # Dot matrix effect (client)
    effects/                    # CSS/DOM visual effects
      Spotlight.tsx             # Spotlight beam effect (client)
      RotatingCircularText.tsx  # Circular rotating text (client)
      ClickHere.tsx             # Click prompt animation (client)
    ui/                         # Reusable UI primitives
      ThemeToggle.tsx           # Sun/moon theme switcher (client)
      PortfolioButton.tsx       # Animated portfolio button (client)
      ExternalLink.tsx          # External link with icon (client)
    transitions/                # Page transition system
      TransitionProvider.tsx    # Circular reveal transition context (client)
      TransitionLink.tsx        # Navigation link with transition trigger (client)
    pages/                      # Page-level content compositions
      HomeContent.tsx           # Home page content assembly (client)
      MobileHomeContent.tsx     # Mobile home page variant (client)
      PortfolioGrid.tsx         # Staggered project grid (client)
      AboutSections.tsx         # Bio/experience/education (client)
      ChatInterface.tsx         # Chat UI with message history (client)
  lib/                          # Non-component logic
    data/
      projects.ts               # Portfolio project data (typed)
      experience.ts             # Experience/education data (typed)
    types/
      index.ts                  # Shared TypeScript interfaces
    utils/
      cn.ts                     # Tailwind class merging utility
    hooks/
      useCanvas.ts              # Canvas setup + rAF loop hook
      useResponsive.ts          # Responsive breakpoint hook
      useTheme.ts               # Theme access hook (wraps next-themes)
  public/
    images/                     # Portfolio images, experience images
    favicon.ico
```

### Why This Structure

**`src/` directory:** Separates application code from config files at root. Standard Next.js convention since v13+.

**`app/` for routing only:** Pages in `app/` are thin shells. They import composed content from `components/pages/`. This keeps the router directory clean and makes component testing easier.

**`components/` split by concern, not by page:** The Flutter codebase splits by page (desktop/mobile variants per file). The Next.js version should split by responsibility instead. Responsive behavior is handled within each component via Tailwind breakpoints and a single `ResponsiveShell` wrapper, eliminating the need for separate mobile files.

**`lib/` for non-React code:** Data, types, and utility functions live outside the component tree. This matches Next.js conventions and keeps imports clean.

### Component Boundaries

| Component | Responsibility | Communicates With | Rendering |
|-----------|---------------|-------------------|-----------|
| `app/layout.tsx` | Root HTML, ThemeProvider, font loading, metadata | Wraps all pages | Server |
| `app/template.tsx` | Page transition animation wrapper | Wraps page content per navigation | Client |
| `app/page.tsx` (home) | Entry for home route | Imports `HomeContent` | Server shell |
| `app/api/chat/route.ts` | Proxies chat requests to xAI Grok API | Called by `ChatInterface` via fetch | Server |
| `ResponsiveShell` | Detects viewport width, renders mobile/desktop variant | Wraps page content components | Client |
| `Navbar` / `MobileNavbar` | Navigation links, external links, portfolio button | Triggers `TransitionLink` navigation | Client |
| `TransitionProvider` | Manages circular reveal animation state | Wraps app in `template.tsx`, used by `TransitionLink` | Client |
| `TransitionLink` | Triggers circular reveal from click position | Reads `TransitionProvider` context | Client |
| `ParticleBackground` | Canvas-based floating gradient circles | Standalone, layered behind content | Client |
| `SnowfallEffect` | Canvas-based snowfall with mouse-reactive drift | Standalone, listens to mouse events | Client |
| `DotMatrix` | Canvas-based dot pattern | Standalone, layered behind content | Client |
| `ThemeToggle` | Dark/light mode switch with sun/moon animation | Calls `next-themes` setTheme | Client |
| `ChatInterface` | Chat UI, message state, API calls | Calls `/api/chat` route | Client |
| `PortfolioGrid` | Staggered grid of project cards | Reads from `lib/data/projects.ts` | Client (animations) |
| `AboutSections` | Scrollable bio/experience/education | Reads from `lib/data/experience.ts` | Client (scroll) |

### Server vs Client Component Boundary

The critical architectural decision in Next.js App Router is where the "use client" boundary sits. For this portfolio:

**Server Components (no interactivity, rendered on server):**
- `app/layout.tsx` -- static HTML shell, metadata, font links
- `app/page.tsx`, `app/portfolio/page.tsx`, etc. -- thin route entry points
- `app/api/chat/route.ts` -- API proxy

**Client Components (interactive, shipped to browser):**
- ALL canvas animations (ParticleBackground, SnowfallEffect, DotMatrix)
- ALL visual effects (Spotlight, RotatingCircularText, ClickHere)
- Navigation bars (need click handlers, transition triggers)
- ThemeToggle (needs useTheme hook)
- ChatInterface (needs useState, useEffect, fetch)
- TransitionProvider/TransitionLink (need useRef for click position, animation state)
- ResponsiveShell (needs window width detection)
- PortfolioGrid (uses staggered animations)
- AboutSections (uses scroll detection)

**Key insight:** This portfolio is heavily interactive. Most leaf components will be client components. The server/client boundary should be at the page level: pages are server components that import client component trees. This keeps initial HTML fast while shipping interactivity to the browser.

```
Server Component (page.tsx)
  --> Client Component (HomeContent.tsx) "use client"
        --> Client Component (Navbar.tsx)
        --> Client Component (ParticleBackground.tsx)
        --> Client Component (SnowfallEffect.tsx)
        --> etc.
```

The "use client" directive only needs to be on the top-level client component in each tree. Child imports inherit the client boundary.

## Data Flow

### Theme State Flow

```
1. next-themes ThemeProvider wraps app in layout.tsx
2. ThemeProvider reads system preference on mount (prefers-color-scheme)
3. ThemeProvider sets "dark" class on <html> element
4. Tailwind dark: variants respond to class presence
5. ThemeToggle calls setTheme("dark" | "light") from useTheme()
6. next-themes persists choice to localStorage automatically
7. All components using dark: Tailwind classes update instantly via CSS

Improvement over Flutter: Theme persists across sessions (localStorage)
                          No prop drilling of isDarkMode/toggleTheme
```

### Page Navigation Flow (Circular Reveal)

```
1. User clicks a navigation link (e.g., "Portfolio" in Navbar)
2. TransitionLink captures click position (clientX, clientY) via onClick
3. TransitionLink calls TransitionProvider.startTransition(position, targetPath)
4. TransitionProvider:
   a. Sets clip-path: circle(0% at Xpx Ypx) on overlay div
   b. Animates to circle(150vmax at Xpx Ypx) over 500ms
   c. At animation midpoint (~250ms), triggers router.push(targetPath)
   d. New page renders under the expanding circle
   e. Animation completes, overlay removed
5. New page is fully visible

Implementation: CSS clip-path animation on a positioned overlay div
Alternative: View Transitions API with clip-path (experimental in Next.js)
```

This replicates the Flutter `CircularRevealPageRoute` behavior where:
- The reveal originates from the clicked button's position
- The circle expands to cover the entire viewport
- The new page content is revealed as the circle grows

### Canvas Animation Flow

```
1. Canvas component mounts (useEffect with empty deps)
2. useCanvas hook:
   a. Gets canvas ref via useRef<HTMLCanvasElement>
   b. Gets 2D context
   c. Initializes particle/entity state in useRef (not useState -- no re-renders)
   d. Starts requestAnimationFrame loop
   e. Each frame: clear canvas, update positions, draw entities
   f. Cleanup: cancelAnimationFrame on unmount
3. Canvas element sized to viewport via CSS (width: 100%, height: 100%)
4. Canvas resolution set to devicePixelRatio for crisp rendering
5. Positioned absolutely behind content via z-index

Performance: Mutations happen in refs, never triggering React re-renders.
             Only the canvas draw calls happen per frame.
```

### Chat API Flow

```
1. User types message in ChatInterface
2. ChatInterface maintains message history in useState
3. On submit: POST to /api/chat with { messages: [...history, newMessage] }
4. /api/chat route.ts:
   a. Reads GROK_API_KEY from process.env (server-side only)
   b. Forwards request to https://api.x.ai/v1/chat/completions
   c. Returns streaming response via ReadableStream
5. ChatInterface consumes stream, updating UI incrementally
6. Message appended to conversation history state

Security improvement: API key never reaches the browser.
```

### Asset Loading Flow

```
1. Images placed in public/images/ directory
2. Referenced via Next.js Image component: <Image src="/images/project.png" />
3. Next.js optimizes images automatically (WebP, sizing, lazy loading)
4. Portfolio data in lib/data/projects.ts references image paths as strings
```

## Patterns to Follow

### Pattern 1: Canvas Animation Hook

**What:** Custom hook encapsulating HTML5 Canvas setup, animation loop, and cleanup.
**When:** For every canvas-based effect (particles, snow, dot matrix).

```typescript
// hooks/useCanvas.ts
import { useRef, useEffect, useCallback } from 'react';

type DrawFunction = (
  ctx: CanvasRenderingContext2D,
  frameCount: number,
  deltaTime: number
) => void;

export function useCanvas(draw: DrawFunction) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    let animationId: number;
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      frameRef.current++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      draw(ctx, frameRef.current, deltaTime);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  return canvasRef;
}
```

### Pattern 2: Responsive Component (No Separate Mobile Files)

**What:** Single component that handles both layouts internally using Tailwind breakpoints and a responsive hook.
**When:** Every component that differs between mobile and desktop.

```typescript
// hooks/useResponsive.ts
'use client';
import { useState, useEffect } from 'react';

export function useResponsive(breakpoint = 600) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return { isMobile };
}

// Usage in component:
export function Navbar() {
  const { isMobile } = useResponsive();
  if (isMobile) return <MobileNavbarLayout />;
  return <DesktopNavbarLayout />;
}
```

This eliminates the Flutter pattern of separate `navbar.dart` / `mobile_navbar.dart` files. One component, one import, one concern.

### Pattern 3: Circular Reveal Transition System

**What:** A context-based transition system that captures click position and animates a circular clip-path expansion.
**When:** All inter-page navigation (except back button).

```typescript
// The transition overlay is a fixed-position div with clip-path animation.
// CSS handles the heavy lifting:
//
// .reveal-overlay {
//   position: fixed;
//   inset: 0;
//   z-index: 9999;
//   clip-path: circle(0% at var(--cx) var(--cy));
//   transition: clip-path 500ms ease-in-out;
// }
// .reveal-overlay.active {
//   clip-path: circle(150vmax at var(--cx) var(--cy));
// }
//
// TransitionProvider sets --cx and --cy CSS custom properties
// from the click event coordinates.
```

### Pattern 4: Server Page Shell with Client Content

**What:** Page files in `app/` are minimal server components that delegate to client components.
**When:** Every page route.

```typescript
// app/portfolio/page.tsx (Server Component)
import { Metadata } from 'next';
import { PortfolioContent } from '@/components/pages/PortfolioContent';

export const metadata: Metadata = {
  title: 'Portfolio | Lakshman',
  description: 'Projects and work',
};

export default function PortfolioPage() {
  return <PortfolioContent />;
}

// components/pages/PortfolioContent.tsx (Client Component)
'use client';
// All interactive logic here
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Separate Mobile/Desktop Page Files

**What:** Creating `portfolio.tsx` and `mobile_portfolio.tsx` as separate files, mirroring the Flutter pattern.
**Why bad:** Duplicates logic, layout, and data fetching. Changes must be made in two places. The Flutter codebase has this problem -- 9,873 lines of code where roughly 40% is mobile/desktop duplication.
**Instead:** Use Tailwind responsive classes (`md:`, `lg:`) and a single `useResponsive` hook. One component handles both layouts. For radically different mobile/desktop layouts (like NavBar), use conditional rendering within the same file or split into sub-components imported by one parent.

### Anti-Pattern 2: useState for Animation State

**What:** Using React `useState` to track positions/velocities of animated entities (particles, snowflakes).
**Why bad:** Each `setState` triggers a React re-render. At 60fps with 100+ particles, that is 6000+ re-renders per second. Performance will collapse.
**Instead:** Store animation state in `useRef`. Mutate refs directly. Only the canvas draw loop reads them. React never re-renders for animation frames.

### Anti-Pattern 3: Prop Drilling Theme State

**What:** Passing `isDarkMode` and `toggleTheme` as props through every component, as done in the Flutter version.
**Why bad:** Every intermediate component needs to know about theme. Adding a new nested component requires threading props through the entire tree.
**Instead:** Use `next-themes` with React context. Any component calls `useTheme()` directly. No prop drilling. The ThemeProvider in `layout.tsx` handles everything.

### Anti-Pattern 4: API Key in Client Code

**What:** Storing the xAI API key in a client-accessible file (like Flutter's `env.dart`).
**Why bad:** The key is exposed in the browser's network tab, source maps, or minified JS. Anyone can extract and abuse it.
**Instead:** Store in `.env.local` as `GROK_API_KEY` (no `NEXT_PUBLIC_` prefix). Only accessible in server-side code (`app/api/chat/route.ts`).

### Anti-Pattern 5: Putting Interactive Logic in layout.tsx

**What:** Adding "use client" to `layout.tsx` for theme or animation management.
**Why bad:** Layout is shared across all routes and should remain a server component for performance. Making it a client component opts the entire app out of server rendering benefits.
**Instead:** Keep `layout.tsx` as server component. Wrap children in a client `ThemeProvider` component that is imported into the layout. The layout itself stays server-rendered.

### Anti-Pattern 6: Using template.tsx for Static Content

**What:** Putting non-transition content in `template.tsx`.
**Why bad:** `template.tsx` re-mounts on every navigation. Any state inside it resets. Only use it for things that SHOULD reset per navigation (like page transitions).
**Instead:** Static shared content (fonts, providers, metadata) goes in `layout.tsx`. Only the transition overlay wrapper goes in `template.tsx`.

## Component Dependency Graph and Build Order

### Dependency Layers (build bottom-up)

```
Layer 0: Foundation (no dependencies on other project code)
  |
  |- lib/types/index.ts          -- TypeScript interfaces
  |- lib/utils/cn.ts             -- Tailwind class merge utility
  |- lib/data/projects.ts        -- Portfolio data
  |- lib/data/experience.ts      -- Experience/education data
  |- globals.css                 -- Tailwind config, CSS variables, theme colors
  |
Layer 1: Hooks (depend on Layer 0)
  |
  |- hooks/useCanvas.ts          -- Canvas + rAF abstraction
  |- hooks/useResponsive.ts      -- Viewport breakpoint detection
  |
Layer 2: Leaf Components (depend on Layers 0-1, no project component deps)
  |
  |- ThemeToggle.tsx             -- Uses next-themes useTheme
  |- ParticleBackground.tsx      -- Uses useCanvas
  |- SnowfallEffect.tsx          -- Uses useCanvas
  |- DotMatrix.tsx               -- Uses useCanvas
  |- Spotlight.tsx               -- CSS/DOM animation
  |- RotatingCircularText.tsx    -- CSS/DOM animation
  |- ClickHere.tsx               -- CSS/DOM animation
  |- PortfolioButton.tsx         -- Styled button
  |- ExternalLink.tsx            -- Link with icon
  |
Layer 3: Transition System (depends on Next.js router)
  |
  |- TransitionProvider.tsx      -- Context + overlay div + clip-path animation
  |- TransitionLink.tsx          -- Click capture + context consumer
  |
Layer 4: Composition Components (depend on Layers 2-3)
  |
  |- Navbar.tsx                  -- Composes TransitionLink, PortfolioButton, ExternalLink, ThemeToggle
  |- MobileNavbar.tsx            -- Composes TransitionLink, ExternalLink, ThemeToggle
  |
Layer 5: Page Content Components (depend on Layers 2-4)
  |
  |- HomeContent.tsx             -- Composes Navbar, ParticleBackground, SnowfallEffect, DotMatrix, etc.
  |- PortfolioContent.tsx        -- Composes Navbar, PortfolioGrid
  |- AboutContent.tsx            -- Composes Navbar, AboutSections
  |- ChatContent.tsx             -- Composes Navbar, ChatInterface
  |
Layer 6: App Shell (depends on all layers)
  |
  |- app/layout.tsx              -- ThemeProvider, fonts, metadata
  |- app/template.tsx            -- TransitionProvider wrapper
  |- app/page.tsx                -- Imports HomeContent
  |- app/portfolio/page.tsx      -- Imports PortfolioContent
  |- app/about/page.tsx          -- Imports AboutContent
  |- app/chat/page.tsx           -- Imports ChatContent
  |- app/api/chat/route.ts       -- xAI Grok API proxy
```

### Suggested Build Order

Build in this order to maintain a working application at each step:

**Phase 1: Foundation + App Shell**
- Set up Next.js project with App Router, Tailwind, TypeScript
- Create `app/layout.tsx` with ThemeProvider (next-themes)
- Create `globals.css` with theme variables and Tailwind directives
- Create `lib/types/`, `lib/utils/`, `lib/data/` with data and types
- Create `hooks/useResponsive.ts`
- Result: App boots, theme works, no pages yet

**Phase 2: Navigation + Layout**
- Build `Navbar.tsx` and `MobileNavbar.tsx` (without transition system, use standard Next.js Link)
- Build `ResponsiveShell.tsx`
- Create all 4 page routes (`page.tsx` files) with placeholder content
- Result: Navigable multi-page app with responsive navbar

**Phase 3: Canvas Animations**
- Build `hooks/useCanvas.ts`
- Port `ParticleBackground.tsx` (floating gradient circles)
- Port `SnowfallEffect.tsx` (mouse-reactive snowfall)
- Port `DotMatrix.tsx` (dot pattern)
- Layer them on home page
- Result: Home page has all background effects

**Phase 4: Home Page Content**
- Port `HomeContent.tsx` with text animations, RotatingCircularText, ClickHere, Spotlight
- Wire up all effects on home page
- Result: Home page feature-complete

**Phase 5: Content Pages**
- Port `PortfolioContent.tsx` with staggered grid layout
- Port `AboutContent.tsx` with scrollable sections
- Result: Portfolio and About pages complete

**Phase 6: Chat System**
- Build `app/api/chat/route.ts` (xAI Grok proxy with streaming)
- Build `ChatInterface.tsx` with message history and streaming display
- Result: Chat page functional with secure API key handling

**Phase 7: Circular Reveal Transitions**
- Build `TransitionProvider.tsx` with clip-path animation
- Build `TransitionLink.tsx` with click position capture
- Replace standard Links in Navbar with TransitionLinks
- Wire into `app/template.tsx`
- Result: All navigation uses circular reveal transition

**Phase 8: Polish + Deploy**
- Visual fidelity audit against Flutter version
- Performance optimization (lazy loading, image optimization)
- AWS Amplify deployment configuration
- Result: Production-ready

### Why This Order

1. **Foundation first (Phase 1-2):** You need routing, theming, and layout before building anything visual. Without these, you cannot see or test components in context.

2. **Canvas before content (Phase 3 before 4):** The home page's visual identity depends on background effects. Building text content without the background makes visual fidelity comparison impossible.

3. **Home before other pages (Phase 4 before 5):** The home page is the most complex page (5+ layered effects). Getting it right validates the entire animation architecture. If canvas performance is bad, you find out early.

4. **Chat last among pages (Phase 6):** Chat is the only page with backend integration. It is functionally independent of the other pages. Building it last means the API route pattern is the last new architectural concept introduced.

5. **Transitions near-last (Phase 7):** Circular reveal transitions are a cross-cutting concern. They modify navigation behavior app-wide. All pages must exist and work before wrapping them in transition animations. Debugging page content is harder if transitions are animating during development.

## Scalability Considerations

| Concern | This Portfolio | If Adding More Pages | If Adding CMS |
|---------|---------------|---------------------|---------------|
| Data | Hardcoded TS files | Still hardcoded, add more files | Move to headless CMS, fetch in server components |
| Routing | 4 static routes | Add more `app/[page]/page.tsx` | Same pattern, possibly dynamic routes |
| State | Client-only (theme, chat) | Same | Consider Zustand if state grows |
| Animation perf | 3 canvas layers on home | Keep canvas layers per-page, not global | Same |
| Bundle size | ~50-80KB JS estimated | Grows linearly with pages | Same |
| Images | public/ directory | Consider CDN if >50 images | CMS handles images |

## Sources

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js View Transition Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition)
- [Next.js App Router Route Transitions Discussion](https://github.com/vercel/next.js/discussions/42658)
- [next-transition-router Library](https://github.com/ismamz/next-transition-router)
- [Animation with Canvas and requestAnimationFrame in React](https://dev.to/ptifur/animation-with-canvas-and-requestanimationframe-in-react-5ccj)
- [Using requestAnimationFrame with React Hooks (CSS-Tricks)](https://css-tricks.com/using-requestanimationframe-with-react-hooks/)
- [Framer Motion vs GSAP Performance Comparison](https://blog.uavdevelopment.io/blogs/comparing-the-performance-of-framer-motion-and-gsap-animations-in-next-js)
- [Next.js on AWS Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html)
- [AWS Amplify SSR Support](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-amplify-support.html)
- [next-themes for Dark Mode](https://www.davegray.codes/posts/light-dark-mode-nextjs-app-router-tailwind)
- [Vercel AI SDK with xAI Provider](https://ai-sdk.dev/providers/ai-sdk-providers/xai)
- [xAI Streaming Guide](https://docs.x.ai/docs/guides/streaming-response)
- [Next.js Project Structure Best Practices 2025](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)

---

*Architecture analysis: 2026-04-02*
