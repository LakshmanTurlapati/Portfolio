// src/lib/voice-commands.ts
// Local stop-intent matcher only.
//
// All other intent routing (tours, navigation, mode switches, project opens)
// is delegated to the LLM via tool calls in /api/chat — there are no other
// hardcoded regex triggers.
//
// Stop is the lone exception: instant abort without a network round-trip is a
// safety/UX requirement (the user yelling "stop" must work even if the API is
// down or slow). Everything else can afford the latency of a model turn.

export function isStopIntent(u: string): boolean {
  return /^(stop|shut up|quiet|cancel|exit|close|bye)/.test(u);
}
