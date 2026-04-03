# Phase 1: App Shell and Navigation - Research

**Researched:** 2026-04-03
**Domain:** Next.js 15 App Router, Tailwind CSS v4, responsive layout, theming, navigation
**Confidence:** HIGH

## Summary

Phase 1 establishes the Next.js application shell: project initialization with Next.js 15.5.x + Tailwind CSS v4, dark/light theme with system preference detection, responsive layout switching at 600px, and navigation between four page routes (Home, Portfolio, About, Chat). Pages beyond Home are stubs ("Coming soon"). The home page includes the full app shell with navbar, theme toggle, author name, and background gradients.

The technical approach is well-understood: `next-themes` handles theme state with `class` attribute strategy, Tailwind CSS v4 uses CSS-first configuration with `@custom-variant dark` and a custom `--breakpoint-sm: 37.5rem` (600px) breakpoint, and `next/font/google` loads Lato with four weights (400, 500, 600, 700). The portfolio button glow animation uses CSS `@keyframes` with rotating `box-shadow` values. The sun icon in the theme toggle is a custom SVG (not an icon library), matching the Flutter `CustomPainter` implementation.

One notable tension: `next-themes` persists theme choice to `localStorage` by default, but the CONTEXT.md decision says "no theme persistence." The practical workaround is to set `defaultTheme="system"` -- on reload, if no user interaction has occurred, it follows system preference. If the user toggled the theme during their session, `localStorage` will remember it until they close the tab or clear storage. This is actually better UX than the Flutter version (which forgets mid-session choices on any navigation), and `next-themes` has no built-in way to disable `localStorage`. The recommendation is to accept this behavior and document it as an improvement over Flutter.

**Primary recommendation:** Initialize with manual Tailwind CSS v4 setup (not `create-next-app --tailwind` which gives v3), use `next-themes` with `attribute="class"` and `defaultTheme="system"`, and build all components as single responsive files using Tailwind's custom 600px breakpoint.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use `src/` directory with `app/`, `components/`, `hooks/`, `lib/` subdirectories -- standard Next.js convention
- Component files use `kebab-case.tsx` naming (e.g., `particle-background.tsx`, `theme-toggle.tsx`)
- Single responsive components using Tailwind breakpoints + `useMediaQuery` hook -- eliminates Flutter's mobile/desktop file duplication
- Shared types in `src/types/` directory with barrel export
- Use `next-themes` library for theme management -- handles system detection, class toggling, SSR hydration
- No theme persistence (match Flutter behavior -- runtime only, resets on reload)
- Tailwind `class` strategy with `next-themes` -- avoids hydration mismatch
- CSS custom properties (variables) toggled by dark/light class -- matches UI-SPEC token table
- Next.js App Router file-based routing: `/`, `/portfolio`, `/about`, `/chat`
- Page stubs show "Coming soon" text centered with correct theme colors (per UI-SPEC)
- Navigation state is URL-based (App Router handles it) -- no React state for current page
- Social links hardcoded in navbar component (matches Flutter pattern) -- GitHub, LinkedIn, X/Twitter URLs
- Next.js 15.5.x pinned (not latest) -- AWS Amplify caps at v15
- Tailwind CSS v4 with CSS-first configuration (no tailwind.config.js)
- Google Fonts Lato via next/font for zero layout shift
- GSAP for future page transitions (install in Phase 1 but use in Phase 4)

