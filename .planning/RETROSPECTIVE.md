# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v4.0 — Voice Mode Production

**Shipped:** 2026-04-26
**Phases:** 4 | **Plans:** 14 | **Sessions:** multiple

### What Was Built

- Persistent layout-level voice session that survives navigation and keeps the voice overlay available across pages.
- Real voice tool callbacks for navigation, project opening, about-page scrolling, external links, theme toggles, and guided tour actions.
- Color-coded voice glow feedback for listening, executing, success, and error states.
- ElevenLabs Scribe v2 STT via server-issued single-use tokens, with Web Speech fallback retained.
- Deployment-ready API configuration, including `ELEVENLABS_API_KEY` build-time injection and a reusable Amplify verifier script.

### What Worked

- Isolating STT into its own phase kept the highest-risk AudioWorklet/WebSocket work contained.
- Layout-level provider ownership prevented voice-controller state from resetting during page navigation.
- Human visual verification caught timing and echo-loop issues that static verification would have missed.
- Scope deferral kept the milestone shippable when DNS/Amplify access was unavailable, without losing the future verification path.

### What Was Inefficient

- Several older summaries lacked useful one-liners, so milestone auto-extraction produced weak `One-liner:` entries that needed manual cleanup.
- Amplify/custom-domain verification was planned as a blocker before confirming DNS reachability, causing late re-scope work.
- STATE.md still carries older pending todo/blocker text that should be cleaned in a future planning-health pass.

### Patterns Established

- Server-only voice credentials flow through API routes; browser clients receive only short-lived STT tokens or audio responses.
- Voice page effects are registered through `VoiceSessionProvider` and page-specific callbacks instead of hardcoded controller branches.
- Deployment smoke tests should be scripted, sanitized, and repeatable, with raw tokens/audio/stream text never printed.

### Key Lessons

1. Treat external deployment/DNS checks as separate milestone gates unless the production URL is already reachable.
2. Keep plan summaries substantive; milestone automation depends on good one-liners.
3. When scope changes, explicitly move deferred work into future requirements instead of leaving verification gaps ambiguous.

### Cost Observations

- Model mix: not tracked.
- Sessions: multiple.
- Notable: Parallelized GSD planning/execution helped, but human-gated deployment work still needs explicit external readiness checks.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v4.0 | multiple | 4 | Voice work moved from page-local behavior to layout-level orchestration with scripted deployment verification. |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v4.0 | Manual visual checks + scripted API smoke checks | Voice overlay, callbacks, STT, and API readiness covered | Amplify verifier script uses Node built-ins only. |

### Top Lessons (Verified Across Milestones)

1. High-risk browser behavior needs human visual verification even when code-level verification passes.
2. External infrastructure dependencies should have explicit readiness checks before they block milestone completion.
