# Phase 1: App Shell and Navigation - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the Next.js app shell with working navigation between all four pages (Home, Portfolio, About, Chat), dark/light theme toggle with system preference detection, and responsive layout switching at 600px breakpoint. Pages are stubs ("Coming soon") except for the shell structure. All visual styling must match the Flutter version per the UI-SPEC.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- Use `src/` directory with `app/`, `components/`, `hooks/`, `lib/` subdirectories -- standard Next.js convention
- Component files use `kebab-case.tsx` naming (e.g., `particle-background.tsx`, `theme-toggle.tsx`)
- Single responsive components using Tailwind breakpoints + `useMediaQuery` hook -- eliminates Flutter's mobile/desktop file duplication
- Shared types in `src/types/` directory with barrel export

### Theme System
- Use `next-themes` library for theme management -- handles system detection, class toggling, SSR hydration
- No theme persistence (match Flutter behavior -- runtime only, resets on reload)
- Tailwind `class` strategy with `next-themes` -- avoids hydration mismatch
- CSS custom properties (variables) toggled by dark/light class -- matches UI-SPEC token table

### Navigation & Routing
- Next.js App Router file-based routing: `/`, `/portfolio`, `/about`, `/chat`
- Page stubs show "Coming soon" text centered with correct theme colors (per UI-SPEC)
- Navigation state is URL-based (App Router handles it) -- no React state for current page
- Social links hardcoded in navbar component (matches Flutter pattern) -- GitHub, LinkedIn, X/Twitter URLs

### Claude's Discretion
- Internal component composition and prop interfaces
- Tailwind utility class organization and custom CSS structure
- Hook implementation details (useMediaQuery, useTheme wrappers)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Flutter `lib/navbar.dart` -- reference for desktop navbar layout, colors, dimensions
- Flutter `lib/mobile_navbar.dart` -- reference for mobile navbar layout
- Flutter `lib/theme_toggle.dart` -- reference for theme toggle animation (sun/moon/separator)
- Flutter `lib/main.dart` -- reference for responsive breakpoint logic, theme colors, gradient backgrounds
- Flutter `lib/portfolio_button.dart` -- reference for animated gradient button
- UI-SPEC at `.planning/phases/01-app-shell-and-navigation/01-UI-SPEC.md` -- exact design contract

### Established Patterns
- Flutter uses `LayoutBuilder` with 600px breakpoint -- Next.js will use Tailwind responsive + useMediaQuery
- Flutter passes `isDarkMode` and `toggleTheme` via constructor props -- Next.js uses `next-themes` context
- Flutter uses separate mobile/desktop files -- Next.js consolidates into responsive components

### Integration Points
- App Router layout.tsx -- root layout with ThemeProvider, fonts, metadata
- Navigation components mount in layout -- shared across all pages
- Theme provider wraps entire app at layout level

</code_context>

<specifics>
## Specific Ideas

- Next.js 15.5.x pinned (not latest) -- AWS Amplify caps at v15
- Tailwind CSS v4 with CSS-first configuration (no tailwind.config.js)
- Google Fonts Lato via next/font for zero layout shift
- GSAP for future page transitions (install in Phase 1 but use in Phase 4)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope.

</deferred>
