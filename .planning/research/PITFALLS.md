# Domain Pitfalls

**Domain:** Flutter-to-Next.js portfolio migration with canvas animations, custom page transitions, and AWS Amplify deployment
**Researched:** 2026-04-02

---

## Critical Pitfalls

Mistakes that cause rewrites, broken features, or deployment failures.

---

### Pitfall 1: Canvas Animation Memory Leaks from requestAnimationFrame Without Cleanup

**What goes wrong:** The Flutter codebase runs three simultaneous canvas animations (particle background with 7 circles, snowfall with 220 snowflakes across 3 layers, and fog with 2000 particles). Each uses `AnimationController` with `SingleTickerProviderStateMixin`, which Flutter manages automatically. In React, developers typically use `requestAnimationFrame` inside `useEffect` but forget to cancel the frame ID in the cleanup function, or they cancel the wrong frame ID. This creates animation loops that persist after component unmount, consuming CPU indefinitely.

**Why it happens:** In Flutter, `dispose()` on the controller stops everything. In React, `requestAnimationFrame` returns a new ID each frame, and the cleanup function in `useEffect` captures the ID from the initial render via closure -- not the latest frame ID. The latest ID must be stored in a `useRef` that the cleanup function reads.

**Consequences:**
- Multiple animation loops accumulate on every page navigation (each navigate-away spawns a zombie loop)
- Memory grows from ~2.5 KB to ~819 KB per leaked animation (empirically measured)
- Mobile devices overheat and drain battery; desktop tabs become sluggish
- Particularly severe because this portfolio runs 3-4 canvas animations simultaneously on the home page

**Prevention:**
```typescript
// WRONG -- closure captures stale frameId
useEffect(() => {
  let frameId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameId); // captures initial frameId only
}, []);

// CORRECT -- ref always holds latest frameId
const frameRef = useRef<number>(0);
useEffect(() => {
  const animate = (time: number) => {
    // update logic here
    frameRef.current = requestAnimationFrame(animate);
  };
  frameRef.current = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameRef.current);
}, []);
```

**Detection (warning signs):**
- Open DevTools Performance Monitor; memory should plateau, not climb on navigation
- Check "JS Heap Size" after navigating away from home page -- should drop
- CPU usage should return to near-zero when leaving the home page

**Phase relevance:** Phase 1 (Home Page) -- must be correct from the first canvas implementation. Every subsequent canvas component will follow this pattern.

**Confidence:** HIGH -- verified via multiple sources including empirical studies and React documentation patterns.

---

### Pitfall 2: Circular Reveal Page Transition Breaks with Next.js App Router

**What goes wrong:** The Flutter app uses `Navigator.push(CircularRevealPageRoute(...))` with imperative, stack-based navigation. The circular reveal uses `ClipPath` with a custom clipper that expands a circle from the click origin. In Next.js App Router, there is no equivalent to Flutter's imperative `Navigator.push` with custom transition builders. The App Router controls component lifecycle -- it unmounts the old page and mounts the new page without any hook for exit animations. Attempting to use Framer Motion's `AnimatePresence` with `exit` props fails because the App Router tears down the outgoing component before the exit animation can run.

**Why it happens:** Next.js App Router re-renders the layout tree on navigation. The outgoing page's React tree is destroyed immediately. There is no built-in mechanism to delay unmount for a transition. This is a fundamental architectural mismatch: Flutter's `PageRouteBuilder` controls the entire transition lifecycle; Next.js App Router does not expose this control.

**Consequences:**
- Attempted Framer Motion exit animations produce no visible effect
- Developers spend days debugging why `AnimatePresence` exit is ignored
- The workaround (FrozenRouter pattern) relies on unexposed Next.js internals (`LayoutRouterContext`) and can break on any Next.js update
- Circular reveal specifically requires coordinating origin position, clip-path animation, and page content rendering in sequence

