'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useVoiceController } from '@/lib/voice-controller';
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
  });

  return (
    <VoiceSessionContext.Provider
      value={{ voiceActive, voiceProps, micDenied, openVoice, closeVoice, prefersReduced }}
    >
      {children}
    </VoiceSessionContext.Provider>
  );
}
