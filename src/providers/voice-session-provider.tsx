'use client';

import { createContext, useContext, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useVoiceController } from '@/lib/voice-controller';
import type { ToolCallbacks } from '@/lib/voice-controller';
import type { VoicePanelProps } from '@/components/voice-panel';
import { useTransition } from '@/providers/transition-provider';
import { usePathname } from 'next/navigation';

type VoiceNavProps = Omit<VoicePanelProps, 'isDark' | 'micDenied'>;

export interface VoiceSessionContextType {
  voiceActive: boolean;
  voiceProps: VoiceNavProps;
  micDenied: boolean;
  openVoice: () => void;
  closeVoice: () => void;
  prefersReduced: boolean;
  registerToolCallbacks: (callbacks: ToolCallbacks) => void;  // Phase 13: per D-01
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

  // Phase 13 (D-01, D-05, D-04): tool callback registry via ref so dispatchToolCall reads fresh values.
  // useRef not useState — prevents stale closure in dispatchToolCall memoization.
  const toolCallbacksRef = useRef<ToolCallbacks>({});

  // registerToolCallbacks merges incoming callbacks into the shared ref (per Pattern 2, RESEARCH.md).
  // Pages call this on mount; pass {} to deregister on unmount.
  const registerToolCallbacks = useCallback((callbacks: ToolCallbacks) => {
    toolCallbacksRef.current = { ...toolCallbacksRef.current, ...callbacks };
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
  }, [resolvedTheme, setTheme]);

  const goPage = useCallback(
    (page: string) => {
      const paths: Record<string, string> = { home: '/', portfolio: '/portfolio', about: '/about' };
      navigateWithReveal(paths[page] ?? '/', window.innerWidth / 2, window.innerHeight / 2);
    },
    [navigateWithReveal]
  );

  // Per D-06 + Pattern 3 (RESEARCH.md): navigate to home first, then signal ChatPopup via CustomEvent.
  // 400ms delay gives View Transitions API (~500ms) enough time to mount the home page
  // before the event fires. If timing is still off, increase to 500ms.
  const openTextChat = useCallback(
    (_initialText?: string) => {
      goPage('home');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('parz:open-text-chat'));
      }, 400);
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
