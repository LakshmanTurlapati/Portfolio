# Phase 6: Home Page and Ambient Backgrounds - Context

**Gathered:** 2026-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a polished home page with particles.js connected-node mesh, live GitHub Stats pill, and a visually complete Ask Parz navbar button. This phase is **validate/polish** — all three components already exist from a prior session and need auditing and live data wiring.

</domain>

<decisions>
## Implementation Decisions

### Particles Config
- **D-01:** Keep particles.js config as-is: 90 nodes, speed 1.2, line distance 150, grab distance 200. Matches v3 prototype values.

### GitHub Stats
- **D-02:** **Fetch live stats** from GitHub API — not hardcoded. All data points should be live.
- **D-03:** **All stats live including contributions/streak** — fetch contributions by scraping the GitHub profile page contribution graph since no API endpoint exists. More fragile but fully dynamic.
- **D-04:** Data points to fetch: total contributions, current streak, longest streak, public repos count, total stars (sum across repos), yearly commits.

### Ask Parz Button
- **D-05:** For Phase 6, Ask Parz button click opens the **text chat popup** as interim. Full voice mode (navbar morph, VoiceBus, STT, TTS) is Phase 8.
- **D-06:** **LOCKED FOR PHASE 8:** Voice mode will use **ElevenLabs API** for TTS (not Web Speech Synthesis) with custom voice ID `dMWVPH9DSxWOMrrrUso3` and API key `sk_0652cbb88d5012195f72d932c2609e949ff02c1edcbe7519`. AI responses via **Grok (xAI)**. This is a 1:1 functional voice implementation, not a Web Speech API placeholder.

### Claude's Discretion
- Fallback display when GitHub API is rate-limited (show last known values or hardcoded fallback)
- Contribution graph scraping approach (HTML parsing vs SVG parsing)
- Chat popup styling alignment with v3 prototype

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### V3 Design Prototype
- `/tmp/design-extract/portfolio-v3/project/home.jsx` — Home page with Particles, GitHubStats, AskParz, ChatPopup
- `/tmp/design-extract/portfolio-v3/project/styles.css` — All CSS styles for home page components

### Existing Implementation (audit targets)
- `src/components/particle-background.tsx` — particles.js mesh (already implemented)
- `src/components/github-stats.tsx` — Stats pill with hardcoded values (needs live data)
- `src/components/ask-parz-button.tsx` — Navbar button with orbs (needs chat wiring)
- `src/app/page.tsx` — Home page assembly (already wired)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/particle-background.tsx` — Full particles.js integration, needs audit only
- `src/components/github-stats.tsx` — Visual complete, needs data fetching logic added
- `src/components/ask-parz-button.tsx` — Visual complete, needs onClick wiring to chat
- Chat page exists at `src/app/chat/page.tsx` with xAI Grok integration via `/api/chat` route

### Established Patterns
- API routes at `src/app/api/` for server-side calls (chat already uses this)
- Theme detection via `useTheme()` + `useMounted()` guard
- `react-icons` for Font Awesome icons

### Integration Points
- GitHub Stats needs a new API route or client-side fetch for GitHub data
- Ask Parz button needs to trigger a chat popup overlay (similar to v3 prototype's ChatPopup)
- Particles.js loaded via CDN script injection in the component

</code_context>

<specifics>
## Specific Ideas

- GitHub contribution scraping: the profile page at `github.com/LakshmanTurlapati` has an SVG contribution graph. Parse the `data-count` attributes from the calendar cells to compute total contributions and streaks.
- For the chat popup triggered by Ask Parz: port the ChatPopup component from the v3 prototype (home.jsx) — it has conversation memory, suggestion chips, loading messages, and Parz persona.

</specifics>

<deferred>
## Deferred Ideas

- Full voice mode with ElevenLabs TTS + Grok (Phase 8) — tech decisions locked above
- VoiceBus state machine driving particles mesh breathing (Phase 8)
- Navbar morph into voice control panel (Phase 8)

</deferred>

---

*Phase: 06-home-page-and-ambient-backgrounds*
*Context gathered: 2026-04-23*
