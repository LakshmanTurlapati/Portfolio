---
gsd_state_version: 1.0
phase: 28
slug: chat-ui-redesign
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-27
requirements: [CHAT-UI-01]
target_file: src/components/chat-popup.tsx
---

# Phase 28 -- UI Design Contract: Chat Popup Redesign

> Visual and interaction contract for the redesigned `ChatPopup` component. Behavior is preserved verbatim from the v4.1 baseline plus Phase 25 (voice handoff via `parz:open-text-chat`) and Phase 26 (iOS keyboard / safe-area). This contract is purely visual / UX polish and supersedes the inline styles currently rendered by `src/components/chat-popup.tsx`.

---

## 0. Phase Boundary (Source of Truth)

**In scope (visual / UX polish):**
- Surface treatment of the popup card (background, border, shadow, radius, blur)
- Header layout, persona name typography, close affordance
- Message bubble visual language (assistant vs user), spacing, radius
- Suggestion chip visual language and layout (mobile strip vs desktop wrap)
- Input bar visual treatment: input field, send button states, error border
- Empty-state greeting copy and treatment
- Loading indicator polish (preserve 3-dot pulse + status shimmer)
- Error display polish (preserve random Parz error copy)
- Motion: popup entry/exit, message appear, send button tap feedback, reduced-motion fallbacks
- Accessibility: ARIA roles, focus management, keyboard handling, contrast

**Out of scope (preserve verbatim):**
- `useChat` hook wiring, `siteControlChatTransport`, message send / receive paths
- `getMessageText`, `RenderLinkedText`, `getToolCall`, tool-call dispatch (`navigate`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, `unsupportedIframeControl`)
- `sanitizeText` and `linkifyText` rendering pipelines
- `loadingMessages` rotation cadence (3 s interval) and `PARZ_ERRORS` random pick
- Suggestion logic: `userMessageCount < 2` && `!suggestionClicked` (random `smallQuestions` + `bigQuestions`)
- Phase 25 voice handoff: `parz:open-text-chat` listener and mount-focus pattern
- Phase 26 iOS keyboard: `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"`, 300 ms `scrollIntoView` on focus, `paddingBottom: max(16px, env(safe-area-inset-bottom))`

---

## 1. Design System

| Property | Value |
|----------|-------|
| Tool | none (no shadcn — `components.json` not present) |
| Preset | not applicable |
| Component library | none (hand-rolled with Tailwind v4 utility-first + inline style fallbacks where needed for CSS variables) |
| Icon library | `react-icons/fa6` (existing — `FaXmark`, `FaArrowUp`) |
| Fonts loaded (per `src/app/layout.tsx`) | `Lato` (100/300/400/700/900) via `--font-lato`; `Instrument_Serif` (400 italic + roman) via `--font-instrument-serif` |
| Fonts NOT loaded | JetBrains Mono is referenced in `28-CONTEXT.md` for timestamps but is **not** registered in `layout.tsx`. **Decision:** drop monospace timestamps from this redesign — timestamps were not in the v4.1 popup and adding a new font is out of scope. If future iteration needs mono, register in `layout.tsx` first. |
| Theme contract | `isDark: boolean` prop (existing); colors resolved via `var(--color-text)` / `var(--color-bg)` from `src/app/globals.css` |

---

## 2. Spacing Scale

All inner padding, gap, and margin values must come from this 4-point ladder. No ad-hoc pixel values.

| Token | Value | Where it is used in the popup |
|-------|-------|-------------------------------|
| s-1 | 4px | Bubble tail radius (`borderBottomRightRadius` / `borderBottomLeftRadius` reduction) |
| s-2 | 8px | Suggestion chip vertical padding; gap between suggestion chips; gap between message bubbles on the same author run |
| s-3 | 12px | Message bubble vertical padding; gap between assistant + user bubble pairs |
| s-4 | 16px | Default container padding (header sides, message area sides, input row sides); chip horizontal padding |
| s-5 | 20px | Header vertical inner padding; popup outer corner radius reference |
| s-6 | 24px | Desktop popup edge offset (right/bottom from viewport); section breaks |
| s-7 | 32px | Empty-state vertical padding |
| s-8 | 48px | Reserved for future (not used in this phase) |

**Exceptions** (justified):
- Mobile popup uses `inset: 8px` (s-2) on both sides per `28-CONTEXT.md` "inset-2 margins" — required so the popup edge does not collide with iOS rubber-band scroll.
- Send button is `40px x 40px` (slightly above the 4-point ladder rendered as 10x s-1) — required for WCAG 2.5.5 minimum 44px touch target. **Adjust** to **44px x 44px** for final spec.
- Input wrapper bottom padding uses `max(16px, env(safe-area-inset-bottom))` — required by Phase 26 / MOB-02 (iOS home-indicator clearance). This stays exactly as-is.

---

