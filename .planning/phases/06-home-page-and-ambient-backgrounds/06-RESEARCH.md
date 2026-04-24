# Phase 6: Home Page and Ambient Backgrounds - Research

**Researched:** 2026-04-23
**Domain:** Next.js API routes, GitHub data fetching/scraping, particles.js, React popup components
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Keep particles.js config as-is: 90 nodes, speed 1.2, line distance 150, grab distance 200.
- **D-02:** Fetch live stats from GitHub API — not hardcoded.
- **D-03:** All stats live including contributions/streak — fetch by scraping the GitHub profile page contribution graph since no API endpoint exists.
- **D-04:** Data points: total contributions, current streak, longest streak, public repos count, total stars (sum across repos), yearly commits.
- **D-05:** For Phase 6, Ask Parz button opens the text chat popup as interim. Full voice mode is Phase 8.
- **D-06:** LOCKED FOR PHASE 8: Voice mode will use ElevenLabs API (voice ID `dMWVPH9DSxWOMrrrUso3`, key `sk_0652cbb88d5012195f72d932c2609e949ff02c1edcbe7519`) and Grok (xAI). Phase 8 scope — no work in Phase 6.

### Claude's Discretion
- Fallback display when GitHub API is rate-limited (show last known values or hardcoded fallback)
- Contribution graph scraping approach (HTML parsing vs SVG parsing)
- Chat popup styling alignment with v3 prototype

### Deferred Ideas (OUT OF SCOPE)
- Full voice mode with ElevenLabs TTS + Grok (Phase 8)
- VoiceBus state machine driving particles mesh breathing (Phase 8)
- Navbar morph into voice control panel (Phase 8)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home page background uses a particles.js connected-node mesh with grab and push interactivity, monochrome palette, and theme-aware re-init | Component already implemented at `src/components/particle-background.tsx` — audit only, verified correct |
| HOME-02 | User sees a GitHub Stats pill at bottom-center showing contributions, streak, stars, and repos with expandable hover panel | Component exists with hardcoded data; needs live data API route — scraping algorithm verified working |
| HOME-03 | Navbar includes an Ask Parz button with ambient blurred orbs, green status dot, and hover amplification | Component exists at `src/components/ask-parz-button.tsx`; needs onClick wiring to ChatPopup overlay |
</phase_requirements>

---

## Summary

Phase 6 is a polish/wiring phase — all three components (ParticleBackground, GitHubStats, AskParzButton) already exist in the codebase from a prior session and are visually complete. The work is: (1) audit ParticleBackground for correctness, (2) wire GitHubStats to live data via a new API route, and (3) wire AskParzButton's onClick to open a ChatPopup overlay component that needs to be created.

The highest-risk item is the GitHub Stats live data pipeline. GitHub's REST API provides repos/stars/followers but has no endpoint for contribution streaks. The only source for streak data is scraping the HTML from `https://github.com/users/{username}/contributions` — a verified working endpoint that returns the contribution calendar as server-rendered HTML. The scraping approach has been manually validated: it yields accurate streak (49), longest streak (49), and total contributions (4,755) matching the current hardcoded values.

The ChatPopup component needs to be created from scratch by porting the v3 prototype's `ChatPopup` component (in `/tmp/design-extract/portfolio-v3/project/home.jsx`). The existing chat page (`src/app/chat/page.tsx`) provides the `@ai-sdk/react` `useChat` hook pattern to reuse for the popup's API calls.

**Primary recommendation:** Create `/api/github-stats` route that scrapes contributions + calls REST API for repos/stars, cache responses with `next: { revalidate: 3600 }`, fall back to hardcoded values on error. Port ChatPopup from v3 prototype using existing `useChat` hook pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| particles.js mesh rendering | Browser/Client | — | Canvas-based animation; needs DOM + window access |
| Theme-aware particle reinit | Browser/Client | — | useTheme() must run in client component |
| GitHub stats display | Browser/Client | — | Rendered as React state; receives pre-fetched data |
| GitHub data fetching (REST API) | API/Backend | — | Server-side to protect rate limits, avoid CORS |
| GitHub contribution scraping | API/Backend | — | GitHub blocks client-side fetch (CORS); must be server-side |
| Response caching (ISR) | API/Backend | — | `next: { revalidate }` on the fetch calls in the route |
| ChatPopup overlay | Browser/Client | API/Backend | UI is client; API calls routed through existing `/api/chat` |
| Ask Parz button state | Browser/Client | — | Orb animation and click handler are purely client-side |

