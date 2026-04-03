# Phase 2: Home Page and Canvas Animations - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver all visual effects on the home page: particle background, snowfall, dot matrix, rotating circular text, and spotlight effect. All animations must run at 60fps on desktop and mobile, match the Flutter version's visual appearance, and properly clean up on unmount to prevent memory leaks. The home page must assemble all effects with correct z-index layering.

</domain>

<decisions>
## Implementation Decisions

### Canvas Architecture
- Multiple canvases (one per effect) -- simpler lifecycle, independent cleanup, matches Flutter's per-widget approach
- Shared `useCanvas` hook standardizing requestAnimationFrame + useRef pattern across all effects, ensures consistent cleanup
- ResizeObserver on canvas parent for resize handling -- update canvas dimensions, recalculate positions
- Cap particle counts on mobile (detect via useMediaQuery) -- target 60fps on mid-range devices

### Animation Effects
- Rotating circular text: SVG with `<textPath>` on a `<circle>` -- CSS rotation animation, simpler than Flutter's trigonometric positioning
- Spotlight effect: CSS radial-gradient overlay with pointer tracking via mousemove/touchmove -- GPU-accelerated, no canvas needed
- Dot matrix: Canvas with pre-computed grid positions, theme-aware dot colors via CSS custom properties
- Snow particles: Custom physics matching Flutter -- random spawn at top, gravity + slight horizontal drift, reset on viewport exit

### Home Page Assembly
- Z-index layering: background gradient -> particles -> snow -> dot matrix -> spotlight -> content (navbar, text) -- matches Flutter Stack widget order
- Lazy initialization -- start animations only when home page is mounted, not on app load
- All effects read theme via CSS custom properties -- no React re-renders needed for color changes
- All effects render on both mobile and desktop (with reduced particle counts on mobile) -- matches Flutter behavior

### Claude's Discretion
- Exact particle counts and physics constants (extract from Flutter source)
- Canvas rendering optimizations (offscreen canvas, double buffering if needed)
- SVG textPath content and rotation speed for circular text
- useCanvas hook API design and cleanup implementation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Flutter `lib/particle_background.dart` -- reference for particle behavior, colors, count
- Flutter `lib/snow.dart` -- reference for snow physics, spawn logic, particle properties
- Flutter `lib/dot_matrix.dart` and `lib/mobile_dot_matrix.dart` -- reference for grid layout and dot styling
- Flutter `lib/rotating_circular_text.dart` -- reference for text content, rotation speed
- Flutter `lib/spotlight.dart` -- reference for spotlight size, interpolation, colors
- Phase 1 `src/hooks/use-media-query.ts` -- existing responsive hook for mobile detection
- Phase 1 `src/lib/cn.ts` -- utility for conditional classnames
- Phase 1 `src/app/globals.css` -- CSS custom properties for theme colors

### Established Patterns
- Components use `kebab-case.tsx` naming
- Theme colors accessed via CSS custom properties (no prop drilling)
- Responsive breakpoint at 600px via `useMediaQuery` or Tailwind `sm:` prefix
- `useMounted` hook for SSR safety

### Integration Points
- `src/app/page.tsx` -- home page where all effects will be composed
- Canvas components mount as children of the home page with absolute positioning
- Theme colors from `globals.css` CSS custom properties

</code_context>

<specifics>
## Specific Ideas

- Extract exact particle counts, speeds, sizes from Flutter source files
- Use `useRef` for all animation state to avoid React re-renders during animation frames
- Canvas elements should have `pointer-events: none` so they don't block interaction with navbar/buttons
- Snow and particle effects should be behind content (lower z-index) while spotlight is above

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