**Prevention -- choose one of these approaches:**

1. **CSS clip-path with View Transitions API (recommended):** Enable `experimental.viewTransition` in `next.config.js`. Use CSS `clip-path: circle()` to animate the reveal. The View Transitions API captures a snapshot of the old page and animates to the new one without needing to delay unmount. This is the closest analog to Flutter's `CircularRevealPageRoute`.

   ```javascript
   // next.config.js
   const nextConfig = {
     experimental: {
       viewTransition: true,
     },
   };
   ```

   Then use `document.startViewTransition()` with custom CSS that applies `clip-path: circle(0% at Xpx Ypx)` expanding to `circle(150% at Xpx Ypx)`.

2. **Intercepting navigation with a transition wrapper:** Build a custom `TransitionLink` component that intercepts `router.push`, runs the clip-path animation on an overlay, waits for it to complete, then performs the actual navigation. This avoids relying on App Router lifecycle entirely.

3. **next-transition-router library:** A community library (`next-transition-router`) that provides leave/enter hooks for the App Router. Wraps the layout and delays navigation until the leave animation completes.

**Detection:**
- Test navigation between all pages immediately after implementing transitions
- Verify the transition plays on both forward navigation and browser back button
- Test on mobile Safari -- View Transitions API support varies

**Phase relevance:** Phase 3 or dedicated transition phase -- must be prototyped early because it affects the entire navigation architecture. Do not defer this to the end.