---

## Standard Stack

### Core (all already installed)
| Library | Version (installed) | Purpose | Why Standard |
|---------|---------------------|---------|--------------|
| next | 15.5.14 | App Router, API routes, ISR | Project framework |
| react | 19.1.0 | UI components | Project framework |
| next-themes | ^0.4 | Theme detection via `useTheme()` | Already used in particle-background.tsx |
| @ai-sdk/react | ^3.0.147 | `useChat` hook for chat popup | Already used in chat/page.tsx |
| @ai-sdk/xai | ^3.0.77 | xAI Grok API model | Already used in `/api/chat/route.ts` |
| react-icons | ^5 | FaGithub, FaFire icons in stats pill | Already used in github-stats.tsx |

### No New Packages Needed
All required packages are already installed. The GitHub stats route uses Node.js built-in `fetch` (available in Next.js runtime). No HTML parsing library is needed — regex-based extraction is sufficient and verified.

**Installation:** None required.

**Version verification:** Confirmed via `package.json` and `npm view`. [VERIFIED: package.json in project root]

---

## Architecture Patterns

### System Architecture Diagram

```
Home page (page.tsx)
       |
       +-- ParticleBackground (client, CDN particles.js)
       |       |
       |       +-- useTheme() → isDark → destroy/recreate pJSDom instance
       |
       +-- GitHubStats (client)
       |       |
       |       +-- useEffect → fetch('/api/github-stats')
       |                               |
       |                        API Route: /api/github-stats
       |                               |
       |                    +----------+----------+
       |                    |                     |
       |           github.com/users/             api.github.com/users/
       |           {user}/contributions          {user} & /repos
       |           (HTML scrape)                 (REST API, unauthenticated)
       |                    |                     |
       |                    +----------+----------+
       |                               |
       |                         Parsed stats object
       |                         (cached 1 hour via revalidate)
       |                               |
       |                      GitHubStats renders live data
       |                      (fallback to hardcoded on error)
       |
       +-- AskParzButton (client, in DesktopNavbar)
               |
               +-- onClick → setChatOpen(true) (state in page.tsx or navbar)
                       |
               ChatPopup overlay (new component)
                       |
                       +-- useChat hook → POST /api/chat
                       +-- suggestion chips (1 small + 1 big)
                       +-- loading message cycle
                       +-- hide suggestions after 2 user messages
                       +-- onClose → setChatOpen(false)
```

### Recommended Project Structure Additions
```
src/
├── app/
│   └── api/
│       └── github-stats/
│           └── route.ts          # New: GitHub data endpoint
├── components/
│   ├── github-stats.tsx          # Existing: add live data fetch + fallback
│   ├── chat-popup.tsx            # New: ChatPopup overlay component
│   ├── ask-parz-button.tsx       # Existing: wire onClick prop
│   └── particle-background.tsx  # Existing: audit only
```

### Pattern 1: GitHub Contributions Scraping
**What:** Fetch `https://github.com/users/{username}/contributions` server-side. Parse `<td>` elements with `class="ContributionCalendar-day"` and associated `<tool-tip>` elements.
**When to use:** In the `/api/github-stats` route handler. This endpoint returns full server-rendered HTML — the contribution graph is NOT present on the main profile page.

**Verified HTML structure** [VERIFIED: direct HTTP probe of github.com/users/LakshmanTurlapati/contributions]:
```
<td tabindex="0" data-date="2026-04-23" id="contribution-day-component-COL-ROW"
    data-level="1" role="gridcell" class="ContributionCalendar-day"></td>
<tool-tip for="contribution-day-component-COL-ROW" ...>
  12 contributions on April 23rd.
</tool-tip>
```

**Key observations (VERIFIED):**
- `data-date` attribute: YYYY-MM-DD format
- `data-level`: 0-4 (intensity, NOT count)
- Count is in tooltip text: `"N contributions on Month Day."` or `"No contributions on Month Day."`
- Total contributions appears in `<h2>` as `"4,755\n      contributions\n        in the last year"`
- 370 day entries returned (rolling ~12 months)
- Endpoint requires no authentication

