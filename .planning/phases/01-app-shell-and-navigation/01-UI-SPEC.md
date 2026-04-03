---
phase: 1
slug: app-shell-and-navigation
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 1 -- UI Design Contract

> Visual and interaction contract for the App Shell and Navigation phase. This is a 1:1 migration from Flutter -- all values are extracted directly from the Dart source files and must be replicated exactly in Next.js.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind CSS v4 only -- no shadcn) |
| Preset | not applicable |
| Component library | none (custom components matching Flutter originals) |
| Icon library | Font Awesome 6 (react-icons/fa6) -- matches Flutter's font_awesome_flutter |
| Font | Lato via next/font/google -- matches Flutter's GoogleFonts.latoTextTheme() |

Source: REQUIREMENTS.md FOUN-01, FOUN-05; Flutter `main.dart` line 88

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Inline icon padding |
| sm | 8px | Social icon gaps (Flutter SizedBox(width: 8)) |
| md | 12px | Theme toggle element gaps (Flutter SizedBox(width: 12)) |
| lg | 20px | Page edge insets: bottom/left/right positioning, mobile name/toggle offset |
| xl | 24px | Navbar border-radius approximation base |
| 2xl | 30px | Desktop author name right offset (Positioned right: 30) |

Exceptions:
- Desktop navbar width: 630px (fixed, not from scale) -- Flutter `navbar.dart` line 123-124
- Desktop navbar height: 60px (fixed) -- Flutter `navbar.dart` line 124
- Mobile navbar height: 70px (fixed) -- Flutter `mobile_navbar.dart` line 113
- Desktop portfolio button width: 200px (fixed) -- Flutter `navbar.dart` line 145
- Navbar border-radius: 25px -- Flutter `navbar.dart` line 137
- Portfolio button inner border-radius: 20px -- Flutter `portfolio_button.dart` line 103

### Migration Override: Non-Standard Spacing Tokens

This project is a 1:1 pixel-faithful migration from Flutter. The following spacing tokens do not appear in the standard 8-point set (4, 8, 16, 24, 32, 48, 64) but are mandated by the Flutter source code. Changing these values would break visual fidelity with the production Flutter site at audienclature.com.

| Token | Value | Standard? | Flutter Source | Justification |
|-------|-------|-----------|----------------|---------------|
| md | 12px | Multiple of 4 but not in standard set | `lib/theme_toggle.dart` line 113: `const SizedBox(width: 12)` (gap between sun and dashed separator); line 122: `const SizedBox(width: 12)` (gap between dashed separator and moon); `lib/navbar.dart` line 177: `right: 12` (social icons right padding) | The theme toggle is a tightly composed sun--separator--moon row. Collapsing 12px to 8px would crowd the elements; expanding to 16px would visually disconnect them. The Flutter design intentionally uses 12px for compact-but-readable gaps in small inline controls. |
| lg | 20px | Multiple of 4 but not in standard set | `lib/mobile.dart` line 74: `top: 20` (mobile author name); line 75: `left: 20` (mobile author name); line 88: `top: 20` (mobile theme toggle); line 89: `right: 20` (mobile theme toggle); line 120: `bottom: 20` (mobile navbar); line 121: `left: 20` (mobile navbar); line 122: `right: 20` (mobile navbar); `lib/main.dart` line 315: `bottom: 20` (desktop theme toggle); line 316: `left: 20` (desktop theme toggle); line 325: `bottom: 20` (desktop author name) | 20px is the universal page-edge inset used throughout both mobile and desktop layouts. Adjusting to 16px or 24px would shift every edge-positioned element and break alignment parity with the Flutter version. |
| 2xl | 30px | NOT a multiple of 4 | `lib/main.dart` line 326: `right: 30` (desktop author name right offset from viewport edge) | This is the only non-multiple-of-4 spacing value in the entire Phase 1 scope. In the Flutter source, the desktop author name "Lakshman Turlapati" is positioned at `Positioned(bottom: 20, right: 30, ...)`. Adjusting to 32px would shift the author name 2px leftward from its Flutter position, breaking pixel fidelity. Since this is a migration with visual match as the core constraint, the original 30px must be preserved. |

---

