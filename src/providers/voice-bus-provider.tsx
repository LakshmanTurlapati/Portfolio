'use client';

// Per D-07, D-09: React context mirror of window.VoiceBus.state.
// Provides useVoiceBus() hook to any child component.

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initVoiceBus } from '@/lib/voice-bus-init';

// Initialize at module scope — guarantees window.VoiceBus exists before any useEffect runs.
initVoiceBus();

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

const VoiceBusContext = createContext<VoiceState>('idle');

export function useVoiceBus(): VoiceState {
  return useContext(VoiceBusContext);
}

export function VoiceBusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceState>('idle');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.VoiceBus) {
      return window.VoiceBus.on('state', setState as (s: unknown) => void);
    }
  }, []);

  return (
    <VoiceBusContext.Provider value={state}>
      {children}
    </VoiceBusContext.Provider>
  );
}