**Verified parsing algorithm** [VERIFIED: manual Node.js test yielding streak=49, longest=49, total=4755]:
```typescript
// Source: verified via direct HTTP test on 2026-04-23
// 1. Fetch https://github.com/users/LakshmanTurlapati/contributions
// 2. Extract td elements
const tdMatches = [...html.matchAll(/<td[^>]+class="ContributionCalendar-day"[^>]*>/g)];
// 3. Parse id and date from each td
// id="contribution-day-component-COL-ROW", data-date="YYYY-MM-DD"
// 4. Extract counts from tooltip text
const tooltipCounts: Record<string, number> = {};
for (const m of html.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]+)<\/tool-tip>/g)) {
  const countMatch = m[2].match(/^(\d+)\s+contribution/);
  tooltipCounts[m[1]] = countMatch ? parseInt(countMatch[1]) : 0;
}
// 5. Extract total from h2
const totalMatch = html.match(/(\d[\d,]+)\s*\n\s*contributions/);
const totalContributions = totalMatch ? parseInt(totalMatch[1].replace(',','')) : 0;
// 6. Compute streaks (sort by date asc)
//    currentStreak: walk backward from today; break at count=0
//    longestStreak: single pass, track max run
```

### Pattern 2: GitHub REST API for Repos and Stars
**What:** Single unauthenticated call to REST API. All 74 repos fit on one page (per_page=100).
**Verified endpoints** [VERIFIED: direct HTTP probe 2026-04-23]:

```typescript
// User info: public_repos (74), followers (44)
const userRes = await fetch('https://api.github.com/users/LakshmanTurlapati', {
  headers: { 'User-Agent': 'portfolio-app' },
  next: { revalidate: 3600 }
});

// All repos in one page (74 repos < 100 limit) — sum stargazers_count
// Verified total: 1624 stars
const reposRes = await fetch(
  'https://api.github.com/users/LakshmanTurlapati/repos?per_page=100&page=1&type=owner',
  { headers: { 'User-Agent': 'portfolio-app' }, next: { revalidate: 3600 } }
);
const repos = await reposRes.json();
const totalStars = repos.reduce((sum: number, r: {stargazers_count: number}) => sum + r.stargazers_count, 0);
```

**Rate limits** [VERIFIED: GitHub Docs + live test]:
- Unauthenticated: 60 req/hr per IP
- Authenticated (PAT): 5,000 req/hr
- With `next: { revalidate: 3600 }`, only 3 requests/hr maximum (one per revalidation cycle)
- Recommendation: unauthenticated is sufficient; no PAT needed for this usage pattern

### Pattern 3: ISR Caching in Next.js 15 App Router Route Handler
**What:** Route handler responses are cached when `fetch()` calls use `next: { revalidate }`.
**When to use:** In `/api/github-stats/route.ts` to avoid hammering GitHub on every request.

```typescript
// Source: Next.js 15 docs [CITED: nextjs.org/docs/app/getting-started/caching-and-revalidating]
export const revalidate = 3600; // revalidate route every 1 hour

export async function GET() {
  // All fetch() calls in this route inherit the revalidate setting
  // or can override with their own next: { revalidate }
}
```

### Pattern 4: ChatPopup Component (port from v3 prototype)
**What:** Modal overlay with conversation memory, suggestion chips, loading messages, close button.
**Source:** `/tmp/design-extract/portfolio-v3/project/home.jsx` lines 344-446.

**v3 prototype ChatPopup behavior** [VERIFIED: read home.jsx]:
- `messages` state: array of `{ role: 'user'|'bot', text: string }`
- Suggestion chips: 1 small + 1 big from `pickParzSuggestions()`, hidden after 2 user messages
- Loading messages: cycle every 3s via `setInterval`
- API call: sends full conversation history + system prompt as message array
- `initialMessage` prop: optional — if provided, auto-sends on mount
- Backdrop: full-screen blur overlay, click to close
- Positioning: `position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%)`

**Adaptation for Next.js** — use existing `useChat` hook from `@ai-sdk/react` (same as chat page):
```typescript
// Source: src/app/chat/page.tsx — existing pattern
import { useChat } from '@ai-sdk/react';
const { messages, sendMessage, status } = useChat();
```
The existing `/api/chat` route already handles Grok streaming. ChatPopup just reuses it.

