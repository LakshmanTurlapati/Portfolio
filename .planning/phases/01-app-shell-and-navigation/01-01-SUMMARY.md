---
phase: 01-app-shell-and-navigation
plan: 01
subsystem: ui
tags: [next.js, tailwindcss-v4, next-themes, lato-font, postcss, react-icons, gsap]

# Dependency graph
requires: []
provides:
  - "Next.js 15 project scaffold with App Router and TypeScript"
  - "Tailwind CSS v4 CSS-first configuration with custom 600px breakpoint"
  - "Dark/light theme system via next-themes with system preference detection"
  - "Design token CSS variables for both light and dark modes"
  - "Background gradient classes (linear light, conic dark)"
  - "Lato font loaded via next/font with all available weights"
  - "cn() utility for conditional Tailwind class merging"
  - "useMounted and useMediaQuery hooks"
  - "NavLink and SocialLink type exports"
  - "Portfolio button image assets in public/icons/"
affects: [01-app-shell-and-navigation, 02-animations-and-home-page, 03-content-pages-and-chat, 04-transitions-and-deployment]

# Tech tracking
tech-stack:
  added: [next.js@15.5.14, react@19.1.0, tailwindcss@4.x, "@tailwindcss/postcss@4.x", next-themes@0.4.x, react-icons@5.x, gsap@3.x, "@gsap/react@2.x", clsx@2.x, tailwind-merge@3.x, postcss@8.x, typescript@5.x, eslint@9.x]
  patterns: [css-first-tailwind-config, next-themes-class-strategy, custom-css-variables-for-design-tokens, css-based-dark-mode-toggle]

key-files:
  created:
    - package.json
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - eslint.config.mjs
    - src/app/globals.css
    - src/app/layout.tsx
    - src/app/page.tsx
    - src/providers/theme-provider.tsx
    - src/lib/cn.ts
    - src/hooks/use-mounted.ts
    - src/hooks/use-media-query.ts
    - src/types/index.ts
    - public/icons/portfolio.png
    - public/icons/portfolio_light.png
  modified:
    - .gitignore

key-decisions:
  - "Lato font weights adjusted to 100,300,400,700,900 (actual Google Fonts availability) instead of plan's 400,500,600,700 -- weights 500 and 600 do not exist for Lato"
  - "Used Tailwind CSS v4 CSS-first configuration (no tailwind.config.js) with @custom-variant dark for class-based dark mode"
  - "PostCSS configured with @tailwindcss/postcss plugin (v4 pattern, not the old tailwindcss plugin)"

patterns-established:
  - "CSS-first Tailwind v4: all config in globals.css @theme block, no JS config file"
  - "Design tokens via CSS custom properties: :root for light mode, .dark for dark mode"
  - "ThemeProvider pattern: client component wrapping next-themes with attribute=class and defaultTheme=system"
  - "cn() utility: clsx + tailwind-merge for conditional class composition"
  - "Font loading: next/font/google with CSS variable applied on html element"

requirements-completed: [FOUN-01, FOUN-02, FOUN-05]

# Metrics
duration: 4min
completed: 2026-04-03
---

# Phase 01 Plan 01: Project Foundation Summary

**Next.js 15 project initialized with Tailwind CSS v4 CSS-first config, next-themes dark/light system detection, Lato font, and design token variables for both themes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-03T14:10:03Z
- **Completed:** 2026-04-03T14:14:42Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Next.js 15.5.14 project initialized with all 9 required Phase 1 dependencies
- Tailwind CSS v4 configured via CSS-first approach with custom 600px breakpoint (37.5rem)
- Theme system with next-themes detects system dark/light preference on load
- All design token CSS variables defined for both light and dark modes
- Background gradient utility classes created (linear gradient for light, conic gradient for dark)
- Lato font loaded via next/font with zero layout shift
- Utility files in place: cn(), useMounted, useMediaQuery hooks, type exports

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js 15 project and install all dependencies** - `b5d5e8d` (feat)
2. **Task 2: Configure root layout, theme provider, globals.css, and utility files** - `00404c7` (feat)

## Files Created/Modified
- `package.json` - Project configuration with all Phase 1 dependencies
- `tsconfig.json` - TypeScript configuration with path aliases (@/*)
- `next.config.ts` - Minimal Next.js config
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss plugin for Tailwind v4
- `eslint.config.mjs` - ESLint flat config with Next.js rules
- `.gitignore` - Updated with Next.js and Node patterns
- `src/app/globals.css` - Tailwind v4 CSS-first config, design tokens, gradient classes
- `src/app/layout.tsx` - Root layout with Lato font, ThemeProvider, metadata
- `src/app/page.tsx` - Placeholder home page with bg-gradient-main
- `src/providers/theme-provider.tsx` - Client-side theme provider wrapping next-themes
- `src/lib/cn.ts` - clsx + tailwind-merge utility function
- `src/hooks/use-mounted.ts` - SSR-safe mounted state guard
- `src/hooks/use-media-query.ts` - Custom hook for responsive breakpoint detection
- `src/types/index.ts` - NavLink and SocialLink interface exports
- `public/icons/portfolio.png` - Mobile portfolio button image (dark text)
- `public/icons/portfolio_light.png` - Mobile portfolio button image (light text)

## Decisions Made
- Lato font weights adjusted to [100, 300, 400, 700, 900] instead of plan-specified [400, 500, 600, 700]. Google Fonts Lato does not offer weights 500 or 600. The closest mapping: 400 (normal) stays as-is, 700 (bold) stays as-is, 500 (medium) maps to 400, and 600 (semibold) maps to 700. Components using these weights will need to apply font-weight via CSS with the nearest available weight.
- Accepted next-themes localStorage persistence as an improvement over Flutter's no-persistence behavior (documented in research as expected).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Lato font weight specification**
- **Found during:** Task 2 (Configure root layout)
- **Issue:** Plan specified weights ['400', '500', '600', '700'] but Google Fonts Lato only supports [100, 300, 400, 700, 900]. Build failed with "Unknown weight 500 for font Lato."
- **Fix:** Changed weight array to ['100', '300', '400', '700', '900'] to include all available Lato weights. Components needing weight 500/600 will use the nearest available weight (400 or 700).
- **Files modified:** src/app/layout.tsx
- **Verification:** npm run build completes successfully
- **Committed in:** 00404c7 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minimal -- font weight availability is a Google Fonts constraint, not a design flaw. All needed visual weights are covered by the available set.

## Issues Encountered
- create-next-app refused to initialize in a directory with existing Flutter files. Resolved by creating the project in /tmp and copying the scaffolding files, then creating package.json directly with all dependencies.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- App shell foundation is complete and builds successfully
- Theme detection, font loading, and Tailwind CSS v4 are all verified working
- Plans 01-02 (navbar components) and 01-03 (remaining shell elements) can proceed
- Portfolio button image assets are in place for mobile navbar implementation

## Self-Check: PASSED

All 15 created files verified present. Both task commits (b5d5e8d, 00404c7) verified in git log. SUMMARY.md exists at expected path.

---
*Phase: 01-app-shell-and-navigation*
*Completed: 2026-04-03*
