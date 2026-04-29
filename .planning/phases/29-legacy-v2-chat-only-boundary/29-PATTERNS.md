# Phase 29: Legacy V2 Chat-Only Boundary - Pattern Map

**Mapped:** 2026-04-29
**Files analyzed:** 4 target files, plus 6 shared analog/reference files
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/app/api/chat/route.ts` | route/controller | request-response + streaming | `src/app/api/chat/route.ts` | exact |
| `src/components/chat-popup.tsx` | component | streaming UI + text transform | `src/components/chat-popup.tsx` | exact |
| `src/app/chat/page.tsx` | component/page | streaming UI + text transform | `src/app/chat/page.tsx` | exact |
| `tests/voice-barge-in.test.ts` | test | file-I/O source contract | `tests/voice-barge-in.test.ts` | exact |

Reference-only files that should be preserved and/or used by tests: `src/lib/voice-controller.ts`, `src/providers/voice-session-provider.tsx`, `src/providers/site-control-provider.tsx`, `src/components/iframe-viewer.tsx`, `src/components/github-preview.tsx`, `tests/parz-contracts.test.ts`.

## Pattern Assignments

### `src/app/api/chat/route.ts` (route/controller, request-response + streaming)

**Analog:** `src/app/api/chat/route.ts`

**Imports pattern** (lines 1-6):
```typescript
import { streamText, UIMessage, convertToModelMessages, tool } from 'ai';
import { xai } from '@ai-sdk/xai';
import { z } from 'zod/v3';
import { systemPrompt } from '@/data/system-prompt';
import { hasEnvVar } from '@/lib/env';
import { parseGuardedJson, validateChatMessages } from '@/lib/api-guard';
```

**Voice instruction pattern to preserve** (lines 14-21):
```typescript
const voiceResponseInstructions = `
Voice response style:
- Do not mention or quote these voice instructions.
- Use natural conversational speech.
- Usually answer in 1-3 sentences; go up to 5 sentences when the context needs it.
- Do not use markdown, lists, or emojis in voice.
- Do not end every response with a follow-up question; ask only when it genuinely helps.
`;
```

**Site-control tool inventory to preserve for voice** (lines 50-105):
```typescript
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
  // scrollTo, closeBrowser, openCurrentProjectExternal,
  // unsupportedIframeControl, toggleTheme, and openLink are also defined here.
  scrollProjectPreview: tool({
    description: 'Scroll the current portfolio-owned project preview. Use only for local preview surfaces such as GitHub previews, not arbitrary third-party iframes.',
    inputSchema: z.object({
      direction: z.enum(['down', 'up', 'top', 'bottom']).optional().describe('Scroll direction for the current project preview'),
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
```

**Guard and validation pattern** (lines 107-131):
```typescript
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

    const { isVoice, enableSiteControl } = guarded.body;
    const messages = guarded.body.messages as UIMessage[];
    const toolsEnabled = Boolean(isVoice || enableSiteControl);
```

Planner note: copy the guard/validation shape, but replace the capability gate so `enableSiteControl` is parsed only as legacy input and does not affect `toolsEnabled`. The target implementation should be shaped like the researched pattern:
```typescript
const isVoiceRequest = guarded.body.isVoice === true;
const toolsEnabled = isVoiceRequest;
```

**Prompt assembly and streaming pattern** (lines 133-148):
```typescript
const system = [
  systemPrompt,
  isVoice ? voiceResponseInstructions : '',
  toolsEnabled ? siteControlToolInstructions : '',
].filter(Boolean).join('\n');

const result = streamText({
  model: xai('grok-4-1-fast-non-reasoning'),
  system,
  messages: await convertToModelMessages(messages),
  maxOutputTokens: 1000,
  temperature: 0.7,
  ...(toolsEnabled ? { tools: siteControlTools } : {}),
});

return result.toUIMessageStreamResponse();
```

Planner note: preserve `systemPrompt` for all requests. Add a text-only boundary instruction constant beside `voiceResponseInstructions`, then include it only when `isVoiceRequest` is false.

**Error handling pattern** (lines 149-155):
```typescript
} catch {
  const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];
  return new Response(
    JSON.stringify({ error: message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Supporting validation analog:** `src/lib/api-guard.ts`

**JSON guard pattern** (lines 75-123):
```typescript
export async function parseGuardedJson<T>(
  req: Request,
  options: JsonGuardOptions,
): Promise<GuardedJson<T>> {
  const guardResponse = guardApiRequest(req, options);
  if (guardResponse) return { ok: false, response: guardResponse };

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      ok: false,
      response: jsonError('Request must use application/json.', 415),
    };
  }
```

**Message validation pattern** (lines 125-143):
```typescript
export function validateChatMessages(messages: unknown): Response | null {
  if (!Array.isArray(messages)) {
    return jsonError('messages must be an array.', 400);
  }

  if (messages.length > 40) {
    return jsonError('Too many messages.', 413);
  }

  const aggregateTextChars = messages.reduce((sum, message) => {
    return sum + extractMessageText(message).length;
  }, 0);

  if (aggregateTextChars > 12_000) {
    return jsonError('Message content is too large.', 413);
  }

  return null;
}
```

---

### `src/components/chat-popup.tsx` (component, streaming UI + text transform)

**Analog:** `src/components/chat-popup.tsx`

**Imports pattern to preserve, with removals** (lines 3-11):
```typescript
import { useState, useEffect, useRef, useCallback, useLayoutEffect, type CSSProperties } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { FaXmark, FaArrowUp } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useSiteControl, type ControlPage } from '@/providers/site-control-provider';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ChatMorphRect, ChatVoiceSnapshot } from '@/lib/chat-morph';
```

Planner note: preserve React, `useChat`, icons, sanitize/linkify, media query, and morph imports. Delete `DefaultChatTransport`, `useSiteControl`, and `ControlPage` from this text client.

**Current text transport anti-pattern to delete** (lines 42-44):
```typescript
const siteControlChatTransport = new DefaultChatTransport({
  body: { enableSiteControl: true },
});
```

**Text extraction/rendering pattern to preserve** (lines 50-80):
```typescript
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('');
}

function RenderLinkedText({ text }: { text: string }) {
  const parts: LinkPart[] = linkifyText(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            className="underline break-all"
            style={{ color: 'inherit' }}
          >
            {part.content}
          </a>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}
```

**Tool parsing anti-pattern to delete** (lines 83-101):
```typescript
type ToolPart = {
  type?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  args?: Record<string, unknown>;
};

function getToolCall(part: ToolPart): { id: string; name: string; args: Record<string, unknown> } | null {
  const name = part.toolName || (part.type?.startsWith('tool-') ? part.type.slice(5) : '');
  if (!name) return null;
  if (part.state && part.state !== 'input-available' && part.state !== 'output-available') return null;
  return {
    id: part.toolCallId || `${name}:${JSON.stringify(part.input || part.args || {})}`,
    name,
    args: part.input || part.args || {},
  };
}
```

**State and useChat pattern** (lines 161-199):
```typescript
const siteControl = useSiteControl();
const isDesktop = useMediaQuery('(min-width: 768px)');
const messagesEndRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLInputElement>(null);
const handledToolCallsRef = useRef<Set<string>>(new Set());

const { messages, sendMessage, status, error } = useChat({
  transport: siteControlChatTransport,
  onError: () => {
    // Error handled via the error state from the hook
  },
});
```

Planner note: keep the refs and `useChat` error callback shape, but delete `siteControl`, `handledToolCallsRef`, and the `transport` option. The final popup should call `useChat({ onError: () => { ... } })`.

**Client tool execution anti-pattern to delete** (lines 209-237):
```typescript
useEffect(() => {
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    for (const rawPart of message.parts as ToolPart[]) {
      const toolCall = getToolCall(rawPart);
      if (!toolCall || handledToolCallsRef.current.has(toolCall.id)) continue;
      handledToolCallsRef.current.add(toolCall.id);

      if (toolCall.name === 'navigate') {
        const page = toolCall.args.page;
        if (page === 'home' || page === 'portfolio' || page === 'about') siteControl.navigate(page as ControlPage);
      }
      if (toolCall.name === 'openProject' && typeof toolCall.args.name === 'string') {
        siteControl.openProject(toolCall.args.name);
      }
      if (toolCall.name === 'scrollTo' && typeof toolCall.args.section === 'string') {
        siteControl.scrollTo(toolCall.args.section);
      }
      if (toolCall.name === 'scrollProjectPreview') {
        siteControl.scrollProjectPreview(
          typeof toolCall.args.direction === 'string' ? toolCall.args.direction : undefined,
        );
      }
      if (toolCall.name === 'closeBrowser') siteControl.closeBrowser();
      if (toolCall.name === 'openCurrentProjectExternal') siteControl.openCurrentProjectExternal();
      if (toolCall.name === 'unsupportedIframeControl') siteControl.unsupportedIframeControl();
    }
  }
}, [messages, siteControl]);
```

**Send interaction pattern to preserve** (lines 370-395):
```typescript
const handleSend = useCallback(() => {
  const trimmed = inputValue.trim();
  if (!trimmed || isLoading) return;
  sendMessage({ text: trimmed });
  setInputValue('');
  setUserMessageCount((c) => c + 1);
}, [inputValue, isLoading, sendMessage]);

const handleSuggestionClick = useCallback(
  (text: string) => {
    setSuggestionClicked(true);
    sendMessage({ text });
    setUserMessageCount((c) => c + 1);
  },
  [sendMessage]
);
```

**Message display pattern to preserve** (lines 662-700):
```typescript
{messages.map((message) => {
  const isUser = message.role === 'user';
  const rawText = getMessageText(message.parts as Array<{ type: string; text?: string }>);
  const displayText = isUser ? rawText : sanitizeText(rawText);

  return (
    <div
      key={message.id}
      data-chat-message-wrapper="true"
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        margin: isUser ? '6px 0' : '6px 0 6px 4px',
        animation: 'messageAppear 180ms ease-out',
      }}
    >
      <div
        style={{
          maxWidth: '270px',
```

---

### `src/app/chat/page.tsx` (component/page, streaming UI + text transform)

**Analog:** `src/app/chat/page.tsx`

**Imports pattern to preserve, with removals** (lines 3-10):
```typescript
import { useRef, useEffect, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { FaArrowUp, FaArrowLeft } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useTransition } from '@/providers/transition-provider';
import { useSiteControl, type ControlPage } from '@/providers/site-control-provider';
```

Planner note: preserve React, `useChat`, icons, sanitize/linkify, and transition imports. Delete `DefaultChatTransport`, `useSiteControl`, and `ControlPage`.

**Current text transport anti-pattern to delete** (lines 41-43):
```typescript
const siteControlChatTransport = new DefaultChatTransport({
  body: { enableSiteControl: true },
});
```

**Text extraction/rendering pattern to preserve** (lines 49-79):
```typescript
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('');
}

function RenderLinkedText({ text }: { text: string }) {
  const parts: LinkPart[] = linkifyText(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 break-all"
          >
            {part.content}
          </a>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}
```

**Tool parsing anti-pattern to delete** (lines 81-99):
```typescript
type ToolPart = {
  type?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  args?: Record<string, unknown>;
};

function getToolCall(part: ToolPart): { id: string; name: string; args: Record<string, unknown> } | null {
  const name = part.toolName || (part.type?.startsWith('tool-') ? part.type.slice(5) : '');
  if (!name) return null;
  if (part.state && part.state !== 'input-available' && part.state !== 'output-available') return null;
  return {
    id: part.toolCallId || `${name}:${JSON.stringify(part.input || part.args || {})}`,
    name,
    args: part.input || part.args || {},
  };
}
```

**State and useChat pattern** (lines 101-131):
```typescript
export default function ChatPage() {
  const { navigateWithReveal } = useTransition();
  const siteControl = useSiteControl();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handledToolCallsRef = useRef<Set<string>>(new Set());

  const { messages, sendMessage, status, error } = useChat({
    transport: siteControlChatTransport,
    onError: () => {
      // Error handled via the error state from the hook
    },
  });
```

Planner note: keep `navigateWithReveal`, refs, and the `useChat` error callback shape. Delete `siteControl`, `handledToolCallsRef`, and the `transport` option.

**Client tool execution anti-pattern to delete** (lines 150-178):
```typescript
useEffect(() => {
  for (const message of messages) {
    if (message.role !== 'assistant') continue;
    for (const rawPart of message.parts as ToolPart[]) {
      const toolCall = getToolCall(rawPart);
      if (!toolCall || handledToolCallsRef.current.has(toolCall.id)) continue;
      handledToolCallsRef.current.add(toolCall.id);

      if (toolCall.name === 'navigate') {
        const page = toolCall.args.page;
        if (page === 'home' || page === 'portfolio' || page === 'about') siteControl.navigate(page as ControlPage);
      }
      if (toolCall.name === 'openProject' && typeof toolCall.args.name === 'string') {
        siteControl.openProject(toolCall.args.name);
      }
      if (toolCall.name === 'scrollTo' && typeof toolCall.args.section === 'string') {
        siteControl.scrollTo(toolCall.args.section);
      }
      if (toolCall.name === 'scrollProjectPreview') {
        siteControl.scrollProjectPreview(
          typeof toolCall.args.direction === 'string' ? toolCall.args.direction : undefined,
        );
      }
      if (toolCall.name === 'closeBrowser') siteControl.closeBrowser();
      if (toolCall.name === 'openCurrentProjectExternal') siteControl.openCurrentProjectExternal();
      if (toolCall.name === 'unsupportedIframeControl') siteControl.unsupportedIframeControl();
    }
  }
}, [messages, siteControl]);
```

**Send interaction pattern to preserve** (lines 192-217):
```typescript
const handleSend = useCallback(() => {
  const trimmed = inputValue.trim();
  if (!trimmed || isLoading) return;
  sendMessage({ text: trimmed });
  setInputValue('');
  setUserMessageCount((c) => c + 1);
}, [inputValue, isLoading, sendMessage]);

const handleSuggestionClick = useCallback(
  (text: string) => {
    setSuggestionClicked(true);
    sendMessage({ text });
    setUserMessageCount((c) => c + 1);
  },
  [sendMessage]
);

const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  },
  [handleSend]
);
```

**Message display pattern to preserve** (lines 262-292):
```typescript
{messages.map((message) => {
  const isUser = message.role === 'user';
  const rawText = getMessageText(message.parts as Array<{ type: string; text?: string }>);
  const displayText = isUser ? rawText : sanitizeText(rawText);

  return (
    <div
      key={message.id}
      className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-3 ${
          isUser ? 'rounded-br-md' : 'rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {isUser ? (
            displayText
          ) : (
            <RenderLinkedText text={displayText} />
          )}
        </p>
      </div>
    </div>
  );
})}
```

---

### `tests/voice-barge-in.test.ts` (test, file-I/O source contract)

**Analog:** `tests/voice-barge-in.test.ts`

**Imports pattern** (lines 1-3):
```typescript
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
```

**Source-contract test pattern for route prompt assertions** (lines 190-203):
```typescript
describe('voice chat prompt routing', () => {
  it('keeps conversational voice rules in the server-side prompt path', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(source).toContain('const voiceResponseInstructions');
    expect(source).toContain('Do not mention or quote these voice instructions');
    expect(source).toContain('go up to 5 sentences when the context needs it');
    expect(source).toContain('Do not end every response with a follow-up question');
    expect(source).toContain('isVoice ? voiceResponseInstructions');
    expect(source).not.toContain('one or two sentences');
  });
```

Planner note: update this block or add a neighboring test so it expects text boundary guidance and the new voice-only gate. It should assert the route contains `const textChatBoundaryInstructions`, the exact guidance copy, `const toolsEnabled = isVoice === true` or equivalent, and does not contain `Boolean(isVoice || enableSiteControl)`.

**Current site-control wiring test to revise** (lines 219-239):
```typescript
describe('site-control tool wiring', () => {
  it('wires project-preview scrolling through voice, text chat, and preview surfaces', () => {
    const route = readFileSync(join(process.cwd(), 'src/app/api/chat/route.ts'), 'utf8');
    const voice = readFileSync(join(process.cwd(), 'src/lib/voice-controller.ts'), 'utf8');
    const provider = readFileSync(join(process.cwd(), 'src/providers/site-control-provider.tsx'), 'utf8');
    const iframeViewer = readFileSync(join(process.cwd(), 'src/components/iframe-viewer.tsx'), 'utf8');
    const githubPreview = readFileSync(join(process.cwd(), 'src/components/github-preview.tsx'), 'utf8');
    const chatPage = readFileSync(join(process.cwd(), 'src/app/chat/page.tsx'), 'utf8');
    const chatPopup = readFileSync(join(process.cwd(), 'src/components/chat-popup.tsx'), 'utf8');

    expect(route).toContain('scrollProjectPreview: tool');
    expect(voice).toContain("case 'scrollProjectPreview'");
    expect(voice).toContain("runTool('scrollProjectPreview'");
    expect(provider).toContain('scrollProjectPreview: (direction?');
    expect(iframeViewer).toContain('onRegisterPreviewScroller');
    expect(iframeViewer).toContain('controlOverlayActive');
    expect(githubPreview).toContain('onRegisterScroller');
    expect(githubPreview).toContain('shell.scrollTo');
    expect(chatPage).toContain("toolCall.name === 'scrollProjectPreview'");
    expect(chatPopup).toContain("toolCall.name === 'scrollProjectPreview'");
  });
```

Planner note: rename this test so project-preview scrolling is through voice and preview surfaces only. Replace the final two positive text-chat assertions with negative assertions that text clients do not contain `enableSiteControl`, `useSiteControl`, `getToolCall`, `handledToolCallsRef`, or `toolCall.name`.

**Voice-to-text morph preservation test pattern** (lines 250-273):
```typescript
it('carries the voice capsule rect and panel snapshot into the text chat morph', () => {
  const chatMorph = readFileSync(join(process.cwd(), 'src/lib/chat-morph.ts'), 'utf8');
  const sessionProvider = readFileSync(join(process.cwd(), 'src/providers/voice-session-provider.tsx'), 'utf8');
  const voicePanel = readFileSync(join(process.cwd(), 'src/components/voice-panel.tsx'), 'utf8');
  const chatPopup = readFileSync(join(process.cwd(), 'src/components/chat-popup.tsx'), 'utf8');
  const homePage = readFileSync(join(process.cwd(), 'src/app/page.tsx'), 'utf8');

  expect(chatMorph).toContain('export interface ChatMorphRect');
  expect(chatMorph).toContain('export interface ChatVoiceSnapshot');
  expect(sessionProvider).toContain('getCurrentChatMorphOrigin()');
  expect(sessionProvider).toContain("new CustomEvent<OpenTextChatDetail>('parz:open-text-chat'");
  expect(sessionProvider).toContain('voiceSnapshot');
  expect(chatPopup).toContain('Legacy V2 Chat interface (Features may be limited)');
  expect(chatPopup).toContain('const width = Math.min(400, viewportWidth - 48)');
});
```

**Persona/broad-topic contract to preserve:** `tests/parz-contracts.test.ts`

**Broad-topic assertion pattern** (lines 38-45):
```typescript
it('allows broad-topic answers while separating public facts from general reasoning', () => {
  expect(systemPrompt).toContain('For general topics outside the portfolio, answer normally with general reasoning');
  expect(systemPrompt).toContain('technology, AI, careers, strategy, tools, games, music, taste, culture');
  expect(systemPrompt).toContain('Do not refuse normal broad-topic questions');
  expect(systemPrompt).toContain('use only public-safe facts from the profile and public project data');
  expect(systemPrompt).toContain('do not invent private personal facts');
  expect(systemPrompt).toContain('private datastore');
});
```

Planner note: no edit is required here unless the route prompt change touches persona contracts. Keep this file in the verification run.

## Shared Patterns

### Server Boundary

**Source:** `src/app/api/chat/route.ts`
**Apply to:** `src/app/api/chat/route.ts`, `tests/voice-barge-in.test.ts`

Preserve `siteControlTools` and `siteControlToolInstructions` for voice, but make the grant server-authoritative through `isVoice === true`. Text chat should get prompt guidance, not tools.

Current code to replace (lines 129-137):
```typescript
const { isVoice, enableSiteControl } = guarded.body;
const messages = guarded.body.messages as UIMessage[];
const toolsEnabled = Boolean(isVoice || enableSiteControl);

const system = [
  systemPrompt,
  isVoice ? voiceResponseInstructions : '',
  toolsEnabled ? siteControlToolInstructions : '',
].filter(Boolean).join('\n');
```

Target behavior from phase research:
```typescript
const isVoiceRequest = guarded.body.isVoice === true;
const toolsEnabled = isVoiceRequest;

const system = [
  systemPrompt,
  isVoiceRequest ? voiceResponseInstructions : textChatBoundaryInstructions,
  isVoiceRequest ? siteControlToolInstructions : '',
].filter(Boolean).join('\n');
```

### Text-Only Clients

**Source:** `src/components/chat-popup.tsx`, `src/app/chat/page.tsx`
**Apply to:** both text chat surfaces

Keep text rendering and send behavior. Delete all text-client capability opt-in and tool dispatch:
```text
DefaultChatTransport
siteControlChatTransport
enableSiteControl
useSiteControl
ControlPage
ToolPart
getToolCall
handledToolCallsRef
toolCall.name
siteControl.navigate/openProject/scrollTo/scrollProjectPreview/closeBrowser/openCurrentProjectExternal/unsupportedIframeControl
```

The text clients should render text parts only through `getMessageText`, `sanitizeText`, and `RenderLinkedText`.

### Voice Tool Preservation

**Source:** `src/lib/voice-controller.ts`
**Apply to:** tests and route-preservation checks

**Voice request body and stream parsing** (lines 816-842):
```typescript
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages, isVoice: true }),
});

const toolCalls: { name: string; args: Record<string, unknown> }[] = [];

const handleLine = (line: string) => {
  if (line.startsWith('data: ')) {
    const payload = line.slice(6);
    if (payload === '[DONE]') return;
    try {
      const evt = JSON.parse(payload);
      if (evt.type === 'text-delta' && typeof evt.delta === 'string') {
        responseText += evt.delta;
      }
      if (evt.type === 'tool-input-available' && evt.toolName) {
        toolCalls.push({ name: evt.toolName, args: evt.input || {} });
      }
    } catch {}
```

**Voice dispatch pattern** (lines 884-929):
```typescript
for (const tc of toolCalls) {
  switch (tc.name) {
    case 'navigate':
      dispatchToolCall('navigate', tc.args);
      break;
    case 'openProject': {
      dispatchToolCall('openProject', { slug: (tc.args as { name: string }).name });
      break;
    }
    case 'scrollProjectPreview':
      dispatchToolCall('scrollProjectPreview', { direction: (tc.args as { direction?: string }).direction ?? 'down' });
      break;
    case 'switchToText': {
      const voiceSnapshot = buildVoiceSnapshot();
      stopAll();
      openTextChat(undefined, undefined, voiceSnapshot);
      activeRef.current = false;
      setActive(false);
      return;
    }
    case 'endCall':
      if (clean) await speak(clean);
      stopAll();
      activeRef.current = false;
      setActive(false);
      return;
  }
}
```

**Source:** `src/providers/voice-session-provider.tsx`
**Apply to:** voice bridge preservation

**Provider callback bridge** (lines 62-84):
```typescript
const { resolvedTheme, setTheme } = useTheme();
useEffect(() => {
  toolCallbacksRef.current.toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  toolCallbacksRef.current.openLink = ({ url }: { url: string }) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  toolCallbacksRef.current.openProject = ({ slug }: { slug: string }) => {
    return siteControl.openProject(slug);
  };
  toolCallbacksRef.current.scrollTo = ({ selector }: { selector: string }) => {
    return siteControl.scrollTo(selector);
  };
  toolCallbacksRef.current.scrollProjectPreview = ({ direction }: { direction?: string }) => {
    return siteControl.scrollProjectPreview(direction);
  };
  toolCallbacksRef.current.closeBrowser = siteControl.closeBrowser;
  toolCallbacksRef.current.openCurrentProjectExternal = siteControl.openCurrentProjectExternal;
  toolCallbacksRef.current.unsupportedIframeControl = siteControl.unsupportedIframeControl;
}, [resolvedTheme, setTheme, siteControl]);
```

### Voice-To-Text Handoff Is UI Only

**Source:** `src/providers/voice-session-provider.tsx`
**Apply to:** `src/components/chat-popup.tsx`, tests

**Open text chat event pattern** (lines 97-135):
```typescript
// For text-chat fallback, route directly instead of using siteControl.navigate:
// opening chat is UI state, not a site-control action, so it must not show the
// FSB control overlay. If already home, fire immediately; otherwise wait for
// the home page-ready event or the safety timer.
const openTextChat = useCallback(
  (_initialText?: string, originRect?: ChatMorphRect, voiceSnapshot?: ChatVoiceSnapshot) => {
    const capturedOriginRect = originRect ?? getCurrentChatMorphOrigin();
    let fired = false;
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;
    let unsub: (() => void) | null = null;
    const fire = () => {
      if (fired) return;
      fired = true;
      try { unsub?.(); } catch {}
      if (safetyTimer !== null) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      const detail: OpenTextChatDetail = {
        originRect: capturedOriginRect,
        voiceSnapshot,
        source: capturedOriginRect ? 'voice' : 'default',
      };
      window.dispatchEvent(new CustomEvent<OpenTextChatDetail>('parz:open-text-chat', { detail }));
    };
```

### Preview Scrolling Remains Voice And Preview Surface Owned

**Source:** `src/providers/site-control-provider.tsx`, `src/components/iframe-viewer.tsx`, `src/components/github-preview.tsx`
**Apply to:** `tests/voice-barge-in.test.ts`

**Site-control preview scroll owner** (lines 177-193):
```typescript
const scrollProjectPreview = useCallback(
  (directionInput: PreviewScrollDirection | string = 'down'): ControlResult => {
    return runWithControlOverlay(() => {
      if (!browser) return { ok: false, message: 'There is no project browser open right now.' };
      const direction = normalizePreviewScrollDirection(directionInput);
      if (!direction) return { ok: false, message: "I couldn't use that preview scroll direction." };
      const scroller = previewScrollerRef.current;
      if (!scroller) {
        return {
          ok: false,
          message: "I can open and close this preview, but I can't scroll inside that external iframe.",
        };
      }
      return scroller(direction)
        ? { ok: true, message: `Scrolling the project preview ${direction}.` }
        : { ok: false, message: "I couldn't scroll this preview right now." };
    }, 'preview');
  },
```

**Preview scroller registration** (provider lines 265-276):
```typescript
{browser && (
  <IframeViewer
    url={browser.url}
    label={`${browser.projectName} · ${browser.label}`}
    isDark={resolvedTheme === 'dark'}
    controlOverlayActive={controlOverlayActive && controlOverlayScope === 'preview'}
    onClose={() => {
      previewScrollerRef.current = null;
      setBrowser(null);
    }}
    onRegisterPreviewScroller={registerPreviewScroller}
  />
)}
```

**GitHub preview scroller implementation** (lines 207-232):
```typescript
useEffect(() => {
  if (!onRegisterScroller) return;
  if (loading || error || !repo) {
    onRegisterScroller(null);
    return;
  }

  const scroller: PreviewScroller = (direction) => {
    const shell = shellRef.current;
    if (!shell) return false;
    const distance = Math.max(360, Math.floor(shell.clientHeight * 0.75));
    const top =
      direction === 'top'
      ? 0
      : direction === 'bottom'
        ? shell.scrollHeight
        : direction === 'up'
          ? shell.scrollTop - distance
          : shell.scrollTop + distance;
    shell.scrollTo({ top, behavior: 'smooth' });
    return true;
  };

  onRegisterScroller(scroller);
  return () => onRegisterScroller(null);
}, [error, loading, onRegisterScroller, repo]);
```

### Visual No-Change Contract

**Source:** `29-UI-SPEC.md`, `src/components/chat-popup.tsx`, `src/app/chat/page.tsx`
**Apply to:** text chat components

Do not add visible banners, warnings, CTAs, modals, badges, or persistent copy. Preserve popup dimensions, morph behavior, header copy, suggestions, loading states, error states, input behavior, message styling, accessibility roles, and linkified assistant text.

Code anchors to keep stable:
```text
src/components/chat-popup.tsx lines 533-545: dialog shell and morph attrs
src/components/chat-popup.tsx lines 585-612: "Parz" heading and Legacy V2 subtitle
src/components/chat-popup.tsx lines 648-700: message log and message rendering
src/app/chat/page.tsx lines 219-242: full page shell and back button
src/app/chat/page.tsx lines 244-346: messages, loading, and error display
src/app/chat/page.tsx lines 348-417: suggestions and input
```

### Source-Contract Tests

**Source:** `tests/voice-barge-in.test.ts`, `tests/parz-contracts.test.ts`
**Apply to:** regression coverage

Use `readFileSync(join(process.cwd(), file), 'utf8')` for boundary contracts. Prefer positive and negative string assertions over browser-heavy setup for this phase.

Add or update source-contract expectations for:
```text
route contains: const textChatBoundaryInstructions
route contains: use voice mode for navigation and site-control actions
route contains: ...(toolsEnabled ? { tools: siteControlTools } : {})
route does not contain: Boolean(isVoice || enableSiteControl)
text clients do not contain: enableSiteControl
text clients do not contain: useSiteControl
text clients do not contain: getToolCall
text clients do not contain: handledToolCallsRef
text clients do not contain: toolCall.name
voice contains: body: JSON.stringify({ messages, isVoice: true })
voice/provider still contain: scrollProjectPreview, switchToText, endCall, toggleTheme, openProject
```

## No Analog Found

All target files have exact existing analogs. One subpattern has no current in-repo exact example: a text `useChat` client using the default transport with no `body`. Use the existing `useChat` blocks in `src/components/chat-popup.tsx` and `src/app/chat/page.tsx`, deleting only the `transport: siteControlChatTransport` option.

## Metadata

**Analog search scope:** `src/app/api`, `src/components`, `src/app/chat`, `src/lib`, `src/providers`, `tests`, plus phase artifacts in `.planning/phases/29-legacy-v2-chat-only-boundary`
**Files scanned:** 76 source/test files
**Project guidance read:** `CLAUDE.md`; no `.claude/skills` or `.agents/skills` project skills found
**Pattern extraction date:** 2026-04-29
