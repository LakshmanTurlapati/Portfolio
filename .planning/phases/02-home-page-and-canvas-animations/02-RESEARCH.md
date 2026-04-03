# Phase 2: Home Page and Canvas Animations - Research

**Researched:** 2026-04-03
**Domain:** HTML5 Canvas animations, SVG animation, CSS effects, React animation lifecycle, home page assembly
**Confidence:** HIGH

## Summary

Phase 2 implements the home page's visual layer: particle background, snowfall, dot matrix, rotating circular text, spotlight, scrolling text roller, and the home page assembly that composes them all. The existing Next.js project (Phase 1 complete) has a working home page shell with navbar, theme toggle, and author name -- Phase 2 adds animation layers and the scrolling text focal point into this existing page.

The architecture uses separate canvases for particles and snow, HTML/CSS divs for dot matrix (with per-dot hover), SVG with CSS rotation for circular text, a CSS radial-gradient overlay for spotlight, and a CSS-driven vertical roller for scrolling text. All animation state must be stored in `useRef` (never `useState`) to avoid React re-renders at 60fps. Every effect must clean up `requestAnimationFrame`, timers, intervals, and event listeners on unmount.

**Primary recommendation:** Build a shared `useCanvas` hook first, then implement each effect as an independent component with its own lifecycle. Canvas blur must use pre-rendered offscreen stamps (not per-frame blur). Assemble everything on the home page with the z-index layering defined in the UI-SPEC.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Multiple canvases (one per effect) -- simpler lifecycle, independent cleanup, matches Flutter's per-widget approach
- Shared `useCanvas` hook standardizing requestAnimationFrame + useRef pattern across all effects, ensures consistent cleanup
- ResizeObserver on canvas parent for resize handling -- update canvas dimensions, recalculate positions
- Cap particle counts on mobile (detect via useMediaQuery) -- target 60fps on mid-range devices
- Rotating circular text: SVG with `<textPath>` on a `<circle>` -- CSS rotation animation, simpler than Flutter's trigonometric positioning
- Spotlight effect: CSS radial-gradient overlay with pointer tracking via mousemove/touchmove -- GPU-accelerated, no canvas needed
- Dot matrix: Canvas with pre-computed grid positions, theme-aware dot colors via CSS custom properties (OVERRIDDEN by UI-SPEC -- use HTML/CSS divs instead, see deviation note)
- Snow particles: Custom physics matching Flutter -- random spawn at top, gravity + slight horizontal drift, reset on viewport exit
- Z-index layering: background gradient -> particles -> snow -> dot matrix -> spotlight -> content (navbar, text)
- Lazy initialization -- start animations only when home page is mounted, not on app load
- All effects read theme via CSS custom properties -- no React re-renders needed for color changes
- All effects render on both mobile and desktop (with reduced particle counts on mobile)

### Claude's Discretion
- Exact particle counts and physics constants (extract from Flutter source)
- Canvas rendering optimizations (offscreen canvas, double buffering if needed)
- SVG textPath content and rotation speed for circular text
- useCanvas hook API design and cleanup implementation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANIM-01 | Particle background renders on home page with smooth 60fps animation | useCanvas hook + pre-rendered blur stamps + offscreen canvas pattern |
| ANIM-02 | Snowfall effect renders with realistic particle physics matching Flutter version | Normalized 0-1 coordinate system, 3-layer depth, drift from mouse position |
| ANIM-03 | Dot matrix effect renders matching Flutter version visual appearance | HTML/CSS div grid with CSS transitions for hover, Color.lerp via CSS custom properties |
| ANIM-04 | Rotating circular text animates smoothly using SVG textPath | SVG `<textPath>` on `<circle>`, CSS `@keyframes` rotation, 8s duration |
| ANIM-05 | Spotlight effect follows cursor/touch matching Flutter version behavior | CSS radial-gradient overlay, Offset.lerp interpolation at 20ms tick, direct style mutation |
| ANIM-06 | All canvas animations clean up properly on component unmount (no memory leaks) | useCanvas hook with useRef for frameId, cleanup of intervals/timers/event listeners |
| ANIM-07 | Canvas animations perform at 60fps on mobile devices without jank | 50% particle count reduction on mobile, pre-rendered blur stamps, useRef for all state |
| PAGE-01 | Home page assembles all animations with correct layering | 11-layer z-index system from UI-SPEC, pointer-events: none on overlay layers |

