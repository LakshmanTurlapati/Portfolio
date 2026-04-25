'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
import { VoicePanel } from '@/components/voice-panel';

export function VoiceOverlay() {
  const mounted = useMounted();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { voiceActive, voiceProps, micDenied } = useVoiceSession();

  // Per Pitfall 1 (RESEARCH.md): MUST return null on home page to avoid double panel.
  // Per D-05: VoiceOverlay only renders on non-home pages.
  if (!mounted || !voiceActive || pathname === '/') return null;

  return (
    <div role="complementary" aria-label="Voice assistant panel">
      {/* Desktop: hidden on mobile — matches sm: breakpoint (640px, project uses 600px) */}
      <div className="hidden sm:block">
        <div
          className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--color-navbar-bg)' }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} />
        </div>
      </div>
      {/* Mobile: hidden on desktop */}
      <div className="sm:hidden">
        <div
          className="fixed bottom-[20px] left-[20px] right-[20px] h-[72px] rounded-[25px] z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--color-navbar-bg)' }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} />
        </div>
      </div>
    </div>
  );
}