## Typography

| Role | Size | Weight | Line Height | Source |
|------|------|--------|-------------|--------|
| Body | 16px | 400 (normal) | 1.5 | Navbar "About Me" text -- `navbar.dart` line 168 |
| Label | 18px | 600 (semibold) | 1.4 | Portfolio button text -- `portfolio_button.dart` line 123 |
| Heading | 20px | 600 (semibold) | 1.3 | Author name "Lakshman Turlapati" -- `main.dart` line 338-339 |
| Display | 24px | 400 (normal) / 700 (bold for roles) | 1.2 | Home scrolling text -- `home_text.dart` lines 69-70, 104-106 |

Font family: `Lato` for all roles. Loaded via `next/font/google` with `display: 'swap'` and subsets `['latin']`.

Declared primary weights: 400 (normal) and 600 (semibold).

### Migration Override: 4 Font Weights Required

This project uses 4 font weights (400, 500, 600, 700) instead of the recommended maximum of 2. All 4 weights are explicitly declared in the Flutter source code and collapsing to 2 would produce visually incorrect results. Each weight serves a distinct role, and the Flutter design uses specific weight values to create a deliberate visual hierarchy.

| Weight | Flutter Constant | Files and Lines | Elements | Why Collapsing Breaks Fidelity |
|--------|-----------------|-----------------|----------|-------------------------------|
| 400 (normal) | `FontWeight.normal` | `lib/home_text.dart` line 71: `fontWeight: FontWeight.normal` (static text "I'm an enthused"); `lib/home_text.dart` line 125: `fontWeight: FontWeight.normal` (static text "from Texas!") | Static surrounding text in the desktop scrolling text composition | Weight 400 is paired with weight 700 on the same line ("I'm an enthused **[role]** from Texas!"). Changing 400 to 600 would eliminate the contrast between static and dynamic text, flattening the visual hierarchy. |
| 500 (medium) | `FontWeight.w500` | `lib/mobile.dart` line 80: `fontWeight: FontWeight.w500` | Mobile author name "Lakshman Turlapati" (top-left corner) | Desktop uses 600 for the same text (`main.dart` line 339). Mobile intentionally uses 500 to appear slightly lighter on smaller screens, avoiding visual heaviness. Using 600 on mobile would make mobile and desktop author names identical weight, which contradicts the Flutter design's deliberate platform differentiation. Using 400 would make it too light. |
| 600 (semibold) | `FontWeight.w600` | `lib/main.dart` line 339: `fontWeight: FontWeight.w600` (desktop author name); `lib/portfolio_button.dart` line 121: `fontWeight: FontWeight.w600` (Portfolio button label) | Desktop author name, Portfolio button text | 600 is the primary emphasis weight. It distinguishes interactive/branded elements from body text (400) and role text (700). |
| 700 (bold) | `FontWeight.bold` | `lib/navbar.dart` line 166: `fontWeight: FontWeight.bold` (desktop "About Me" text); `lib/mobile_navbar.dart` line 146: `fontWeight: FontWeight.bold` (mobile "About Me" text); `lib/home_text.dart` line 105: `fontWeight: FontWeight.bold` (desktop scrolling role names); `lib/mobile_home_text.dart` line 220: `fontWeight: FontWeight.bold` (mobile "Defines" text); `lib/mobile_home_text.dart` line 361: `fontWeight: FontWeight.bold` (mobile scrolling role names) | "About Me" navbar link, scrolling role titles ("UI/UX Designer", "Product Developer", etc.), mobile "Defines" text | 700 is used for high-emphasis interactive text ("About Me") and the rotating role names that are the visual focal point of the home page. Dropping to 600 would make these elements indistinguishable from the Portfolio button and author name, collapsing two distinct hierarchy levels into one. |

**Conclusion:** All 4 weights are load-bearing in the Flutter design's visual hierarchy. The `next/font/google` loader must import Lato with weights `[400, 500, 600, 700]`.

---

## Color