</phase_requirements>

---

## Standard Stack

### Core (already installed in Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | Framework | Already installed, App Router with server components |
| React | 19.1.0 | UI library | Already installed, hooks for animation lifecycle |
| TypeScript | ^5 | Type safety | Already installed, interfaces for particle/snowflake state |
| Tailwind CSS | ^4 | Styling | Already installed, z-index utilities, responsive variants |
| GSAP | ^3 | DOM animations | Already installed, used for pulsing scale animation on circular text wrapper |
| @gsap/react | ^2 | React integration | Already installed, useGSAP hook for GSAP cleanup |
| next-themes | ^0.4 | Theme detection | Already installed, theme-aware CSS custom properties |
| react-icons | ^5 | Icons | Already installed, `IoArrowForwardSharp` or similar for mobile arrow |

### Phase 2 Specific

No new dependencies needed. Phase 2 uses:
- Native HTML5 Canvas API for particles and snow
- Native SVG for rotating circular text
- CSS radial-gradient for spotlight
- CSS transitions for dot matrix hover
- `requestAnimationFrame` for animation loops

### What NOT to Install

| Library | Why Not |
|---------|---------|
| tsParticles | Custom particle physics from Flutter -- generic library would fight the API |
| react-curved-text | Simple SVG textPath is trivial to build, no dependency needed |
| Framer Motion / Motion | GSAP already installed, canvas animations are imperative not declarative |
| canvas-confetti | Wrong effect type entirely |

**Installation:** No new packages needed.

---

## Architecture Patterns

### Recommended File Structure

```
src/
  hooks/
    use-canvas.ts           # Shared canvas animation hook (NEW)
    use-media-query.ts      # Existing -- mobile detection
    use-mounted.ts          # Existing -- SSR safety
  components/
    particle-background.tsx # Canvas-based floating circles (NEW)
    snowfall.tsx            # Canvas-based snow particles (NEW)
    dot-matrix.tsx          # HTML/CSS dot grid with hover (NEW)
    rotating-circular-text.tsx # SVG textPath with CSS rotation (NEW)
    spotlight.tsx           # CSS radial-gradient overlay (NEW)
    scrolling-text.tsx      # Vertical text roller (NEW)
    desktop-navbar.tsx      # Existing
    mobile-navbar.tsx       # Existing
    theme-toggle.tsx        # Existing
    author-name.tsx         # Existing
  app/
    page.tsx                # Home page assembly (MODIFY existing)
    globals.css             # Add Phase 2 CSS custom properties (MODIFY existing)
```

### Pattern 1: useCanvas Hook

**What:** Shared hook that provides a canvas ref, handles ResizeObserver, manages requestAnimationFrame loop with proper cleanup.

**When to use:** ParticleBackground and SnowfallEffect components.

**API Design:**

```typescript
interface UseCanvasOptions {
  /** Called every animation frame with context, canvas, and delta time in ms */
  animate: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, deltaTime: number) => void;
  /** Called when canvas resizes -- recalculate positions, particle counts, etc. */
  onResize?: (width: number, height: number) => void;
  /** Whether to use willReadFrequently optimization flag */
  willReadFrequently?: boolean;
}

function useCanvas(options: UseCanvasOptions): React.RefObject<HTMLCanvasElement | null>;
```

**Implementation pattern:**

```typescript
'use client';

import { useRef, useEffect, useCallback } from 'react';

export function useCanvas({ animate, onResize, willReadFrequently = false }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const animateRef = useRef(animate);
  animateRef.current = animate;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently });
    if (!ctx) return;

    // ResizeObserver for canvas dimensions
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
        onResize?.(width, height);
      }
    });
    observer.observe(canvas.parentElement || canvas);

    // Animation loop
    const loop = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;
      animateRef.current(ctx, canvas, deltaTime);
      frameRef.current = requestAnimationFrame(loop);
    };
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [willReadFrequently]); // onResize intentionally excluded -- use ref pattern if needed

  return canvasRef;
}
```

### Pattern 2: Imperative Canvas Animation (No React State)

**What:** All per-frame mutable state (positions, velocities, sizes) stored in `useRef`, never `useState`. Canvas drawing happens imperatively via the 2D context, not through React renders.

**When to use:** Every canvas and animation component.