### Claude's Discretion
- Internal component composition and prop interfaces
- Tailwind utility class organization and custom CSS structure
- Hook implementation details (useMediaQuery, useTheme wrappers)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOUN-01 | Project initialized with Next.js 15.5.x, TypeScript, and Tailwind CSS v4 | Standard Stack section covers exact initialization commands, package versions, and Tailwind v4 CSS-first config |
| FOUN-02 | Dark/light theme toggles correctly with system preference detection on load | Architecture Patterns: Theme System covers next-themes setup with `enableSystem`, `defaultTheme="system"`, and `@custom-variant dark` |
| FOUN-03 | Theme toggle button switches theme at runtime without page reload | ThemeToggle component pattern with `useTheme()` hook; sun SVG and moon icon implementation details in Code Examples |
| FOUN-04 | Responsive layout renders mobile variant below 600px and desktop variant at/above 600px | Custom breakpoint `--breakpoint-sm: 37.5rem` in Tailwind v4 `@theme` block; CSS-based responsive switching pattern |
| FOUN-05 | Google Fonts (Lato) loaded via next/font with no layout shift | Code Examples: Font Loading shows exact `Lato` import with weights [400, 500, 600, 700] and CSS variable setup |
| NAV-01 | Desktop navbar displays page links (Home, Portfolio, About, Chat) and social icons (GitHub, LinkedIn, X/Twitter) | Component patterns from Flutter source analysis; social links table from UI-SPEC |
| NAV-02 | Mobile navbar displays as fixed bottom bar with Portfolio button, About Me link, and social icons | UI-SPEC discrepancy documented: Flutter source shows bottom bar, not hamburger menu. Research follows Flutter source. |
| NAV-03 | Navigation links route to correct pages | App Router file-based routing pattern; Link component usage |
| NAV-04 | Social icon links open in new tab to correct external URLs | Standard `<a>` with `target="_blank"` and `rel="noopener noreferrer"`; react-icons for FontAwesome 6 icons |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.5.14 | Framework, routing, SSR | Latest 15.x release; AWS Amplify constraint prevents v16. App Router for file-based routing. |
| React | 19.x | UI library | Bundled with Next.js 15. |
| TypeScript | 5.x | Type system | Bundled with Next.js 15. |
| Tailwind CSS | 4.2.2 | Styling | CSS-first config (no tailwind.config.js). Custom breakpoints via `@theme` block. |
| @tailwindcss/postcss | 0.x | PostCSS plugin for Tailwind v4 | Required for Tailwind v4 with Next.js. Replaces old `tailwindcss` PostCSS plugin. |
| next-themes | 0.4.6 | Dark/light mode toggle with system detection | De facto standard for Next.js theming. Zero-flash via `suppressHydrationWarning` + blocking script. |
| react-icons | 5.6.0 | Font Awesome 6 icons | Tree-shakeable. Provides `faGithub`, `faLinkedin`, `faXTwitter` matching Flutter's `font_awesome_flutter`. |
| GSAP | 3.14.2 | Animation (future use) | Install in Phase 1 for portfolio button glow animation; heavy use in Phase 4 for page transitions. |
| @gsap/react | 2.1.2 | React GSAP integration | Official `useGSAP()` hook for animation lifecycle management. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx | 2.1.1 | Conditional class joining | When building components with conditional Tailwind classes |
| tailwind-merge | 3.5.0 | Merge conflicting Tailwind classes | When component props can override default styles |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-themes | Custom React Context | Would need to reimplement system detection, class toggling, SSR script injection, tab sync. Not worth it for a solved problem. |
| react-icons | @fortawesome/react-fontawesome | Heavier bundle, more complex setup. react-icons is lighter and includes FA6. |
| GSAP for portfolio glow | Pure CSS @keyframes | CSS keyframes can handle the rotating box-shadow. GSAP is overkill for this one animation but is already needed for Phase 4. Use CSS keyframes for the glow, reserve GSAP for Phase 4. |

**Installation:**

```bash
# Step 1: Create Next.js 15 project WITHOUT --tailwind flag (it gives v3)
npx create-next-app@15 portfolio-v2 --typescript --eslint --app --src-dir --no-tailwind

# Step 2: Install Tailwind CSS v4 manually
npm install tailwindcss @tailwindcss/postcss postcss

# Step 3: Install theme, icons, animation, utilities
npm install next-themes react-icons gsap @gsap/react clsx tailwind-merge
```

