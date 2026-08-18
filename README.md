# Portfolio Website

Interactive Next.js portfolio for [parzival.live](https://parzival.live), featuring a responsive project gallery, animated visual system, AI chat persona, voice mode, site-control tooling, and GitHub activity stats.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- AI SDK with OpenRouter
- Concierge v0.2.1 browser-action runtime
- ElevenLabs STT/TTS
- Vitest and Playwright

## Features

- Responsive home, portfolio, about, and chat experiences
- Animated canvas and DOM effects, including particle background, dot matrix, spotlight, circular reveal transitions, and portfolio-button morphing
- Project gallery with approved in-app preview targets and external-link controls
- Parz AI chat persona backed by server-side API routes
- Voice mode with ElevenLabs speech-to-text and streaming TTS
- Context-scoped Concierge action catalogs, cancellable workflows, ES256-signed server-to-browser dispatch, and IndexedDB replay protection
- Explicit Concierge anonymous lifecycle telemetry (`telemetry={true}`)
- GitHub activity card backed by a cached API route
- Public API protection for paid AI/voice routes: origin checks, generous per-IP limits, and payload validation

## Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Node.js 22.12 or newer is required by Concierge v0.2.x. The repository pins
22.12.0 in `.nvmrc`.

Create `.env.local` from `.env.example` and provide the server-side keys needed for chat and voice:

```bash
cp .env.example .env.local
```

Required for AI chat:

```bash
OPENROUTER_API_KEY=
```

Required for voice STT/TTS:

```bash
ELEVENLABS_API_KEY=
```

Required for signed voice site control:

```bash
npm run concierge:keys
```

Copy the two generated base64 values into `.env.local` as
`CONCIERGE_ES256_PRIVATE_KEY_PEM_B64` and
`CONCIERGE_ES256_PUBLIC_KEY_PEM_B64`. Keep the private value server-side and
configure both values as Fly secrets for the `parzival-live` app.

Optional:

```bash
GITHUB_TOKEN=
ALLOWED_API_ORIGINS=
PRODUCTION_BASE_URL=
```

## Scripts

```bash
npm run dev       # Start local dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint
npm test          # Vitest
npm run test:e2e  # Playwright
npm run concierge:keys # Generate a P-256 signing pair
npm run verify:production # Smoke the configured production URL
```

## Deployment

The app is deployed to Fly.io as `parzival-live` using the standalone Next.js
Docker image. Production secrets are provided by Fly and must not be committed.

Concierge sits above the existing AI SDK/model loop; it replaces the custom
browser-control admission, dispatch, lifecycle, and tour orchestration layer.
It does not replace OpenRouter, the AI SDK, speech, or the app-owned UI effects.
The React binding has anonymous Concierge telemetry explicitly enabled. Its
payload and opt-out contract are documented in the
[Concierge privacy policy](https://github.com/fullselfbrowsing/Concierge/blob/v0.2.1/docs/privacy.md).

For production API smoke checks:

```bash
PRODUCTION_BASE_URL=https://parzival.live npm run verify:production
```

## Assets

Runtime assets live under `public/`:

- `public/assets/` for project images
- `public/icons/` for app icons
