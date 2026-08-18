import {
  createBridge,
  createConcierge,
  defineAction,
  offPageResult,
} from '@full-self-browsing/concierge';
import type {
  AbortSignalLike,
  ActionDefinition,
  ActionResult,
  Bridge,
  BridgeRegistry,
  Concierge,
  Scheduler,
  StageContext,
  StandardSchemaV1,
} from '@full-self-browsing/concierge';
import { z } from 'zod';
import { pickTourNarration } from '@/data/tour-narration';
import type { ControlSection, PreviewScrollDirection } from '@/lib/site-control-utils';

export type ControlPage = 'home' | 'portfolio' | 'about';

export interface PortfolioConciergeContext extends StageContext {
  readonly page: ControlPage;
  readonly browserOpen: boolean;
  readonly previewScrollable: boolean;
  readonly voiceActive: boolean;
}

export type PortfolioConciergeBridge = Bridge<
  {
    navigate(page: ControlPage): ActionResult;
    openProject(name: string): ActionResult;
    scrollTo(section: ControlSection): ActionResult;
    scrollProjectPreview(direction?: PreviewScrollDirection): ActionResult;
    closeBrowser(): ActionResult;
    openCurrentProjectExternal(): ActionResult;
    unsupportedIframeControl(): ActionResult;
    toggleTheme(): ActionResult;
    openLink(url: string): ActionResult;
    switchToText(): ActionResult;
    endCall(): ActionResult;
    announce(text: string, signal: AbortSignalLike): Promise<void>;
    stopAnnouncement(): void;
  },
  {
    page(): ControlPage;
    browserOpen(): boolean;
    previewScrollable(): boolean;
    voiceActive(): boolean;
  }
>;

export interface PortfolioConciergeRuntime {
  readonly concierge: Concierge;
  readonly bridge: BridgeRegistry<PortfolioConciergeBridge>;
}

export const portfolioConciergeContextSchema = z.object({
  page: z.enum(['home', 'portfolio', 'about']),
  browserOpen: z.boolean(),
  previewScrollable: z.boolean(),
  voiceActive: z.boolean(),
}).strict();

const EMPTY_SCHEMA = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const;

const PAGE_SCHEMA = {
  type: 'object',
  properties: { page: { enum: ['home', 'portfolio', 'about'] } },
  required: ['page'],
  additionalProperties: false,
} as const;

const PROJECT_SCHEMA = {
  type: 'object',
  properties: { name: { type: 'string', minLength: 1, maxLength: 128 } },
  required: ['name'],
  additionalProperties: false,
} as const;

const SECTION_SCHEMA = {
  type: 'object',
  properties: { section: { enum: ['about', 'experience', 'academics'] } },
  required: ['section'],
  additionalProperties: false,
} as const;

const SCROLL_SCHEMA = {
  type: 'object',
  properties: { direction: { enum: ['down', 'up', 'top', 'bottom'] } },
  additionalProperties: false,
} as const;

const LINK_SCHEMA = {
  type: 'object',
  properties: {
    url: { type: 'string', format: 'uri', minLength: 1, maxLength: 2048 },
  },
  required: ['url'],
  additionalProperties: false,
} as const;

function schedule(fn: () => void, delayMs: number): () => void {
  const handle: ReturnType<typeof setTimeout> = setTimeout(fn, delayMs);
  return () => clearTimeout(handle);
}

function missingBridge(action: string): ActionResult {
  return offPageResult(action, 'portfolio interface');
}

function definePortfolioAction<
  Name extends string,
  Description extends string,
  Schema extends StandardSchemaV1,
>(
  definition: Parameters<
    typeof defineAction<Name, Description, Schema, PortfolioConciergeBridge>
  >[0],
): ActionDefinition<Name, Schema, PortfolioConciergeBridge> {
  return defineAction<Name, Description, Schema, PortfolioConciergeBridge>(definition);
}

export function controlPageFromPathname(pathname: string): ControlPage {
  if (pathname === '/portfolio') return 'portfolio';
  if (pathname === '/about') return 'about';
  return 'home';
}

