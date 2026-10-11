import { systemPrompt } from '@/data/system-prompt';
import { siteControlToolInstructions, voiceResponseInstructions } from '@/app/api/chat/route';

export function buildGrokVoiceInstructions(): string {
  return [
    systemPrompt,
    voiceResponseInstructions,
    siteControlToolInstructions,
    `Voice engine:
- You are speaking live through Grok Voice. The visitor hears your audio directly.
- Every voice turn MUST include spoken text. Never reply with tool calls only — the user hears silence if narration is missing.
- Keep replies short enough to say out loud. No markdown, lists, or emojis.`,
  ].join('\n\n');
}