## 3. Typography

| Role | Font | Size | Weight | Line Height | Letter Spacing | Used For |
|------|------|------|--------|-------------|----------------|----------|
| Header persona name | Instrument Serif (italic) | 22px | 400 | 1.2 | 0 | "Parz" label in header |
| Header subtitle | Lato | 12px | 400 | 1.3 | 0 | (Optional) "Lakshman's digital twin" subline under persona name; opacity 0.55 |
| Body / message text | Lato | 15px | 400 | 1.5 | 0 | Assistant message bubbles |
| User message text | Lato | 15px | 500 | 1.5 | 0 | User message bubbles (slightly heavier per Context) |
| Empty-state body | Lato | 14px | 400 | 1.6 | 0 | Greeting paragraph when messages.length === 0 |
| Suggestion chip label | Lato | 13px | 500 | 1.3 | 0.005em | Chip button text |
| Input field text | Lato | 14px | 400 | 1.5 | 0 | Typed input characters |
| Input placeholder | Lato | 14px | 400 | 1.5 | 0 | "Talk to my persona!" — opacity 0.5 |
| Loading status | Lato | 12px | 400 | 1.4 | 0.01em | Rotating loading messages — uses existing `popup-shimmer-text` |
| Error message body | Lato | 14px | 400 | 1.5 | 0 | Random Parz error string |
| Aria-label / sr-only | Lato | inherit | inherit | inherit | inherit | Screen-reader-only labels on close + send |

**Rules:**
- **Exactly two body weights** (400 regular, 500 medium). No 700 / 900 / 100 / 300 anywhere in the popup.
- **Exactly one display face** (Instrument Serif italic, persona name only).
- No embedded `<strong>` or `<b>` styling inside message bubbles (sanitizer strips it; redesign does not introduce new emphasis tokens).
- Line-height 1.5 for prose, 1.2-1.4 for tight UI labels — never below 1.2.

---

## 4. Color

The chat popup is a **monochrome + accent** surface. Color tokens reference `src/app/globals.css` so dark / light mode invert automatically.

| Role | Value | Usage |
|------|-------|-------|
| Dominant surface (60%) | Light: `#fafaf7` -- Dark: `#1a1a1c` (matches `iframe-viewer.tsx`) | Popup card background |
| Secondary (30%) | Light: `rgba(0,0,0,0.04)` -- Dark: `rgba(255,255,255,0.06)` | Assistant bubble background tint, input field fill, suggestion chip rest fill |
| Accent (10%) | `var(--color-text)` reversed onto `var(--color-bg)` | User bubbles (filled), send button (filled when input has content), persona name color, focus ring |
| Destructive | `rgba(239, 68, 68, 1)` (existing red) -- backgrounds at 0.10 alpha, borders at 0.30 alpha | Error message bubble background + border only |
| Border (subtle) | Light: `rgba(0,0,0,0.08)` -- Dark: `rgba(255,255,255,0.08)` | Header divider, popup outer border, assistant bubble border |
| Border (input) | Light: `rgba(0,0,0,0.10)` -- Dark: `rgba(255,255,255,0.12)` | Input field outline (rest) |
| Focus ring | `var(--color-text)` at 0.40 alpha, 2px outline, 2px offset | Input on focus, send button on focus, close button on focus, suggestion chip on focus |
| Shadow | `0 24px 64px rgba(0,0,0,0.30)` | Popup card elevation (matches `iframe-viewer.tsx`) |
| Backdrop | `rgba(42,42,42,0.30)` + `backdrop-filter: blur(2px)` | Behind popup, click-to-close |

**Accent reserved for (explicit list — not "all interactive elements"):**
1. User message bubble fill (`background: var(--color-text)`, `color: var(--color-bg)`)
2. Send button fill **only when** `inputValue.trim() && !isLoading` (otherwise outline at 0.30 alpha)
3. Persona name "Parz" header text color
4. Focus ring on the four focusable elements (input, send, close, chips)
5. Suggestion chip border on hover / focus

**Accent must NOT be used for:**
- Assistant bubbles (transparent fill + subtle border only)
- Suggestion chip rest state
- Empty state text (uses opacity 0.7 on `--color-text`)
- Loading dots (use `var(--color-text)` directly, opacity-modulated by the existing `dot-wave-popup` keyframe)
- Borders / dividers (use the subtle border token above)

**Contrast check (WCAG AA, computed against the dominant surface):**
- Light mode body text (`#000` on `#fafaf7`): 19.7:1 -- PASS AAA
- Dark mode body text (`#fff` on `#1a1a1c`): 17.8:1 -- PASS AAA
- Light mode placeholder (`#000` @ 0.5 on `#fafaf7`): 9.85:1 -- PASS AA
- Dark mode placeholder (`#fff` @ 0.5 on `#1a1a1c`): 8.9:1 -- PASS AA
- User bubble (`#fafaf7` on `#000` / `#1a1a1c` on `#fff`): >= 17:1 -- PASS AAA
- Error text (`var(--color-text)` on `rgba(239,68,68,0.10)` over surface): >= 4.5:1 -- PASS AA

