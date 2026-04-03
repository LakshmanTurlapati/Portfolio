---
phase: 2
slug: home-page-and-canvas-animations
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-03
---

# Phase 2 -- UI Design Contract

> Visual and interaction contract for the Home Page and Canvas Animations phase. This is a 1:1 migration from Flutter -- all values are extracted directly from the Dart source files and must be replicated exactly in Next.js. This document covers particle background, snowfall, dot matrix, rotating circular text, spotlight, scrolling text, and the home page assembly with correct z-index layering.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Tailwind CSS v4 only -- no shadcn) |
| Preset | not applicable |
| Component library | none (custom components matching Flutter originals) |
| Icon library | Font Awesome 6 (react-icons/fa6) -- carried from Phase 1 |
| Font | Lato via next/font/google -- carried from Phase 1 |

Source: Phase 1 UI-SPEC (carried forward, no changes)

---

## Focal Point

The **ScrollingText** component is the primary visual anchor of the home page. On desktop, it is centered horizontally and vertically (offset -40px upward), composing the sentence "I'm an enthused [role] from Texas!" with a vertically scrolling role list as the dynamic element. On mobile, the "What Defines me?" rotated text plus the role roller serve the same anchor function (centered, offset -80px upward). All other visual effects (particles, snow, dot matrix, spotlight) are layered around this focal point as atmospheric decoration and must not compete for visual dominance.

---

## Spacing Scale

Carried from Phase 1. No new spacing tokens introduced in Phase 2.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Gap between static text and scrolling text (desktop `SizedBox(width: 8)`) |
| md | 12px | Gap between static text segments and scrolling roller (desktop `SizedBox(width: 12)`) |
| lg | 20px | Mobile text margins (left: 20, right: 20), mobile dot matrix bottom offset, page edge insets |
| xl | 24px | Not used in Phase 2 |
| 2xl | 30px | Not used in Phase 2 |

### Migration Override: Flutter Parity Exceptions (Spacing)

These tokens were accepted in Phase 1 and carry forward unchanged. They do not appear in the standard 8-point set (4, 8, 16, 24, 32, 48, 64) but are mandated by the Flutter source code. Changing these values would break visual fidelity with the production Flutter site at audienclature.com.

| Token | Value | Standard? | Flutter Source (Phase 2 usage) | Justification |
|-------|-------|-----------|-------------------------------|---------------|
| md | 12px | Multiple of 4 but not in standard set | Phase 1 origin: `lib/theme_toggle.dart` line 113, line 122; `lib/navbar.dart` line 177. Phase 2 usage: `lib/home_text.dart` line 75: `SizedBox(width: 12)` (gap between "I'm an enthused" static text and the scrolling role roller on desktop) | 12px is the compact inline gap for tightly composed horizontal elements. Collapsing to 8px would crowd the static text against the roller; expanding to 16px would visually disconnect them. Carried from Phase 1 where it was accepted for the same rationale (theme toggle element gaps). |
| lg | 20px | Multiple of 4 but not in standard set | Phase 1 origin: `lib/mobile.dart` lines 74-75, 88-89, 120-122; `lib/main.dart` lines 315-316, 325. Phase 2 usage: `lib/mobile_home_text.dart` line 303: `left: 20` (mobile "What Defines me?" text margin); line 331: `right: 20` (mobile role roller margin); `lib/mobile.dart` line 111: `bottom: 140` uses 20px-based positioning parity | 20px is the universal page-edge inset across both mobile and desktop layouts. Every edge-positioned element uses 20px. Adjusting to 16px or 24px would shift all edge elements and break alignment parity with the Flutter version. Carried from Phase 1. |
| 2xl | 30px | NOT a multiple of 4 | Phase 1 origin: `lib/main.dart` line 326: `right: 30` (desktop author name). Not directly used as a new spacing token in Phase 2 animations, but carried in the scale for consistency with Phase 1 | The only non-multiple-of-4 spacing value. Adjusting to 32px would shift the desktop author name 2px from its Flutter position. Carried from Phase 1 where it was accepted. |

### Phase 2 Specific Fixed Dimensions

| Element | Value | Source |
|---------|-------|--------|
| Scrolling text roller height | 150px | `home_text.dart` line 78 |
| Scrolling text roller width | 230px | `home_text.dart` line 79 |
| Scrolling text item extent | 30px | `home_text.dart` line 98 |
| Scrolling text vertical offset (desktop) | -40px (upward from center) | `main.dart` line 231 |
| Scrolling text vertical offset (mobile) | -80px (upward from center) | `mobile.dart` line 100 |
| Dot matrix position (desktop) | bottom: 160px, left: 0, right: 0, centered | `main.dart` line 289-290 |
| Dot matrix position (mobile) | bottom: 140px, left: 0, right: 0, centered | `mobile.dart` line 110-111 |
| Spotlight radius | 275px | `spotlight.dart` line 99, 103 |
| Spotlight blur sigma | 100px | `spotlight.dart` line 101 |
| Rotating text container size (main.dart) | 144x144px | `main.dart` line 247-248 |
| Rotating text radius (main.dart) | 72px | `main.dart` line 263 |

---

## Typography

