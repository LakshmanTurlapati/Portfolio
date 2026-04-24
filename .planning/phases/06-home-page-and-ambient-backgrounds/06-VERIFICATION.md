---
phase: 06-home-page-and-ambient-backgrounds
verified: 2026-04-23T00:00:00Z
status: human_needed
score: 8/8 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open home page and verify particles.js mesh renders with grab/push interactivity"
    expected: "Monochrome connected-node mesh visible; hovering canvas triggers grab mode (lines extend to cursor); clicking pushes new particles; switching dark/light theme reinitializes mesh without stacked canvases"
    why_human: "Requires browser — particles.js renders on canvas via CDN script injection; cannot verify visual rendering or interactivity programmatically"
  - test: "Hover the GitHub Stats pill at bottom-center of home page"
    expected: "Pill is visible showing live contributions, streak, stars, repos; hovering expands detail panel with longest streak and Contributions (12 mo) label; values are not 4,755/49/74/1.6k (would indicate fallback — verify network call succeeds)"
    why_human: "Requires browser and network access to GitHub; cannot verify live data fetch result or hover panel expand/collapse animation"
  - test: "Click Ask Parz button in the desktop navbar and send a message"
    expected: "ChatPopup slides up from bottom-center with popupIn animation; greeting message visible; suggestion chips shown; typing a message and pressing Enter (or clicking arrow) sends it; streaming response appears; loading dots + rotating status text visible during streaming; X button and backdrop click both close the popup"
    why_human: "Requires browser and running xAI Grok API endpoint; visual animation, streaming behavior, and close mechanics require interactive testing"
  - test: "Verify Ask Parz button on mobile (viewport < 600px)"
    expected: "Mobile navbar shows AskParzButton (green dot only, label hidden); tapping it opens ChatPopup overlay; popup closes via backdrop or X"
    why_human: "Requires browser at mobile viewport; cannot verify mobile layout or tap behavior"
  - test: "Toggle dark/light theme while home page is loaded and verify particle mesh reinit"
    expected: "After toggling theme, particle mesh destroys previous canvas (no stacked canvases in DOM) and reinitializes with correct monochrome palette for new theme"
    why_human: "Requires inspecting DOM during runtime; canvas accumulation check needs browser DevTools"
---

# Phase 06: Home Page and Ambient Backgrounds Verification Report