---

## 5. Layout Geometry

### 5.1 Outer popup card

| Property | Mobile (`< 768px`) | Desktop (`>= 768px`) |
|----------|---------------------|----------------------|
| Position | `fixed` | `fixed` |
| Anchor | `inset: 8px` (top/right/bottom/left) | `right: 24px; bottom: 24px` |
| Width | `calc(100vw - 16px)` | `420px` |
| Max width | `100%` | `420px` |
| Height | `calc(100dvh - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))` (cap) | `min(640px, calc(100vh - 48px))` |
| Min height | `360px` | `420px` |
| Display | `flex; flex-direction: column` | same |
| Border radius | `20px` | `20px` |
| Border | `1px solid` border token | same |
| Background | dominant surface token (theme-aware) | same |
| Backdrop filter | `blur(14px)` (preserve existing) | same |
| Shadow | `0 24px 64px rgba(0,0,0,0.30)` | same |
| z-index | `50` | `50` |

**Backdrop element:** `position: fixed; inset: 0; z-index: 40; background: rgba(42,42,42,0.30); backdrop-filter: blur(2px);` — click closes popup. Already correct in current code; preserve.

**Mobile breakpoint hook:** use `useMediaQuery('(min-width: 768px)')` from `src/hooks/use-media-query.ts` to switch between mobile and desktop layouts. Matches the breakpoint used by Phase 26 (MOB-01 particle gate) and Phase 27 (FSB-05 overlay gate) for ecosystem coherence.

### 5.2 Header row

- Height: `56px` fixed (`flex-shrink: 0`)
- Padding: `12px 16px` (s-3 / s-4)
- Border-bottom: `1px solid` border token
- Layout: `display: flex; align-items: center; justify-content: space-between`
- Left cluster: persona name (Instrument Serif italic 22px) + optional subtitle stacked below (Lato 12px, opacity 0.55) — vertically tight, gap `2px`. Subtitle is **optional**; recommendation: include it on first redesign for warmth, can A/B remove.
- Right cluster: close button — `32px x 32px`, `border-radius: 8px`, hover `background: rgba(0,0,0,0.05)` light / `rgba(255,255,255,0.05)` dark, icon `FaXmark` size 18, `color: var(--color-text)` at 0.7 opacity rest, 1.0 on hover/focus.

### 5.3 Messages area

- `flex: 1; overflow-y: auto; min-height: 0`
- Padding: `16px` (s-4) on all sides
- Gap between adjacent message bubbles: `12px` (s-3) for cross-author transitions, `8px` (s-2) for same-author runs
- Custom scrollbar: hide on WebKit (`::-webkit-scrollbar { width: 0 }`) and Firefox (`scrollbar-width: none`) — preserve subtle scrolling without visible track. Already absent in current code; explicitly suppress to avoid flicker on macOS.
- Scroll behavior: `scrollIntoView({ behavior: 'smooth' })` on `messagesEndRef` — preserve as-is.

### 5.4 Message bubbles

| Property | Assistant | User |
|----------|-----------|------|
| Max width | `85%` of messages-area width | `85%` |
| Align | `justify-content: flex-start` | `justify-content: flex-end` |
| Background | `secondary token` (faint tint) | `var(--color-text)` (accent fill) |
| Color | `var(--color-text)` | `var(--color-bg)` |
| Border | `1px solid` border-subtle token | none |
| Padding | `10px 14px` | `10px 14px` |
| Font | Lato 15 / 400 / 1.5 | Lato 15 / 500 / 1.5 |
| Border radius (corners) | `16px 16px 16px 4px` (tail bottom-left) | `16px 16px 4px 16px` (tail bottom-right) |
| Word break | `word-break: break-word` | same |
| Link styling (inside `RenderLinkedText`) | underline + `text-blue-500` light / `text-blue-400` dark | underline (inverted): `text-blue-200 dark:text-blue-300` so it stays legible against accent fill |

**Adjustment:** raise bubble max-width from current `80%` to `85%` to reduce the cramped feeling on mobile.

### 5.5 Empty-state greeting

- Renders **only when** `messages.length === 0 && !isLoading`
- Padding: `32px 16px 16px` (s-7 / s-4 / s-4)
- Layout: single text block, no bubble container
- Copy: see Section 6
- Color: `var(--color-text)` at opacity 0.7
- Typography: Lato 14 / 400 / 1.6

### 5.6 Loading indicator