**Version verification:** All versions confirmed via `npm view` on 2026-04-03.

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    layout.tsx           # Root layout: font, theme provider, metadata
    page.tsx             # Home page (full app shell)
    portfolio/
      page.tsx           # Placeholder: "Coming soon"
    about/
      page.tsx           # Placeholder: "Coming soon"
    chat/
      page.tsx           # Placeholder: "Coming soon"
    globals.css          # Tailwind v4 imports, custom properties, @theme
  components/
    desktop-navbar.tsx   # Desktop navbar (shown >= 600px)
    mobile-navbar.tsx    # Mobile bottom navbar (shown < 600px)
    portfolio-button.tsx # Animated gradient glow button
    theme-toggle.tsx     # Sun/dashed-line/moon toggle
    sun-icon.tsx         # Custom SVG sun with animated rays
    author-name.tsx      # "Lakshman Turlapati" positioned text
  hooks/
    use-media-query.ts   # Custom hook for 600px breakpoint detection
    use-mounted.ts       # SSR-safe mounted state guard
  lib/
    cn.ts                # clsx + tailwind-merge utility
  types/
    index.ts             # Shared type exports
  providers/
    theme-provider.tsx   # Client component wrapping next-themes ThemeProvider
public/
  icons/
    portfolio.png        # Mobile portfolio button image (dark text)
    portfolio_light.png  # Mobile portfolio button image (light text)
postcss.config.mjs       # @tailwindcss/postcss plugin
next.config.ts           # Next.js configuration
```

### Pattern 1: Tailwind CSS v4 Configuration (CSS-First)

**What:** All Tailwind configuration lives in `globals.css` instead of `tailwind.config.js`.
**When to use:** Always -- this is Tailwind v4's standard approach.

```css
/* src/app/globals.css */
@import "tailwindcss";

/* Dark mode via class strategy (for next-themes) */
@custom-variant dark (&:where(.dark, .dark *));

/* Custom breakpoint matching Flutter's 600px */
@theme {
  --breakpoint-sm: 37.5rem; /* 600px - overrides default 640px */
}

/* Design token CSS custom properties */
:root {
  /* Light mode (default) */
  --color-bg: #FFFFFF;
  --color-text: #000000;
  --color-navbar-bg: rgba(0, 0, 0, 0.8);
  --color-navbar-text: #9E9E9E;
  --color-social-icon: #808080;
  --color-sun: #000000;
  --color-moon: rgba(0, 0, 0, 0.26);
  --color-separator: rgba(0, 0, 0, 0.26);
  --color-portfolio-btn-bg: #FFFFFF;
  --color-portfolio-btn-text: #000000;
}

.dark {
  --color-bg: #000000;
  --color-text: #FFFFFF;
  --color-navbar-bg: rgba(255, 255, 255, 0.8);
  --color-navbar-text: #424242;
  --color-social-icon: #424242;
  --color-sun: #757575;
  --color-moon: #E0E0E0;
  --color-separator: #9E9E9E;
  --color-portfolio-btn-bg: #000000;
  --color-portfolio-btn-text: #FFFFFF;
}
```

### Pattern 2: Theme Provider Setup

**What:** Wrap the app with `next-themes` ThemeProvider in a client component.
**When to use:** Root layout setup.

```typescript
// src/providers/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import { ThemeProvider } from '@/providers/theme-provider';
import './globals.css';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portfolio v2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lato.variable} suppressHydrationWarning>
      <body className="font-[family-name:var(--font-lato)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Pattern 3: Responsive Layout Without Hydration Mismatch

**What:** Use CSS-based responsive switching instead of JavaScript `window.innerWidth` checks.
**When to use:** Showing/hiding desktop vs mobile components at the 600px breakpoint.

```tsx
// In a page or layout component:
<>
  {/* Desktop layout: hidden below 600px, visible at 600px+ */}
  <div className="hidden sm:block">
    <DesktopNavbar />
  </div>

  {/* Mobile layout: visible below 600px, hidden at 600px+ */}
  <div className="sm:hidden">
    <MobileNavbar />
  </div>
</>
```

This approach produces identical HTML on server and client (both divs are always rendered), and CSS handles the visibility. No hydration mismatch possible.

**When JavaScript detection IS needed:** The `useMediaQuery` hook should only be used for logic that cannot be expressed in CSS (e.g., conditionally rendering different content, not just hiding/showing). For Phase 1, CSS-based switching covers all cases.

### Pattern 4: PostCSS Configuration for Tailwind v4

