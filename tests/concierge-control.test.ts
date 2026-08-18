import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { convertToModelMessages } from 'ai';
import { createAISDKAdapter } from '@full-self-browsing/concierge/ai-sdk';
import { createSignedBatchIssuer } from '@full-self-browsing/concierge/ai-sdk/server';
import {
  createSignedBrowserBridge,
  createTestMemoryReplayStore,
} from '@full-self-browsing/concierge/ai-sdk/browser';
import {
  createPortfolioConcierge,
  type PortfolioConciergeBridge,
  type PortfolioConciergeContext,
} from '@/lib/portfolio-concierge';
import {
  CONCIERGE_AUDIENCE,
  CONCIERGE_KEY_ID,
  isConciergeSessionId,
} from '@/lib/concierge-protocol';
import { buildVoiceHistoryMessages } from '@/lib/voice-controller';

const HOME_CONTEXT: PortfolioConciergeContext = {
  page: 'home',
  browserOpen: false,
  previewScrollable: false,
  voiceActive: true,
};

function mountedBridge(onOpenProject: (name: string) => void = () => {}): PortfolioConciergeBridge {
  const success = (message: string) => ({ ok: true, message });
  return {
    actions: {
      navigate: (page) => success(`Navigated to ${page}.`),
      openProject: (name) => {
        onOpenProject(name);
        return success(`Opened ${name}.`);
      },
      scrollTo: (section) => success(`Scrolled to ${section}.`),
      scrollProjectPreview: (direction) => success(`Scrolled ${direction ?? 'down'}.`),
      closeBrowser: () => success('Closed browser.'),
      openCurrentProjectExternal: () => success('Opened externally.'),
      unsupportedIframeControl: () => ({ ok: false, message: 'Unsupported.' }),
      toggleTheme: () => success('Toggled theme.'),
      openLink: () => success('Opened link.'),
      switchToText: () => success('Switched to text.'),
      endCall: () => success('Ended call.'),
      announce: async () => {},
      stopAnnouncement: () => {},
    },
    snapshot: {
      page: () => 'home',
      browserOpen: () => false,
      previewScrollable: () => false,
      voiceActive: () => true,
    },
  };
}