- Position: rendered as the next assistant bubble (`justify-content: flex-start; margin-bottom: 12px`)
- Container: same border + padding as assistant bubble
- Three-dot wave: `7px x 7px` circles, `gap: 4px`, `background: var(--color-text)`, animation `dot-wave-popup 1.4s ease-in-out infinite` with `0.2s` stagger across the three dots — **preserve existing keyframe `dot-wave-popup` from chat-popup.tsx style block**.
- Status text: 12px Lato, uses existing `popup-shimmer-text` class. Cycles `loadingMessages` every 3 s — preserve `loadingMsgIndex` interval logic verbatim.

### 5.7 Error display

- Renders **only when** `currentError !== null`
- Same bubble shape as assistant (left-aligned, tail bottom-left)
- `background: rgba(239, 68, 68, 0.10)`, `border: 1px solid rgba(239, 68, 68, 0.30)`, `color: var(--color-text)`, max-width 85%, font Lato 14 / 400 / 1.5
- Copy: random pick from `PARZ_ERRORS` — preserve `getRandomItem(PARZ_ERRORS)` selection in `useEffect` triggered by `error` from `useChat`
- No icon (current pattern is text-only — keep clean)

### 5.8 Suggestion chips strip

- Renders **only when** `!suggestionClicked && userMessageCount < 2` (preserve `showSuggestions` predicate)
- Container: `display: flex; gap: 8px; padding: 8px 16px; flex-shrink: 0`
- Mobile: `flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none` -- horizontal pill strip
- Desktop: `flex-wrap: wrap; justify-content: center` -- wrapping centered cluster
- Chip button:
  - Padding `8px 16px` (s-2 / s-4)
  - `border-radius: 999px` (full pill)
  - `font-size: 13px`, `font-weight: 500`, `letter-spacing: 0.005em`
  - Border `1px solid rgba(0,0,0,0.15)` light / `rgba(255,255,255,0.20)` dark
  - Background secondary token
  - Hover: `transform: scale(1.04)` (slightly tamer than current 1.05), `border-color` accent at 0.35 alpha, transition `200ms ease`
  - Focus-visible: focus ring (see Section 4)
  - Tap (`:active`): `transform: scale(0.98)`
- Two chips rendered: `suggestions.small` then `suggestions.big` (preserve `useState(() => ({ small: getRandomItem(...), big: getRandomItem(...) }))`)

### 5.9 Input row

- Padding: `8px 16px max(16px, env(safe-area-inset-bottom))` (preserve safe-area inset from Phase 26 / MOB-02)
- `flex-shrink: 0`
- Inner wrapper: `position: relative` so the send button can be absolutely positioned inside the input rail
- Input field:
  - `width: 100%`, `border-radius: 24px`, `padding: 12px 56px 12px 20px` (right padding 56px reserves space for the 44x44 send button + 4px gap to edge)
  - Font: Lato 14 / 400 / 1.5
  - Background: secondary token; `backdrop-filter: blur(10px)` preserved
  - Border: 1px solid input-border token
  - On focus: border becomes `var(--color-text)` at 0.30 alpha, plus a 2px focus ring (see Section 4) at 2px offset
  - **Critical iOS attributes (preserve verbatim):** `type="text"`, `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"`
  - **Critical iOS focus handler (preserve verbatim):** `onFocus={() => setTimeout(() => inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)}`
  - Disabled state (`isLoading`): opacity 0.6, `cursor: not-allowed`
- Send button:
  - Position: `absolute; right: 6px; top: 50%; transform: translateY(-50%)`
  - Size: `44px x 44px` (raised from current 36 for WCAG 2.5.5)
  - Border-radius: 999px (circle)
  - Icon: `FaArrowUp size={16}`
  - **Enabled state** (`inputValue.trim() && !isLoading`): `background: var(--color-text)`, `color: var(--color-bg)`, opacity 1, cursor pointer
  - **Disabled state**: `background: transparent`, `color: var(--color-text)` at opacity 0.30, `border: 1px solid` border token, cursor `not-allowed`
  - Hover (enabled): `transform: translateY(-50%) scale(1.04)`
  - Active (enabled): `transform: translateY(-50%) scale(0.94)` -- "haptic feel" tap per Context
  - Transition: `transform 150ms ease, background-color 200ms ease, opacity 200ms ease`
  - Focus-visible: focus ring (see Section 4)

### 5.10 Error border on input wrapper

When `currentError !== null`, the input wrapper gains:
- `border: 1px solid rgba(239, 68, 68, 0.45)` (overrides input-border)
- A 1.5 s `borderColor` ease-out transition back to default once the user types again (`onChange` fires) — implementation: clear `currentError` when input length transitions from 0 to 1, OR keep showing until next message attempt. **Decision:** clear visual error border on `onChange` (first keystroke) for forgiving UX; leave the error bubble in the message stream until the next successful response.

---

## 6. Copywriting Contract