export function createPortfolioConcierge(options: {
  scheduler?: Scheduler;
} = {}): PortfolioConciergeRuntime {
  const bridge = createBridge<PortfolioConciergeBridge>('parz-portfolio-ui');

  const navigate = definePortfolioAction({
    name: 'navigate',
    description: 'Switch the portfolio page. Call this only after an explicit request to go to, switch to, or show a page. Do not call it for incidental page mentions or information questions.',
    schema: z.object({ page: z.enum(['home', 'portfolio', 'about']) }).strict(),
    jsonSchema: PAGE_SCHEMA,
    redact: 'passthrough',
    effects: { readOnly: false, destructive: false, idempotent: true },
    handler: ({ args, bridge: mounted }) =>
      mounted === null ? missingBridge('Navigation') : mounted.actions.navigate(args.page),
  });

  const openProject = definePortfolioAction({
    name: 'openProject',
    description: 'Open an approved project in the portfolio viewer. Call this only after an explicit open, show, view, demo, or pull-up request. Do not call it for a bare project mention or questions such as "tell me about FSB".',
    schema: z.object({ name: z.string().min(1).max(128) }).strict(),
    jsonSchema: PROJECT_SCHEMA,
    redact: 'passthrough',
    effects: { readOnly: false, destructive: false, idempotent: true },
    handler: ({ args, bridge: mounted }) =>
      mounted === null ? missingBridge('Project opening') : mounted.actions.openProject(args.name),
  });

  const scrollTo = definePortfolioAction({
    name: 'scrollTo',
    description: 'Navigate to and scroll the about page to a named section. Call this only after an explicit scroll, jump, or show-section request.',
    schema: z.object({ section: z.enum(['about', 'experience', 'academics']) }).strict(),
    jsonSchema: SECTION_SCHEMA,
    redact: 'passthrough',
    effects: { readOnly: false, destructive: false, idempotent: true },
    handler: ({ args, bridge: mounted }) =>
      mounted === null ? missingBridge('Section scrolling') : mounted.actions.scrollTo(args.section),
  });

  const scrollProjectPreview = definePortfolioAction({
    name: 'scrollProjectPreview',
    description: 'Scroll the currently open portfolio-owned project preview. Call this only when a preview is open and the user explicitly asks to scroll it.',
    schema: z.object({ direction: z.enum(['down', 'up', 'top', 'bottom']).optional() }).strict(),
    jsonSchema: SCROLL_SCHEMA,
    redact: 'passthrough',
    effects: { readOnly: false, destructive: false, idempotent: false },
    availableWhen: (context) =>
      context.browserOpen === true && context.previewScrollable === true,
    handler: ({ args, bridge: mounted }) =>
      mounted === null
        ? missingBridge('Preview scrolling')
        : mounted.actions.scrollProjectPreview(args.direction),
  });

  const closeBrowser = definePortfolioAction({
    name: 'closeBrowser',
    description: 'Close the portfolio project viewer. Call this only after an explicit close, dismiss, or back-out request.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: true },
    availableWhen: (context) => context.browserOpen === true,
    handler: ({ bridge: mounted }) =>
      mounted === null ? missingBridge('Preview closing') : mounted.actions.closeBrowser(),
  });

  const openCurrentProjectExternal = definePortfolioAction({
    name: 'openCurrentProjectExternal',
    description: 'Open the currently viewed approved project in a new tab. Call this only after an explicit external or new-tab request.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: true },
    availableWhen: (context) => context.browserOpen === true,
    handler: ({ bridge: mounted }) =>
      mounted === null
        ? missingBridge('External project opening')
        : mounted.actions.openCurrentProjectExternal(),
  });

  const unsupportedIframeControl = definePortfolioAction({
    name: 'unsupportedIframeControl',
    description: 'Use when the user asks to click, type, submit, log in, or operate controls inside an embedded third-party project.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: true, destructive: false, idempotent: true },
    availableWhen: (context) => context.browserOpen === true,
    handler: ({ bridge: mounted }) =>
      mounted === null
        ? missingBridge('Embedded-site control')
        : mounted.actions.unsupportedIframeControl(),
  });

  const toggleTheme = definePortfolioAction({
    name: 'toggleTheme',
    description: 'Toggle the portfolio between light and dark themes. Call this only after an explicit theme-change request.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: false },
    handler: ({ bridge: mounted }) =>
      mounted === null ? missingBridge('Theme switching') : mounted.actions.toggleTheme(),
  });

  const openLink = definePortfolioAction({
    name: 'openLink',
    description: 'Open an approved public portfolio, contact, or project URL in a new tab. Call this only after an explicit request and never invent a URL.',
    schema: z.object({ url: z.string().url().max(2048) }).strict(),
    jsonSchema: LINK_SCHEMA,
    redact: 'passthrough',
    effects: { readOnly: false, destructive: false, idempotent: true },
    handler: ({ args, bridge: mounted }) =>
      mounted === null ? missingBridge('Link opening') : mounted.actions.openLink(args.url),
  });

  const switchToText = definePortfolioAction({
    name: 'switchToText',
    description: 'End voice mode and continue in text chat. Call this only after an explicit request to switch to text or typing.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: true },
    availableWhen: (context) => context.voiceActive === true,
    terminal: true,
    handler: ({ bridge: mounted }) =>
      mounted === null ? missingBridge('Text mode') : mounted.actions.switchToText(),
  });

  const endCall = definePortfolioAction({
    name: 'endCall',
    description: 'End the voice conversation. Call this only when the user says goodbye or explicitly asks to stop or end the call.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: true },
    availableWhen: (context) => context.voiceActive === true,
    terminal: true,
    handler: ({ bridge: mounted }) =>
      mounted === null ? missingBridge('Voice controls') : mounted.actions.endCall(),
  });

  const startTour = definePortfolioAction({
    name: 'startTour',
    description: 'Run the application-owned guided portfolio showcase. Call this only after an explicit tour, walkthrough, showcase, or show-me-around request.',
    schema: z.object({}).strict(),
    jsonSchema: EMPTY_SCHEMA,
    redact: 'drop',
    effects: { readOnly: false, destructive: false, idempotent: false },
    availableWhen: (context) => context.voiceActive === true,
    handler: async ({ bridge: mounted, workflow }) => {
      if (mounted === null) return missingBridge('Guided tour');

      const narration = pickTourNarration();
      const context = (
        page: ControlPage,
        browserOpen: boolean,
        previewScrollable: boolean,
      ): PortfolioConciergeContext => ({
        page,
        browserOpen,
        previewScrollable,
        voiceActive: true,
      });
      const run = async (
        stepId: string,
        name: string,
        input: unknown,
        stepContext: PortfolioConciergeContext,
      ): Promise<ActionResult> => workflow.run({
        stepId,
        name,
        input,
        context: stepContext,
      });

      workflow.cleanup(() => mounted.actions.stopAnnouncement());

      let result = await run('portfolio-page', 'navigate', { page: 'portfolio' }, context('home', false, false));
      if (!result.ok) return result;
      await workflow.delay(900);
      await mounted.actions.announce(narration.opener, workflow.signal);

      result = await run('review-gate', 'openProject', { name: 'Review Gate' }, context('portfolio', false, false));
      if (!result.ok) return result;
      await workflow.delay(1200);
      await mounted.actions.announce(narration.reviewGateIntro, workflow.signal);
      result = await run('review-gate-scroll', 'scrollProjectPreview', { direction: 'down' }, context('portfolio', true, true));
      if (!result.ok) return result;
      await workflow.delay(900);
      await mounted.actions.announce(narration.reviewGateMid, workflow.signal);
      result = await run('review-gate-bottom', 'scrollProjectPreview', { direction: 'bottom' }, context('portfolio', true, true));
      if (!result.ok) return result;
      await workflow.delay(900);
      await mounted.actions.announce(narration.reviewGateClose, workflow.signal);

      result = await run('close-review-gate', 'closeBrowser', {}, context('portfolio', true, true));
      if (!result.ok) return result;
      await workflow.delay(500);
      result = await run('fsb', 'openProject', { name: 'FSB' }, context('portfolio', false, false));
      if (!result.ok) return result;
      await workflow.delay(1100);
      await mounted.actions.announce(narration.fsb, workflow.signal);

      result = await run('close-fsb', 'closeBrowser', {}, context('portfolio', true, false));
      if (!result.ok) return result;
      await workflow.delay(500);
      result = await run('gitfly', 'openProject', { name: 'GitFly' }, context('portfolio', false, false));
      if (!result.ok) return result;
      await workflow.delay(1100);
      await mounted.actions.announce(narration.gitFly, workflow.signal);

      result = await run('close-gitfly', 'closeBrowser', {}, context('portfolio', true, false));
      if (!result.ok) return result;
      await workflow.delay(500);
      result = await run('parz-ai', 'openProject', { name: 'Parz-AI' }, context('portfolio', false, false));
      if (!result.ok) return result;
      await workflow.delay(1100);
      await mounted.actions.announce(narration.parzAi, workflow.signal);
      result = await run('parz-ai-scroll', 'scrollProjectPreview', { direction: 'down' }, context('portfolio', true, true));
      if (!result.ok) return result;
      await workflow.delay(800);

      result = await run('close-parz-ai', 'closeBrowser', {}, context('portfolio', true, true));
      if (!result.ok) return result;
      await workflow.delay(500);
      result = await run('about-page', 'scrollTo', { section: 'about' }, context('portfolio', false, false));
      if (!result.ok) return result;
      await workflow.delay(1000);
      await mounted.actions.announce(narration.aboutIntro, workflow.signal);
      result = await run('experience', 'scrollTo', { section: 'experience' }, context('about', false, false));
      if (!result.ok) return result;
      await workflow.delay(900);
      await mounted.actions.announce(narration.experience, workflow.signal);
      result = await run('academics', 'scrollTo', { section: 'academics' }, context('about', false, false));
      if (!result.ok) return result;
      await workflow.delay(900);
      await mounted.actions.announce(narration.signoff, workflow.signal);

      return { ok: true, message: 'Completed the guided portfolio tour.' };
    },
  });

  const concierge = createConcierge({
    stages: [
      { id: 'home', match: (context) => context.page === 'home', actions: [], bridge },
      { id: 'portfolio', match: (context) => context.page === 'portfolio', actions: [], bridge },
      { id: 'about', match: (context) => context.page === 'about', actions: [], bridge },
    ],
    crossStage: [
      navigate,
      openProject,
      scrollTo,
      scrollProjectPreview,
      closeBrowser,
      openCurrentProjectExternal,
      unsupportedIframeControl,
      toggleTheme,
      openLink,
      startTour,
      switchToText,
      endCall,
    ],
    scheduler: options.scheduler ?? schedule,
    maxWorkflowDepth: 16,
    maxWorkflowSteps: 256,
  });

  return Object.freeze({ concierge, bridge });
}