**Confidence:** HIGH -- multiple open issues on Next.js GitHub (Discussion #42658, motion issue #2411) confirm this is a known, fundamental limitation.

---

### Pitfall 3: AWS Amplify Environment Variables Invisible to Server-Side Runtime

**What goes wrong:** The xAI API key is stored as an environment variable in Amplify Console. Next.js API routes (`/api/chat`) attempt to read it via `process.env.XAI_API_KEY`. The API route returns undefined for the key. The chat feature silently fails or returns errors. This happens because Amplify treats build-time and runtime environments differently -- environment variables set in the Amplify Console are available during the build phase but are NOT automatically available to the server-side Lambda runtime that executes API routes.

**Why it happens:** AWS Amplify deploys Next.js SSR apps using Lambda@Edge or Lambda functions behind CloudFront. Environment variables configured in the Amplify Console are injected into the build container, not the Lambda execution environment. Next.js only forwards `NEXT_PUBLIC_*` variables to the client bundle; server-side variables require explicit configuration in `amplify.yml` to be written to `.env.production` at build time so they are bundled alongside the Lambda code.

**Consequences:**
- Chat feature completely broken in production while working perfectly in local development
- Difficult to diagnose because Amplify shows "deployment successful"
- Exposing `NEXT_PUBLIC_XAI_API_KEY` as a workaround re-introduces the security vulnerability that motivated the migration

**Prevention:**

Add an explicit environment variable injection step in `amplify.yml`:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - echo "XAI_API_KEY=$XAI_API_KEY" >> .env.production
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

Alternatively, use AWS Systems Manager Parameter Store for secrets and retrieve them at runtime via the AWS SDK.

**Detection:**
- Test the chat feature in the deployed environment immediately after first deployment -- do not assume it works because local dev works
- Log `!!process.env.XAI_API_KEY` (boolean check, not the value) in the API route during initial testing
- Check Amplify build logs for the env injection step

**Phase relevance:** Phase 4 (Chat + API) and Phase 5 (Deployment) -- must be validated with a minimal API route test before building the full chat feature.

**Confidence:** HIGH -- confirmed by official AWS documentation and multiple community reports.

---

### Pitfall 4: Theme Hydration Mismatch Causes Flash of Wrong Theme

**What goes wrong:** The Flutter app detects system theme preference via `WidgetsBinding.instance.window.platformBrightness` and toggles between dark/light mode. In Next.js with server components, the server renders HTML without knowing the user's theme preference (it cannot read `localStorage` or `prefers-color-scheme`). The server renders light mode (the default). When the client hydrates, it detects dark mode and switches -- causing a visible flash of light-to-dark content, or worse, a React hydration mismatch error that breaks interactivity.

**Why it happens:** Server-Side Rendering (SSR) fundamentally cannot access client-side state. `localStorage` does not exist on the server. `window.matchMedia('(prefers-color-scheme: dark)')` does not exist on the server. Any component that conditionally renders based on theme during SSR will produce HTML that differs from what the client produces, triggering React's hydration mismatch.

**Consequences:**
- Visible flash of wrong theme on every page load (FOUC -- Flash of Unstyled Content)
- React hydration errors in console that can cascade to break interactive components
- Users on dark mode see a jarring white flash before dark mode activates
- Theme toggle breaks if hydration error corrupts the component tree

**Prevention:**

Use the `next-themes` library with the cookie-based approach:

1. Store theme preference in a cookie (readable by the server) instead of `localStorage`
2. Read the cookie in the root layout's server component to set the initial `className`
3. Use a `mounted` state guard for any theme-dependent UI that reads from `useTheme()`

```typescript
// layout.tsx (server component)
import { cookies } from 'next/headers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme')?.value || 'system';

  return (
    <html lang="en" className={theme === 'dark' ? 'dark' : ''}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

```typescript
// ThemeToggle.tsx (client component)
'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />; // placeholder to avoid layout shift

  return <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>...</button>;
}
```

Also inject a blocking `<script>` in the `<head>` to set the theme class before first paint:

```html
<script dangerouslySetInnerHTML={{ __html: `
  (function() {
    const theme = document.cookie.match(/theme=([^;]+)/)?.[1]
      || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
  })();
` }} />
```

**Detection:**
- Load the page with "Disable cache" enabled in DevTools -- do you see a flash?
- Test with system dark mode enabled, then toggle to light and reload
- Check browser console for "Hydration mismatch" warnings

**Phase relevance:** Phase 1 (Foundation/Setup) -- theme infrastructure must be correct before any themed component is built.

**Confidence:** HIGH -- confirmed by Next.js official documentation and the `next-themes` library documentation.

---

### Pitfall 5: AWS Amplify Fails to Detect Next.js SSR When amplify.yml Exists

**What goes wrong:** Amplify auto-detects Next.js SSR apps and generates the correct build configuration. However, if you add a custom `amplify.yml` file (which you need for the environment variable injection in Pitfall 3), Amplify stops auto-detecting and uses your config verbatim. If `baseDirectory` is not set to `.next`, or if the `files` glob is wrong, the deployment "succeeds" but the site shows a blank page or 404 errors at the deployed domain.

**Why it happens:** Amplify's auto-detection and custom config are mutually exclusive. When `amplify.yml` is present, Amplify trusts it completely. A common mistake is setting `baseDirectory` to `out` (which is for static export) instead of `.next` (which is for SSR).

**Consequences:**
- Deployment shows "successful" in Amplify Console but the domain shows nothing
- Extremely confusing because there are no error logs -- the build completed
- SSR features (API routes, server components) silently don't work if Amplify treats the app as static

**Prevention:**
- Always set `baseDirectory: .next` in `amplify.yml` for SSR apps
- Always include `files: '**/*'` to capture all build output
- Do NOT set `output: 'export'` in `next.config.js` -- that disables SSR, API routes, and server components
- Verify in Amplify Console > App settings > Build settings that "Framework" shows "Next.js - SSR"

**Detection:**
- After first deployment, check the Amplify Console for the "Framework" detection
- Visit the deployed URL immediately -- do not assume success from the build log
- Test an API route (e.g., `/api/health`) to confirm SSR is working

**Phase relevance:** Phase 5 (Deployment) -- but should be validated with a skeleton deployment in Phase 1.

**Confidence:** HIGH -- confirmed by AWS documentation and multiple GitHub issues (amplify-hosting #3838).

---

## Moderate Pitfalls

---

### Pitfall 6: Canvas Animation setState per Frame Destroys React Performance

**What goes wrong:** The Flutter snowfall uses `setState()` inside the animation listener to trigger repaints every frame (~60 fps). Direct translation to React would mean calling a state setter 60 times per second, causing 60 full React re-renders per second per animation. With 3 animations running simultaneously, that is 180 React reconciliation cycles per second.

**Prevention:**
- Never use `useState` for per-frame animation data. Use `useRef` for all mutable animation state (particle positions, velocities, sizes)
- Draw directly to the canvas via `canvasRef.current.getContext('2d')` inside the `requestAnimationFrame` callback
- The React component should render the `<canvas>` element exactly once; all updates happen imperatively via the Canvas 2D API
- This is the single biggest mindset shift from Flutter's `CustomPainter` + `setState` pattern

**Detection:**
- React DevTools Profiler shows constant re-renders from the canvas component
- Visible jank or frame drops in the animation
- CPU usage stays above 30% even for simple particle effects

**Phase relevance:** Phase 1 (Home Page) -- foundational pattern for all canvas work.

**Confidence:** HIGH -- well-documented React performance pattern.

---

### Pitfall 7: Responsive Layout Hydration Mismatch from useMediaQuery / window.innerWidth

**What goes wrong:** The Flutter app uses `LayoutBuilder` with a 600px breakpoint to switch between `MobileHome` and `HomePage`. The direct React translation would be: `const isMobile = window.innerWidth < 600`. This crashes on the server (no `window`) and causes hydration mismatch (server renders one layout, client renders another based on actual viewport).

**Prevention:**
- Use CSS media queries and Tailwind's responsive prefixes (`md:`, `lg:`) for layout switching -- these work without JavaScript and produce consistent server/client HTML
- For the 600px breakpoint: define a custom Tailwind breakpoint (`screens: { 'sm': '600px' }`) and use `hidden sm:block` / `sm:hidden` to toggle components
- If JavaScript-based detection is unavoidable, use the `mounted` guard pattern (render a default layout on server, switch after mount)
- Do NOT use `@artsy/fresnel` or similar libraries that render both versions and hide one with CSS -- this doubles the DOM size for every responsive component

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '600px', // matches Flutter's 600px breakpoint
    },
  },
};
```