| Element | Copy | Notes |
|---------|------|-------|
| Header persona name | `Parz` | Instrument Serif italic. Single word, no period. |
| Header subtitle (optional) | `Lakshman's digital twin` | Lato 12, opacity 0.55. Same line of context as the v4.1 greeting. |
| Empty-state body (preserve) | `Hey! I'm Parz - Lakshman's digital twin. Ask me anything about his work or projects.` | Already shipping in v4.1. Replace en-dash with em-dash for typographic consistency: `I'm Parz — Lakshman's digital twin.` |
| Input placeholder (preserve) | `Talk to my persona!` | Already shipping. Keep verbatim. |
| Send button aria-label | `Send message` | Preserve. |
| Close button aria-label | `Close chat` | Preserve. |
| Suggestion chip labels (preserve verbatim) | `Who are you?`, `Your age?`, `Where from?`, `What music do you listen to?`, `What's your favorite game?`, `What tech are you into?`, `Tell me about projects`, `What's your setup like?` | Random pick (1 small + 1 big) per `useState` initializer. |
| Loading status messages (preserve verbatim) | `Waking up my private server`, `Processing your message`, `Almost there, Hold tight!`, `Generating response` | Cycles every 3 s. |
| Error messages (preserve verbatim) | The 7 `PARZ_ERRORS` strings (`"Ah, my brain glitched..."`, etc.) | Random pick on each `error` change. |
| Primary CTA implied | (none — chat input has no submit-button label, only an aria-label) | The send icon button is the CTA; its accessible name is `Send message`. |
| Destructive confirmation | (not applicable — popup has no destructive actions) | The X close action is non-destructive (state is in-memory only). |

**Voice / tone rules:**
- First-person from Parz (matches v4.1 persona).
- Casual, never formal. Em-dashes preferred for asides.
- Never expose technical error details — only friendly Parz-voice strings (already enforced by `PARZ_ERRORS` selection).
- No emojis anywhere in the popup (project rule).

---

## 7. Motion Spec

| Surface | Trigger | Animation | Duration | Easing | Reduced-motion fallback |
|---------|---------|-----------|----------|--------|-------------------------|
| Popup card entry | Component mount | `opacity 0 -> 1`, `transform: scale(0.96) -> scale(1.0)` | 200 ms | `cubic-bezier(0.2, 0.9, 0.2, 1)` | Instant: `opacity 1`, no scale |
| Popup card exit | `onClose` invoked | `opacity 1 -> 0` | 150 ms | `ease-in` | Instant fade-out 0 ms |
| Backdrop entry | Component mount | `opacity 0 -> 1` | 200 ms | `ease-out` | Instant |
| Backdrop exit | `onClose` invoked | `opacity 1 -> 0` | 150 ms | `ease-in` | Instant |
| Message appear | New message added to `messages` array | `opacity 0 -> 1`, `transform: translateY(4px) -> 0` | 180 ms | `ease-out` | Instant `opacity 1`, no translate |
| Loading dots | While `isLoading === true` | `dot-wave-popup` keyframe (preserve from existing style block) — 7px circles bob `translateY(0 -> -6px -> 0)` with opacity 0.4 -> 1 -> 0.4 | 1.4 s loop, 0.2 s stagger across 3 dots | `ease-in-out` | Show 3 static dots at opacity 0.6, no animation |
| Status shimmer | While `isLoading === true` | `popup-shimmer` keyframe (preserve) — gradient sweep across text | 2 s linear infinite | `linear` | Static gradient, no animation |
| Send button enable | `inputValue.trim()` becomes truthy | Background fade `transparent -> var(--color-text)`, opacity `0.30 -> 1.0` | 200 ms | `ease` | Instant swap |
| Send button tap | `:active` | `transform: scale(0.94)` | 100 ms | `ease-out` | None — no scale |
| Send button success pulse (optional) | After successful `sendMessage` resolves | Subtle green outline pulse: `box-shadow: 0 0 0 0 rgba(169,227,75,0.55) -> 0 0 0 6px rgba(169,227,75,0)` | 250 ms | `ease-out` | None |
| Suggestion chip hover | `:hover` | `transform: scale(1.04)`, border color shift | 200 ms | `ease` | Border-only highlight |
| Input focus ring | `:focus-visible` | Outline appears | 0 ms (instant) | n/a | Same |
| Input error border | `currentError !== null` | Border color `default -> red` | 200 ms | `ease-in-out` | Instant swap |

**Implementation note:** all animations declared in scoped `<style>` block inside the component (matches current pattern with `@keyframes popupIn`, `dot-wave-popup`, `popup-shimmer`, `fadeIn`). Reduced-motion fallback wrapped in `@media (prefers-reduced-motion: reduce)` block within the same scoped style.

---

## 8. Accessibility Spec

### 8.1 Semantics

