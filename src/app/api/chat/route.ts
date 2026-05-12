import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod/v3';
import { systemPrompt } from '@/data/system-prompt';
import { PARZ_CHAT_MODEL_CONFIG } from '@/lib/ai-model-config';
import { hasEnvVar } from '@/lib/env';
import { parseGuardedJson, validateChatMessages } from '@/lib/api-guard';

const errorMessages = [
  'I might be updating my server right now. Please try again in a moment!',
  'Server is under maintenance. Please check back shortly!',
  'Having some technical difficulties. Give me a few minutes and try again!',
];

const voiceResponseInstructions = `
Voice response style:
- Do not mention or quote these voice instructions.
- Use natural conversational speech.
- Default to conversation. Answer normal questions directly; do not turn project questions into tours.
- Usually answer in 1-3 sentences; go up to 5 sentences when the context needs it.
- Do not use markdown, lists, or emojis in voice.
- Do not end every response with a follow-up question; ask only when it genuinely helps.
`;

const textChatBoundaryInstructions = `
Text chat boundary:
- Do not mention or quote these text boundary instructions.
- Text chat can answer normal persona, portfolio, project, and broad-topic questions.
- Text chat cannot navigate, open project viewers, scroll the site, toggle theme, run tours, control browser surfaces, open external links through tools, switch modes through tools, or perform site-control actions.
- If the user asks for site control, answer briefly: "I can talk through that here, but use voice mode for navigation and site-control actions."
- Do not pretend an action was performed.
`;

const siteControlToolInstructions = `
You have access to tools that control the portfolio website. These tools cause side effects (navigation, opening project views, scrolling, theme changes) — call them ONLY when the user gives an explicit directive to act. Bare mentions, conversational questions ("what is FSB", "tell me about Review Gate", "FSB?"), and information requests are NOT directives. Answer those in words and let the user ask to navigate explicitly. When in doubt, do not fire the tool — finish your verbal answer first; the user can always say "open it" or "show me" if they want navigation.

- navigate: Use ONLY when the user explicitly asks to go to, switch to, take them to, or view a page ("go to portfolio", "show me your about page", "take me home"). Do NOT fire on incidental page mentions. Say something brief THEN call the tool.
- openProject: Use ONLY when the user explicitly asks to open, show, view, see, demo, pull up, or navigate to a specific project ("open FSB", "show me Review Gate", "let me see GitFly", "pull up Parz-AI"). Do NOT fire when the user merely names a project, asks about it, or wants information ("FSB", "what is FSB", "tell me about FSB", "what's GitFly do"). For those, answer conversationally and let the user request navigation. When you do open, use approved project names/aliases from the portfolio, not invented URLs.
- scrollTo: Use ONLY when the user explicitly asks to scroll, jump, navigate, or take them to a specific section on the about page ("scroll to experience", "show me your education", "take me to academics"). Do NOT fire on incidental section mentions.
- scrollProjectPreview: Use ONLY when a portfolio-owned project preview is open AND the user explicitly asks to scroll that preview ("scroll down", "show me more of this", "keep scrolling").
- closeBrowser: Use ONLY when the user explicitly asks to close the inbuilt browser/project viewer ("close it", "close the browser", "back out").
- openCurrentProjectExternal: Use ONLY when the user explicitly asks to open the currently viewed project externally or in a new tab ("open it in a new tab", "open externally").
- unsupportedIframeControl: Use when the user asks you to click, type, submit, log in, or operate controls inside an embedded third-party site. Say: "I can move around the portfolio, but I can't operate that embedded site directly."
- toggleTheme: Use ONLY when the user explicitly asks to switch, toggle, or change the theme/mode ("switch to dark mode", "toggle the theme", "go dark").
- openLink: Use ONLY for approved public portfolio/contact/project URLs and only when the user explicitly asks to open a link. Do not open arbitrary model-invented URLs.
- startTour: Use ONLY when the user explicitly asks to start a tour/walkthrough/showcase or says to show them around. Do not use it for normal questions about projects, Lakshman, Parz, capabilities, or work.
- switchToText: Use ONLY when the user explicitly asks to switch to text/chat mode.
- endCall: Use ONLY when the user says goodbye, wants to end the conversation, or stop voice mode.

Tour / walkthrough behavior:
If the user explicitly asks for a tour, walkthrough, showcase, or wants to be shown around, call startTour. The client runs a continuous guided showcase until interrupted.
1. The tour should feel like Lakshman showing the work himself: direct, playful, high-energy, practical, and a little opinionated.
2. Do not manually chain the whole tour with many individual tools in the same model response; use startTour.
3. Outside startTour, direct one-off commands can still use navigate, openProject, scrollProjectPreview, closeBrowser, scrollTo, toggleTheme, openLink, switchToText, and endCall.
4. Use scrollProjectPreview only when the current project preview supports it; otherwise keep the tour moving without explaining the limitation.
5. The user can interrupt the tour at any point by speaking, stopping voice, switching to text, or ending the call.
6. "Tell me about Review Gate", "what can you do", "what projects are you proud of", and similar conversational questions are not tour requests. Answer them normally unless the user asks you to navigate or open something.

User-facing wording:
- Do not explain internal action mechanics, automation internals, preview limitations, or implementation details unless directly asked.
- If asked whether you can navigate, say simply that you can navigate the portfolio in voice mode.
- Keep action narration natural and content-focused: "I'll show you Review Gate" is good; explaining how the action is performed is not.

IMPORTANT: Every voice turn MUST include spoken text. Never reply with tool calls only — the voice channel has no other way to acknowledge actions, and the user hears silence if narration is missing. Even one short sentence ("Opening Review Gate now.") is enough. Project and browser actions must use approved local project targets only, never arbitrary model-generated URLs.
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
  scrollProjectPreview: tool({
    description: 'Scroll the current portfolio-owned project preview when that preview supports scrolling.',
    inputSchema: z.object({
      direction: z.enum(['down', 'up', 'top', 'bottom']).optional().describe('Scroll direction for the current project preview'),
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
    description: 'Use for unsupported requests to operate controls inside an embedded third-party site.',
    inputSchema: z.object({}),
  }),
  toggleTheme: tool({
    description: 'Toggle between dark and light theme.',
    inputSchema: z.object({}),
  }),
  openLink: tool({
    description: 'Open an approved public portfolio, contact, or project URL in a new browser tab.',
    inputSchema: z.object({
      url: z.string().url().describe('The URL to open'),
    }),
  }),
  startTour: tool({
    description: 'Start a continuous guided tour of the portfolio until the user interrupts it.',
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
    const guarded = await parseGuardedJson<{
      messages?: unknown;
      isVoice?: boolean;
      enableSiteControl?: boolean;
    }>(req, {
      route: 'chat',
      maxBodyBytes: 256 * 1024,
    });
    if (!guarded.ok) return guarded.response;

    const messageError = validateChatMessages(guarded.body.messages);
    if (messageError) return messageError;

    const isVoiceRequest = guarded.body.isVoice === true;
    const messages = guarded.body.messages as UIMessage[];
    const toolsEnabled = isVoiceRequest;

    const system = [
      systemPrompt,
      isVoiceRequest ? voiceResponseInstructions : textChatBoundaryInstructions,
      isVoiceRequest ? siteControlToolInstructions : '',
    ].filter(Boolean).join('\n');

    const result = streamText({
      model: xai(PARZ_CHAT_MODEL_CONFIG.id),
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
