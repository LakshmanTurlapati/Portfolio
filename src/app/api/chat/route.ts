import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod/v3';
import { systemPrompt } from '@/data/system-prompt';
import { hasEnvVar } from '@/lib/env';

const errorMessages = [
  'I might be updating my server right now. Please try again in a moment!',
  'Server is under maintenance. Please check back shortly!',
  'Having some technical difficulties. Give me a few minutes and try again!',
];

const voiceToolInstructions = `
You have access to tools that control the portfolio website. Use them when appropriate:
- navigate: Use when the user wants to go to a page (portfolio, about, home). Say something brief THEN call the tool.
- openProject: Use when the user mentions a specific project name. Navigate to portfolio first if needed, then open the project.
- scrollTo: Use when the user wants to see a specific section on the about page (experience, education/academics, about).
- toggleTheme: Use when the user asks to switch, toggle, or change the theme/mode (dark/light).
- openLink: Use when the user asks to open a specific URL.
- startTour: Use ONLY when the user explicitly asks for a tour/walkthrough of the site.
- switchToText: Use when the user wants to switch to text/chat mode.
- endCall: Use when the user says goodbye, wants to end the conversation, or stop voice mode.

IMPORTANT: Always respond with a brief spoken message alongside any tool call. For example, if navigating say "Sure, heading to the portfolio" and call navigate. Never call a tool silently without speaking.
`;

const voiceTools = {
  navigate: tool({
    description: 'Navigate to a page on the portfolio website. Valid pages: home, portfolio, about.',
    inputSchema: z.object({
      page: z.enum(['home', 'portfolio', 'about']).describe('The page to navigate to'),
    }),
  }),
  openProject: tool({
    description: 'Open a specific project detail view on the portfolio page. Use the project name as it appears in the portfolio.',
    inputSchema: z.object({
      name: z.string().describe('The project name to open, e.g. "Parz-AI", "FSB", "Amogus"'),
    }),
  }),
  scrollTo: tool({
    description: 'Scroll to a section on the about page. Valid sections: about, experience, academics.',
    inputSchema: z.object({
      section: z.enum(['about', 'experience', 'academics']).describe('The section to scroll to'),
    }),
  }),
  toggleTheme: tool({
    description: 'Toggle between dark and light theme.',
    inputSchema: z.object({}),
  }),
  openLink: tool({
    description: 'Open a URL in a new browser tab.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to open'),
    }),
  }),
  startTour: tool({
    description: 'Start a guided tour of the portfolio website. Only use when the user explicitly asks for a tour.',
    inputSchema: z.object({}),
  }),
  switchToText: tool({
    description: 'Switch from voice mode to text chat mode.',
    inputSchema: z.object({}),
  }),
  endCall: tool({
    description: 'End the voice session and close voice mode.',
    inputSchema: z.object({}),
  }),
};

export async function POST(req: Request) {
  if (!hasEnvVar('XAI_API_KEY')) {
    return new Response(
      JSON.stringify({ error: 'Chat service is not configured. Please try again later.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { messages, isVoice } = (await req.json()) as { messages: UIMessage[]; isVoice?: boolean };

    const system = isVoice
      ? systemPrompt + voiceToolInstructions
      : systemPrompt;

    const result = streamText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1000,
      temperature: 0.7,
      ...(isVoice ? { tools: voiceTools } : {}),
    });

    return result.toUIMessageStreamResponse();
  } catch {
    const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
