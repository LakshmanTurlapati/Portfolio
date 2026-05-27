# Portfolio Website

Interactive Next.js portfolio for [parzival.live](https://parzival.live), featuring a responsive project gallery, animated visual system, AI chat persona, voice mode, site-control tooling, and GitHub activity stats.

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- AI SDK with xAI
- ElevenLabs STT/TTS
- Vitest and Playwright

## Features

- Responsive home, portfolio, about, and chat experiences
- Animated canvas and DOM effects, including particle background, dot matrix, spotlight, circular reveal transitions, and portfolio-button morphing
- Project gallery with approved in-app preview targets and external-link controls
- Parz AI chat persona backed by server-side API routes
- Voice mode with ElevenLabs speech-to-text, streaming TTS, barge-in handling, and site-control tool calls
- GitHub activity card backed by a cached API route
- Public API protection for paid AI/voice routes: origin checks, generous per-IP limits, and payload validation

## Local Development

```bash
npm install --legacy-peer-deps
npm run dev
```

Create `.env.local` from `.env.example` and provide the server-side keys needed for chat and voice:

```bash
cp .env.example .env.local
```

Required for AI chat:

```bash
XAI_API_KEY=
```

Required for voice STT/TTS:

```bash
ELEVENLABS_API_KEY=
```

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
```

## Deployment

The app is configured for standalone Next.js output and AWS Amplify/Fly-style deployment. Production secrets should be provided by the deployment environment, not committed.

For production API smoke checks:

```bash
PRODUCTION_BASE_URL=https://parzival.live node scripts/verify-amplify-apis.mjs
```

## Assets

Runtime assets live under `public/`:

- `public/assets/` for project images
- `public/icons/` for app icons
- `public/pcm-processor.js` for voice audio processing