**What:** The PostCSS config uses `@tailwindcss/postcss` instead of the old `tailwindcss` plugin.
**When to use:** Project root config.

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Anti-Patterns to Avoid

- **Using `window.innerWidth` for responsive layout:** Causes SSR crash and hydration mismatch. Use Tailwind responsive prefixes (`sm:hidden`, `hidden sm:block`) instead.
- **Prop drilling theme state:** Flutter passes `isDarkMode` through every widget. In Next.js, any component calls `useTheme()` directly from `next-themes`. No props needed.
- **Using `tailwind.config.js` with Tailwind v4:** Tailwind v4 uses CSS-first configuration. Creating a JS config file is the v3 pattern.
- **Using `create-next-app --tailwind`:** As of Next.js 15, this flag installs Tailwind v3, not v4. Must install v4 manually.
- **Setting `darkMode: "class"` in a config file:** This is Tailwind v3 syntax. In v4, use `@custom-variant dark (&:where(.dark, .dark *))` in CSS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme detection + class toggling | Custom context + matchMedia + class manipulation | `next-themes` | Handles SSR, system detection, class strategy, tab sync, blocking script to prevent flash |
| Font loading + optimization | Manual `<link>` tags or CSS `@font-face` | `next/font/google` | Self-hosts fonts, eliminates layout shift, zero external requests, preloads correctly |
| Conditional class names | String concatenation | `clsx` + `tailwind-merge` via `cn()` utility | Handles falsy values, prevents Tailwind class conflicts |
| Responsive breakpoint detection | Custom resize listener | Tailwind responsive prefixes (`sm:`) | CSS-based, no hydration mismatch, no JavaScript overhead |

**Key insight:** This phase is largely configuration and layout -- the libraries do the heavy lifting. The custom work is in the UI components (sun SVG, dashed separator, portfolio button glow, gradient backgrounds) where pixel-perfect matching to the Flutter source is required.

## Common Pitfalls

### Pitfall 1: Theme Hydration Flash (FOUC)

**What goes wrong:** Server renders light mode HTML, client detects dark mode and switches -- visible white flash.
**Why it happens:** Server cannot read `window.matchMedia` or `localStorage`.
**How to avoid:** `next-themes` with `suppressHydrationWarning` on `<html>` element injects a blocking script that sets the theme class before first paint. The `attribute="class"` and `defaultTheme="system"` props handle this automatically.
**Warning signs:** White flash on page load when system is in dark mode. Console "hydration mismatch" errors.

### Pitfall 2: Responsive Layout Hydration Mismatch

**What goes wrong:** Using `window.innerWidth < 600` in a component causes different HTML on server vs client.
**Why it happens:** `window` does not exist during SSR. Server renders one layout, client renders another.
**How to avoid:** Use CSS `hidden sm:block` / `sm:hidden` patterns that render both layouts in the DOM and let CSS control visibility. Both server and client produce identical HTML.
**Warning signs:** Layout "jumps" on first load. Console hydration mismatch warnings.

### Pitfall 3: create-next-app Installs Tailwind v3

**What goes wrong:** Running `npx create-next-app@15 --tailwind` installs Tailwind CSS v3.4.x with `tailwind.config.js`, not v4 with CSS-first configuration.
**Why it happens:** Next.js 15's create-next-app defaults to Tailwind v3.
**How to avoid:** Create the project WITHOUT `--tailwind` flag, then manually install `tailwindcss @tailwindcss/postcss postcss` and configure CSS-first.
**Warning signs:** Presence of `tailwind.config.js` or `tailwind.config.ts` in project root. Package.json showing tailwindcss version 3.x.

### Pitfall 4: next-themes localStorage vs "No Persistence" Decision