**Phase Goal:** Users see a particles.js connected-node mesh on the home page and a GitHub Stats pill, and the navbar offers the Ask Parz entry point with ambient orbs
**Verified:** 2026-04-23
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | GitHub Stats pill displays live contribution count, streak, stars, and repos (not hardcoded values) | VERIFIED | `github-stats.tsx` uses `useState(FALLBACK_STATS)` + `useEffect` that fetches `/api/github-stats` on mount and calls `setStats` with formatted live values; no `GITHUB_STATS` constant remains |
| 2 | Hovering the pill expands the detail panel showing longest streak and yearly commits | VERIFIED | `github-stats.tsx` lines 87-109: detail div with `maxHeight: hover ? 120 : 0` transition; renders `stats.longestStreak` days and `stats.yearlyCommits` with label "Contributions (12 mo)" |
| 3 | If GitHub is unreachable, the pill still renders with hardcoded fallback values | VERIFIED | `route.ts` wraps all fetch logic in `try/catch` returning `FALLBACK` constant; `github-stats.tsx` `.catch(() => {})` keeps `FALLBACK_STATS` as initial state |
| 4 | Clicking Ask Parz button in the desktop navbar opens the ChatPopup overlay | VERIFIED | `desktop-navbar.tsx` passes `onClick={onAskParz}` to `AskParzButton`; `page.tsx` passes `onAskParz={() => setChatOpen(true)}`; `{mounted && chatOpen && <ChatPopup .../>}` renders on state change |
| 5 | ChatPopup shows an initial greeting, suggestion chips, and accepts user messages that stream via /api/chat | VERIFIED | `chat-popup.tsx` renders empty-state greeting, `showSuggestions` conditional chips (1 small + 1 big), `useChat` from `@ai-sdk/react` for streaming; `handleSend` calls `sendMessage({ text })` |
| 6 | ChatPopup closes when user clicks backdrop or the X button, returning to normal home page state | VERIFIED | Backdrop div has `onClick={onClose}`; header X button has `onClick={onClose}`; `onClose` from `page.tsx` is `() => setChatOpen(false)` |
| 7 | Mobile navbar shows a functional Ask Parz button that also opens the ChatPopup | VERIFIED | `mobile-navbar.tsx` has `onAskParz: () => void` prop, imports `AskParzButton`, renders it in `flex-[2]` slot with `onClick={onAskParz}`; `page.tsx` passes `onAskParz={() => setChatOpen(true)}` to `MobileNavbar` |
| 8 | ParticleBackground correctly destroys previous canvas before re-init on theme change (no stacked canvases) | VERIFIED | `particle-background.tsx` lines 54-61: three-step cleanup in correct order — `destroypJS()` on all `pJSDom` entries, `pJSDom = []`, then `containerRef.current.querySelector('canvas')?.remove()`; `useEffect` dep array is `[isDark, mounted]` |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/app/api/github-stats/route.ts` | Server-side GitHub data endpoint with scraping + REST API + 1hr cache | VERIFIED | Exists; `export const revalidate = 3600`; `GET()` handler with `Promise.all` of 3 fetches; tooltip-based count extraction; streak computation; `try/catch` with `FALLBACK` |
| `src/components/github-stats.tsx` | GitHub stats pill with live data fetch and fallback | VERIFIED | Exists; `useState(FALLBACK_STATS)`; `useEffect` fetches `/api/github-stats`; all JSX uses `stats.*`; no `GITHUB_STATS` references |
| `src/components/chat-popup.tsx` | ChatPopup overlay component with useChat hook, suggestion chips, loading messages | VERIFIED | Exists; exports `ChatPopup`; `useChat` from `@ai-sdk/react`; suggestion chips; `loadingMessages` rotation; `popupIn`/`fadeIn` keyframes via `<style>` tag; `sanitizeText` + `linkifyText` on assistant messages |
| `src/app/page.tsx` | Home page with chatOpen state, ChatPopup render, and onAskParz prop passed to navbars | VERIFIED | Exists; `chatOpen` state (line 22); `onAskParz={() => setChatOpen(true)}` passed to both navbars; `{mounted && chatOpen && <ChatPopup .../>}` at line 120 |
| `src/components/desktop-navbar.tsx` | Desktop navbar accepting onAskParz prop, passed to AskParzButton | VERIFIED | `DesktopNavbarProps { onAskParz: () => void }`; `AskParzButton` rendered with `onClick={onAskParz}` |
| `src/components/mobile-navbar.tsx` | Mobile navbar with AskParzButton wired to onAskParz prop | VERIFIED | `MobileNavbarProps { onAskParz: () => void }`; `AskParzButton` in `flex-[2]` slot with `onClick={onAskParz}` |
| `src/components/particle-background.tsx` | Three-step canvas cleanup before re-init | VERIFIED | All three steps present in correct order; `useEffect` dep array `[isDark, mounted]`; particles config: 90 nodes, speed 1.2, line distance 150, grab 200 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/components/github-stats.tsx` | `/api/github-stats` | `useEffect` fetch on mount | WIRED | Line 25: `fetch('/api/github-stats')` inside `useEffect(()=>{...}, [])` |
| `src/app/api/github-stats/route.ts` | `github.com/users/LakshmanTurlapati/contributions` | server-side fetch + regex parsing | WIRED | Line 17-20: `fetch('https://github.com/users/LakshmanTurlapati/contributions')` with tooltip regex `ContributionCalendar-day` |
| `src/app/page.tsx` | `src/components/desktop-navbar.tsx` | `onAskParz` prop | WIRED | `<DesktopNavbar onAskParz={() => setChatOpen(true)} />` |
| `src/components/desktop-navbar.tsx` | `src/components/ask-parz-button.tsx` | `onClick={onAskParz}` prop | WIRED | `<AskParzButton isDark={isDark} onClick={onAskParz} />` |
| `src/components/chat-popup.tsx` | `/api/chat` | `useChat` from `@ai-sdk/react` | WIRED | `useChat({})` — routes to `/api/chat` per the ai-sdk default |
| `src/app/page.tsx` | `src/components/mobile-navbar.tsx` | `onAskParz` prop | WIRED | `<MobileNavbar onAskParz={() => setChatOpen(true)} />` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `github-stats.tsx` | `stats` | `fetch('/api/github-stats')` → `setStats` in useEffect | Yes — `route.ts` scrapes GitHub HTML + REST API; FALLBACK only on catch | FLOWING |
| `chat-popup.tsx` | `messages` | `useChat` hook → `/api/chat` streaming endpoint | Yes — real xAI Grok streaming (established in Phase 3) | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — no runnable entry points testable without browser/server. Both checks (particle canvas, ChatPopup streaming) require a running Next.js dev server and browser. Routed to human verification.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| HOME-01 | 06-02-PLAN.md | Home page background uses particles.js connected-node mesh with grab/push interactivity, monochrome palette, and theme-aware re-init | SATISFIED (code) — NEEDS HUMAN (visual) | `particle-background.tsx`: three-step cleanup, `[isDark, mounted]` dep, 90 nodes/speed 1.2/line 150/grab 200 config present |
| HOME-02 | 06-01-PLAN.md | GitHub Stats pill with contributions, streak, stars, repos and expandable hover panel | SATISFIED (code) — NEEDS HUMAN (live data) | `github-stats.tsx`: live fetch wired; `route.ts`: scraping + REST; hover expand implemented |
| HOME-03 | 06-02-PLAN.md | Navbar includes Ask Parz button with ambient blurred orbs, green status dot, and hover amplification | SATISFIED | `ask-parz-button.tsx`: ambient orbs (orb spawn loop), green status dot (`#a9e34b` + `askParzPulse` animation), `scale(1.04)` hover transform; button wired to ChatPopup on both desktop and mobile |