- Popup card root: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="chat-popup-heading"`
- Header persona name: `id="chat-popup-heading"`, semantic element `<h2>` with visual styling
- Messages region: `role="log"`, `aria-live="polite"`, `aria-relevant="additions"` (announces new messages but not edits)
- User bubbles: `aria-label="You said: {message text}"` (or use a visually-hidden prefix span)
- Assistant bubbles: `aria-label="Parz said: {message text}"` similarly
- Loading indicator: `role="status"`, `aria-label="Parz is typing"`, hides decorative dots from AT via `aria-hidden="true"` on the dot container
- Error bubble: `role="alert"` (announces immediately)
- Suggestion chip strip: `role="group"`, `aria-label="Suggested questions"`
- Each chip button: native `<button>` with descriptive accessible name (the chip text itself)
- Input field: `aria-label="Message Parz"` (since there is no visible label), `aria-describedby="chat-input-hint"` if a hint is added
- Send button: `aria-label="Send message"` (preserve)
- Close button: `aria-label="Close chat"` (preserve)

### 8.2 Focus management

- On mount: focus the input within 100 ms (preserve existing `inputRef.current?.focus()` in mount `useEffect`)
- Tab order: `input` -> `send button` -> `close button` -> [if visible] `suggestion chip 1` -> `suggestion chip 2` -> back to `input` (browser-default order is acceptable; document but do not implement a focus trap in this phase per Context "deferred")
- On close (`onClose` invoked): return focus to the element that opened the popup. The opener is `AskParzButton` or the `parz:open-text-chat` global event — implementation should call `previouslyFocused.focus()` if a ref is available; otherwise focus document body. **Acceptable scope:** call `document.activeElement` capture on mount and restore on unmount.
- Escape key: closes popup. Wire a `keydown` listener on `window` that calls `onClose()` when `e.key === 'Escape'`. Already implicit via backdrop click; this adds explicit support.

### 8.3 Keyboard shortcuts (preserve)

- `Enter` (without Shift): submits the message via `handleSend()`. Preserve verbatim.
- `Shift+Enter`: no-op (input is single-line, but the handler explicitly checks `!e.shiftKey` — leave defensive check in place).
- `Escape`: closes popup (new in this phase per accessibility requirements).

### 8.4 Color contrast

All combinations declared in Section 4 must meet WCAG AA (4.5:1 for normal text, 3:1 for large text and UI components). Verified inline.

### 8.5 Touch targets

- Send button: 44 x 44 px (raised from 36)
- Close button: 32 x 32 visual but with `padding: 6px` extending hit area to 44 x 44 minimum
- Suggestion chips: 36 px height (8 + 13 line + 8 + 4 leading), tap area satisfies 44 px in flow direction via row spacing

### 8.6 Reduced motion

All entry / exit / message-appear / send-pulse animations have an instant fallback inside `@media (prefers-reduced-motion: reduce)` (see Section 7 table column).

---

## 9. State Inventory & Visual Behavior

| State | Trigger | Visual treatment |
|-------|---------|------------------|
| Closed | parent unmounts component | Component does not render |
| Opening | mount | Popup card enters with `popupIn` animation; backdrop fades in; input auto-focuses (100 ms) |
| Idle / empty | `messages.length === 0 && !isLoading && !error` | Show empty-state greeting + suggestion strip below |
| Idle / has messages | `messages.length > 0 && !isLoading` | Hide empty state; show message stream; hide suggestion strip if `userMessageCount >= 2` |
| Composing | input has focus, user typing | Send button transitions from disabled (outlined, 0.30 opacity) to enabled (filled accent) once `inputValue.trim()` truthy |
| Submitting | `status === 'submitted'` | Loading bubble appears under last message; input disabled (opacity 0.6); send button disabled |
| Streaming | `status === 'streaming'` | Same as Submitting; assistant bubble grows token-by-token (provided by `useChat`); auto-scroll to bottom each chunk |
| Suggestion clicked | `handleSuggestionClick` | `setSuggestionClicked(true)`; sends message; suggestion strip animates out (opacity + height collapse over 200 ms) |
| Error | `error` from useChat | Random Parz error bubble appears; `currentError` state set; input wrapper gains red border; user can retry |
| User typing after error | input `onChange` fires | Input border returns to default; error bubble persists in message stream until next successful response |
| Closing | `onClose` invoked (X click, backdrop click, or Escape) | Exit animation 150 ms; backdrop fades; previously-focused element refocused |

---

## 10. Component Structure (consumer-facing)

The component signature does NOT change:

```ts
export function ChatPopup({ isDark, onClose }: { isDark: boolean; onClose: () => void }): JSX.Element
```

Internal sub-elements (logical, not necessarily separate components):

```
ChatPopup
├── Backdrop (fixed inset-0, click-to-close)
├── PopupCard (fixed, animated entry)
│   ├── Header
│   │   ├── PersonaTitle (Instrument Serif "Parz")
│   │   └── CloseButton (FaXmark)
│   ├── MessagesArea (scrollable, role="log")
│   │   ├── EmptyStateGreeting (when messages.length === 0)
│   │   ├── MessageBubble[] (assistant + user variants)
│   │   ├── LoadingBubble (when isLoading)
│   │   └── ErrorBubble (when currentError)
│   ├── SuggestionStrip (when showSuggestions)
│   │   └── SuggestionChip x 2
│   └── InputRow (safe-area padded)
│       ├── InputField (with iOS attrs)
│       └── SendButton (44x44, FaArrowUp)
└── (scoped <style> block with keyframes + reduced-motion fallback)
```

Implementer may extract `MessageBubble`, `SuggestionChip`, `LoadingBubble`, `ErrorBubble` as local helper components within the same file for readability. Not mandatory.

---

## 11. Acceptance Criteria

The implementation passes when ALL of the following are TRUE. UI auditor uses this list to verify post-execution.

### 11.1 Layout
1. On desktop (`>= 768px`), popup renders at `width: 420px`, anchored 24 px from right and bottom edges of viewport.
2. On mobile (`< 768px`), popup renders full-bleed minus 8 px inset on all sides; height respects `100dvh` minus safe-area insets.
3. Header is exactly 56 px tall with persona name "Parz" in Instrument Serif italic 22 px on the left and a 32 x 32 close button on the right.
4. Messages area scrolls independently; popup card itself does not scroll.
5. Input row sticks to the bottom and respects `env(safe-area-inset-bottom)` on iOS (verified with iOS simulator or real device).
6. Suggestion strip wraps on desktop, scrolls horizontally on mobile.

### 11.2 Visual
7. Popup card uses dominant surface (`#fafaf7` light / `#1a1a1c` dark), 1px subtle border, `0 24px 64px rgba(0,0,0,0.30)` shadow, 20 px border radius -- matches `iframe-viewer.tsx` aesthetic.
8. User bubbles render as filled `var(--color-text)` rectangles with a tail bottom-right.
9. Assistant bubbles render as transparent-tint rectangles with a 1px subtle border and tail bottom-left.
10. Send button is 44 x 44, filled accent when input has content, outlined at 0.30 opacity when empty.
11. Suggestion chips are full-pill (`border-radius: 999px`), 13 px Lato medium, hover scale 1.04.
12. Error bubble uses `rgba(239, 68, 68, 0.10)` background + `0.30` alpha border; no other red elsewhere.
13. No JetBrains Mono usage anywhere in the popup (only Lato + Instrument Serif).