### Dark Mode

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #000000 | Page background (sweep gradient center) |
| Gradient stops | #000000, #101010, #1A1A1A, #202020 | Sweep gradient at stops 0.0, 0.2, 0.4, 0.6, 0.8, 1.0 |
| Navbar background | rgba(255,255,255,0.8) | White at 80% opacity -- `navbar.dart` line 134 |
| Navbar text | grey[800] = #424242 | "About Me" text, social icons -- `navbar.dart` lines 165, 186 |
| Portfolio button bg | #000000 | Button surface -- `portfolio_button.dart` line 101 |
| Portfolio button text | #FFFFFF | Button label -- `portfolio_button.dart` line 119 |
| Body text | #FFFFFF | Author name, scrolling text -- `main.dart` line 340 |
| Theme toggle sun | grey[600] = #757575 | Sun icon color -- `theme_toggle.dart` line 103 |
| Theme toggle moon | grey[300] = #E0E0E0 | Moon icon color (active state) -- `theme_toggle.dart` line 153 |
| Theme toggle separator | grey = #9E9E9E | Dashed line color -- `theme_toggle.dart` line 229 |
| Meta theme-color | #000000 | Safari browser chrome -- `main.dart` line 45 |

### Light Mode

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #FFFFFF | Page background (linear gradient edges) |
| Gradient mid | #D0D0D0 | Linear gradient center band at stops 0.4-0.6 -- `main.dart` lines 214-219 |
| Gradient stops | #FFFFFF, #D0D0D0, #D0D0D0, #FFFFFF | At stops 0.05, 0.4, 0.6, 0.95 |
| Navbar background | rgba(0,0,0,0.8) | Black at 80% opacity -- `navbar.dart` line 135 |
| Navbar text | grey = #9E9E9E | "About Me" text -- `navbar.dart` line 165 |
| Social icon color | #808080 | Social icons -- `navbar.dart` line 186, 202, 219 |
| Portfolio button bg | #FFFFFF | Button surface -- `portfolio_button.dart` line 101 |
| Portfolio button text | #000000 | Button label -- `portfolio_button.dart` line 119 |
| Body text | #000000 | Author name, scrolling text -- `main.dart` line 340 |
| Theme toggle sun | #000000 | Sun icon color (active state) -- `theme_toggle.dart` line 104 |
| Theme toggle moon | black26 = rgba(0,0,0,0.26) | Moon icon color -- `theme_toggle.dart` line 154 |
| Theme toggle separator | black26 = rgba(0,0,0,0.26) | Dashed line color -- `theme_toggle.dart` line 229 |
| Meta theme-color | #FFFFFF | Safari browser chrome -- `main.dart` line 45 |

### Portfolio Button Gradient Glow (both modes)

| Color | Hex | Opacity | Blur | Spread |
|-------|-----|---------|------|--------|
| Blue | #002BFF | 0.4 | 18px | 1px |
| Cyan | #00FFCC | 0.4 | 18px | 1px |
| Pink | #FF4AD5 | 0.4 | 18px | 1px |

Animation: 3 shadows rotate in a circle (radius 4px offset) over 3 seconds, repeating infinitely.
Source: `portfolio_button.dart` lines 50-63