describe('portfolio Concierge integration', () => {
  it('resolves browser and voice capabilities from live context', () => {
    const { concierge } = createPortfolioConcierge();
    const names = (context: PortfolioConciergeContext) =>
      concierge.resolveCatalog(context).tools.map((tool) => tool.name);

    const home = names(HOME_CONTEXT);
    expect(home).toContain('navigate');
    expect(home).toContain('startTour');
    expect(home).not.toContain('closeBrowser');
    expect(home).not.toContain('scrollProjectPreview');

    const browser = names({ ...HOME_CONTEXT, browserOpen: true });
    expect(browser).toContain('closeBrowser');
    expect(browser).toContain('openCurrentProjectExternal');
    expect(browser).not.toContain('scrollProjectPreview');

    const scrollable = names({ ...HOME_CONTEXT, browserOpen: true, previewScrollable: true });
    expect(scrollable).toContain('scrollProjectPreview');

    const textOnly = names({ ...HOME_CONTEXT, voiceActive: false });
    expect(textOnly).not.toContain('startTour');
    expect(textOnly).not.toContain('switchToText');
    expect(textOnly).not.toContain('endCall');
  });

  it('does not prepare an action that is unavailable in the resolved catalog', async () => {
    const { concierge } = createPortfolioConcierge();
    const adapter = createAISDKAdapter({ concierge });
    const catalog = await adapter.resolveCatalog(HOME_CONTEXT);

    expect(adapter.prepareStep({
      catalog,
      responseId: 'response-off-stage',
      userTurnId: 'turn-off-stage',
      toolCalls: [{
        toolCallId: 'call-off-stage',
        toolName: 'closeBrowser',
        input: {},
      }],
    })).toEqual({ kind: 'invalid', code: 'unknown_tool', callIndex: 0 });
  });

  it('verifies, dispatches, and replay-blocks a signed server tool batch', async () => {
    const opened: string[] = [];
    const runtime = createPortfolioConcierge({
      scheduler: (fn) => {
        queueMicrotask(fn);
        return () => {};
      },
    });
    const unregister = runtime.bridge.register(mountedBridge((name) => opened.push(name)));
    const adapter = createAISDKAdapter({ concierge: runtime.concierge });
    const catalog = await adapter.resolveCatalog(HOME_CONTEXT);
    const prepared = adapter.prepareStep({
      catalog,
      responseId: 'response-1',
      userTurnId: 'turn-1',
      toolCalls: [{
        toolCallId: 'call-1',
        toolName: 'openProject',
        input: { name: 'FSB' },
      }],
    });
    expect(prepared.kind).toBe('ready');
    if (prepared.kind !== 'ready') throw new Error('Expected a prepared tool call.');

    const { privateKey, publicKey } = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const issuer = createSignedBatchIssuer({
      adapter,
      audience: CONCIERGE_AUDIENCE,
      keyId: CONCIERGE_KEY_ID,
      privateKey: { format: 'pkcs8-pem', data: privateKey },
    });
    const issued = await issuer.issue({
      sessionId: 'session-1',
      currentContext: HOME_CONTEXT,
      prepared: prepared.value,
    });
    expect(issued.kind).toBe('issued');
    if (issued.kind !== 'issued') throw new Error('Expected a signed batch.');

    const browserBridge = createSignedBrowserBridge({
      concierge: runtime.concierge,
      audience: CONCIERGE_AUDIENCE,
      sessionId: 'session-1',
      publicKeys: new Map([[CONCIERGE_KEY_ID, { format: 'spki-pem', data: publicKey }]]),
      replayStore: createTestMemoryReplayStore(),
      presentOutcome: async () => ({ outcome: 'completed' }),
      initialContext: HOME_CONTEXT,
    });

    const verificationBridge = (options: {
      audience?: string;
      sessionId?: string;
      context?: PortfolioConciergeContext;
    } = {}) => createSignedBrowserBridge({
      concierge: runtime.concierge,
      audience: options.audience ?? CONCIERGE_AUDIENCE,
      sessionId: options.sessionId ?? 'session-1',
      publicKeys: new Map([[CONCIERGE_KEY_ID, { format: 'spki-pem', data: publicKey }]]),
      replayStore: createTestMemoryReplayStore(),
      presentOutcome: async () => ({ outcome: 'completed' }),
      initialContext: options.context ?? HOME_CONTEXT,
    });

    const wrongSession = verificationBridge({ sessionId: 'session-2' });
    expect(await wrongSession.accept(issued.envelope)).toEqual({
      kind: 'rejected',
      code: 'session_mismatch',
    });
    await wrongSession.stop();

    const wrongAudience = verificationBridge({ audience: 'another-app/concierge' });
    expect(await wrongAudience.accept(issued.envelope)).toEqual({
      kind: 'rejected',
      code: 'audience_mismatch',
    });
    await wrongAudience.stop();

    const staleCatalog = verificationBridge({
      context: { ...HOME_CONTEXT, browserOpen: true },
    });
    expect(await staleCatalog.accept(issued.envelope)).toEqual({
      kind: 'rejected',
      code: 'catalog_mismatch',
    });
    await staleCatalog.stop();

    const tampered = verificationBridge();
    const changedFirstCharacter = issued.envelope.signature[0] === 'A' ? 'B' : 'A';
    expect(await tampered.accept({
      ...issued.envelope,
      signature: changedFirstCharacter + issued.envelope.signature.slice(1),
    })).toEqual({ kind: 'rejected', code: 'invalid_signature' });
    await tampered.stop();

    const first = await browserBridge.accept(issued.envelope);
    expect(first.kind).toBe('completed');
    expect(opened).toEqual(['FSB']);

    const replay = await browserBridge.accept(issued.envelope);
    expect(replay).toEqual({ kind: 'rejected', code: 'replayed' });
    expect(opened).toEqual(['FSB']);

    await browserBridge.stop();
    unregister();
  });

  it('accepts only fixed-length base64url session identifiers', () => {
    expect(isConciergeSessionId('A'.repeat(32))).toBe(true);
    expect(isConciergeSessionId('abc')).toBe(false);
    expect(isConciergeSessionId(`${'A'.repeat(31)}=`)).toBe(false);
    expect(isConciergeSessionId(undefined)).toBe(false);
  });

  it('carries verified action results into the next AI SDK turn by call id', async () => {
    const { concierge } = createPortfolioConcierge();
    const catalog = await createAISDKAdapter({ concierge }).resolveCatalog(HOME_CONTEXT);
    const uiMessages = buildVoiceHistoryMessages([
      { role: 'user', content: 'Open FSB.' },
      {
        role: 'assistant',
        content: 'Opening FSB now.',
        toolResults: [{
          toolCallId: 'call-open-fsb',
          toolName: 'openProject',
          input: { name: 'FSB' },
          output: { ok: true, message: 'Opening FSB.' },
        }],
      },
    ], (() => {
      let sequence = 0;
      return () => `message-${sequence += 1}`;
    })());

    const modelMessages = await convertToModelMessages(uiMessages, {
      tools: catalog.aiTools,
    });
    expect(modelMessages.map((message) => message.role)).toEqual([
      'user',
      'assistant',
      'tool',
    ]);
    expect(modelMessages[1]).toMatchObject({
      role: 'assistant',
      content: expect.arrayContaining([
        expect.objectContaining({
          type: 'tool-call',
          toolCallId: 'call-open-fsb',
          toolName: 'openProject',
          input: { name: 'FSB' },
        }),
      ]),
    });
    expect(modelMessages[2]).toMatchObject({
      role: 'tool',
      content: [expect.objectContaining({
        type: 'tool-result',
        toolCallId: 'call-open-fsb',
        toolName: 'openProject',
      })],
    });
  });

  it('runs the guided tour as one observable Concierge workflow', async () => {
    const runtime = createPortfolioConcierge({
      scheduler: (fn) => {
        queueMicrotask(fn);
        return () => {};
      },
    });
    const actions: string[] = [];
    const bridge = mountedBridge((name) => actions.push(`open:${name}`));
    bridge.actions.navigate = (page) => {
      actions.push(`navigate:${page}`);
      return { ok: true, message: `Navigated to ${page}.` };
    };
    bridge.actions.scrollProjectPreview = (direction) => {
      actions.push(`preview:${direction ?? 'down'}`);
      return { ok: true, message: 'Scrolled preview.' };
    };
    bridge.actions.closeBrowser = () => {
      actions.push('close');
      return { ok: true, message: 'Closed browser.' };
    };
    bridge.actions.scrollTo = (section) => {
      actions.push(`section:${section}`);
      return { ok: true, message: `Scrolled to ${section}.` };
    };
    const unregister = runtime.bridge.register(bridge);
    const lifecycle: string[] = [];
    const unsubscribe = runtime.concierge.onDispatch((event) => {
      if (event.phase === 'executing' || event.phase === 'succeeded') {
        lifecycle.push(`${event.phase}:${event.name}`);
      }
    });
    const catalog = runtime.concierge.resolveCatalog(HOME_CONTEXT);

    const result = await runtime.concierge.dispatch(HOME_CONTEXT, {
      name: 'startTour',
      input: {},
      catalogRevision: catalog.revision,
      identity: {
        sessionId: 'session-tour',
        responseId: 'response-tour',
        callId: 'call-tour',
        userTurnId: 'turn-tour',
        outputIndex: 0,
      },
    });

    expect(result).toEqual({ ok: true, message: 'Completed the guided portfolio tour.' });
    expect(actions).toEqual([
      'navigate:portfolio',
      'open:Review Gate',
      'preview:down',
      'preview:bottom',
      'close',
      'open:FSB',
      'close',
      'open:GitFly',
      'close',
      'open:Parz-AI',
      'preview:down',
      'close',
      'section:about',
      'section:experience',
      'section:academics',
    ]);
    expect(lifecycle).toContain('executing:startTour');
    expect(lifecycle).toContain('executing:openProject');
    expect(lifecycle.at(-1)).toBe('succeeded:startTour');

    unsubscribe();
    unregister();
  });
});