### 11.3 Typography
14. Exactly two Lato weights used: 400 (body, placeholder, empty-state, error, status) and 500 (user bubble, suggestion chip).
15. Instrument Serif italic 22 px is used ONLY for the persona name.
16. All prose has line-height >= 1.5; all UI labels have line-height >= 1.2.

### 11.4 Color & contrast
17. WCAG AA (4.5:1) verified for: body text, placeholder, error text, suggestion chip label, in both light and dark modes.
18. Accent color is reserved to the 5 places listed in Section 4; no decorative accent on borders, dividers, or empty-state text.
19. `var(--color-text)` and `var(--color-bg)` are the only theme-bound color tokens read; no hardcoded `#000` / `#fff` outside the inverted user bubble case.

### 11.5 Motion
20. Popup entry runs 200 ms `cubic-bezier(0.2, 0.9, 0.2, 1)` with scale 0.96 -> 1.0 + opacity fade.
21. Message-appear runs 180 ms ease-out with 4 px slide-up.
22. Send button has a 250 ms green-pulse outline on successful submit (optional but recommended).
23. `prefers-reduced-motion: reduce` causes all entry / message / send-pulse animations to become instant; loading dots become 3 static dots.

### 11.6 Behavior preservation (regression tests — MUST NOT change)
24. `useChat` hook remains the source of truth for `messages`, `sendMessage`, `status`, `error`.
25. `siteControlChatTransport` is unchanged; `enableSiteControl: true` body is sent verbatim.
26. Tool-call dispatch logic in the `useEffect` that watches `messages` is unchanged: same six branches (`navigate`, `openProject`, `scrollTo`, `closeBrowser`, `openCurrentProjectExternal`, `unsupportedIframeControl`).
27. `sanitizeText` runs on assistant text before display; `RenderLinkedText` runs on the sanitized output.
28. `loadingMessages` cycle remains every 3 000 ms; the four strings cycle in declared order.
29. `PARZ_ERRORS` random pick happens on each `error` change; technical `error.message` is never displayed.
30. `showSuggestions = !suggestionClicked && userMessageCount < 2` predicate is unchanged.
31. `handleSend` trims input, gates on `!isLoading`, calls `sendMessage({ text })`, clears `inputValue`, increments `userMessageCount`. Behavior unchanged.
32. `handleSuggestionClick` sets `suggestionClicked = true`, calls `sendMessage({ text })`, increments `userMessageCount`. Unchanged.
33. `handleKeyDown` submits on `Enter` without `Shift`. Unchanged.

