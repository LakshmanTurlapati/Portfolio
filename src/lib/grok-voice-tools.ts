// Client-safe tool schemas for the Grok Voice realtime session.
// The browser sends these on session.update. The API key never lives here.

export const GROK_VOICE_MODEL = 'grok-voice-latest';
export const GROK_VOICE_SAMPLE_RATE = 24000;
export const DEFAULT_GROK_VOICE_ID = 'dxzytjeplonw';

export type GrokVoiceFunctionTool = {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
};

export const grokVoiceTools: GrokVoiceFunctionTool[] = [
  {
    type: 'function',
    name: 'navigate',
    description: 'Switch the portfolio page (home, portfolio, about). Call this ONLY when the user gives an explicit page-switch directive. Do NOT call this on incidental page mentions.',
    parameters: {
      type: 'object',
      properties: {
        page: { type: 'string', enum: ['home', 'portfolio', 'about'], description: 'The page to navigate to' },
      },
      required: ['page'],
    },
  },
  {
    type: 'function',
    name: 'openProject',
    description: 'Open an approved project in the in-portfolio browser. Call this ONLY when the user gives an explicit open/show/view directive. Do NOT call this on bare mentions or questions like "tell me about FSB".',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Approved project name or alias, e.g. Parz-AI, FSB, GitFly, Review Gate, T2S.' },
      },
      required: ['name'],
    },
  },
  {
    type: 'function',
    name: 'scrollTo',
    description: 'Scroll the about page to a section. Call this ONLY when the user gives an explicit scroll or jump directive.',
    parameters: {
      type: 'object',
      properties: {
        section: { type: 'string', enum: ['about', 'experience', 'academics'], description: 'The section to scroll to' },
      },
      required: ['section'],
    },
  },
  {
    type: 'function',
    name: 'scrollProjectPreview',
    description: 'Scroll inside a currently open portfolio project preview. Call this ONLY when a preview is open AND the user explicitly asks to scroll it.',
    parameters: {
      type: 'object',
      properties: {
        direction: { type: 'string', enum: ['down', 'up', 'top', 'bottom'], description: 'Scroll direction' },
      },
    },
  },
  {
    type: 'function',
    name: 'closeBrowser',
    description: 'Close the inbuilt project viewer. Call this ONLY when the user explicitly asks to close it.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'openCurrentProjectExternal',
    description: 'Open the currently viewed approved project in a new tab. Call this ONLY when the user explicitly asks to open it externally.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'unsupportedIframeControl',
    description: 'Use when the user asks to click, type, or operate controls inside an embedded third-party site.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'toggleTheme',
    description: 'Toggle dark and light theme. Call this ONLY when the user explicitly asks to switch theme or mode.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'openLink',
    description: 'Open an approved public portfolio, contact, or project URL. Call this ONLY when the user explicitly asks to open a link. Never invent URLs.',
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The approved URL to open' },
      },
      required: ['url'],
    },
  },
  {
    type: 'function',
    name: 'startTour',
    description: 'Start a guided tour of the portfolio. Call this ONLY when the user explicitly asks for a tour, walkthrough, or to be shown around.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'switchToText',
    description: 'Switch from voice mode to text chat. Call this ONLY when the user explicitly asks to type or use text chat.',
    parameters: { type: 'object', properties: {} },
  },
  {
    type: 'function',
    name: 'endCall',
    description: 'End the voice session. Call this ONLY when the user says goodbye or asks to stop voice mode.',
    parameters: { type: 'object', properties: {} },
  },
];
