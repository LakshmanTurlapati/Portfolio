'use client';

import { usePathname } from 'next/navigation';
import { MobileHomeScene } from '@/components/mobile-home-scene';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMounted } from '@/hooks/use-mounted';

const MOBILE_HOME_ROUTES = new Set(['/', '/chat']);

export function MobileHomeContinuityLayer() {
  const mounted = useMounted();
  const isMobile = useMediaQuery('(max-width: 599px)');
  const pathname = usePathname();

  const isVisible = mounted && isMobile && MOBILE_HOME_ROUTES.has(pathname);
  const isInteractive = pathname === '/';

  if (!isVisible) return null;

  return (
    <div
      data-route={isInteractive ? 'home' : 'chat'}
      data-testid="mobile-home-continuity-layer"
      className="fixed inset-0 z-0 overflow-hidden"
      style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
    >
      <MobileHomeScene
        inert={!isInteractive}
        className="h-dvh min-h-0"
        style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
      />
    </div>
  );
}