Carried from Phase 1 with Phase 2 additions. The canonical type scale declares exactly 4 sizes and 2 primary weights.

| Role | Size | Weight | Line Height | Source |
|------|------|--------|-------------|--------|
| Body | 16px | 400 (normal) | 1.5 | Carried from Phase 1 |
| Label | 18px | 600 (semibold) | 1.4 | Carried from Phase 1 |
| Heading | 20px | 600 (semibold) | 1.3 | Carried from Phase 1 |
| Display | 24px | 400 (normal) | 1.2 | Desktop scrolling text -- `home_text.dart` lines 69-71 |

Font family: `Lato` for all roles. Loaded via `next/font/google` with `display: 'swap'` and subsets `['latin']`.

Declared primary weights: 400 (normal) and 600 (semibold).

### Migration Override: 3 Font Weights Required

This project uses 3 font weights (400, 600, 700) in Phase 2 instead of the recommended maximum of 2. All 3 weights are explicitly declared in the Flutter source code and collapsing to 2 would produce visually incorrect results. Each weight serves a distinct role in the visual hierarchy. (Phase 1 also declared weight 500 for mobile author name -- that carries forward at the font-loading level but is not used in Phase 2 components.)

| Weight | Flutter Constant | Phase 2 Files and Lines | Elements | Why Collapsing Breaks Fidelity |
|--------|-----------------|------------------------|----------|-------------------------------|
| 400 (normal) | `FontWeight.normal` | `lib/home_text.dart` line 71: `fontWeight: FontWeight.normal` (static text "I'm an enthused"); `lib/home_text.dart` line 125: `fontWeight: FontWeight.normal` (static text "from Texas!") | Static surrounding text in the desktop scrolling text composition | Weight 400 is paired with weight 700 on the same visual line ("I'm an enthused **[role]** from Texas!"). Changing 400 to 600 would eliminate the contrast between static and dynamic text, flattening the visual hierarchy. |
| 600 (semibold) | `FontWeight.w600` | `lib/main.dart` line 252: rotating circular text "Click Here" font weight; `lib/main.dart` line 258: rotating circular text bullet font weight | Rotating circular text labels and bullets (desktop only) | 600 distinguishes the "Click Here" indicator as branded emphasis text, consistent with Phase 1 usage for the author name and portfolio button. |
| 700 (bold) | `FontWeight.bold` | `lib/home_text.dart` line 105: `fontWeight: FontWeight.bold` (desktop scrolling role names); `lib/mobile_home_text.dart` line 220: `fontWeight: FontWeight.bold` (mobile "Defines" text); `lib/mobile_home_text.dart` line 361: `fontWeight: FontWeight.bold` (mobile scrolling role names) | Scrolling role titles ("UI/UX Designer", etc.), mobile "Defines" emphasis | 700 is the high-emphasis weight for the visual focal point -- the dynamically scrolling role names. Dropping to 600 would make role names visually identical to the "Click Here" indicator and navbar elements, collapsing two distinct hierarchy levels into one. |

**Conclusion:** All 3 weights are load-bearing in Phase 2. The `next/font/google` loader already imports Lato with weights `[400, 500, 600, 700]` from Phase 1.

### Element-Specific Typography Exceptions

The following font sizes appear in individual components but fall outside the 4-size canonical type scale. They are Flutter source values that must be replicated for pixel fidelity. Each is scoped to a single component and does not affect the general type scale.

| Element | Size | Weight | Component | Flutter Source | Rationale |
|---------|------|--------|-----------|----------------|-----------|
| Mobile role names (scrolling) | 22px | 700 (bold) | ScrollingText (Mobile) | `lib/mobile_home_text.dart` line 360-361 | Mobile uses 22px instead of the desktop 24px to fit within the narrower mobile roller width. Rounding to 20px or 24px would either undersize or overflow the roller container. |
| Rotating circular text "Click Here" | 16.6px | 600 (semibold) | RotatingCircularText | `lib/main.dart` line 252 | Fractional size calculated to evenly space 4 pairs of "Click Here" + bullet around a 72px-radius circle. Rounding to 16px or 18px would cause text overlap or visible gaps in the circular arrangement. |
| Rotating circular text bullet | 23.8px | 600 (semibold) | RotatingCircularText | `lib/main.dart` line 258 | Fractional size calculated so the bullet separator visually balances against the 16.6px text in the circular layout. Rounding to 24px would shift all subsequent text positions around the circle. |

---

## Color

### Phase 2 Animation Colors

Colors carried from Phase 1 remain the default page colors. The following are Phase 2 specific effect colors:

#### Particle Background (both modes -- theme independent)

| Role | Value | Opacity | Source |
|------|-------|---------|--------|
| Gradient center color | #A8A8A8 | 0.6 | `particle_background.dart` line 114 |
| Gradient mid color | #8C8C8C | 0.3 | `particle_background.dart` line 115 |
| Gradient edge | transparent | 0.0 | `particle_background.dart` line 116 |

Gradient type: RadialGradient per circle, stops at [0.0, 0.7, 1.0].
Blur: MaskFilter.blur(normal, circleSize / 8).

#### Snowfall Colors

