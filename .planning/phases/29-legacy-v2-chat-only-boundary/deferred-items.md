# Deferred Items - Phase 29

## Out-of-scope verification findings

- `npx vitest run tests/voice-barge-in.test.ts tests/parz-contracts.test.ts` fails in `tests/parz-contracts.test.ts` on the existing current-work parity assertion: `bioText` contains "AI first hotel discovery platform" while the test expects "AI-first hotel booking platform". Phase 29 did not edit persona, bio, experience, or public profile content, so this is deferred outside the chat-only boundary work.
- `npm run lint` exits 0 but reports existing warnings in `src/components/particle-background.tsx`, `src/components/portfolio-card.tsx`, and `src/hooks/use-canvas.ts`. Phase 29 did not touch those files, so the warnings are deferred.