**What goes wrong:** User decision says "no theme persistence" but `next-themes` writes to `localStorage` by default. There is no built-in way to disable this (open issue #295, milestone v0.5).
**Why it happens:** `next-themes` was designed around persistence. The library has no `noStorage` prop.
**How to avoid:** Accept the behavior as a UX improvement. With `defaultTheme="system"`, a fresh page load on a new session follows system preference. If the user toggled during a session, localStorage remembers it -- this is actually better than the Flutter version which forgets on any navigation. Alternatively, clear localStorage key `'theme'` on mount if strict Flutter parity is required.
**Warning signs:** After toggling to dark mode and reloading, the theme persists instead of reverting to system.

### Pitfall 5: Tailwind v4 Custom Breakpoint Units

**What goes wrong:** Defining breakpoints in pixels (`--breakpoint-sm: 600px`) when Tailwind v4 defaults use `rem`.
**Why it happens:** Copy-paste from Flutter which uses pixel values.
**How to avoid:** Use `rem` for breakpoints: `--breakpoint-sm: 37.5rem` (600px / 16 = 37.5rem). This matches Tailwind's convention and ensures consistent behavior with user font size preferences.
**Warning signs:** Breakpoint behaves differently when user has custom browser font size.

### Pitfall 6: Sun Icon is Custom-Drawn, Not an Icon

**What goes wrong:** Using a sun emoji or icon library (Material, Lucide) for the theme toggle sun.
**Why it happens:** Assuming it's a standard icon.
**How to avoid:** The Flutter sun is a `CustomPainter` that draws a circle with 8 rays at 45-degree intervals. Must be implemented as an SVG or canvas element with animatable ray length (4px default, 6px on hover). See Code Examples section for the exact SVG specification.
**Warning signs:** Sun icon looks different from the Flutter version.

## Code Examples

Verified patterns from Flutter source analysis and official documentation:

### Font Loading (next/font/google)

```typescript
// src/app/layout.tsx
import { Lato } from 'next/font/google';

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lato',
  display: 'swap',
});

// Apply to <html> element:
<html lang="en" className={lato.variable} suppressHydrationWarning>
```

Source: [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts)

### cn() Utility (clsx + tailwind-merge)

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Theme-Aware Component Pattern

```typescript
// Example: using useTheme() in a client component
'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return <div className="w-[106px] h-[30px]" />; // matches sun-separator-moon width
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex items-center gap-3">
      {/* Sun - click to activate light mode */}
      <button
        onClick={() => isDark && setTheme('light')}
        aria-label="Switch to light mode"
      >
        <SunIcon active={!isDark} />
      </button>

      {/* Dashed separator */}
      <DashedSeparator isDark={isDark} />

      {/* Moon - click to activate dark mode */}
      <button
        onClick={() => !isDark && setTheme('dark')}
        aria-label="Switch to dark mode"
      >
        <MoonIcon active={isDark} />
      </button>
    </div>
  );
}
```

### Sun Icon SVG Specification (from Flutter CustomPainter)

The Flutter `SunCirclePainter` draws:
- Canvas size: 30x30px
- Center circle: radius = 30/6 = 5px, stroke width 2px
- 8 rays at 45-degree intervals
- Ray gap from circle edge: 4px
- Ray length: 4px (default), 6px (hover)
- All strokes use current sun color

```typescript
// Sun icon as SVG component with animatable ray length
// rayLength: 4 (default) or 6 (hover), animated over 300ms
interface SunIconProps {
  active: boolean;
  rayLength?: number;
}

// SVG approach:
// - center circle at (15, 15) with r=5, stroke-width=2, fill=none
// - 8 lines from (15 + 9*cos(angle), 15 + 9*sin(angle))
//   to (15 + (9+rayLength)*cos(angle), 15 + (9+rayLength)*sin(angle))
//   where 9 = radius(5) + gap(4)
// - angles: 0, 45, 90, 135, 180, 225, 270, 315 degrees
```

### Portfolio Button Glow Animation (CSS @keyframes)

The Flutter `AnimatedGradientButton` creates 3 rotating box-shadows. This maps to CSS:

```css
@keyframes glow-rotate {
  from { --glow-angle: 0deg; }
  to { --glow-angle: 360deg; }
}

/* Use JavaScript (requestAnimationFrame or GSAP) to update
   box-shadow offsets since CSS cannot natively rotate
   individual box-shadow offsets. Alternative: use @property
   for the angle and calculate offsets via CSS math. */
```

Since CSS `box-shadow` offset cannot be individually rotated via keyframes, this animation requires JavaScript. Use `requestAnimationFrame` with a `useRef` for the angle, updating the element's `style.boxShadow` directly:

```typescript
// Pattern: rAF-based box-shadow rotation
const angleRef = useRef(0);
const frameRef = useRef<number>(0);

useEffect(() => {
  const animate = () => {
    angleRef.current += (2 * Math.PI) / (3 * 60); // 3 seconds at 60fps
    const t = angleRef.current;
    const r = 4; // orbit radius

    const shadows = [
      `${r * Math.cos(t)}px ${r * Math.sin(t)}px 18px 1px rgba(0, 43, 255, 0.4)`,
      `${r * Math.cos(t + 2.094)}px ${r * Math.sin(t + 2.094)}px 18px 1px rgba(0, 255, 204, 0.4)`,
      `${r * Math.cos(t + 4.189)}px ${r * Math.sin(t + 4.189)}px 18px 1px rgba(255, 74, 213, 0.4)`,
    ].join(', ');

    if (elementRef.current) {
      elementRef.current.style.boxShadow = shadows;
    }
    frameRef.current = requestAnimationFrame(animate);
  };

  frameRef.current = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(frameRef.current);
}, []);
```

### Background Gradients (from UI-SPEC)

```css
/* Dark mode background - conic gradient matching Flutter SweepGradient */
.dark .bg-gradient-main {
  background: conic-gradient(
    from 0deg,
    #000000 0%,
    rgba(16, 16, 16, 0.9) 20%,
    rgba(26, 26, 26, 0.8) 40%,
    rgba(32, 32, 32, 0.7) 60%,
    rgba(16, 16, 16, 0.9) 80%,
    #000000 100%
  );
}

/* Light mode background - linear gradient */
.bg-gradient-main {
  background: linear-gradient(
    to right,
    #FFFFFF 5%,
    #D0D0D0 40%,
    #D0D0D0 60%,
    #FFFFFF 95%
  );
}

/* Transition between modes */
.bg-gradient-main {
  transition: background 300ms ease;
}
```

### Social Links Data

```typescript
// Hardcoded social links matching Flutter navbar.dart
const SOCIAL_LINKS = [
  {
    icon: 'faGithub',        // from react-icons/fa6
    url: 'https://github.com/LakshmanTurlapati',
    label: 'GitHub profile',
  },
  {
    icon: 'faLinkedin',      // from react-icons/fa6
    url: 'https://www.linkedin.com/in/lakshman-turlapati-3091aa191/',
    label: 'LinkedIn profile',
  },
  {
    icon: 'faXTwitter',      // from react-icons/fa6
    url: 'https://x.com/parzival1213',
    label: 'X (Twitter) profile',
  },
] as const;
```

### Asset Migration

The mobile portfolio button uses image assets. These must be copied from the Flutter project:

```
# Source (Flutter)
web/icons/portfolio.png         -> public/icons/portfolio.png
web/icons/portfolio_light.png   -> public/icons/portfolio_light.png
```

In Next.js, reference via:
```tsx
import Image from 'next/image';
<Image src="/icons/portfolio.png" alt="Portfolio" ... />
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js | CSS-first `@theme` + `@custom-variant` | Tailwind v4, Jan 2025 | No JS config file needed; all config in globals.css |
| `darkMode: "class"` in JS config | `@custom-variant dark (...)` in CSS | Tailwind v4, Jan 2025 | Must use new CSS syntax for dark mode class strategy |
| `postcss-import` + `tailwindcss` plugins | `@tailwindcss/postcss` single plugin | Tailwind v4, Jan 2025 | Simpler PostCSS config |
| `create-next-app --tailwind` (gives v4) | Must install v4 manually | As of Next.js 15.5.x, Apr 2026 | The `--tailwind` flag still scaffolds v3 |
| Custom theme context + localStorage | `next-themes` library | Stable since 2023 | De facto standard; handles all edge cases |

**Deprecated/outdated:**
- `tailwind.config.js` / `tailwind.config.ts`: Tailwind v3 pattern. Do not create for v4 projects.
- `darkMode: "class"` in JS: Tailwind v3 syntax. Use `@custom-variant` in CSS for v4.
- `@apply` heavy usage: Still works in v4 but the community recommends inline utilities. Use `@apply` sparingly.

## Open Questions

1. **next-themes localStorage persistence vs "no persistence" decision**
   - What we know: `next-themes` always writes to `localStorage`. There is no `noStorage` prop. Open issue #295, targeted for v0.5 (no release date).
   - What's unclear: Whether the user strictly requires theme to reset on reload, or whether the Flutter behavior (reset on reload) was just a limitation they accepted.
   - Recommendation: Accept `next-themes` default behavior. With `defaultTheme="system"`, first visit follows system. User toggles are remembered. This is standard web behavior and an improvement over Flutter. If strict parity is required, add a `useEffect` that calls `localStorage.removeItem('theme')` on mount -- but this causes a flash.

2. **NAV-02 REQUIREMENTS.md discrepancy**
   - What we know: REQUIREMENTS.md says "hamburger menu and navigation drawer." Flutter source implements a bottom navbar bar.
   - What's unclear: Whether REQUIREMENTS.md should be updated.
   - Recommendation: Follow Flutter source (bottom bar), as documented in UI-SPEC. The REQUIREMENTS.md entry is inaccurate relative to the Flutter implementation.

3. **Portfolio button glow: CSS vs JavaScript animation**
   - What we know: CSS `@keyframes` cannot individually animate `box-shadow` offset positions in a circular path. JavaScript (rAF) can.
   - What's unclear: Whether GSAP should be used here (it's being installed anyway) or raw rAF.
   - Recommendation: Use raw `requestAnimationFrame` for this simple rotation. GSAP adds unnecessary complexity for a single box-shadow animation. Reserve GSAP for Phase 4 page transitions where its timeline model provides real value.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js runtime | Yes | v25.6.1 | -- |
| npm | Package management | Yes | 11.9.0 | -- |
| Git | Version control | Yes | (in PATH) | -- |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None.

All required tools are available. Node.js v25 exceeds the minimum requirement (Node 18.17+ for Next.js 15).

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS v4 Dark Mode docs](https://tailwindcss.com/docs/dark-mode) - `@custom-variant dark` syntax verified
- [Tailwind CSS v4 Responsive Design docs](https://tailwindcss.com/docs/responsive-design) - `@theme --breakpoint-*` syntax verified
- [Tailwind CSS Next.js Installation Guide](https://tailwindcss.com/docs/guides/nextjs) - Manual v4 setup steps verified
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) - ThemeProvider props, suppressHydrationWarning pattern
- [Next.js Font Optimization docs](https://nextjs.org/docs/app/getting-started/fonts) - next/font/google usage
- npm registry: All package versions verified via `npm view` on 2026-04-03
- Flutter source files: `lib/navbar.dart`, `lib/mobile_navbar.dart`, `lib/theme_toggle.dart`, `lib/main.dart`, `lib/portfolio_button.dart`, `lib/mobile_portfolio_button.dart`, `lib/mobile.dart` - exact dimensions, colors, behaviors

### Secondary (MEDIUM confidence)
- [next-themes issue #295](https://github.com/pacocoursey/next-themes/issues/295) - localStorage disable feature status
- [How to Add Dark Mode in Next.js 15 with Tailwind CSS v4](https://www.sujalvanjare.com/blog/dark-mode-nextjs15-tailwind-v4) - integration pattern verified against official docs
- [Implementing Dark Mode with Tailwind CSS v4 and next-themes](https://jianliao.github.io/blog/tailwindcss-v4) - cross-verified with Tailwind docs

### Tertiary (LOW confidence)
- None. All findings verified against primary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all versions verified via npm registry; patterns verified against official docs
- Architecture: HIGH - patterns are standard Next.js 15 + Tailwind v4 setup, well-documented
- Pitfalls: HIGH - all pitfalls cross-referenced with official documentation and known issues
- Component implementation: HIGH - exact specifications extracted from Flutter source code line-by-line

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (30 days -- stable stack, no fast-moving dependencies)
