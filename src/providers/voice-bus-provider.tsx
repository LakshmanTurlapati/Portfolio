'use client';

import type { ReactNode } from 'react';
import { initVoiceBus } from '@/lib/voice-bus-init';

// Initialize at module scope — guarantees window.VoiceBus exists before any useEffect runs.
initVoiceBus();

export function VoiceBusProvider({ children }: { children: ReactNode }) {
  return children;
}