```tsx
// layout component
<div className="sm:hidden"><MobileHome /></div>
<div className="hidden sm:block"><DesktopHome /></div>
```

**Detection:**
- Console warnings about hydration mismatch on page load
- Layout "jumps" from mobile to desktop (or vice versa) on first load
- Different content rendered during SSR vs client

**Phase relevance:** Phase 1 (Foundation) -- the responsive system is the skeleton that everything else hangs on.

**Confidence:** HIGH -- confirmed by Next.js documentation and community discussions.

---

### Pitfall 8: Multiple Canvas Elements on One Page Kill Mobile Performance

**What goes wrong:** The home page simultaneously runs: particle background (7 circles with radial gradients + blur), snowfall (220 snowflakes with blur across 3 layers), and potentially fog (2000 particles). Each is a separate `<canvas>` element with its own `requestAnimationFrame` loop. On mobile devices, this causes frame drops below 30 fps, battery drain, and device heating.

**Prevention:**
- Consolidate all home page animations into a single canvas with a single `requestAnimationFrame` loop. One loop updates particles, snow, and fog in sequence, then draws all to the same canvas context
- Reduce particle counts on mobile: use `navigator.hardwareConcurrency` or a simple viewport width check to scale down (e.g., 50% fewer snowflakes on mobile)
- Use `will-change: transform` on the canvas element to hint GPU compositing
- Consider `OffscreenCanvas` with a Web Worker for the particle calculations (keep drawing on the main thread)
- Cap to 30fps on mobile if needed -- most of these ambient effects look fine at 30fps
- Add `visibility` detection: pause all animations when the tab is not visible (`document.visibilitychange` event)