| Mode | Layer | Color Base | Opacity | Source |
|------|-------|------------|---------|--------|
| Dark | Back | #000000 (black) | 0.7 | `snow.dart` line 85 |
| Dark | Middle | #000000 (black) | 0.5 | `snow.dart` line 86 |
| Dark | Front | #000000 (black) | 0.3 | `snow.dart` line 87 |
| Light | Back | #FFFFFF (white) | 0.7 | `snow.dart` line 85 |
| Light | Middle | #FFFFFF (white) | 0.5 | `snow.dart` line 86 |
| Light | Front | #FFFFFF (white) | 0.3 | `snow.dart` line 87 |

Note: In dark mode, snowflake base color is black; in light mode, snowflake base color is white. This is the Flutter behavior (`isDarkMode ? Colors.black : Colors.white` at line 82).

#### Dot Matrix Colors

| Mode | Color Range Start | Color Range End | Source |
|------|-------------------|-----------------|--------|
| Dark | #B0B0B0 | #1A1A1A | `dot_matrix.dart` lines 84-85 |
| Light | grey[300] = #E0E0E0 | grey[800] = #424242 | `dot_matrix.dart` lines 89-91 |

Each dot's color is `Color.lerp(start, end, intensity)` where intensity is a random 0.0-1.0 value per dot.

#### Spotlight Colors

| Mode | Center Color | Opacity | Edge Color | Source |
|------|-------------|---------|------------|--------|
| Dark | #000000 (black) | 0.09 | transparent | `spotlight.dart` lines 91-92 |
| Light | #FFFFFF (white) | 0.1 | transparent | `spotlight.dart` lines 93-94 |

#### Scrolling Text Colors

| Mode | Static Text | Role Text | Source |
|------|-------------|-----------|--------|
| Dark | #FFFFFF | #FFFFFF | `home_text.dart` lines 72, 107 |
| Light | #000000 | #000000 | `home_text.dart` lines 72, 107 |

#### Rotating Circular Text Colors (Click Here indicator)

| Mode | Text Color | Bullet Color | Source |
|------|------------|--------------|--------|
| Dark | #FFFFFF (white) | rgba(255,255,255,0.7) (white70) | `main.dart` lines 253, 259 |
| Light | #000000 (black) | rgba(0,0,0,0.87) (black87) | `main.dart` lines 253, 259 |

#### Mobile Arrow Icon Color

| Mode | Color | Source |
|------|-------|--------|
| Dark | rgba(255,255,255,0.8) | `mobile_home_text.dart` line 191 |
| Light | rgba(0,0,0,0.8) | `mobile_home_text.dart` line 191 |

### CSS Custom Properties (Phase 2 additions to globals.css)

```css
/* Light mode (default) */
:root {
  /* Phase 2 animation tokens */
  --color-snow: rgba(255, 255, 255, 1);
  --color-dot-start: #E0E0E0;
  --color-dot-end: #424242;
  --color-spotlight: rgba(255, 255, 255, 0.1);
  --color-circular-text: #000000;
  --color-circular-bullet: rgba(0, 0, 0, 0.87);
  --color-arrow-icon: rgba(0, 0, 0, 0.8);
}

/* Dark mode */
.dark {
  --color-snow: rgba(0, 0, 0, 1);
  --color-dot-start: #B0B0B0;
  --color-dot-end: #1A1A1A;
  --color-spotlight: rgba(0, 0, 0, 0.09);
  --color-circular-text: #FFFFFF;
  --color-circular-bullet: rgba(255, 255, 255, 0.7);
  --color-arrow-icon: rgba(255, 255, 255, 0.8);
}
```

---

## Component Inventory (Phase 2)

### 1. ParticleBackground (AnimatedCircleBackground)

Floating circles with radial gradient and blur, drifting across the viewport.