All three requirement IDs (HOME-01, HOME-02, HOME-03) declared in PLAN frontmatter are fully accounted for. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/components/chat-popup.tsx` | 436 | `placeholder="Talk to my persona!"` | Info | Input placeholder text — not a stub, expected UX copy |

No blockers or stubs detected. The `placeholder` attribute is an HTML input placeholder for UX copy, not an implementation placeholder. No `TODO`, `FIXME`, empty returns, hardcoded data arrays used in rendering (fallback values are correctly overwritten by live fetch), or disconnected handlers found.

### Human Verification Required

#### 1. Particle Background Visual Rendering

**Test:** Load home page in browser. Observe background.
**Expected:** Monochrome connected-node mesh visible (90 nodes); hovering canvas extends grab lines to cursor; clicking pushes 3 new nodes; switching dark/light theme cleanly reinitializes mesh (no stacked canvases in DevTools Elements panel).
**Why human:** particles.js renders via CDN script injection onto a canvas; visual rendering and interactivity cannot be verified statically.

#### 2. GitHub Stats Pill — Live Data and Hover

**Test:** Load home page (desktop, >= 600px). Look at bottom-center. Hover the GitHub stats pill.
**Expected:** Pill visible with contribution count, streak, stars, repos. If network available, values should differ from fallback (4,755/49/1.6k/74). Hovering expands detail panel smoothly showing "Longest streak X days" and "Contributions (12 mo) Y". Label reads "Contributions (12 mo)" not "Commits in 2026".
**Why human:** Requires live GitHub API access and browser interaction for hover state.

#### 3. ChatPopup — Desktop Ask Parz Flow

**Test:** Click the "Parz" button (with green dot) in the desktop navbar.
**Expected:** Panel slides up from bottom with animation. Greeting message: "Hey! I'm Parz — Lakshman's digital twin." Suggestion chips (small + big question) visible. Type a message, press Enter. Loading dots + rotating status text appear. Response streams in. X button closes popup. Clicking backdrop also closes popup.
**Why human:** Requires running server (`/api/chat` xAI Grok endpoint) and browser interaction.

#### 4. Ask Parz — Mobile Viewport

**Test:** Open home page at < 600px width (mobile). Check bottom navbar.
**Expected:** Mobile navbar visible at bottom; AskParzButton present (green dot visible, "Parz" label hidden per `max-[760px]:hidden`); tapping it opens ChatPopup; all ChatPopup behaviors work same as desktop.
**Why human:** Requires mobile/responsive browser viewport.

#### 5. Theme Toggle — No Canvas Accumulation

**Test:** Load home page, open DevTools Elements panel, expand the `#pf-particles` div. Toggle dark/light theme.
**Expected:** After each toggle, exactly one `<canvas>` element inside `#pf-particles` (not multiple stacked ones).
**Why human:** Requires runtime DOM inspection in browser DevTools.

### Gaps Summary

No code gaps found. All 8 observable truths are verified at the code level. All three requirement IDs (HOME-01, HOME-02, HOME-03) are satisfied by substantive, wired implementations. TypeScript compiles clean. No stubs, empty handlers, or disconnected data flows.

The 5 human verification items are behavioral/visual checks that require a running browser and (for items 3 and 4) the live xAI API. These are standard end-to-end checks, not code quality gaps.

---

_Verified: 2026-04-23_
_Verifier: Claude (gsd-verifier)_
