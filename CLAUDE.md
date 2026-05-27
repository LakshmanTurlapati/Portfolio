# Project Guidance

## Project

This repository is the active Next.js portfolio for parzival.live. The old Flutter implementation has been removed from the branch; current development should target the Next.js App Router app under `src/`.

The portfolio showcases projects, experience, education, a Parz AI chat persona, voice mode, project previews, and GitHub activity stats.

## Active Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- AI SDK with xAI
- ElevenLabs STT/TTS
- Vitest for unit tests
- Playwright for browser tests

## Important Paths

- `src/app/` - app routes, pages, API routes, and global CSS
- `src/components/` - reusable UI, animation, chat, portfolio, and voice components
- `src/providers/` - app-level context providers for theme, transitions, voice, and site control
- `src/lib/` - utilities, animation helpers, API guards, voice state machine, and parsing helpers
- `src/data/` - public portfolio content, project metadata, persona prompt, experience, and education data
- `public/assets/` - project image assets served by Next.js
- `public/icons/` - portfolio icon assets
- `public/pcm-processor.js` - audio worklet used by voice mode
- `tests/` - Vitest tests
- `e2e/` - Playwright tests

## Environment

Server-side secrets must stay out of the client bundle.

Required:

- `XAI_API_KEY` for chat and site-control responses
- `ELEVENLABS_API_KEY` for voice STT/TTS features

Optional:

- `GITHUB_TOKEN` for higher GitHub API rate limits
- `ALLOWED_API_ORIGINS` for additional paid API caller origins
- `PRODUCTION_BASE_URL` for `scripts/verify-amplify-apis.mjs`

## Development Commands

```bash
npm install --legacy-peer-deps
npm run dev
npm run build
npm run lint
npm test
npm run test:e2e
npm audit --omit=dev
```

## Implementation Notes

- Keep paid API routes guarded with origin checks, generous per-IP limits, and payload validation.
- Keep project browser targets approved through `src/data/projects.ts`; do not let model-generated URLs become iframe targets.
- Preserve the current 600px mobile breakpoint unless intentionally changing responsive behavior.
- Some comments and content mention Flutter as historical project context or portfolio content; those are not active Flutter dependencies.
- Do not add a second frontend stack. New app work belongs in the existing Next.js structure.