**Detection:**
- Test on an actual mobile device (not just browser dev tools responsive mode)
- Use Chrome DevTools Performance tab to check frame rate
- Monitor battery consumption during a 1-minute session

**Phase relevance:** Phase 1 (Home Page) -- architecture decision that is painful to change later.

**Confidence:** HIGH -- well-established web performance pattern.

---

### Pitfall 9: Canvas Blur Effects (MaskFilter) Are Expensive in HTML5 Canvas

**What goes wrong:** The Flutter particle background uses `MaskFilter.blur(BlurStyle.normal, circleSizes[i] / 8)` on every circle, and the snowfall uses `MaskFilter.blur(BlurStyle.normal, blurSigma)` per layer. In HTML5 Canvas, the equivalent is `ctx.filter = 'blur(Xpx)'` or `ctx.shadowBlur = X`. Both are extremely expensive operations -- Canvas 2D blur is software-rendered and recalculated every frame. Seven blurred circles with radial gradients at 60fps will tank performance.

**Prevention:**
- Pre-render blurred circles to an offscreen canvas once, then `drawImage()` them each frame (stamp approach)
- Use CSS `backdrop-filter: blur()` on a positioned element above the canvas instead of in-canvas blur
- For radial gradients, pre-create `CanvasGradient` objects and reuse them -- do not recreate gradients every frame
- For the snowfall blur layers, use CSS `filter: blur()` on separate `<canvas>` elements rather than in-canvas blur
- The fog effect (2000 particles with blur) should use a CSS-based approach entirely -- 2000 blurred circles per frame is not viable in Canvas 2D

**Detection:**
- Frame rate drops below 30fps on the home page
- "Long task" warnings in Chrome DevTools Performance panel
- GPU memory spikes in `chrome://gpu`

**Phase relevance:** Phase 1 (Home Page) -- must decide on blur strategy before implementing any canvas animation.

**Confidence:** HIGH -- Canvas 2D blur performance is well-documented as a bottleneck.

---

### Pitfall 10: `dart:html` APIs Have No Direct React Equivalent

**What goes wrong:** The Flutter app uses `dart:html` to manipulate meta tags (`html.document.querySelector('meta[name="theme-color"]')`) and potentially for URL launching. Developers try to find React equivalents and end up putting `document.querySelector` calls inside components without proper SSR guards, crashing the server.

**Prevention:**
- For meta tag management: use Next.js `metadata` export in page/layout files (App Router built-in)
- For dynamic meta updates: use `next/head` or the `useEffect`-guarded `document` access
- For URL launching: use standard `<a href="..." target="_blank" rel="noopener noreferrer">`
- For any remaining `document`/`window` access: always guard with `typeof window !== 'undefined'` or use `useEffect`
- Map all `dart:html` usages before starting migration

**Detection:**
- `ReferenceError: document is not defined` during SSR
- Pages that work on client navigation but break on hard refresh (which triggers SSR)

**Phase relevance:** Phase 1 (Foundation) -- audit all `dart:html` usage upfront and plan replacements.

**Confidence:** HIGH -- standard SSR knowledge.

---

## Minor Pitfalls

---

### Pitfall 11: Flutter's Prop Drilling Pattern Creates Unnecessary React Complexity

**What goes wrong:** The Flutter app passes `isDarkMode` and `toggleTheme` through every widget constructor. Developers replicate this prop drilling pattern in React instead of using React Context or Zustand. With 10+ components needing theme state, this creates brittle, deeply-nested prop chains.

**Prevention:**
- Use `next-themes` for theme state (already recommended in Pitfall 4)
- Any component can call `useTheme()` directly -- no prop passing needed
- Similarly, consolidate navigation state into a React context rather than replicating Flutter's callback pattern