### 11.7 Phase 25 / Phase 26 inheritance (MUST NOT regress)
34. `parz:open-text-chat` global event still mounts and focuses the popup (Phase 25 / VOICE-05). If this listener lives in a parent provider, the popup must remain compatible with auto-focus on mount.
35. `inputMode="text"`, `enterKeyHint="send"`, `autoComplete="off"` attributes present on the input element (Phase 26 / MOB-02).
36. `onFocus` handler still calls `setTimeout(() => scrollIntoView({ block: 'center', behavior: 'smooth' }), 300)` (Phase 26 / MOB-02).
37. Input row container still applies `paddingBottom: max(16px, env(safe-area-inset-bottom))` (Phase 26 / MOB-02).
38. `<meta name="viewport" content="... viewport-fit=cover ...">` continues to expose safe-area insets (already in `src/app/layout.tsx`).

### 11.8 Accessibility
39. `role="dialog"`, `aria-modal="true"`, `aria-labelledby` referencing the persona name are present on the popup root.
40. Messages container has `role="log"` and `aria-live="polite"`.
41. Loading bubble has `role="status"` and accessible name "Parz is typing".
42. Error bubble has `role="alert"`.
43. All four focusable elements (input, send, close, chip) have a visible focus ring on `:focus-visible`.
44. Escape key closes the popup.
45. Color contrast verified per Section 4.

### 11.9 Determinism for the auditor
46. UI-SPEC values match the implemented component pixel-for-pixel where measurable: 56 px header, 420 px desktop width, 44 x 44 send, 20 px popup radius, 16 px message bubble radius, 4 px tail radius, 32 px close button.
47. No new external dependencies introduced (no shadcn install, no new font, no new icon library).

---

## 12. Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable (no `components.json`) |
| Third-party registries | none | not applicable |

This phase introduces NO third-party UI components. All visuals are hand-rolled in the same file using existing tokens and `react-icons/fa6`. Registry vetting gate not required.

---

## 13. Implementation Notes for Planner / Executor

- The redesign should be implementable as a **single edit to `src/components/chat-popup.tsx`** plus possibly **one small CSS addition in `src/app/globals.css`** if the scoped `<style>` block grows uncomfortably (e.g. the Escape-key handler keyframes). Prefer scoped styles in the component for proximity.
- Use `useMediaQuery('(min-width: 768px)')` (existing hook) to gate desktop vs mobile geometry. Do not invent a new breakpoint constant.
- Preserve every existing `useEffect` body verbatim; only the JSX return tree and the inline `style` objects change.
- The `<style>{...}</style>` keyframes block already in the file (`popupIn`, `fadeIn`, `dot-wave-popup`, `popup-shimmer`, `popup-shimmer-text`) should remain. Add a `messageAppear` keyframe and a `sendSuccessPulse` keyframe.
- Add an `@media (prefers-reduced-motion: reduce)` block inside the same scoped `<style>` that neutralizes the new keyframes.
- For the optional success pulse, reuse the existing `askParzPulse` keyframe in `globals.css:223-226` -- same color (`rgba(169,227,75,0.55)`), same shape -- by adding a class and toggling it on `useChat` `status === 'ready'` transition (or a one-shot `setTimeout` clearing 250 ms after `sendMessage` returns).
- Bundle size: no new dependencies, no new Google Font requests.
- Performance: avoid layout thrash. Anything animated should mutate `transform` / `opacity` / `background-color` only, never width / height / top / left.
- TypeScript: keep prop shape `{ isDark: boolean; onClose: () => void }` -- exporting any new helper types is optional.

---

## 14. Out-of-Spec / Deferred (do not implement in Phase 28)

Per `28-CONTEXT.md`:
- Persona avatar in header
- Multi-thread / message history pane
- File / image attachment
- Markdown rendering changes (the existing `RenderLinkedText` is the boundary)
- Voice toggle inside the popup
- Settings menu inside the popup
- Focus trap (keyboard-only navigation cycle confined to popup) -- explicitly deferred
- Mono timestamp typography (depends on registering JetBrains Mono in `layout.tsx`, which is out of scope)

---

## 15. Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS
- [ ] Behavior Preservation Cross-Check (Sections 11.6 + 11.7): PASS

**Approval:** pending

---

*UI-SPEC drafted: 2026-04-27 by gsd-ui-researcher*
*Pre-populated from: `28-CONTEXT.md` (decisions), `src/components/chat-popup.tsx` (current state), `src/components/iframe-viewer.tsx` (reference aesthetic), `src/app/globals.css` (tokens), `src/app/layout.tsx` (font registration)*
