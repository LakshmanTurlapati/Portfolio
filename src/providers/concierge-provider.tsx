'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { ConciergeProvider } from '@full-self-browsing/concierge-react/client';
import {
  createPortfolioConcierge,
  type PortfolioConciergeRuntime,
} from '@/lib/portfolio-concierge';

const PortfolioConciergeContext = createContext<PortfolioConciergeRuntime | null>(null);

export function usePortfolioConcierge(): PortfolioConciergeRuntime {
  const runtime = useContext(PortfolioConciergeContext);
  if (runtime === null) {
    throw new Error('usePortfolioConcierge must be used inside PortfolioConciergeProvider');
  }
  return runtime;
}

export function PortfolioConciergeProvider({ children }: { children: ReactNode }) {
  const [runtime] = useState(createPortfolioConcierge);

  return (
    <PortfolioConciergeContext.Provider value={runtime}>
      <ConciergeProvider concierge={runtime.concierge} telemetry={true}>
        {children}
      </ConciergeProvider>
    </PortfolioConciergeContext.Provider>
  );
}
