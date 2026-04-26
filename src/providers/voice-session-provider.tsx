'use client';

import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useVoiceController } from '@/lib/voice-controller';
import type { ToolCallbacks } from '@/lib/voice-controller';
import type { VoicePanelProps } from '@/components/voice-panel';
import { useTransition } from '@/providers/transition-provider';
import { useSiteControl } from '@/providers/site-control-provider';
import { usePathname } from 'next/navigation';

type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

export interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
  registerToolCallbacks: (callbacks: ToolCallbacks) => () => void;  // VOICE-08: returns deregister fn
}

const VoiceSessionContext = createContext<VoiceSessionContextType | null>(null);

export function useVoiceSession(): VoiceSessionContextType {
  const ctx = useContext(VoiceSessionContext);
  if (!ctx) throw new Error('useVoiceSession must be used inside VoiceSessionProvider');
  return ctx;
}

export function VoiceSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { navigateWithReveal } = useTransition();
  const siteControl = useSiteControl();

  // Phase 13 (D-01, D-05, D-04): tool callback registry via ref so dispatchToolCall reads fresh values.
  // useRef not useState — prevents stale closure in dispatchToolCall memoization.
  const toolCallbacksRef = useRef<ToolCallbacks>({});

  // VOICE-08: registerToolCallbacks merges incoming callbacks into the shared ref
  // and returns a deregister fn that removes EXACTLY the keys it registered.
  // ownedKeys is captured at registration time so a later mutation of the input
  // object can't change which keys the deregister fn deletes (RESEARCH.md
  // Pitfall 4: survives React 19 strict-mode double-mount).
  const registerToolCallbacks = useCallback((callbacks: ToolCallbacks): (() => void) => {
    const ownedKeys = Object.keys(callbacks) as (keyof ToolCallbacks)[];
    toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks };
    return () => {
      for (const k of ownedKeys) {
        delete toolCallbacksRef.current[k];
      }
    };
  }, []);

  // Phase 13 (D-05, D-04): toggleTheme and openLink have no page-specific state.
  // Wire them here once, never deregistered.
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
    toolCallbacksRef.current.closeBrowser = siteControl.closeBrowser;
    toolCallbacksRef.current.openCurrentProjectExternal = siteControl.openCurrentProjectExternal;
    toolCallbacksRef.current.unsupportedIframeControl = siteControl.unsupportedIframeControl;
  }, [resolvedTheme, setTheme, siteControl]);

  const goPage = useCallback(
    (page: string) => {
      if (page === 'home' || page === 'portfolio' || page === 'about') {
        siteControl.navigate(page);
        return;
      }
      navigateWithReveal('/', window.innerWidth / 2, window.innerHeight / 2);
    },
    [navigateWithReveal, siteControl]
  );

  // VOICE-05: event-driven coordination replacing the prior hardcoded 400ms.
  // Subscribe to VoiceBus 'page-ready' synchronously BEFORE goPage so the
  // listener is live before the destination page mounts. Whichever fires first
  // -- the page-ready event for slug 'home' OR the 1500ms safety timer --
  // calls fire() exactly once (gated by the `fired` flag). Safety timer
  // covers View Transitions failures and missed emits (RESEARCH.md Pattern 2).
  const openTextChat = useCallback(
    (_initialText?: string) => {
      let fired = false;
      let safetyTimer: ReturnType<typeof setTimeout> | null = null;
      const fire = () => {
        if (fired) return;
        fired = true;
        try { unsub(); } catch {}
        if (safetyTimer !== null) {
          clearTimeout(safetyTimer);
          safetyTimer = null;
        }
        window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
      };
      const unsub = window.VoiceBus.on('page-ready', (page) => {
        if (page === 'home') fire();
      });
      safetyTimer = setTimeout(fire, 1500);
      goPage('home');
    },
    [goPage]
  );

  // Per Pitfall 5 (RESEARCH.md): currentPage MUST be dynamic, not 'home'.
  const currentPage = pathname === '/' ? 'home' : pathname.slice(1);

  const {
    active: voiceActive,
    open: openVoice,
    close: closeVoice,
    micDenied,
    prefersReduced,
    voiceProps,
  } = useVoiceController({
    goPage,
    openTextChat,
    currentPage,
    toolCallbacks: toolCallbacksRef.current,
  });

  return (
    <VoiceSessionContext.Provider
      value={{ voiceActive, voiceProps, micDenied, openVoice, closeVoice, prefersReduced, registerToolCallbacks }}
    >
      {children}
    </VoiceSessionContext.Provider>
  );
}
