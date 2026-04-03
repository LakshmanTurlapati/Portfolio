import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { xai } from '@ai-sdk/xai';
import { systemPrompt } from '@/data/system-prompt';
import { hasEnvVar } from '@/lib/env';

const errorMessages = [
  'I might be updating my server right now. Please try again in a moment!',
  'Server is under maintenance. Please check back shortly!',
  'Having some technical difficulties. Give me a few minutes and try again!',
];

export async function POST(req: Request) {
  // Validate API key is configured before attempting to use it
  if (!hasEnvVar('XAI_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'Chat service is not configured. Please try again later.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { messages } = (await req.json()) as { messages: UIMessage[] };

    const result = streamText({
      model: xai('grok-3-mini'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1000,
      temperature: 0.7,
    });

    return result.toUIMessageStreamResponse();
  } catch {
    const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