**Phase relevance:** Phase 1 (Foundation).

---

### Pitfall 12: Hardcoded Pixel Values from Flutter Don't Map to Responsive CSS

**What goes wrong:** The Flutter app has hardcoded values throughout: navbar width `630`, breakpoint `600`, item width `300`, button size `200x60`. Directly translating these to CSS pixel values creates rigid layouts that break at intermediate screen sizes.

**Prevention:**
- Define a design token system in Tailwind config (`theme.extend`) for all spacing/sizing values
- Use relative units (`rem`, viewport units, `clamp()`) where appropriate
- The 600px breakpoint maps to a Tailwind screen, but intermediate layout adjustments may be needed
- Test at 600px, 768px, 1024px, 1280px, and 1440px -- Flutter's LayoutBuilder only cared about < or >= 600px

**Phase relevance:** Phase 1 (Foundation) -- Tailwind config should be set up with the token system before building components.

---

### Pitfall 13: Google Fonts Loading Flash

**What goes wrong:** The Flutter app uses `GoogleFonts.latoTextTheme()` which bundles fonts at build time. In Next.js, loading Google Fonts incorrectly causes a Flash of Unstyled Text (FOUT) where the browser shows a fallback font before the web font loads.

**Prevention:**
- Use `next/font/google` which automatically handles font loading, preloading, and CSS `font-display: swap`
- Import at the layout level so the font is available globally
- Use `next/font`'s `subsets` option to reduce download size

```typescript
import { Lato } from 'next/font/google';
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'] });
```

**Phase relevance:** Phase 1 (Foundation).

---

### Pitfall 14: Chat API Route Timeout on AWS Amplify Lambda

**What goes wrong:** The xAI Grok API can take 10-30 seconds for complex responses. AWS Amplify deploys Next.js API routes as Lambda functions with a default timeout of 10 seconds. Long chat responses get cut off with a 504 Gateway Timeout.

**Prevention:**
- Implement streaming responses using the Vercel AI SDK pattern or raw `ReadableStream` to send tokens as they arrive
- If streaming is not possible, increase the Lambda timeout in the Amplify configuration
- Add a client-side timeout indicator so users know the response is still generating
- The Flutter app's current approach of waiting for the full response before displaying is already problematic -- streaming improves this

**Detection:**
- Chat responses that work for short questions but fail for complex ones
- 504 errors in the browser network tab

**Phase relevance:** Phase 4 (Chat + API).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation | Severity |
|-------------|---------------|------------|----------|
| Phase 1: Foundation/Setup | Theme hydration mismatch (Pitfall 4) | Use next-themes with cookie + blocking script | Critical |
| Phase 1: Foundation/Setup | Responsive hydration mismatch (Pitfall 7) | CSS media queries, not JS detection | Critical |
| Phase 1: Foundation/Setup | dart:html assumptions (Pitfall 10) | Audit and map all browser API usage upfront | Moderate |
| Phase 1: Home Page | Canvas memory leaks (Pitfall 1) | useRef for frame IDs, proper cleanup | Critical |
| Phase 1: Home Page | setState per frame (Pitfall 6) | useRef for all animation state, imperative canvas | Critical |
| Phase 1: Home Page | Canvas blur performance (Pitfall 9) | Pre-render blurred shapes, CSS filter alternatives | Critical |
| Phase 1: Home Page | Multiple canvases on mobile (Pitfall 8) | Single canvas loop, reduced particle counts | Moderate |
| Phase 2-3: Navigation/Transitions | Circular reveal breaks in App Router (Pitfall 2) | View Transitions API or custom transition wrapper | Critical |
| Phase 4: Chat + API | API route env vars invisible (Pitfall 3) | amplify.yml env injection to .env.production | Critical |
| Phase 4: Chat + API | Lambda timeout (Pitfall 14) | Streaming responses | Moderate |
| Phase 5: Deployment | Amplify SSR detection failure (Pitfall 5) | Correct amplify.yml with baseDirectory: .next | Critical |
| Phase 5: Deployment | Env vars not in Lambda (Pitfall 3) | Validate with test route before full deployment | Critical |