**Suggestion chip data** (already in `src/app/chat/page.tsx`):
```typescript
const smallQuestions = ['Who are you?', 'Your age?', 'Where from?'];
const bigQuestions = ['What music do you listen to?', "What's your favorite game?", ...];
```

### Pattern 5: Wire AskParzButton in DesktopNavbar
**Current state:** `src/components/desktop-navbar.tsx` line 64 passes `onClick={() => { /* voice mode placeholder */ }}`.
**Required change:** Pass a callback down from a parent that owns `chatOpen` state.

Two viable wiring approaches:
1. **State in `page.tsx`** — `page.tsx` holds `chatOpen`, passes `onAskParz` down to `DesktopNavbar`, which passes it to `AskParzButton`.
2. **State in `DesktopNavbar`** — navbar owns `chatOpen`, renders `ChatPopup` inline.

Recommendation: state in `page.tsx` (matches existing `clickCount` pattern). `ChatPopup` renders as sibling to all other layers, z-index above everything.

### Anti-Patterns to Avoid
- **Client-side GitHub fetch:** GitHub sends `Access-Control-Allow-Origin: *` only for the API, not for `github.com/users/*/contributions`. Always fetch server-side.
- **Parsing main profile page:** `github.com/LakshmanTurlapati` does NOT contain the contribution calendar (it is lazy-loaded via `github.com/users/{user}/contributions`). Only the `/users/*/contributions` URL works.
- **Using `data-level` as contribution count:** `data-level` is 0–4 intensity, not the actual count. Use tooltip text to get the real number.
- **Polling pJSDom index:** The `pJSDom` array grows on every `particlesJS()` call. Always destroy previous instances AND remove the old canvas before re-init.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chat API streaming | Custom SSE handler | `@ai-sdk/react` `useChat` + existing `/api/chat` route | Already wired, handles streaming, error states, message history |
| Markdown sanitization | Custom regex | Existing `src/lib/sanitize-text.ts` | Already handles Parz-specific sanitization |
| URL linkification | Custom parser | Existing `src/lib/linkify.ts` | Already tested |
| Theme detection | Manual `localStorage` check | `useTheme()` from `next-themes` + `useMounted()` guard | Already used in all components |
| Rate limit handling | Exponential backoff | `next: { revalidate }` + error fallback to hardcoded values | Simpler, serverless-compatible |

**Key insight:** The heavy lifting for GitHub stats is a single server-side route that runs once per hour. Everything else reuses existing infrastructure.

---

## Common Pitfalls

### Pitfall 1: GitHub Contribution Endpoint Returns Last 12 Months Only
**What goes wrong:** The scraping endpoint returns ~370 days (rolling 12 months). "Total contributions" in the `<h2>` matches this window, not all-time.
**Why it happens:** GitHub's default graph shows the last year.
**How to avoid:** Use the `<h2>` text value directly — it already says "in the last year." Don't try to accumulate the `count` values for a different total. Display it as "contributions (last year)" in the pill.
**Warning signs:** If scraped total deviates from displayed hardcoded value, check the h2 regex.

### Pitfall 2: Streak Calculation Edge Cases (Today vs Yesterday)
**What goes wrong:** If today has no contributions yet (early morning), the current streak appears broken.
**Why it happens:** The streak should start from the most recent day with contributions, not force-starting from today.
**How to avoid:** Walk backward from today; if today's count is 0, skip it and start from yesterday. This matches GitHub's own streak widget behavior.
**Warning signs:** Streak drops to 0 on days with activity.

### Pitfall 3: pJSDom Accumulation on Theme Change
**What goes wrong:** Rapid theme toggling creates multiple overlapping particle canvases.
**Why it happens:** `particlesJS()` appends a new canvas each call without auto-cleanup.
**How to avoid:** Before calling `particlesJS()`, explicitly call `destroypJS()` on all `pJSDom` entries AND remove any existing `<canvas>` from the container. The existing `particle-background.tsx` already does this — preserve this logic in the audit.
**Warning signs:** Multiple canvas elements in the DOM inspector.

