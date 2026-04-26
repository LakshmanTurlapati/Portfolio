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

const siteControlToolInstructions = `
You have access to tools that control the portfolio website. Use them when appropriate:
- navigate: Use when the user wants to go to a page (portfolio, about, home). Say something brief THEN call the tool.
- openProject: Use when the user mentions a specific project name or approved alias. Open the approved inbuilt-browser target for that project; do not invent project URLs.
- scrollTo: Use when the user wants to see a specific section on the about page (experience, education/academics, about).
- closeBrowser: Use when the user asks to close the inbuilt browser/project viewer.
- openCurrentProjectExternal: Use when the user asks to open the currently viewed project externally or in a new tab.
- unsupportedIframeControl: Use when the user asks you to click, type, scroll, submit, log in, or otherwise operate controls inside a third-party iframe. Say: "I can control the portfolio shell, but I can't operate arbitrary controls inside a third-party iframe."
- toggleTheme: Use when the user asks to switch, toggle, or change the theme/mode (dark/light).
- openLink: Use when the user asks to open a specific URL.
- switchToText: Use when the user wants to switch to text/chat mode.
- endCall: Use when the user says goodbye, wants to end the conversation, or stop voice mode.

Tour / walkthrough behavior:
If the user asks for a tour, walkthrough, or wants to be shown around, run it conversationally — there is no dedicated tour tool. Drive it yourself by calling the existing tools one step at a time:
1. Navigate to a section (navigate or openProject), say one or two sentences of commentary, then stop and let the user respond. Do NOT chain the entire tour in a single response.
2. Wait for the user to say something like "next", "keep going", "what else", or to ask a question. Then move to the next stop.
3. A natural ordering is: home (intro) → portfolio (overview) → a flagship project like Parz-AI, FSB, or GitFly via openProject → about (closing). Adapt to what the user seems most interested in.
4. End the tour when the user says they're done, or after about-page closing remarks. Do not loop indefinitely.
The point is the user paces it, not you.

IMPORTANT: Always respond with a brief message alongside any tool call. For example, if navigating say "Sure, heading to the portfolio" and call navigate. Never call a tool silently without speaking. Project and browser actions must use approved local project targets only, never arbitrary model-generated URLs.
`;

const siteControlTools = {
  navigate: tool({
    description: 'Navigate to a page on the portfolio website. Valid pages: home, portfolio, about.',
    inputSchema: z.object({
      page: z.enum(['home', 'portfolio', 'about']).describe('The page to navigate to'),
    }),
  }),
  openProject: tool({
    description: 'Open a specific approved project target in the portfolio browser. Use a project name or alias from the portfolio, not an arbitrary URL.',
    inputSchema: z.object({
      name: z.string().describe('The project name or alias to open, e.g. "Parz-AI", "FSB", "GitFly", "Review Gate", "T2S"'),
    }),
  }),
  scrollTo: tool({
    description: 'Scroll to a section on the about page. Valid sections: about, experience, academics.',
    inputSchema: z.object({
      section: z.enum(['about', 'experience', 'academics']).describe('The section to scroll to'),
    }),
  }),
  closeBrowser: tool({
    description: 'Close the inbuilt portfolio browser/project viewer if it is currently open.',
    inputSchema: z.object({}),
  }),
  openCurrentProjectExternal: tool({
    description: 'Open the currently active approved project browser target externally in a new tab.',
    inputSchema: z.object({}),
  }),
  unsupportedIframeControl: tool({
    description: 'Use for unsupported requests to operate arbitrary third-party iframe contents. The portfolio shell can be controlled, but cross-origin iframe controls cannot.',
    inputSchema: z.object({}),
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
    const { messages, isVoice, enableSiteControl } = (await req.json()) as {
      messages: UIMessage[];
      isVoice?: boolean;
      enableSiteControl?: boolean;
    };
    const toolsEnabled = Boolean(isVoice || enableSiteControl);

    const system = toolsEnabled
      ? systemPrompt + siteControlToolInstructions
      : systemPrompt;

    const result = streamText({
      model: xai('grok-4-1-fast-non-reasoning'),
      system,
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 1000,
      temperature: 0.7,
      ...(toolsEnabled ? { tools: siteControlTools } : {}),
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