---

## Sources

### Canvas Animation Performance
- [Optimizing GSAP Animations in Next.js 15](https://medium.com/@thomasaugot/optimizing-gsap-animations-in-next-js-15-best-practices-for-initialization-and-cleanup-2ebaba7d0232) -- GSAP cleanup patterns applicable to raw canvas
- [RequestAnimationFrame and UseEffect vs UseLayoutEffect](https://blog.jakuba.net/request-animation-frame-and-use-effect-vs-use-layout-effect/) -- why useLayoutEffect is needed for frame cancellation
- [Frontend Memory Leaks: 500-Repository Study](https://stackinsight.dev/blog/memory-leak-empirical-study/) -- empirical data on rAF memory leak severity
- [Creating Interactive Animations with Canvas and React](https://medium.com/@ignatovich.dm/creating-interactive-animations-with-canvas-and-react-7c4e85eb7bce) -- useRef pattern for canvas state

### Page Transitions
- [Next.js App Router Page Transition Discussion #42658](https://github.com/vercel/next.js/discussions/42658) -- canonical discussion on the limitation
- [Framer Motion exit animation bug #2411](https://github.com/framer/motion/issues/2411) -- confirms exit animations broken with App Router
- [Next.js viewTransition Config](https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition) -- official experimental flag
- [Solving Framer Motion Page Transitions in Next.js App Router](https://www.imcorfitz.com/posts/adding-framer-motion-page-transitions-to-next-js-app-router) -- FrozenRouter workaround
- [next-transition-router](https://github.com/ismamz/next-transition-router) -- community library for App Router transitions
- [The Magic of Clip Path](https://emilkowal.ski/ui/the-magic-of-clip-path) -- clip-path animation techniques

### AWS Amplify + Next.js
- [AWS: Making Environment Variables Accessible to Server-Side Runtimes](https://docs.aws.amazon.com/amplify/latest/userguide/ssr-environment-variables.html) -- official docs confirming the env var problem
- [Deploying a Next.js SSR Application to Amplify](https://docs.aws.amazon.com/amplify/latest/userguide/deploy-nextjs-app.html) -- official deployment guide
- [Beware of Next.js on AWS Amplify](https://betterprogramming.pub/beware-of-next-js-on-aws-amplify-5a1286db2a6a) -- real-world deployment pain points
- [Amplify Hosting Issue #3838](https://github.com/aws-amplify/amplify-hosting/issues/3838) -- "successful" deployment showing nothing
- [Next.js Deployment to AWS Amplify: Environment Variable Fix](https://dev.to/dilumdarshana/nextjs-deployment-to-aws-amplify-environment-variable-issue-fix-333k) -- community fix

### Theme and Hydration
- [Fixing Hydration Mismatch in Next.js (next-themes)](https://medium.com/@pavan1419/fixing-hydration-mismatch-in-next-js-next-themes-issue-8017c43dfef9) -- the mounted pattern
- [next-themes](https://github.com/pacocoursey/next-themes) -- library documentation
- [Next.js Dark Mode Implementation Guide](https://eastondev.com/blog/en/posts/dev/20251220-nextjs-dark-mode-guide/) -- cookie-based approach

### Responsive Design and SSR
- [React/NextJS: SSR and Responsive Design](https://medium.com/fredwong-it/react-nextjs-ssr-and-responsive-design-ae33e658975c) -- core problem statement
- [Managing useMediaQuery Hydration Errors in Next.js](https://medium.com/@dwinTech/managing-usemediaquery-hydration-errors-in-next-js-9ecc555542c7) -- hydration fix patterns

---

*Concerns audit: 2026-04-02*