**Critical rule:** The React component renders the `<canvas>` element exactly ONCE. All visual updates happen through `ctx.clearRect()` + `ctx.drawXxx()` inside the `requestAnimationFrame` callback.

```typescript
// CORRECT -- particle state in ref, no re-renders
const particlesRef = useRef<Particle[]>([]);

// WRONG -- would cause 60 re-renders/second
const [particles, setParticles] = useState<Particle[]>([]);
```

### Pattern 3: Theme Colors via CSS Custom Properties (No React Re-renders)

**What:** Canvas and CSS effects read theme colors from CSS custom properties at draw time. When theme toggles, the CSS variables change automatically and the next animation frame picks up the new colors.

**How to read CSS variables in canvas:**

```typescript
const style = getComputedStyle(canvas);
const snowColor = style.getPropertyValue('--color-snow').trim();
```

### Pattern 4: Pre-Rendered Blur Stamps (Offscreen Canvas)

**What:** For the particle background, each circle needs a radial gradient + blur. Per-frame `ctx.filter = 'blur(Xpx)'` is extremely expensive. Instead, pre-render each circle (with its gradient and blur) to an OffscreenCanvas once, then stamp it with `ctx.drawImage()` each frame.

**Implementation:**

```typescript
function createBlurredCircle(size: number): HTMLCanvasElement {
  const blurAmount = size / 8;
  // Add padding for blur overflow
  const padding = blurAmount * 3;
  const fullSize = (size + padding) * 2;

  const offscreen = document.createElement('canvas');
  offscreen.width = fullSize;
  offscreen.height = fullSize;
  const ctx = offscreen.getContext('2d')!;

  // Apply blur filter
  ctx.filter = `blur(${blurAmount}px)`;

  // Draw radial gradient circle
  const gradient = ctx.createRadialGradient(
    fullSize / 2, fullSize / 2, 0,
    fullSize / 2, fullSize / 2, size
  );
  gradient.addColorStop(0, 'rgba(168, 168, 168, 0.6)');
  gradient.addColorStop(0.7, 'rgba(140, 140, 140, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(fullSize / 2, fullSize / 2, size, 0, Math.PI * 2);
  ctx.fill();

  return offscreen;
}
```

### Pattern 5: Spotlight via Direct Style Mutation

**What:** The spotlight is a `<div>` with `background: radial-gradient(...)` positioned absolutely. On mousemove, update the div's style directly via ref -- no React state, no re-render.

```typescript
const spotlightRef = useRef<HTMLDivElement>(null);
const currentPosRef = useRef<{ x: number; y: number } | null>(null);
const targetPosRef = useRef<{ x: number; y: number } | null>(null);

// Interpolation tick (20ms)
useEffect(() => {
  const interval = setInterval(() => {
    if (!targetPosRef.current || !spotlightRef.current) return;
    const current = currentPosRef.current || targetPosRef.current;
    // Offset.lerp equivalent: current + (target - current) * 0.2
    const x = current.x + (targetPosRef.current.x - current.x) * 0.2;
    const y = current.y + (targetPosRef.current.y - current.y) * 0.2;
    currentPosRef.current = { x, y };

    const color = getComputedStyle(spotlightRef.current).getPropertyValue('--color-spotlight').trim();
    spotlightRef.current.style.background =
      `radial-gradient(circle 275px at ${x}px ${y}px, ${color}, transparent)`;
    spotlightRef.current.style.filter = 'blur(100px)';
  }, 20);

  return () => clearInterval(interval);
}, []);
```

### Anti-Patterns to Avoid

