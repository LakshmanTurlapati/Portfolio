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
          data-chat-morph-origin="true"
          className="fixed top-[10px] left-1/2 -translate-x-1/2 w-[760px] h-[72px] rounded-[25px] z-50 overflow-hidden"
          style={{ backgroundColor: 'var(--color-navbar-bg)' }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} />
        </div>
      </div>
      {/* Mobile: hidden on desktop. Bottom uses max(20px, env(safe-area-inset-bottom))
          so notched iOS devices don't put the home indicator over the panel. */}
      <div className="sm:hidden">
        <div
          data-chat-morph-origin="true"
          className="fixed h-[76px] rounded-[25px] z-50 overflow-hidden shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
          style={{
            backgroundColor: 'var(--color-navbar-bg)',
            left: 'max(14px, env(safe-area-inset-left))',
            right: 'max(14px, env(safe-area-inset-right))',
            bottom: 'max(20px, env(safe-area-inset-bottom))',
            backdropFilter: 'blur(18px) saturate(1.1)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
          }}
        >
          <VoicePanel {...voiceProps} isDark={isDark} micDenied={micDenied} compact />
        </div>
      </div>
    </div>
  );
}