### Pitfall 4: GitHub API Rate Limit on Vercel/Amplify
**What goes wrong:** Serverless functions share an outbound IP pool. 60 req/hr shared across all invocations is quickly exhausted.
**Why it happens:** Each cold start hits GitHub without a shared cache.
**How to avoid:** `next: { revalidate: 3600 }` caches at the Next.js level. On Amplify, the route handler result is cached in the CDN layer. Add a try/catch with hardcoded fallback values so the pill still renders even if GitHub is unreachable.
**Warning signs:** Intermittent 403 responses from GitHub API.

### Pitfall 5: ChatPopup Hydration Mismatch
**What goes wrong:** ChatPopup renders on server with `chatOpen=false` but React tries to reconcile state.
**Why it happens:** `use client` boundary issues or premature portal rendering.
**How to avoid:** Gate ChatPopup rendering entirely on `chatOpen` being true (conditional render, not CSS visibility). Since `page.tsx` already uses `useMounted()` guard, ChatPopup should only render after mount.
**Warning signs:** `Hydration failed` errors in console.

---

## Code Examples

### GitHub Stats API Route Skeleton
```typescript
// src/app/api/github-stats/route.ts
// Source: verified scraping algorithm (2026-04-23 live test)
import { NextResponse } from 'next/server';

export const revalidate = 3600;

const FALLBACK = {
  totalContributions: 4755,
  currentStreak: 49,
  longestStreak: 49,
  repos: 74,
  stars: 1624,
  yearlyCommits: 4755,
};

export async function GET() {
  try {
    const [contribHtml, userJson, reposJson] = await Promise.all([
      fetch('https://github.com/users/LakshmanTurlapati/contributions', {
        headers: { 'User-Agent': 'portfolio-app/1.0' },
        next: { revalidate: 3600 },
      }).then((r) => r.text()),
      fetch('https://api.github.com/users/LakshmanTurlapati', {
        headers: { 'User-Agent': 'portfolio-app/1.0', Accept: 'application/vnd.github+json' },
        next: { revalidate: 3600 },
      }).then((r) => r.json()),
      fetch('https://api.github.com/users/LakshmanTurlapati/repos?per_page=100&type=owner', {
        headers: { 'User-Agent': 'portfolio-app/1.0', Accept: 'application/vnd.github+json' },
        next: { revalidate: 3600 },
      }).then((r) => r.json()),
    ]);

    // Parse contribution days from HTML
    const tdMatches = [...contribHtml.matchAll(/<td[^>]+class="ContributionCalendar-day"[^>]*>/g)];
    const tooltipCounts: Record<string, number> = {};
    for (const m of contribHtml.matchAll(
      /for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]+)<\/tool-tip>/g
    )) {
      const countMatch = m[2].match(/^(\d+)\s+contribution/);
      tooltipCounts[m[1]] = countMatch ? parseInt(countMatch[1]) : 0;
    }

    // Build sorted day array
    const days = tdMatches.flatMap((m) => {
      const tag = m[0];
      const dateM = tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/);
      const idM = tag.match(/id="(contribution-day-component-\d+-\d+)"/);
      if (!dateM || !idM) return [];
      return [{ date: dateM[1], count: tooltipCounts[idM[1]] ?? 0 }];
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Total from h2
    const totalMatch = contribHtml.match(/(\d[\d,]+)\s*\n\s*contributions/);
    const totalContributions = totalMatch
      ? parseInt(totalMatch[1].replace(/,/g, ''))
      : days.reduce((s, d) => s + d.count, 0);

    // Current streak (walk backward from today)
    const dateCountMap: Record<string, number> = {};
    days.forEach((d) => { dateCountMap[d.date] = d.count; });
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let currentStreak = 0;
    let checkDate = new Date(today);
    // Skip today if no contributions yet
    if (!dateCountMap[todayStr]) checkDate = new Date(today.getTime() - 86400000);
    for (let i = 0; i < 400; i++) {
      const ds = checkDate.toISOString().split('T')[0];
      if (!dateCountMap[ds] || dateCountMap[ds] === 0) break;
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    }

    // Longest streak
    let longestStreak = 0, tempStreak = 0;
    for (const day of days) {
      if (day.count > 0) { tempStreak++; longestStreak = Math.max(longestStreak, tempStreak); }
      else tempStreak = 0;
    }

    const totalStars = Array.isArray(reposJson)
      ? reposJson.reduce((s: number, r: { stargazers_count: number }) => s + r.stargazers_count, 0)
      : FALLBACK.stars;

    return NextResponse.json({
      totalContributions,
      currentStreak,
      longestStreak,
      repos: userJson.public_repos ?? FALLBACK.repos,
      stars: totalStars,
      yearlyCommits: totalContributions,
    });
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
```