Accent reserved for: Portfolio button gradient glow only (blue #002BFF, cyan #00FFCC, pink #FF4AD5). These three colors appear nowhere else in the app shell.

---

## Component Inventory (Phase 1)

### 1. RootLayout

Wraps all pages. Manages theme state at the top level.

| Property | Value |
|----------|-------|
| Theme detection | System preference via `prefers-color-scheme` media query on load |
| Theme state | Boolean `isDarkMode` in React state, passed to all children |
| Theme transition | 300ms CSS transition on background gradient |
| Breakpoint | 600px -- below is mobile, at/above is desktop |
| Background (dark) | CSS conic-gradient (sweep) with stops: #000000 0%, #101010 20%, #1A1A1A 40%, #202020 60%, #101010 80%, #000000 100% |
| Background (light) | CSS linear-gradient(to right, #FFFFFF 5%, #D0D0D0 40%, #D0D0D0 60%, #FFFFFF 95%) |

### 2. DesktopNavbar

Centered fixed-width navbar at top of viewport.

| Property | Value |
|----------|-------|
| Position | Centered horizontally, 10px from top |
| Width | 630px |
| Height | 60px |
| Background (dark) | rgba(255,255,255,0.8) |
| Background (light) | rgba(0,0,0,0.8) |
| Border radius | 25px |
| Layout | Stack: Portfolio button left (200px), "About Me" centered, social icons right |
| Social icon spacing | 8px between icons, icons positioned right with 12px right padding |

### 3. MobileNavbar

Full-width navbar at bottom of viewport.

| Property | Value |
|----------|-------|
| Position | Fixed at bottom, 20px from bottom/left/right edges |
| Width | 90% of viewport width (screenWidth * 0.9) |
| Height | 70px |
| Background | Same as desktop (inverted colors with 0.8 opacity) |
| Border radius | 25px |
| Layout | Row with flex 2:2:3 -- Portfolio button, "About Me" center, social icons right |
| Social icon size | Clamped between 12px and 18px (responsive to available width) |

### 4. PortfolioButton (Desktop)

Animated gradient glow button on the left side of the navbar.

| Property | Value |
|----------|-------|
| Width | 200px (fills left portion of navbar) |
| Height | Full navbar height (60px) |
| Outer border-radius | 25px (matches navbar) |
| Inner button border-radius | 20px |
| Inner button size | 95% width, 80% height of container |
| Button bg (dark) | #000000 |
| Button bg (light) | #FFFFFF |
| Text | "Portfolio" at 18px, weight 600 |
| Text color (dark) | #FFFFFF |
| Text color (light) | #000000 |
| Glow animation | 3 rotating box-shadows (blue/cyan/pink), 3s infinite loop |
| Glow blur | 18px |
| Glow opacity | 0.4 |
| Glow orbit radius | 4px offset from center |
| Elevation | CSS shadow for subtle lift |

### 5. PortfolioButton (Mobile)

Same glow animation but uses an image instead of text.

| Property | Value |
|----------|-------|
| Width | Flex 2 of parent row |
| Inner button size | 90% width, 80% height |
| Image (dark) | portfolio_light.png (white version) |
| Image (light) | portfolio.png (dark version) |
| Image scale | 1.4x |
| All other properties | Same as desktop variant |

### 6. ThemeToggle

Sun/moon toggle with dashed line separator.

| Property | Value |
|----------|-------|
| Layout | Horizontal row: Sun -- DashedLine -- Moon |
| Gap | 12px between each element |
| Sun canvas size | 30x30px |
| Sun circle radius | 5px (size.width / 6) |
| Sun ray count | 8 rays at 45-degree intervals |
| Sun ray length | 4px default, 6px on hover |
| Sun stroke width | 2px |
| Sun color (dark/inactive) | #757575 (grey[600]) |
| Sun color (light/active) | #000000 |
| Moon icon | Material `nightlight_round` equivalent |
| Moon size | 24px default, 26px on hover |
| Moon rotation | -30 degrees (-0.523599 radians) constant |
| Moon color (dark/active) | #E0E0E0 (grey[300]) |
| Moon color (light/inactive) | rgba(0,0,0,0.26) |
| Dashed separator height | 22px |
| Dashed separator dash width | 1px |
| Dashed separator dash height | 3px |
| Dashed separator color (dark) | #9E9E9E (grey) |
| Dashed separator color (light) | rgba(0,0,0,0.26) |
| Hover animation duration | 300ms easeInOut |
| Behavior | Clicking sun activates light mode (only if currently dark). Clicking moon activates dark mode (only if currently light). |

### 7. Desktop Position: ThemeToggle

| Property | Value |
|----------|-------|
| Position | Bottom-left corner: bottom 20px, left 20px |

### 8. Mobile Position: ThemeToggle

| Property | Value |
|----------|-------|
| Position | Top-right corner: top 20px, right 20px |

### 9. AuthorName (Desktop)

| Property | Value |
|----------|-------|
| Position | Bottom-right corner: bottom 20px, right 30px |
| Text | "Lakshman Turlapati" |
| Font size | 20px |
| Font weight | 600 (semibold) |
| Color (dark) | #FFFFFF |
| Color (light) | #000000 |
| Hover effect | Text shadow: offset(2,2), blur 4px, color black54 (dark) / black38 (light) |
| Cursor | pointer |

### 10. AuthorName (Mobile)

| Property | Value |
|----------|-------|
| Position | Top-left corner: top 20px, left 20px |
| Text | "Lakshman Turlapati" |
| Font size | 20px |
| Font weight | 500 (medium) |
| Color (dark) | #FFFFFF |
| Color (light) | #000000 |
| Hover effect | None |

---

## Interaction Contracts

### Theme Toggle

| Trigger | Behavior |
|---------|----------|
| System preference detected on load | Set isDarkMode to match system |
| System preference changes while app is open | Update isDarkMode automatically |
| Click sun icon (while in dark mode) | Switch to light mode, no page reload, 300ms transition |
| Click moon icon (while in light mode) | Switch to dark mode, no page reload, 300ms transition |
| Click sun icon (already in light mode) | No action |
| Click moon icon (already in dark mode) | No action |
| Hover sun/moon icon | Scale animation: ray length 4->6px (sun), size 24->26px (moon), 300ms easeInOut |

### Navigation

| Trigger | Behavior |
|---------|----------|
| Click "Portfolio" button | Navigate to /portfolio route (placeholder page for Phase 1) |
| Click "About Me" text | Navigate to /about route (placeholder page for Phase 1) |
| Click GitHub icon | Open https://github.com/LakshmanTurlapati in new tab |
| Click LinkedIn icon | Open https://www.linkedin.com/in/lakshman-turlapati-3091aa191/ in new tab |
| Click X/Twitter icon | Open https://x.com/parzival1213 in new tab |
| Failed URL launch | Show snackbar/toast: "Could not open link" |

Note: Circular reveal page transitions are Phase 4 scope. Phase 1 uses standard Next.js App Router navigation.
Note: Chat navigation is Phase 3 scope. The navbar does NOT include a Chat link in the Flutter desktop navbar (chat is accessed via a bottom chat placeholder widget). Phase 1 should include placeholder routes for /portfolio, /about, and /chat.

### Responsive Layout

| Viewport | Behavior |
|----------|----------|
| Width >= 600px | Desktop layout: centered top navbar, theme toggle bottom-left, author name bottom-right |
| Width < 600px | Mobile layout: author name top-left, theme toggle top-right, navbar at bottom |
| Breakpoint crossing | Immediate layout switch (no animation) via CSS/LayoutBuilder equivalent |

---

## Background Gradients

### Dark Mode Background

Type: Conic gradient (CSS `conic-gradient` -- equivalent to Flutter `SweepGradient`)

```css
background: conic-gradient(
  from 0deg,
  #000000 0%,
  rgba(16,16,16,0.9) 20%,
  rgba(26,26,26,0.8) 40%,
  rgba(32,32,32,0.7) 60%,
  rgba(16,16,16,0.9) 80%,
  #000000 100%
);
```

### Light Mode Background

Type: Linear gradient (CSS `linear-gradient`)

```css
background: linear-gradient(
  to right,
  #FFFFFF 5%,
  #D0D0D0 40%,
  #D0D0D0 60%,
  #FFFFFF 95%
);
```

Transition between modes: 300ms ease on the background property.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Portfolio button label (desktop) | "Portfolio" |
| Portfolio button label (mobile) | Image asset (portfolio.png / portfolio_light.png) |
| About link label | "About Me" |
| Author attribution | "Lakshman Turlapati" |
| Social link failure toast | "Could not open link" |
| Placeholder page heading | "{Page Name}" (e.g., "Portfolio", "About", "Chat") |
| Placeholder page body | "Coming soon" |
| Browser tab title | "Portfolio v2" |

Note: No empty states, error states, or destructive actions exist in Phase 1. The app shell is purely navigational.

---

## Social Links

| Platform | Icon | URL | Accessible Label |
|----------|------|-----|-------------------|
| GitHub | FontAwesome `faGithub` | https://github.com/LakshmanTurlapati | `aria-label="GitHub profile"` |
| LinkedIn | FontAwesome `faLinkedin` | https://www.linkedin.com/in/lakshman-turlapati-3091aa191/ | `aria-label="LinkedIn profile"` |
| X/Twitter | FontAwesome `faXTwitter` | https://x.com/parzival1213 | `aria-label="X (Twitter) profile"` |

All social links open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).

Note: Social link buttons are icon-only with no visible text label. Each button MUST include an `aria-label` attribute as specified above so screen readers can announce the link destination.

---

## Animation Specifications (Phase 1 only)

### Portfolio Button Glow

| Property | Value |
|----------|-------|
| Type | 3 rotating box-shadows |
| Colors | #002BFF, #00FFCC, #FF4AD5 at 0.4 opacity |
| Blur radius | 18px |
| Spread radius | 1px |
| Orbit radius | 4px offset from center |
| Rotation | Each shadow offset by 120 degrees (2*PI/3) |
| Duration | 3 seconds per full rotation |
| Timing | Linear, infinite repeat |
| Implementation | CSS @keyframes or requestAnimationFrame for smooth rotation |

### Theme Toggle Hover

| Property | Value |
|----------|-------|
| Duration | 300ms |
| Easing | ease-in-out |
| Sun ray expansion | 4px to 6px |
| Moon size expansion | 24px to 26px |

### Background Gradient Transition

| Property | Value |
|----------|-------|
| Duration | 300ms |
| Property | background (gradient swap) |
| Easing | ease |

---

## Placeholder Pages

Phase 1 requires these route stubs so navigation works end-to-end:

| Route | Page | Content |
|-------|------|---------|
| / | Home | Full app shell with navbar, theme toggle, author name, background gradient |
| /portfolio | Portfolio | Placeholder with page name and "Coming soon" |
| /about | About | Placeholder with page name and "Coming soon" |
| /chat | Chat | Placeholder with page name and "Coming soon" |

Each placeholder page must:
- Accept and display the current theme (dark/light background, text color)
- Include a way to navigate back to home (browser back or explicit link)
- Match the background gradient of the home page

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| No registries | N/A | N/A -- no shadcn, no third-party registries |

---

## REQUIREMENTS.md Discrepancy: NAV-02

REQUIREMENTS.md NAV-02 states: "Mobile navbar displays with hamburger menu and navigation drawer."

However, the Flutter source code (`lib/mobile_navbar.dart`, `lib/mobile.dart` lines 118-128) implements mobile navigation as a **bottom navbar** (a fixed-position bar at the bottom of the viewport with inline Portfolio button, "About Me" text, and social icons), NOT a hamburger menu with a navigation drawer.

This UI-SPEC follows the **Flutter source code** (bottom navbar), not the REQUIREMENTS.md description (hamburger menu), because this is a 1:1 migration where the Flutter source is the authoritative visual reference. The REQUIREMENTS.md entry for NAV-02 should be updated to: "Mobile navbar displays as a fixed bottom bar with Portfolio button, About Me link, and social icons."

---

## Implementation Notes

1. **Font loading**: Use `next/font/google` to load Lato with weights 400, 500, 600, 700. Apply as CSS variable `--font-lato` on the body element.

2. **Theme implementation**: Use React context or Zustand for theme state. Detect system preference with `window.matchMedia('(prefers-color-scheme: dark)')` and listen for changes. No localStorage persistence in Phase 1 (matches Flutter behavior -- ENH-03 is deferred).

3. **Responsive approach**: Use CSS media query `@media (min-width: 600px)` or Tailwind breakpoint. The Flutter app uses `LayoutBuilder` with `constraints.maxWidth < 600` -- the Next.js equivalent is a single breakpoint at 600px.

4. **Sun icon**: The Flutter sun is a custom-painted canvas with a circle and 8 rays. In Next.js, implement as an SVG or a small Canvas/SVG component. Do NOT use a Material icon -- the sun is custom drawn.

5. **Moon icon**: Flutter uses `Icons.nightlight_round`. Use the equivalent Lucide or Material icon, or a custom SVG matching the crescent moon shape.

6. **Portfolio button mobile image**: The mobile version uses `portfolio.png` (dark text on transparent) and `portfolio_light.png` (light text on transparent) from `web/icons/`. These assets must be migrated to `public/icons/` in the Next.js project.

7. **Backdrop filter**: The chat overlay uses `BackdropFilter` with blur(2,2). This is Phase 3 scope, not Phase 1.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