| Property | Value | Source |
|----------|-------|--------|
| Number of circles | 7 | `particle_background.dart` line 17 |
| Circle size range | 80px to 180px radius (80 + random * 100) | `particle_background.dart` lines 48-49 |
| Initial position range X | 0 to 500 | `particle_background.dart` line 34 |
| Initial position range Y | 0 to 800 | `particle_background.dart` line 35 |
| Velocity range X | -1 to +1 px/frame | `particle_background.dart` lines 42-43 |
| Velocity range Y | -1 to +1 px/frame | `particle_background.dart` lines 42-43 |
| Animation controller duration | 60 seconds (repeating) | `particle_background.dart` line 27-28 |
| Gradient type | RadialGradient per circle | `particle_background.dart` line 112 |
| Gradient colors | [#A8A8A8 @ 0.6, #8C8C8C @ 0.3, transparent] | `particle_background.dart` lines 114-116 |
| Gradient stops | [0.0, 0.7, 1.0] | `particle_background.dart` line 118 |
| Blur | MaskFilter.blur(normal, circleSize / 8) | `particle_background.dart` lines 123-125 |
| Paint style | Fill | `particle_background.dart` line 127 |
| Edge behavior | When circle exits viewport, respawn at random edge | `particle_background.dart` lines 57-68 |
| Respawn velocity | New random velocity (-1 to +1) on each axis | `particle_background.dart` lines 65-67 |
| Rendering | Canvas (2D context) | Per CONTEXT.md decision |
| pointer-events | none | Per CONTEXT.md specifics |
| Theme awareness | NOT theme-dependent (same colors in both modes) | Source: colors are hardcoded, no isDarkMode param |

### 2. SnowfallEffect

Three-layer snow particle system with depth-based blur, speed, and opacity. Mouse/touch drift affects horizontal movement.

| Property | Value | Source |
|----------|-------|--------|
| Total snowflakes | 220 (50 + 70 + 100) | `snow.dart` lines 93, 103, 114 |
| Mouse drift | Cursor X position normalized to [-1, 1] relative to screen center | `snow.dart` lines 36-38 |
| Drift influence | `flake.drift + (driftFactor * 0.001)` per frame | `snow.dart` line 212 |
| Position system | Normalized 0.0-1.0 on both axes, mapped to canvas dimensions at paint time | `snow.dart` lines 302-304 |
| Y movement per frame | `speed / 1000` | `snow.dart` line 208 |
| Base horizontal drift | random `(-0.5 to 0.5) * 0.002` | `snow.dart` line 197 |
| Wrap behavior Y | When y > 1, reset to y = -0.05, new random x | `snow.dart` lines 215-223 |
| Wrap behavior X | When x > 1, set x = 0; when x < 0, set x = 1 | `snow.dart` lines 226-229 |
| Animation tick | ~16ms (60fps) | `snow.dart` line 184 |

#### Back Layer

| Property | Value | Source |
|----------|-------|--------|
| Count | 50 | `snow.dart` line 93 |
| Speed range | 0.5 to 1.0 | `snow.dart` lines 94-95 |
| Size range | 2.0px to 4.0px radius | `snow.dart` lines 96-97 |
| Opacity | 0.7 | `snow.dart` line 85 |
| Blur sigma | 2.0 | `snow.dart` line 100 |

#### Middle Layer

| Property | Value | Source |
|----------|-------|--------|
| Count | 70 | `snow.dart` line 104 |
| Speed range | 0.5 to 1.5 | `snow.dart` lines 105-106 |
| Size range | 0.5px to 3.0px radius | `snow.dart` lines 107-108 |
| Opacity | 0.5 | `snow.dart` line 86 |
| Blur sigma | 0.1 | `snow.dart` line 111 |

#### Front Layer

| Property | Value | Source |
|----------|-------|--------|
| Count | 100 | `snow.dart` line 115 |
| Speed range | 2.0 to 3.0 | `snow.dart` lines 116-117 |
| Size range | 1.0px to 2.0px radius | `snow.dart` lines 118-119 |
| Opacity | 0.3 | `snow.dart` line 87 |
| Blur sigma | 1.0 | `snow.dart` line 122 |

#### Mobile Optimization

| Property | Desktop | Mobile | Source |
|----------|---------|--------|--------|
| Back layer count | 50 | 25 (50% reduction) | CONTEXT.md: cap particle counts on mobile |
| Middle layer count | 70 | 35 (50% reduction) | CONTEXT.md |
| Front layer count | 100 | 50 (50% reduction) | CONTEXT.md |
| Total | 220 | 110 | Derived |

### 3. DotMatrixPattern (Desktop)

Grid of rounded-rectangle dots with random intensity coloring and hover interaction.

| Property | Value | Source |
|----------|-------|--------|
| Rows | 7 | `dot_matrix.dart` line 7 (default) |
| Columns | 48 (12 * 4) | `dot_matrix.dart` line 8 |
| Dot size | 14px | `dot_matrix.dart` line 9 |
| Dot margin | 2.1px all sides (14 * 0.15) | `dot_matrix.dart` line 80 |
| Dot border-radius | 2.8px (14 * 0.2) | `dot_matrix.dart` line 94 |
| Dot shape | Rectangle with rounded corners | `dot_matrix.dart` line 93-94 |
| Hover size increase | +3px (14 -> 17px) | `dot_matrix.dart` line 78 |
| Hover animation | 300ms duration (AnimatedContainer) | `dot_matrix.dart` line 77 |
| Color per dot | `Color.lerp(startColor, endColor, randomIntensity)` | `dot_matrix.dart` lines 83-91 |
| Intensity | Random 0.0-1.0 per dot, computed once at init | `dot_matrix.dart` lines 41-44 |
| Cursor | pointer (SystemMouseCursors.click) | `dot_matrix.dart` line 62 |
| Click action | Opens https://leetcode.com/u/PARZIVAL1213/ in new tab | `dot_matrix.dart` lines 27-33 |
| Rendering | HTML/CSS divs (not canvas) | See deviation note below |

#### CONTEXT.md Deviation: Dot Matrix Rendering

CONTEXT.md specifies "Canvas with pre-computed grid positions, theme-aware dot colors via CSS custom properties" for the dot matrix. However, the Flutter source uses `AnimatedContainer` (a widget-tree approach with per-dot state), not `CustomPaint` (a canvas approach). The dot matrix requires per-dot hover interaction (14px to 17px growth with 300ms CSS transition) and click handling (open LeetCode URL). Implementing this with canvas would require manual hit-testing, custom animation timing, and cursor management -- significantly more complex than the Flutter original. Using HTML/CSS divs with CSS transitions faithfully replicates the Flutter widget-tree behavior while providing native hover states, pointer cursors, and accessibility. The CONTEXT.md canvas decision was likely a general statement about animation effects, not a specific directive for the interactive dot matrix. This deviation preserves functional and visual fidelity to the Flutter source.

### 4. DotMatrixPattern (Mobile)

Same grid but fewer columns and with horizontal edge-fade mask.

| Property | Value | Source |
|----------|-------|--------|
| Rows | 7 | `mobile_dot_matrix.dart` line 7 (default) |
| Columns | 20 (4 * 5) | `mobile_dot_matrix.dart` line 8 |
| Dot size | 14px | `mobile_dot_matrix.dart` line 9 |
| All other dot properties | Same as desktop | Same source patterns |
| Edge fade mask | Linear gradient left-to-right: transparent 0%, black 10%, black 90%, transparent 100% | `mobile_dot_matrix.dart` lines 53-62 |
| Mask blend mode | dstIn (CSS: mask-image with linear-gradient) | `mobile_dot_matrix.dart` line 65 |

### 5. RotatingCircularText (Click Here indicator)

Circular arrangement of text that rotates continuously. Only shown when clickCounter equals 1.

| Property | Value (as used in main.dart) | Source |
|----------|------------------------------|--------|
| Visibility condition | `clickCounter == 1` | `main.dart` line 237 |
| Container width/height | 144px x 144px | `main.dart` lines 247-248 |
| text1 | "Click Here" | `main.dart` line 250 |
| text1 fontSize | 16.6px | `main.dart` line 252 |
| text1 fontWeight | 600 (semibold) | `main.dart` line 254 |
| text2 | bullet character (Unicode U+2022) | `main.dart` line 256 |
| text2 fontSize | 23.8px | `main.dart` line 258 |
| text2 fontWeight | 600 (semibold) | `main.dart` line 260 |
| numberOfPairs | 4 | `main.dart` line 262 |
| radius | 72px | `main.dart` line 263 |
| Duration (full rotation) | 8 seconds | `main.dart` line 264 |
| Start delay | 2 seconds | `main.dart` line 265 |
| Rotation direction | Clockwise (angle = controllerValue * 2 * PI) | `rotating_circular_text.dart` line 132 |
| Positioning (desktop) | left: `viewportWidth/2 - 270 - (0.01 * viewportWidth)`, top: `10 - (0.05 * viewportHeight)` | `main.dart` lines 239-240 |
| Container wrapper | AnimatedSmoothIndicator (pulsing scale animation) | `main.dart` line 243 |
| Pulse scale range | 1.0 to 1.05 | `main.dart` line 446 |
| Pulse duration | 1500ms, reverse-repeating | `main.dart` line 429 |
| pointer-events | none (IgnorePointer wrapper) | `main.dart` line 243 |
| Implementation | SVG with `<textPath>` on a circle, CSS rotation animation | CONTEXT.md decision |
| Mobile visibility | Not shown on mobile (only in desktop main.dart) | No equivalent in mobile.dart |

### 6. SpotlightEffect

Radial gradient overlay that follows the cursor/touch with smooth interpolation.

| Property | Value | Source |
|----------|-------|--------|
| Spotlight radius | 275px | `spotlight.dart` line 99 |
| Gradient type | RadialGradient, 2 stops | `spotlight.dart` lines 89-97 |
| Gradient stops | [0.0, 1.0] | `spotlight.dart` line 95 |
| Gradient radius param | 1.0 | `spotlight.dart` line 97 |
| Blur | MaskFilter.blur(normal, 100) | `spotlight.dart` line 101 |
| Interpolation method | Offset.lerp(current, target, 0.2) | `spotlight.dart` line 31 |
| Interpolation tick rate | 20ms (50fps interpolation) | `spotlight.dart` line 27 |
| Tracking event (desktop) | mousemove (onHover -> event.localPosition) | `spotlight.dart` line 50 |
| Tracking event (mobile) | touchmove | Equivalent touch handling |
| Exit behavior | On mouse exit, both target and current reset to null (spotlight disappears) | `spotlight.dart` lines 53-56 |
| Render layer | IgnorePointer (does not block mouse events to underlying content) | `spotlight.dart` line 62 |
| Size | Size.infinite (fills parent) | `spotlight.dart` line 68 |
| Implementation | CSS radial-gradient overlay with pointer tracking | CONTEXT.md decision |

### 7. ScrollingText (Desktop)

Horizontally composed text with a vertically scrolling role list.

| Property | Value | Source |
|----------|-------|--------|
| Static text start | "I'm an enthused" (note: curly apostrophe in source) | `home_text.dart` line 23 |
| Static text end | "from Texas!" | `home_text.dart` line 24 |
| Static text size | 24px, weight 400 | `home_text.dart` lines 70-71 |
| Gap between static start and roller | 12px | `home_text.dart` line 75 |
| Gap between roller and static end | 8px | `home_text.dart` line 117 |
| Roller container | 150px height x 230px width | `home_text.dart` lines 78-79 |
| Role list | ["UI/UX Designer", "Product Developer", "Software Developer", "Full-Stack Developer", "Cloud Developer", "AI Developer"] | `home_text.dart` lines 14-20 |
| Role text size | 24px, weight 700 (bold) | `home_text.dart` lines 105-106 |
| Role text alignment | center | `home_text.dart` line 103 |
| Scroll item extent | 30px per item | `home_text.dart` line 98 |
| Scroll perspective | 0.003 | `home_text.dart` line 97 |
| Scroll physics | FixedExtent (snaps to items) | `home_text.dart` line 96 |
| Auto-scroll interval | 1 second between scrolls | `home_text.dart` line 36 |
| Scroll animation | 500ms, easeInOut | `home_text.dart` lines 41-42 |
| Looping | Infinite (ListWheelChildLoopingListDelegate) | `home_text.dart` line 99 |
| Vertical fade mask | LinearGradient top-to-bottom: transparent 0%, black 50%, transparent 100% | `home_text.dart` lines 82-90 |
| Mask blend mode | dstIn | `home_text.dart` line 93 |
| Position | Centered horizontally and vertically, then offset -40px upward | `main.dart` lines 229-231 |

### 8. ScrollingText (Mobile)

Split layout with rotated "What Defines me?" text on the left and role roller on the right.

| Property | Value | Source |
|----------|-------|--------|
| Left text | "What **Defines** me?" (Defines is bold) | `mobile_home_text.dart` lines 209-226 |
| Left text size | 20px | `mobile_home_text.dart` line 215 |
| Left text rotation | 90 degrees counter-clockwise (quarterTurns: 3) | `mobile_home_text.dart` line 307 |
| Left text margin | 20px from left edge | `mobile_home_text.dart` line 303 |
| Right roller | Same 150px x 230px container with same fade mask | `mobile_home_text.dart` lines 332-333 |
| Right roller margin | 20px from right edge | `mobile_home_text.dart` line 331 |
| Role text size (mobile) | 22px, weight 700 (bold) | `mobile_home_text.dart` lines 360-361 |
| Auto-scroll | Same 1s interval, 500ms easeInOut | Same pattern as desktop |
| Position | Centered vertically, offset -80px upward | `mobile.dart` lines 98-100 |
| Arrow indicator | Shows after first navigation click, bounces left-to-right | `mobile_home_text.dart` lines 156-198 |
| Arrow icon | Material `arrow_forward_ios`, 18px | `mobile_home_text.dart` lines 189-190 |
| Arrow bounce amplitude | 12px | `mobile_home_text.dart` line 165 |
| Arrow bounce duration | 1000ms repeating | `mobile_home_text.dart` line 67-68 |
| Arrow drag threshold | >0.5 progress or >300px/s velocity to navigate | `mobile_home_text.dart` line 141 |
| Wave text animation | ShaderMask sweep, 2 seconds repeating | `mobile_home_text.dart` lines 60-61 |

### 9. ChatPlaceholder (Desktop only -- bottom center)

| Property | Value | Source |
|----------|-------|--------|
| Position | bottom: 20px, left: 0, right: 0, centered | `main.dart` lines 300-303 |
| Initial width | 200px | `main.dart` line 307 |
| Visibility | Hidden when chat is open | `main.dart` line 299 |
| Note | Full ChatPlaceholder implementation is Phase 3 scope. Phase 2 should include the positional placeholder only. |

---

## Z-Index Layering (Stack Order)

### Desktop (main.dart build method, lines 188-377)

The Flutter `Stack` renders children in order -- later children paint on top. The Next.js equivalent uses z-index values.

| Layer | Z-Index | Element | Source |
|-------|---------|---------|--------|
| 1 (bottom) | z-0 | Background gradient (AnimatedContainer) | `main.dart` line 192 |
| 2 | z-10 | ParticleBackground (AnimatedCircleBackground) | `main.dart` line 225 |
| 3 | z-20 | ScrollingText (centered, offset -40px) | `main.dart` line 228 |
| 4 | z-25 | RotatingCircularText / Click Here indicator (conditional) | `main.dart` line 237 |
| 5 | z-30 | DesktopNavbar | `main.dart` line 274 |
| 6 | z-30 | DotMatrixPattern (bottom: 160px, centered) | `main.dart` line 289 |
| 7 | z-30 | ChatPlaceholder (bottom: 20px, centered) | `main.dart` line 300 |
| 8 | z-40 | ThemeToggle (bottom-left) | `main.dart` line 314 |
| 9 | z-40 | AuthorName (bottom-right) | `main.dart` line 324 |
| 10 (top) | z-50 | Chat overlay + popup (when open) | `main.dart` lines 357-376 |

### Mobile (mobile.dart build method, lines 33-131)

| Layer | Z-Index | Element | Source |
|-------|---------|---------|--------|
| 1 (bottom) | z-0 | Background gradient | `mobile.dart` line 38 |
| 2 | z-10 | ParticleBackground | `mobile.dart` line 70 |
| 3 | z-20 | AuthorName (top-left) | `mobile.dart` line 73 |
| 4 | z-20 | ThemeToggle (top-right) | `mobile.dart` line 87 |
| 5 | z-25 | ScrollingText (centered, offset -80px) | `mobile.dart` line 97 |
| 6 | z-30 | DotMatrixPattern (bottom: 140px, centered) | `mobile.dart` line 109 |
| 7 (top) | z-40 | MobileNavbar (bottom: 20px) | `mobile.dart` line 119 |

Note: Snowfall and Spotlight effects are NOT in the mobile.dart Stack but are in the desktop version via the SnowfallEffect wrapper and SpotlightEffect wrapper. The SnowfallEffect wraps the entire desktop content as a parent (not a sibling in the Stack). The SpotlightEffect is similarly a wrapper. In the Next.js implementation per CONTEXT.md decisions:
- Snow renders as a separate canvas layer between particles and content (z-15)
- Spotlight renders as a CSS overlay above content (z-35)

### Revised Unified Layering for Next.js

| Layer | Z-Index | Element | Desktop | Mobile |
|-------|---------|---------|---------|--------|
| 1 | z-0 | Background gradient | Yes | Yes |
| 2 | z-10 | ParticleBackground (canvas) | Yes | Yes |
| 3 | z-15 | Snowfall (canvas) | Yes | Yes (reduced count) |
| 4 | z-20 | ScrollingText | Yes (centered, -40px) | Yes (centered, -80px) |
| 5 | z-25 | RotatingCircularText | Yes (conditional) | No |
| 6 | z-30 | DotMatrixPattern | Yes (bottom: 160px) | Yes (bottom: 140px) |
| 7 | z-30 | Navbar | Yes (top) | Yes (bottom) |
| 8 | z-30 | ChatPlaceholder | Yes (bottom center) | No |
| 9 | z-35 | Spotlight overlay | Yes | Yes |
| 10 | z-40 | ThemeToggle | Yes (bottom-left) | Yes (top-right) |
| 11 | z-40 | AuthorName | Yes (bottom-right) | Yes (top-left) |

All canvas/overlay layers (ParticleBackground, Snowfall, Spotlight) MUST have `pointer-events: none` so user interaction with navbar, buttons, dot matrix, and text is not blocked.

---

## Interaction Contracts

### Snowfall Drift

| Trigger | Behavior |
|---------|----------|
| Mouse moves left of center | Snowflakes drift slightly left (driftFactor approaches -1) |
| Mouse moves right of center | Snowflakes drift slightly right (driftFactor approaches +1) |
| Mouse at center | No extra drift (driftFactor = 0) |
| Mouse leaves viewport | Drift factor remains at last known value (no explicit reset in Flutter) |
| Drift magnitude | `baseDrift + (driftFactor * 0.001)` per frame -- very subtle |

### Spotlight Tracking

| Trigger | Behavior |
|---------|----------|
| Mouse enters viewport | Spotlight appears at first cursor position |
| Mouse moves | Target position updates to cursor local position |
| Interpolation tick (every 20ms) | Current position lerps toward target at factor 0.2 |
| Mouse exits viewport | Both target and current reset to null, spotlight disappears immediately |
| Touch move (mobile) | Same as mouse move |
| Touch end (mobile) | Spotlight disappears |

### Dot Matrix Hover

| Trigger | Behavior |
|---------|----------|
| Mouse enters a dot | Dot grows from 14px to 17px (+3), 300ms transition |
| Mouse exits a dot | Dot shrinks back to 14px, 300ms transition |
| Click any dot | Opens https://leetcode.com/u/PARZIVAL1213/ in new tab |
| Cursor | pointer on all dots |

### Scrolling Text Auto-Scroll

| Trigger | Behavior |
|---------|----------|
| Timer tick (every 1 second) | Advance to next role in list |
| Scroll animation | 500ms, easeInOut curve |
| List end | Loops infinitely (wraps from last role back to first) |
| Component mount | Starts at first role (index 0) |
| Component unmount | Timer and scroll controller disposed |

### Rotating Circular Text (Desktop only)

| Trigger | Behavior |
|---------|----------|
| clickCounter becomes 1 | Component renders with 2-second start delay |
| After 2-second delay | Rotation begins, 8 seconds per full rotation, infinite |
| Pulsing wrapper | Scale oscillates 1.0 to 1.05 over 1500ms, reverse-repeating |
| clickCounter changes from 1 | Component unmounts |
| pointer-events | none (does not receive click/hover events) |

### Mobile "What Defines me?" Interaction

| Trigger | Behavior |
|---------|----------|
| First navigation click (clickCount > 0) | After 2-second delay, arrow appears with wave text animation |
| Arrow tap | Navigate to chat page (Phase 3 scope -- stub the navigation) |
| Arrow drag right (>50% or >300px/s) | Navigate to chat page |
| Arrow drag right (<50% and <300px/s) | Snap back to original position |
| Arrow idle animation | Bounces right 12px over 1000ms, repeating |
| Wave text animation | Shimmer/sweep gradient across "What Defines me?" text, 2 seconds repeating |

### Animation Lifecycle (all effects)

| Trigger | Behavior |
|---------|----------|
| Home page mounts | All animations initialize and start (lazy init per CONTEXT.md) |
| Home page unmounts (navigate away) | All animations stop, all intervals/timers cleared, all refs cleaned up |
| Home page remounts (navigate back) | Animations reinitialize from scratch (no stale state) |
| Window resize | Canvas dimensions update via ResizeObserver, particles recalculate positions |
| Tab becomes hidden | requestAnimationFrame naturally pauses |
| Tab becomes visible | requestAnimationFrame naturally resumes |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Desktop static text (start) | "I'm an enthused" |
| Desktop static text (end) | "from Texas!" |
| Role list (both platforms) | "UI/UX Designer", "Product Developer", "Software Developer", "Full-Stack Developer", "Cloud Developer", "AI Developer" |
| Mobile static text | "What **Defines** me?" (Defines is bold) |
| Rotating circular text primary | "Click Here" |
| Rotating circular text separator | bullet character (Unicode U+2022) |
| Dot matrix link destination | https://leetcode.com/u/PARZIVAL1213/ |
| LeetCode link failure | "Could not open link" (carried from Phase 1 social link error pattern) |

No empty states in Phase 2. All effects render immediately on mount (no data fetching).
No destructive actions in Phase 2.

---

## Animation Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| Frame rate (desktop) | 60fps sustained | Chrome DevTools Performance panel |
| Frame rate (mobile) | 60fps sustained | Real device testing on mid-range Android |
| Total canvas layers | 2 (particles + snow) | Canvas count in DOM |
| CSS overlay layers | 1 (spotlight radial-gradient) | DOM overlay count |
| HTML element count (dot matrix desktop) | 336 elements (7 * 48 dots) | DOM node count |
| HTML element count (dot matrix mobile) | 140 elements (7 * 20 dots) | DOM node count |
| Memory cleanup on unmount | 0 leaked intervals, 0 leaked RAF callbacks, 0 leaked event listeners | Chrome DevTools Memory panel |
| Paint time per frame (target) | < 8ms | Chrome DevTools Rendering |

### Optimization Strategies

- Use `requestAnimationFrame` for all canvas animations (particles, snow) -- not `setInterval`
- Canvas elements use `willReadFrequently: false` context option
- Snow and particle state stored in plain arrays/refs, not React state (no re-renders during animation)
- Dot matrix renders as static HTML with CSS transitions (not canvas) -- hover state only needs per-dot React state
- Spotlight uses CSS `background: radial-gradient(...)` with direct style mutation (no React re-render per mouse move)
- Spotlight interpolation uses `requestAnimationFrame` or 20ms interval with ref-based state
- ResizeObserver for canvas dimension updates instead of window resize event

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| No registries | N/A | N/A -- no shadcn, no third-party registries |

---

## Scrolling Text Vertical Fade Mask (CSS Implementation)

Both desktop and mobile scrolling text rollers use a vertical fade mask to hide the top and bottom overflow, creating the illusion that roles emerge from and disappear into transparency.

```css
/* CSS mask for the scrolling text roller */
.scroll-roller-mask {
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 50%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 50%,
    transparent 100%
  );
}
```

## Mobile Dot Matrix Edge Fade Mask (CSS Implementation)

```css
/* CSS mask for mobile dot matrix horizontal fade */
.dot-matrix-fade-mask {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}
```

---

## Implementation Notes

1. **useCanvas hook**: Create a shared `useCanvas` hook that standardizes the requestAnimationFrame + useRef pattern. It should accept an `animate(ctx, canvas, deltaTime)` callback, handle canvas sizing via ResizeObserver, and return a cleanup function. Both particle background and snowfall canvases should use this hook.

2. **Canvas per effect**: Per CONTEXT.md, each canvas effect gets its own canvas element. Do NOT share a single canvas. This simplifies lifecycle and cleanup.

3. **Theme awareness via CSS custom properties**: All theme-dependent colors (snow, dots, spotlight, text) should read from CSS custom properties defined in globals.css. This avoids React re-renders when the theme toggles -- the CSS property change cascades automatically.

4. **Dot matrix as HTML/CSS**: The dot matrix is NOT a canvas effect. It uses individual DOM elements with CSS transitions for hover. This matches Flutter's widget-tree approach (AnimatedContainer per dot) and provides better accessibility and hover interaction. See the CONTEXT.md Deviation note in Component 3 above for full rationale.

5. **Spotlight as CSS overlay**: Per CONTEXT.md, the spotlight is a div with `background: radial-gradient(...)` positioned absolutely, with `pointer-events: none`. The gradient center follows the cursor via direct style mutation (not React state re-render).

6. **Rotating circular text as SVG**: Per CONTEXT.md, implement with SVG `<textPath>` on a `<circle>` element, rotated via CSS transform animation. This is simpler than Flutter's trigonometric CustomPainter approach and achieves the same visual result.

7. **Scrolling text implementation**: The Flutter version uses `ListWheelScrollView` which creates a 3D barrel/cylinder effect. In Next.js, replicate using CSS transforms with `perspective` and vertical stacking. The `perspective: 0.003` value in Flutter is very low, meaning the 3D effect is subtle -- the primary visual is a vertically scrolling list with fade mask.

8. **Home page assembly**: The existing `src/app/page.tsx` already has the shell structure (navbar, theme toggle, author name). Phase 2 adds the animation layers and scrolling text content into this existing page. Do not rebuild the page from scratch.

9. **Memory leak prevention**: Every component that uses `requestAnimationFrame`, `setInterval`, `setTimeout`, or `addEventListener` MUST clean up in its React useEffect cleanup function. The ANIM-06 requirement is a hard gate -- verify with Chrome DevTools Memory panel.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