### GitHubStats Component with Live Data Fetch
```typescript
// src/components/github-stats.tsx — modify to fetch live data
// Source: pattern from existing component + api route above
'use client';
import { useState, useEffect } from 'react';

const FALLBACK_STATS = {
  totalContrib: '4,755',
  currentStreak: 49,
  longestStreak: 49,
  repos: 74,
  stars: '1.6k',
  yearlyCommits: '4.8k',
};

export function GitHubStats({ isDark }: { isDark: boolean }) {
  const [stats, setStats] = useState(FALLBACK_STATS);
  useEffect(() => {
    fetch('/api/github-stats')
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalContrib: data.totalContributions.toLocaleString(),
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
          repos: data.repos,
          stars: data.stars >= 1000
            ? (data.stars / 1000).toFixed(1) + 'k'
            : String(data.stars),
          yearlyCommits: data.yearlyCommits >= 1000
            ? (data.yearlyCommits / 1000).toFixed(1) + 'k'
            : String(data.yearlyCommits),
        });
      })
      .catch(() => { /* keep fallback */ });
  }, []);
  // ... rest of existing render unchanged
}
```

### ChatPopup Wiring in page.tsx
```typescript
// src/app/page.tsx — add chat state
const [chatOpen, setChatOpen] = useState(false);

// Pass to navbar:
<DesktopNavbar onAskParz={() => setChatOpen(true)} />

// Render popup:
{chatOpen && <ChatPopup isDark={isDark} onClose={() => setChatOpen(false)} />}
```

