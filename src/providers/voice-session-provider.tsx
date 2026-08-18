'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useConciergeBridge } from '@full-self-browsing/concierge-react/client';
import {
  createIndexedDBReplayStore,
  createSignedBrowserBridge,
  type BrowserBatchReport,
  type SignedBrowserBridge,
  type SignedToolBatchEnvelopeV1,
} from '@full-self-browsing/concierge/ai-sdk/browser';
import { useVoiceController, type VoiceControllerResult } from '@/lib/voice-controller';
import type { VoicePanelProps } from '@/components/voice-panel';
import { useTransition } from '@/providers/transition-provider';
import { useSiteControl } from '@/providers/site-control-provider';
import { usePortfolioConcierge } from '@/providers/concierge-provider';
import {
  CONCIERGE_AUDIENCE,
  type ConciergeBootstrapResponse,
} from '@/lib/concierge-protocol';
import type {
  PortfolioConciergeBridge,
  PortfolioConciergeContext,
} from '@/lib/portfolio-concierge';
import {
  getCurrentChatMorphOrigin,
  type ChatMorphRect,
  type ChatVoiceSnapshot,
  type OpenTextChatDetail,
} from '@/lib/chat-morph';

type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
}

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function useVoiceSession(): VoiceSessionContextType {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error('useVoiceSession must be used inside VoiceSessionProvider');
  return ctx;
}

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { navigatePlain } = useTransition();
  const siteControl = useSiteControl();
  const runtime = usePortfolioConcierge();

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

      if (pathname === '/') {
        fire();
        return;
      }

      unsub = window.VoiceBus.on('page-ready', (page) => {
        if (page === 'home') fire();
      });
      safetyTimer = setTimeout(fire, 1500);
      navigatePlain('/');
    },
    [navigatePlain, pathname],
  );

  const contextRef = useRef<PortfolioConciergeContext>({
    page: siteControl.page,
    browserOpen: siteControl.browserOpen,
    previewScrollable: siteControl.previewScrollable,
    voiceActive: false,
  });
  const voiceControllerRef = useRef<VoiceControllerResult | null>(null);
  const siteControlRef = useRef(siteControl);
  const openTextChatRef = useRef(openTextChat);
  const signedBridgeRef = useRef<SignedBrowserBridge | null>(null);
  const signedBridgePromiseRef = useRef<Promise<SignedBrowserBridge> | null>(null);
  const signedBridgeGenerationRef = useRef(0);
  const bootstrapAbortRef = useRef<AbortController | null>(null);
  const acceptingRef = useRef(0);
  const outcomeSignalRef = useRef<AbortSignal | null>(null);
  const pendingContextRef = useRef<PortfolioConciergeContext | null>(null);
  siteControlRef.current = siteControl;
  openTextChatRef.current = openTextChat;

  const getSignedBridge = useCallback((): Promise<SignedBrowserBridge> => {
    if (signedBridgeRef.current !== null) return Promise.resolve(signedBridgeRef.current);
    if (signedBridgePromiseRef.current !== null) return signedBridgePromiseRef.current;

    const generation = signedBridgeGenerationRef.current + 1;
    signedBridgeGenerationRef.current = generation;
    const bootstrapAbort = new AbortController();
    bootstrapAbortRef.current?.abort();
    bootstrapAbortRef.current = bootstrapAbort;
    const pending = fetch('/api/concierge/bootstrap', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      credentials: 'same-origin',
      signal: bootstrapAbort.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Concierge bootstrap returned ${response.status}`);
        const bootstrap = await response.json() as ConciergeBootstrapResponse;
        if (bootstrap.audience !== CONCIERGE_AUDIENCE) {
          throw new Error('Concierge bootstrap audience mismatch');
        }

        const bridge = createSignedBrowserBridge({
          concierge: runtime.concierge,
          audience: bootstrap.audience,
          sessionId: bootstrap.sessionId,
          publicKeys: new Map([
            [bootstrap.keyId, { format: 'spki-pem' as const, data: bootstrap.publicKeyPem }],
          ]),
          replayStore: createIndexedDBReplayStore({
            databaseName: 'parz-portfolio-concierge-replay-v1',
          }),
          initialContext: contextRef.current,
          presentOutcome: async (outcome) => {
            const controller = voiceControllerRef.current;
            const signal = outcomeSignalRef.current;
            if (controller === null || signal === null || signal.aborted) {
              return { outcome: 'interrupted' as const };
            }
            const message = outcome.failures.map((failure) => failure.message).join(' ');
            await controller.announce(message, signal);
            return { outcome: signal.aborted ? 'interrupted' as const : 'completed' as const };
          },
          onDiagnostic: ({ code }) => {
            console.warn('[Concierge] signed bridge rejected a batch', { code });
          },
        });
        if (generation !== signedBridgeGenerationRef.current) {
          void bridge.stop();
          throw new DOMException('Superseded Concierge bootstrap.', 'AbortError');
        }
        signedBridgeRef.current = bridge;
        bootstrapAbortRef.current = null;
        return bridge;
      })
      .catch((error) => {
        if (generation === signedBridgeGenerationRef.current) {
          signedBridgePromiseRef.current = null;
          bootstrapAbortRef.current = null;
        }
        throw error;
      });

    signedBridgePromiseRef.current = pending;
    return pending;
  }, [runtime.concierge]);

  const getConciergeContext = useCallback(() => contextRef.current, []);

  const acceptConciergeEnvelope = useCallback(async (
    envelope: SignedToolBatchEnvelopeV1,
    signal: AbortSignal,
  ): Promise<BrowserBatchReport> => {
    const bridge = await getSignedBridge();
    acceptingRef.current += 1;
    outcomeSignalRef.current = signal;
    try {
      await bridge.setContext(contextRef.current);
      const report = await bridge.accept(envelope, { signal });
      if (report.kind === 'terminal') {
        signedBridgeRef.current = null;
        signedBridgePromiseRef.current = null;
      }
      return report;
    } finally {
      acceptingRef.current -= 1;
      if (outcomeSignalRef.current === signal) outcomeSignalRef.current = null;
      if (acceptingRef.current === 0 && pendingContextRef.current !== null) {
        const pendingContext = pendingContextRef.current;
        pendingContextRef.current = null;
        const currentBridge = signedBridgeRef.current;
        if (currentBridge !== null) void currentBridge.setContext(pendingContext);
      }
    }
  }, [getSignedBridge]);

  const controller = useVoiceController({
    openTextChat,
    currentPage: siteControl.page,
    getConciergeContext,
    acceptConciergeEnvelope,
  });
  voiceControllerRef.current = controller;

  const currentContext = useMemo<PortfolioConciergeContext>(() => ({
    page: siteControl.page,
    browserOpen: siteControl.browserOpen,
    previewScrollable: siteControl.previewScrollable,
    voiceActive: controller.active,
  }), [
    controller.active,
    siteControl.browserOpen,
    siteControl.page,
    siteControl.previewScrollable,
  ]);
  contextRef.current = currentContext;

  useEffect(() => {
    if (acceptingRef.current > 0) {
      pendingContextRef.current = currentContext;
      return;
    }
    if (signedBridgeRef.current !== null) {
      void signedBridgeRef.current.setContext(currentContext);
    }
  }, [currentContext]);

  useEffect(() => {
    let mounted = true;
    void getSignedBridge().catch((error) => {
      if (!mounted || (error instanceof DOMException && error.name === 'AbortError')) return;
      console.warn('[Concierge] bootstrap unavailable', {
        message: error instanceof Error ? error.message : String(error),
      });
    });
    return () => {
      mounted = false;
      signedBridgeGenerationRef.current += 1;
      bootstrapAbortRef.current?.abort();
      bootstrapAbortRef.current = null;
      const bridge = signedBridgeRef.current;
      signedBridgeRef.current = null;
      signedBridgePromiseRef.current = null;
      outcomeSignalRef.current = null;
      if (bridge !== null) void bridge.stop();
    };
  }, [getSignedBridge]);

  const mountedBridge = useMemo<PortfolioConciergeBridge>(() => ({
    actions: {
      navigate: (page) => siteControlRef.current.navigate(page),
      openProject: (name) => siteControlRef.current.openProject(name),
      scrollTo: (section) => siteControlRef.current.scrollTo(section),
      scrollProjectPreview: (direction) =>
        siteControlRef.current.scrollProjectPreview(direction),
      closeBrowser: () => siteControlRef.current.closeBrowser(),
      openCurrentProjectExternal: () => siteControlRef.current.openCurrentProjectExternal(),
      unsupportedIframeControl: () => siteControlRef.current.unsupportedIframeControl(),
      toggleTheme: () => siteControlRef.current.toggleTheme(),
      openLink: (url) => siteControlRef.current.openLink(url),
      switchToText: () => {
        const activeController = voiceControllerRef.current;
        if (activeController === null) {
          return { ok: false, message: 'Voice mode is not ready.' };
        }
        const snapshot = activeController.getSnapshot();
        window.setTimeout(() => {
          activeController.close();
          openTextChatRef.current(undefined, undefined, snapshot);
        }, 0);
        return { ok: true, message: 'Switching to text chat.' };
      },
      endCall: () => {
        const activeController = voiceControllerRef.current;
        if (activeController === null) {
          return { ok: false, message: 'Voice mode is not ready.' };
        }
        window.setTimeout(() => activeController.close(), 0);
        return { ok: true, message: 'Ending voice mode.' };
      },
      announce: async (text, signal) => {
        await voiceControllerRef.current?.announce(text, signal);
      },
      stopAnnouncement: () => voiceControllerRef.current?.stopAnnouncement(),
    },
    snapshot: {
      page: () => contextRef.current.page,
      browserOpen: () => contextRef.current.browserOpen,
      previewScrollable: () => contextRef.current.previewScrollable,
      voiceActive: () => contextRef.current.voiceActive,
    },
  }), []);

  useConciergeBridge(runtime.bridge, mountedBridge);

  return (
    <VoiceSessionContext.Provider
      value={{
        voiceActive: controller.active,
        voiceProps: controller.voiceProps,
        micDenied: controller.micDenied,
        openVoice: controller.open,
        closeVoice: controller.close,
        prefersReduced: controller.prefersReduced,
      }}
    >
      {children}
    </VoiceSessionContext.Provider>
  );
}