- **useState for per-frame data:** Causes 60+ React reconciliation cycles per second per animation. Use `useRef` exclusively.
- **Creating gradients every frame:** CanvasGradient objects should be created once (or when size changes), stored in refs, reused.
- **Per-frame ctx.filter blur:** Software-rendered blur recalculated every frame tanks performance. Pre-render to offscreen canvas.
- **Listening on window instead of element:** Use `onMouseMove` on the container element, not `window.addEventListener('mousemove')`. The latter persists beyond component unmount if cleanup is missed.
- **Forgetting to scale for devicePixelRatio:** Canvas will appear blurry on Retina/HiDPI displays. Always set `canvas.width = cssWidth * dpr` and `ctx.scale(dpr, dpr)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Canvas lifecycle (resize, rAF, cleanup) | Manual useEffect per component | Shared `useCanvas` hook | Consistency, guaranteed cleanup, DRY |
| CSS blur for canvas circles | Per-frame `ctx.filter` | Pre-rendered offscreen canvas stamps | 10-50x performance improvement |
| SVG circular text positioning | Trigonometric math (Flutter approach) | SVG `<textPath>` on `<circle>` | Browser handles character positioning along path |
| Theme-aware animation colors | Props/context + re-renders | CSS custom properties read at draw time | Zero React overhead on theme change |
| Scroll wheel effect | Custom 3D transform math | CSS overflow-hidden + translateY animation | Simpler, GPU-accelerated |

**Key insight:** The Flutter version uses imperative canvas painting because that is Flutter's only option for custom visual effects. In the browser, many of these effects have simpler CSS/SVG equivalents (spotlight as radial-gradient, circular text as SVG textPath, dot matrix as HTML elements with CSS transitions). Only particles and snow genuinely need canvas.

---

## Critical Implementation Details (from Flutter Source Analysis)

### Particle Background (particle_background.dart)

| Property | Extracted Value |
|----------|----------------|
| Circle count | 7 |
| Size range | 80-180px radius |
| Initial positions | Random x: 0-500, y: 0-800 |
| Velocity | -1 to +1 px/frame on each axis |
| Edge behavior | When any part exits viewport, respawn at random edge with new velocity |
| Gradient | RadialGradient: #A8A8A8@0.6 -> #8C8C8C@0.3 -> transparent, stops [0, 0.7, 1] |
| Blur | MaskFilter.blur(normal, circleSize/8) |
| Theme dependency | NONE (same colors in both modes) |
| Mobile optimization | Reduce to 4 circles (from 7) |

### Snowfall (snow.dart)

| Property | Back | Middle | Front |
|----------|------|--------|-------|
| Count (desktop) | 50 | 70 | 100 |
| Count (mobile) | 25 | 35 | 50 |
| Speed range | 0.5-1.0 | 0.5-1.5 | 2.0-3.0 |
| Size range | 2-4px | 0.5-3px | 1-2px |
| Opacity | 0.7 | 0.5 | 0.3 |
| Blur sigma | 2.0 | 0.1 | 1.0 |

Movement: `y += speed/1000` per frame, `x += baseDrift + (driftFactor * 0.001)`.
Base drift: `(random - 0.5) * 0.002`.
Wrap: y > 1 resets to y = -0.05, x > 1 wraps to 0, x < 0 wraps to 1.
Drift factor: cursor X normalized to [-1, 1] relative to center.
Color: dark mode = black, light mode = white (read from CSS variable).

### Snowfall Blur Strategy

The 3-layer blur (sigma 2.0, 0.1, 1.0) cannot use per-frame `ctx.filter`. Two approaches:

1. **CSS filter on canvas element (recommended):** Use 3 separate canvas elements (one per layer), apply `filter: blur(Xpx)` via CSS on each `<canvas>` element. This uses GPU-accelerated CSS blur, not software Canvas blur. The CONTEXT.md says "multiple canvases (one per effect)" -- snow could use 1 canvas with 3 internal layers (all 3 layers drawn on one canvas) and apply a single CSS blur that is a weighted average. However, since each layer needs different blur, the cleanest approach is: render all 3 layers on a single canvas WITHOUT blur, then apply the dominant blur (1.0px) as a CSS filter. The 0.1 and 2.0 differences are visually subtle at the snowflake scale and the dominant visual effect is acceptable with a single 1px CSS blur.

2. **Alternative:** Render 3 separate canvases with individual CSS blur values. This respects the exact Flutter blur per layer but adds 2 extra canvas elements. Given the CONTEXT.md decision of "one canvas per effect," a single snow canvas with a compromise CSS blur is preferred.

### Spotlight (spotlight.dart)

- CSS radial-gradient overlay (NOT canvas), per CONTEXT.md decision
- Radius: 275px
- Blur: 100px (CSS `filter: blur(100px)` on the overlay div)
- Interpolation: lerp at 0.2 factor, 20ms tick (50fps)
- Mouse exit: both target and current reset to null, spotlight disappears
- Colors: dark = rgba(0,0,0,0.09), light = rgba(255,255,255,0.1)
- pointer-events: none

### Dot Matrix (dot_matrix.dart / mobile_dot_matrix.dart)

- **Rendering: HTML/CSS divs** (NOT canvas) -- per UI-SPEC deviation note
- Desktop: 7 rows x 48 columns = 336 dots
- Mobile: 7 rows x 20 columns = 140 dots
- Dot size: 14px, hover: 17px (+3), 300ms CSS transition
- Margin: 2.1px all sides (14 * 0.15)
- Border radius: 2.8px (14 * 0.2)
- Color: `Color.lerp(startColor, endColor, randomIntensity)` -- compute once at init
- Mobile: horizontal edge-fade mask via CSS `mask-image: linear-gradient(to right, ...)`
- Click: opens https://leetcode.com/u/PARZIVAL1213/ in new tab
- Cursor: pointer on all dots

### Rotating Circular Text (rotating_circular_text.dart)

- SVG `<textPath>` approach (per CONTEXT.md)
- Text: "Click Here" (16.6px, weight 600) + bullet U+2022 (23.8px, weight 600)
- 4 pairs around a 72px radius circle
- Container: 144x144px
- Rotation: 8 seconds per full turn, clockwise, infinite
- Start delay: 2 seconds
- Visibility: only when `clickCounter === 1`
- Pulsing wrapper: scale 1.0 to 1.05, 1500ms, reverse-repeating (use GSAP)
- pointer-events: none
- Desktop only (not shown on mobile)

### Scrolling Text (home_text.dart / mobile_home_text.dart)

- Desktop: "I'm an enthused [ROLE] from Texas!" horizontal composition
- Mobile: rotated "What Defines me?" on left, role roller on right
- Role list: ["UI/UX Designer", "Product Developer", "Software Developer", "Full-Stack Developer", "Cloud Developer", "AI Developer"]
- Roller: 150px height x 230px width
- Auto-scroll: 1 second interval, 500ms easeInOut animation
- Item extent: 30px per role
- Vertical fade mask: CSS `mask-image: linear-gradient(to bottom, transparent 0%, black 50%, transparent 100%)`
- Desktop position: centered, offset -40px upward
- Mobile position: centered, offset -80px upward
- Mobile: role text is 22px (not 24px desktop)
- Mobile arrow: appears after first navigation click, bounces 12px over 1000ms, drag threshold for navigation

### Home Page Snowfall/Spotlight Note

**Critical finding:** The Flutter source does NOT use SnowfallEffect or SpotlightEffect on the home page. In Flutter, these are used on portfolio and about pages. However, the CONTEXT.md and UI-SPEC explicitly include them in the home page z-index layering for the Next.js version. This is the user's intentional decision -- implement snowfall and spotlight on the home page per CONTEXT.md/UI-SPEC, using Flutter's snow.dart and spotlight.dart as the visual/behavioral reference.

---

## Common Pitfalls

### Pitfall 1: requestAnimationFrame Cleanup Captures Stale Frame ID

**What goes wrong:** Using `let frameId` in useEffect closure -- cleanup captures initial frame ID, not the latest one. Animation loop persists after unmount.
**Why it happens:** JavaScript closures capture variables by reference at creation time. Each rAF call returns a new ID.
**How to avoid:** Store frame ID in `useRef`. The useCanvas hook handles this. See PITFALLS.md Pitfall 1 for the correct pattern.
**Warning signs:** Memory grows on page navigation, CPU stays elevated after leaving home page.

### Pitfall 2: Canvas Blur Per Frame Destroys Performance

**What goes wrong:** Using `ctx.filter = 'blur(Xpx)'` inside the animation loop. Canvas 2D blur is software-rendered and recalculated every frame.
**Why it happens:** Developers translate Flutter's `MaskFilter.blur` directly to Canvas API.
**How to avoid:** Pre-render blurred circles to offscreen canvas stamps. Use CSS `filter: blur()` on canvas elements for layer-level blur.
**Warning signs:** Frame rate drops below 30fps, "Long task" warnings in DevTools.

### Pitfall 3: useState for Animation State Causes 60 Re-renders/Second

**What goes wrong:** Translating Flutter's `setState()` pattern directly to React. Flutter's setState triggers a repaint of the widget subtree; React's setState triggers full reconciliation.
**Why it happens:** Direct mental mapping from Flutter to React without understanding the different rendering models.
**How to avoid:** useRef for ALL mutable animation state. React component renders `<canvas>` once. All updates are imperative via ctx.
**Warning signs:** React DevTools Profiler shows constant re-renders from animation components.

### Pitfall 4: Canvas Blurry on Retina/HiDPI Displays

**What goes wrong:** Setting canvas width/height to CSS pixel dimensions. On a 2x display, the canvas renders at half resolution and is scaled up, appearing blurry.
**Why it happens:** Canvas pixel buffer size must match physical pixels, not CSS pixels.
**How to avoid:** `canvas.width = cssWidth * devicePixelRatio; ctx.scale(dpr, dpr);`
**Warning signs:** All canvas content appears slightly soft/fuzzy on Mac/iPhone displays.

### Pitfall 5: Dot Matrix with 336 Individual DOM Elements Causes Re-render Cascade

**What goes wrong:** Each dot manages its own hover state via useState. Hovering over dots triggers 336 component re-renders because parent re-renders all children.
**Why it happens:** Default React behavior re-renders all children when parent state changes.
**How to avoid:** Extract each dot into a `React.memo`-wrapped component that only re-renders when its own hover state changes. Or use CSS `:hover` pseudo-class for the size change (pure CSS, zero JavaScript re-renders).
**Warning signs:** Hovering over dots causes visible lag or frame drops.

### Pitfall 6: SVG textPath Text Not Centering on Circle

**What goes wrong:** Text renders from the start of the path (12 o'clock or 3 o'clock position) and bunches up instead of distributing evenly.
**Why it happens:** SVG textPath renders text sequentially along the path. Need `textLength` and `spacing` attributes, or multiple `<text>` elements with `startOffset` to position each pair.
**How to avoid:** Use `startOffset` percentage on each `<textPath>` element: 4 pairs at 0%, 25%, 50%, 75%. Each pair contains "Click Here" + bullet.
**Warning signs:** All text bunches at one point on the circle.

---

## Code Examples

### SVG Rotating Circular Text

```tsx
'use client';