### ChatPopup CSS (from v3 prototype styles.css)
```css
/* Source: /tmp/design-extract/portfolio-v3/project/styles.css lines 300-360 */
.chat-backdrop {
  position: fixed; inset: 0; z-index: 40;
  background: rgba(42,42,42,0.3);
  backdrop-filter: blur(2px);
  animation: fadeIn 0.2s ease;
}
.chat-popup {
  position: fixed; left: 50%; bottom: 20px;
  transform: translateX(-50%);
  width: min(720px, calc(100vw - 40px)); max-height: 70vh;
  /* light: rgba(255,255,255,0.92)  dark: rgba(20,20,20,0.92) */
  backdrop-filter: blur(14px);
  animation: popupIn 0.4s cubic-bezier(0.2,0.9,0.2,1);
}
@keyframes popupIn {
  from { transform: translate(-50%, 30px); opacity: 0 }
  to { transform: translate(-50%, 0); opacity: 1 }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| particles.js v2 CDN | Same — still the v2.0.0 CDN build | N/A | No change needed; v2 is stable |
| GitHub REST API rate limit: 60/hr | Still 60/hr unauthenticated (2025 tightening for other operations) | May 2025 | No impact given 1hr cache |
| HTML contribution graph had `data-count` | Now only has `data-level` (0-4) — count is in tooltip text | ~2023–2024 | Must use tooltip text parsing, not `data-count` |

**Deprecated/outdated:**
- `data-count` attribute on GitHub contribution cells: removed from the HTML. Projects that used this will silently return 0. Use tooltip text instead.

---

## Runtime State Inventory

This is a greenfield feature addition phase (new API route, new component, wiring existing components). No rename or migration involved. Runtime state inventory: SKIPPED.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | GitHub's `/users/{user}/contributions` HTML structure (td.ContributionCalendar-day with tooltip) will remain stable | Code Examples | Scraping breaks silently; fallback hardcoded values activate. Low risk — GitHub has kept this structure stable for years. |
| A2 | All 74 repos fit in one `per_page=100` API call | Standard Stack | If repos > 100, star count is understated. Mitigate: check `Link` header for pagination or use `userJson.public_repos` to determine if pagination needed. |
| A3 | `next: { revalidate: 3600 }` is honored in AWS Amplify deployment | Architecture | On Amplify, ISR is supported for App Router; if caching layer doesn't apply, each request hits GitHub API. Mitigate: confirm in Phase 6 deployment verification or add in-memory fallback. [ASSUMED] |

---

## Open Questions

1. **GitHub token for higher rate limits**
   - What we know: Unauthenticated gives 60 req/hr; with `revalidate: 3600` that is ample.
   - What's unclear: If Amplify's egress IPs are shared across many projects, the 60/hr quota could be shared.
   - Recommendation: Start without a token. Add `GITHUB_TOKEN` env var as optional enhancement only if rate-limit errors appear in production.

2. **yearlyCommits display value**
   - What we know: The scraping endpoint returns ~12 months of data, so `totalContributions` from that window is a good proxy.
   - What's unclear: The hardcoded value was "3.2k" for "Commits in 2026" but the live scrape returns 4,755 for last 12 months. Should "Commits in 2026" show only 2026 commits or the rolling 12-month total?
   - Recommendation: Use the scraped 12-month total and relabel as "contributions (12 months)" to be accurate. Alternatively, pass `from` param to GitHub GraphQL (requires token). Clarify with user if precision matters.

3. **ChatPopup z-index stacking with other overlays**
   - What we know: Project detail overlay uses z-indices in the 40-50 range (from `pd-fade` CSS). ChatPopup from v3 prototype uses z-40 for backdrop.
   - What's unclear: Whether ChatPopup can overlap project detail or if they are mutually exclusive.
   - Recommendation: They are mutually exclusive — ChatPopup only opens from home page, project detail only opens from portfolio page. No conflict.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js fetch | GitHub API route | ✓ | Built into Next.js runtime | — |
| github.com/users/*/contributions endpoint | Contribution scraping | ✓ | No versioning | Hardcoded fallback values |
| api.github.com REST API | Repos/stars count | ✓ | v3 (stable) | Hardcoded fallback values |
| /api/chat route | ChatPopup AI responses | ✓ | Existing in codebase | Error message display |
| particles.js CDN | ParticleBackground | ✓ | 2.0.0 (verified CDN URL) | Graceful silent fail |

**Missing dependencies with no fallback:** None.

---

## Security Domain

`security_enforcement` not explicitly set to false in config.json. Phase adds a new API route and a client component. Applicable controls:

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Route is public (GitHub stats are public data) |
| V3 Session Management | No | No session in this phase |
| V4 Access Control | No | No protected resources |
| V5 Input Validation | Yes (minimal) | API route returns only computed values, no user input flows through |
| V6 Cryptography | No | No crypto operations |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GitHub token exposure | Info Disclosure | No token needed; if added, use `process.env` server-side only, never expose to client |
| XSS via scraped content | Tampering | API route returns only numeric values and strings computed server-side, not raw HTML |
| ElevenLabs API key in CONTEXT.md | Info Disclosure | Key in CONTEXT.md is for Phase 8. No Phase 6 code should reference it. Keep out of source. |

---

## Sources

### Primary (HIGH confidence)
- Direct HTTP probe of `github.com/users/LakshmanTurlapati/contributions` — HTML structure, tooltip format, streak calculation verified live (2026-04-23)
- Direct HTTP probe of `api.github.com/users/LakshmanTurlapati` and `/repos` — rate limit headers, repo count, star count verified live (2026-04-23)
- `/tmp/design-extract/portfolio-v3/project/home.jsx` — ChatPopup component source, verified read
- `/tmp/design-extract/portfolio-v3/project/styles.css` — ChatPopup and GitHubStats CSS, verified read
- `src/components/particle-background.tsx` — existing implementation, verified matches v3 prototype
- `src/app/api/chat/route.ts` — existing chat route pattern, verified
- `src/app/chat/page.tsx` — existing useChat hook usage, verified

### Secondary (MEDIUM confidence)
- [Next.js ISR/revalidate docs](https://nextjs.org/docs/app/getting-started/caching-and-revalidating) — caching strategy for route handlers
- [GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) — 60 req/hr unauthenticated, 5000 with PAT

### Tertiary (LOW confidence)
- None — all critical claims were verified via live tool calls.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages already installed, verified in package.json
- Architecture: HIGH — scraping algorithm verified live, produces correct values
- Pitfalls: HIGH — data-level vs data-count discovered empirically, not assumed
- ChatPopup pattern: HIGH — v3 prototype source read directly

**Research date:** 2026-04-23
**Valid until:** 2026-07-23 (stable domain; GitHub HTML structure changes are infrequent but possible)
