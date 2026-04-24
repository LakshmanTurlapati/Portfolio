# Phase 9: Chat, About, and Polish - Context

**Gathered:** 2026-04-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Final polish phase: ensure Parz chat uses the complete DATA_STORE with all 21 projects, replace raw error messages with Parz-persona friendly errors, verify suggestion chips and loading messages work correctly, and verify the About page cursor spotlight matches the v3 prototype. This is a **validate/polish** phase — most code already exists.

</domain>

<decisions>
## Implementation Decisions

### Error UX
- **D-01:** Replace raw `error.message` display in both `chat/page.tsx` and `chat-popup.tsx` with a **random friendly error message in Parz's casual voice**. Examples: "Ah, my brain glitched for a sec. Try again?", "Server's taking a nap. Give it another shot.", "Something's off on my end, hit me again.", "Whoops, lost my train of thought. One more time?"
- **D-02:** Create an array of 5-8 Parz-persona error messages. On error, pick one at random. Do NOT show the technical error.message to the user.
- **D-03:** Apply the same error treatment to both `src/app/chat/page.tsx` AND `src/components/chat-popup.tsx` for consistency.

### DATA_STORE Completeness
- **D-04:** Audit the DATA_STORE in `src/data/system-prompt.ts` against all 21 projects in `src/data/projects.ts`. Cross-reference by project name. Fill any gaps — every project in the portfolio must be answerable by Parz.
- **D-05:** Verify the DATA_STORE includes: bio, education, experience, all 21 projects, hobbies, and philosophy sections. Add any missing sections.

### Suggestion Chips
- **D-06:** Verify both `chat/page.tsx` and `chat-popup.tsx` show 1 small + 1 big suggestion chip at conversation start, hidden after the user sends 2 messages. These already exist — this is verification only, fix if broken.

### Loading Messages
- **D-07:** Verify both `chat/page.tsx` and `chat-popup.tsx` show rotating loading messages while waiting for AI response. These already exist — this is verification only, fix if broken.

### About Page Spotlight
- **D-08:** Verify `src/components/spotlight.tsx` matches the v3 prototype's cursor-following spotlight behavior. The spotlight should follow the cursor via CSS custom properties, producing a soft radial glow effect on the About page.
- **D-09:** Compare against `/tmp/design-extract/portfolio-v3/project/` files for the about page spotlight CSS and fix any discrepancies.

### Claude's Discretion
- Exact wording of Parz-persona error messages (must match his casual, chill voice)
- Whether DATA_STORE project entries need more detail or just presence verification
- Spotlight glow radius, opacity, and color values if they differ from prototype

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation (audit targets)
- `src/data/system-prompt.ts` — Full Parz persona DATA_STORE (213 lines)
- `src/data/projects.ts` — 21 projects with metadata (cross-reference target)
- `src/app/chat/page.tsx` — Chat page with suggestion chips, loading messages, error display
- `src/components/chat-popup.tsx` — ChatPopup overlay (Phase 6) with same features
- `src/components/spotlight.tsx` — Cursor-following spotlight effect
- `src/app/about/page.tsx` — About page rendering SpotlightEffect

### V3 Prototype Reference
- `/tmp/design-extract/portfolio-v3/project/` — About page spotlight CSS reference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/data/system-prompt.ts` — 213-line system prompt with DATA_STORE JSON. Has 29 "name" entries. Needs audit against 21 portfolio projects.
- `src/app/chat/page.tsx` — Full chat page with `useChat`, `smallQuestions`, `bigQuestions`, `loadingMessages`, error display
- `src/components/chat-popup.tsx` — ChatPopup with same features as chat page
- `src/components/spotlight.tsx` — SpotlightEffect with mousemove/touch tracking, rAF interpolation

### Established Patterns
- Error display: `{error && (<div>...</div>)}` pattern in both chat files
- Suggestion chips: `showSuggestions = !suggestionClicked && userMessageCount < 2`
- Loading: `setInterval` every 3s cycling through `loadingMessages` array

### Integration Points
- Error messages: Both chat/page.tsx and chat-popup.tsx need the same error array
- DATA_STORE: Only used in `/api/chat` route (server-side import of system-prompt.ts)
- Spotlight: Rendered in about/page.tsx as `<SpotlightEffect />`

</code_context>

<specifics>
## Specific Ideas

- Error messages should sound like Parz talking — casual, chill, no emojis (per the system prompt's own formatting rules)
- The DATA_STORE audit should compare project names from `projects.ts` against `system-prompt.ts` entries
- Spotlight CSS custom properties: `--spotlight-x` and `--spotlight-y` set via mousemove, consumed by a radial-gradient

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase of the v3 milestone.

</deferred>

---

*Phase: 09-chat-about-and-polish*
*Context gathered: 2026-04-24*