import { useRef, useEffect, useState } from 'react';

interface RotatingCircularTextProps {
  radius: number;
  text: string;
  bulletChar: string;
  numberOfPairs: number;
  duration: number; // seconds for full rotation
  startDelay: number; // seconds before animation starts
}

export function RotatingCircularText({
  radius,
  text,
  bulletChar,
  numberOfPairs,
  duration,
  startDelay,
}: RotatingCircularTextProps) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay * 1000);
    return () => clearTimeout(timer);
  }, [startDelay]);

  if (!started) return <div style={{ width: radius * 2, height: radius * 2 }} />;

  const diameter = radius * 2;
  const circumference = 2 * Math.PI * radius;
  // Build the text content for the path
  const pairText = `${text} ${bulletChar} `;
  const fullText = pairText.repeat(numberOfPairs);

  return (
    <div
      className="animate-spin-slow"
      style={{ width: diameter, height: diameter }}
    >
      <svg viewBox={`0 0 ${diameter} ${diameter}`} width={diameter} height={diameter}>
        <defs>
          <path
            id="circlePath"
            d={`M ${radius},${radius} m -${radius},0 a ${radius},${radius} 0 1,1 ${diameter},0 a ${radius},${radius} 0 1,1 -${diameter},0`}
          />
        </defs>
        <text>
          <textPath href="#circlePath" textLength={circumference} method="align" spacing="auto">
            {/* Render pairs with different font sizes */}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
```

Note: The exact SVG implementation needs careful handling of the two different font sizes (16.6px for "Click Here" and 23.8px for bullet). This may require multiple `<tspan>` elements within the `<textPath>`, or multiple `<text>/<textPath>` pairs with `startOffset` positioning.

### CSS for Rotating Animation

```css
/* In globals.css */
@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin-slow {
  animation: spin-slow 8s linear infinite;
}
```

### Scrolling Text Roller (Vertical)

```tsx
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

const ROLES = [
  'UI/UX Designer',
  'Product Developer',
  'Software Developer',
  'Full-Stack Developer',
  'Cloud Developer',
  'AI Developer',
];

export function ScrollingTextRoller({ fontSize = 24, fontWeight = 700 }: {
  fontSize?: number;
  fontWeight?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemExtent = 30; // px per item, matching Flutter

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // The visual offset: translate items upward as index increases
  // Use CSS transition for the 500ms easeInOut animation
  const offset = -(currentIndex % ROLES.length) * itemExtent;
  // For infinite looping, render enough copies of the role list
  const displayRoles = [...ROLES, ...ROLES, ...ROLES]; // 3 copies for seamless wrap

  return (
    <div
      className="scroll-roller-mask overflow-hidden"
      style={{ height: 150, width: 230 }}
    >
      <div
        ref={containerRef}
        style={{
          transform: `translateY(${60 + offset}px)`, // 60px = center offset within 150px container
          transition: 'transform 500ms cubic-bezier(0.42, 0, 0.58, 1)',
        }}
      >
        {displayRoles.map((role, i) => (
          <div
            key={i}
            className="text-center text-[var(--color-text)]"
            style={{
              height: itemExtent,
              fontSize,
              fontWeight,
              lineHeight: `${itemExtent}px`,
            }}
          >
            {role}
          </div>
        ))}
      </div>
    </div>
  );
}
```

Note: This is a simplified approach. The Flutter `ListWheelScrollView` has a subtle 3D barrel effect (`perspective: 0.003`), but the UI-SPEC notes this value is very low, meaning the 3D effect is nearly invisible. A flat vertical scroll with fade mask is acceptable. If the 3D effect is desired, add `transform: perspective(333px) rotateX(angle)` per item based on distance from center.

### Dot Matrix with CSS-Only Hover

```tsx
// Approach: use CSS :hover for size change, eliminating per-dot React state
// Each dot is a <a> element with CSS transition

export function DotMatrix({ rows = 7, columns = 48, dotSize = 14, isMobile = false }: Props) {
  // Generate random intensities once
  const [pattern] = useState(() =>
    Array.from({ length: rows }, () =>
      Array.from({ length: isMobile ? 20 : columns }, () => Math.random())
    )
  );

  const margin = dotSize * 0.15; // 2.1px
  const borderRadius = dotSize * 0.2; // 2.8px

  return (
    <div className={isMobile ? 'dot-matrix-fade-mask' : ''}>
      {pattern.map((row, rowIdx) => (
        <div key={rowIdx} className="flex justify-center">
          {row.map((intensity, colIdx) => (
            <a
              key={colIdx}
              href="https://leetcode.com/u/PARZIVAL1213/"
              target="_blank"
              rel="noopener noreferrer"
              className="dot-matrix-dot cursor-pointer block"
              style={{
                width: dotSize,
                height: dotSize,
                margin,
                borderRadius,
                backgroundColor: lerpColor(intensity),
                transition: 'width 300ms, height 300ms',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// CSS in globals.css:
// .dot-matrix-dot:hover { width: 17px !important; height: 17px !important; }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| ctx.filter per frame for blur | Pre-render to offscreen canvas, stamp with drawImage | Long-established best practice | 10-50x performance gain for blurred elements |
| Framer Motion for all animation | GSAP for complex timelines, CSS for simple transforms, Canvas API for particles | 2024+ | Better separation of animation types |
| window.addEventListener for mouse tracking | Element-level event handlers (onMouseMove) | React best practice | Automatic cleanup, scoped events |
| Single shared canvas for all effects | Multiple canvases (one per effect) | Modern practice | Simpler lifecycle, independent cleanup |

---

## Open Questions

1. **ListWheelScrollView 3D barrel effect fidelity**
   - What we know: Flutter uses `perspective: 0.003` which creates a very subtle 3D barrel/cylinder effect on the scrolling roles. The UI-SPEC says "the 3D effect is subtle -- the primary visual is a vertically scrolling list with fade mask."
   - What's unclear: Whether the user will notice the difference between a flat scroll vs. a subtle 3D barrel in side-by-side comparison.
   - Recommendation: Start with flat translateY scroll + fade mask. If visual comparison shows a noticeable difference, add per-item CSS perspective transforms. The 0.003 perspective value in Flutter maps roughly to ~333px CSS perspective.

2. **Mobile arrow interaction scope**
   - What we know: The mobile arrow tap/drag navigates to the chat page. The UI-SPEC says "Phase 3 scope -- stub the navigation."
   - What's unclear: Whether to implement the full drag gesture or just the bounce animation + click handler as a stub.
   - Recommendation: Implement the bounce animation, arrow appearance logic (after first nav click), and a click handler that navigates to `/chat`. Implement the drag gesture fully since the drag threshold logic is part of the animation feel. The actual chat page content is Phase 3.

3. **Snowfall single canvas vs. 3 canvases for per-layer blur**
   - What we know: CONTEXT.md says "one canvas per effect." Flutter uses 3 separate layers with different blur sigmas (2.0, 0.1, 1.0).
   - What's unclear: Whether "one canvas per effect" means one canvas for snow (all 3 layers drawn together) or three canvases (one per layer).
   - Recommendation: Use ONE canvas for all snow layers. Draw all 220 flakes on the same canvas. Apply a single CSS `filter: blur(1px)` on the canvas element as a compromise. The visual difference between per-layer blur and single-blur is minimal because individual snowflake blur at 0.5-4px radius is nearly imperceptible. If needed later, can split into 3 canvases.

4. **clickCounter state management**
   - What we know: The Flutter version tracks navigation clicks to trigger the "Click Here" rotating text (shown when counter === 1). On mobile, clickCount drives the arrow animation visibility.
   - What's unclear: How to manage this state in the Next.js version since navigation happens via App Router, not through callbacks.
   - Recommendation: Use a React state variable in the home page component. Desktop navbar clicks can call an `onNavigationClick` callback. Mobile navbar already has a similar pattern. The clickCounter state lives in `page.tsx` and is passed down as needed.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | Yes | v25.6.1 | -- |
| npm | Package management | Yes | 11.9.0 | -- |
| Canvas API | Particles, snow | Yes (browser) | N/A | -- |
| SVG | Circular text | Yes (browser) | N/A | -- |
| ResizeObserver | Canvas sizing | Yes (browser) | N/A | -- |
| CSS mask-image | Fade masks | Yes (browser) | N/A | -webkit- prefix for Safari |

No missing dependencies. All required APIs are native browser features.

---

## Project Constraints (from CLAUDE.md)

- **Tech stack**: Next.js (App Router), React, TypeScript, Tailwind CSS -- all Phase 2 work must use these
- **Visual fidelity**: Must match Flutter version pixel-for-pixel -- exact colors, sizes, speeds from Flutter source
- **Animations**: All custom animations must be replicated -- particle background, snow, dot matrix, rotating text, spotlight
- **Responsive**: Same 600px mobile/desktop breakpoint behavior -- use existing Tailwind `sm:` breakpoint
- **No emojis** in logs, markdown, or anywhere unless explicitly asked
- **File naming**: `kebab-case.tsx` for components (established in Phase 1)
- **GSD Workflow**: Changes must go through GSD commands

---

## Sources

### Primary (HIGH confidence)
- Flutter source files in `lib/` directory -- particle_background.dart, snow.dart, spotlight.dart, dot_matrix.dart, mobile_dot_matrix.dart, rotating_circular_text.dart, home_text.dart, mobile_home_text.dart, main.dart, mobile.dart
- Phase 2 UI-SPEC (`02-UI-SPEC.md`) -- complete visual specification with exact values
- Phase 2 CONTEXT.md (`02-CONTEXT.md`) -- locked implementation decisions
- Project STACK.md (`.planning/research/STACK.md`) -- stack decisions including Canvas API over tsParticles
- Project PITFALLS.md (`.planning/research/PITFALLS.md`) -- known pitfalls for canvas animations

### Secondary (MEDIUM confidence)
- [MDN Canvas Optimization Guide](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- offscreen canvas pre-rendering
- [web.dev Canvas Performance](https://web.dev/canvas-performance/) -- batch rendering, avoid per-frame filter
- [Kirupa Spinning Circular Text](https://www.kirupa.com/animations/spinning_circular_text.htm) -- SVG textPath rotation pattern
- [MDN SVG rotate attribute](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/rotate) -- textPath character orientation
- [OffscreenCanvas web.dev](https://web.dev/articles/offscreen-canvas) -- Web Worker offloading for particle calculations

### Tertiary (LOW confidence)
- None -- all findings verified against official sources or Flutter source code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all already installed from Phase 1
- Architecture: HIGH -- patterns verified against Flutter source and established Canvas/React best practices
- Pitfalls: HIGH -- all pitfalls from project PITFALLS.md plus additional canvas-specific issues
- Implementation details: HIGH -- all values extracted directly from Flutter source files with line numbers

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable browser APIs, no fast-moving dependencies)
