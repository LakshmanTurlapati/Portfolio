# Milestones

## v4.0 Voice Mode Production (Shipped: 2026-04-26)

**Phases completed:** 4 phases, 14 plans, 10 tasks

**Key accomplishments:**

- Persistent voice session moved to layout-level providers so active voice state survives route changes.
- Voice commands now execute real page effects: project opening, section scrolling, navigation, links, theme toggles, and tour actions.
- Voice state visual feedback now uses viewport glow states for listening, executing, success, and error conditions.
- Speech-to-text now uses ElevenLabs Scribe v2 with a secure server-issued token and Web Speech fallback.
- Amplify build config now injects `ELEVENLABS_API_KEY` alongside `XAI_API_KEY` for server-side API routes.
- Chat, STT token, and TTS API routes returned successful live responses on the reachable deployment, with token/audio output sanitized.
- `scripts/verify-amplify-apis.mjs` is ready for future Amplify/custom-domain verification; live production smoke testing is deferred to API-03.

**Deferred:**

- API-03: Restore or identify a reachable Amplify production URL and run `PRODUCTION_BASE_URL="<AMPLIFY_URL>" node scripts/verify-amplify-apis.mjs`.

---
