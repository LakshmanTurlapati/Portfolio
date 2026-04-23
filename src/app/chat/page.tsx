'use client';

import { useRef, useEffect, useState, useCallback, type CSSProperties, type ReactNode } from 'react';
import { useChat } from '@ai-sdk/react';
import { FaArrowUp, FaArrowLeft } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useTransition } from '@/providers/transition-provider';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { ChatPopup } from '@/components/chat-popup';
import { MobileParzVoiceScreen, MOBILE_VOICE_STATE_LABELS } from '@/components/mobile-parz-voice-screen';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useMounted } from '@/hooks/use-mounted';
import { useVoiceSession } from '@/providers/voice-session-provider';
import { getLegacyChatTheme } from '@/lib/chat-theme';

// Suggestion chips data
const smallQuestions = ['Who are you?', 'Your age?', 'Where from?'];
const bigQuestions = [
  'What music do you listen to?',
  "What's your favorite game?",
  'What tech are you into?',
  'Tell me about projects',
  "What's your setup like?",
];

// Loading status messages
const loadingMessages = [
  'Waking up my private server',
  'Processing your message',
  'Almost there, Hold tight!',
  'Generating response',
];

// Parz-persona error messages (random, never show technical error.message)
const PARZ_ERRORS = [
  "Ah, my brain glitched for a sec. Try again?",
  "Server's taking a nap. Give it another shot.",
  "Something's off on my end, hit me again.",
  "Whoops, lost my train of thought. One more time?",
  "Got a hiccup on my side. Try that again.",
  "Ran into a wall there. Mind asking again?",
  "My gears jammed. One more try should do it.",
];

const MOBILE_CHAT_EXIT_DURATION_MS = 320;
const MOBILE_CHAT_EXIT_CANCEL_MS = 220;
const MOBILE_CHAT_EXIT_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Extract text content from message parts
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text!)
    .join('');
}

// Render text with linkified URLs
function RenderLinkedText({ text }: { text: string }) {
  const parts: LinkPart[] = linkifyText(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <a
            key={i}
            href={part.content}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 break-all"
          >
            {part.content}
          </a>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </>
  );
}

export default function ChatPage() {
  const mounted = useMounted();
  const isMobile = useMediaQuery('(max-width: 599px)');

  if (!mounted) {
    return <main className="h-dvh overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }} />;
  }

  return isMobile ? <MobileChatPage /> : <DesktopChatPage />;
}

function MobileChatPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const legacyTheme = getLegacyChatTheme(isDark);
  const { voiceActive, voiceProps, micDenied, openVoice, closeVoice } = useVoiceSession();
  const [mode, setMode] = useState<'parz' | 'legacy'>('parz');
  const [isExiting, setIsExiting] = useState(false);
  const [exitGesture, setExitGesture] = useState({
    active: false,
    animating: false,
    durationMs: MOBILE_CHAT_EXIT_DURATION_MS,
    progress: 0,
  });
  const exitProgressRef = useRef(0);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitRafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isExiting && mode === 'parz' && !voiceActive) openVoice();
  }, [isExiting, mode, openVoice, voiceActive]);

  const clearExitTimers = useCallback(() => {
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (exitRafRef.current !== null) {
      cancelAnimationFrame(exitRafRef.current);
      exitRafRef.current = null;
    }
  }, []);

  const setExitProgress = useCallback(
    (progress: number, animating = false, durationMs = MOBILE_CHAT_EXIT_DURATION_MS) => {
      const nextProgress = Math.min(1, Math.max(0, progress));
      exitProgressRef.current = nextProgress;
      setExitGesture({
        active: nextProgress > 0.001 || animating,
        animating,
        durationMs,
        progress: nextProgress,
      });
    },
    []
  );

  const animateExitTo = useCallback(
    (target: number, durationMs: number, onComplete?: () => void) => {
      clearExitTimers();

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        setExitProgress(target, false, durationMs);
        if (target <= 0) setExitProgress(0, false, durationMs);
        onComplete?.();
        return;
      }

      setExitProgress(target, true, durationMs);
      exitTimerRef.current = setTimeout(() => {
        exitTimerRef.current = null;
        setExitProgress(target, false, durationMs);
        if (target <= 0) setExitProgress(0, false, durationMs);
        onComplete?.();
      }, durationMs);
    },
    [clearExitTimers, setExitProgress]
  );

  const commitExit = useCallback(
    (progress: number) => {
      clearExitTimers();
      setIsExiting(true);
      setExitProgress(progress, true, MOBILE_CHAT_EXIT_DURATION_MS);
      exitRafRef.current = requestAnimationFrame(() => {
        exitRafRef.current = null;
        animateExitTo(1, MOBILE_CHAT_EXIT_DURATION_MS, () => {
          closeVoice();
          router.push('/');
        });
      });
    },
    [animateExitTo, clearExitTimers, closeVoice, router, setExitProgress]
  );

  const cancelExit = useCallback(
    (progress: number) => {
      if (progress <= 0.001) {
        setExitProgress(0, false, MOBILE_CHAT_EXIT_CANCEL_MS);
        return;
      }
      setExitProgress(progress, false, MOBILE_CHAT_EXIT_CANCEL_MS);
      animateExitTo(0, MOBILE_CHAT_EXIT_CANCEL_MS);
    },
    [animateExitTo, setExitProgress]
  );

  const handleExitTap = useCallback(() => {
    commitExit(0);
  }, [commitExit]);

  useEffect(() => {
    return () => clearExitTimers();
  }, [clearExitTimers]);

  const handleBack = useCallback(() => {
    commitExit(0);
  }, [commitExit]);

  const handleToggleToLegacy = useCallback(() => {
    closeVoice();
    setMode('legacy');
  }, [closeVoice]);

  const voiceStateLabel = MOBILE_VOICE_STATE_LABELS[voiceProps.state] ?? 'Ready';
  const voiceCaption = micDenied
    ? 'Mic access blocked'
    : voiceProps.transcript || voiceProps.caption || voiceStateLabel;

  const motionTransition = exitGesture.animating
    ? `transform ${exitGesture.durationMs}ms ${MOBILE_CHAT_EXIT_EASING}`
    : 'none';
  const chatSurfaceStyle: CSSProperties = {
    backgroundColor: legacyTheme.surface,
    transform: `translate3d(${(-exitGesture.progress * 100).toFixed(3)}vw, 0, 0)`,
    transition: motionTransition,
    willChange: exitGesture.active ? 'transform' : undefined,
  };
  const renderChatShell = (children: ReactNode) => (
    <div className="relative z-10 h-dvh overflow-hidden">
      <main
        data-testid="mobile-parz-chat"
        data-exit-progress={exitGesture.progress.toFixed(3)}
        className="absolute inset-0 z-10 h-dvh overflow-hidden"
        style={chatSurfaceStyle}
      >
        {children}
      </main>
    </div>
  );

  if (mode === 'legacy') {
    return renderChatShell(
        <ChatPopup
          isDark={isDark}
          onClose={handleBack}
          mode="screen"
        />
    );
  }

  return renderChatShell(
      <MobileParzVoiceScreen
        isDark={isDark}
        legacyTheme={legacyTheme}
        voiceState={voiceProps.state}
        caption={voiceCaption}
        micDenied={micDenied}
        onMic={voiceProps.onMic}
        onStop={voiceProps.onStop}
        onExitTap={handleExitTap}
        onExitDragStart={() => {
          clearExitTimers();
          setExitProgress(exitProgressRef.current, false);
        }}
        onExitDragProgress={(progress) => {
          clearExitTimers();
          setExitProgress(progress, false);
        }}
        onExitDragCommit={commitExit}
        onExitDragCancel={cancelExit}
        onToggleToLegacy={handleToggleToLegacy}
      />
  );
}

function DesktopChatPage() {
  const { navigateWithReveal } = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [suggestionClicked, setSuggestionClicked] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Start deterministic for SSR, then randomize after hydration.
  const [suggestions, setSuggestions] = useState(() => ({
    small: smallQuestions[0],
    big: bigQuestions[0],
  }));

  useEffect(() => {
    setSuggestions({
      small: getRandomItem(smallQuestions),
      big: getRandomItem(bigQuestions),
    });
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    onError: () => {
      // Error handled via the error state from the hook
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const showSuggestions = !suggestionClicked && userMessageCount < 2;

  // Pick a random Parz error message when error state changes
  useEffect(() => {
    if (error) {
      setCurrentError(getRandomItem(PARZ_ERRORS));
    } else {
      setCurrentError(null);
    }
  }, [error]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Cycle loading messages every 3 seconds
  useEffect(() => {
    if (!isLoading) {
      setLoadingMsgIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInputValue('');
    setUserMessageCount((c) => c + 1);
  }, [inputValue, isLoading, sendMessage]);

  const handleSuggestionClick = useCallback(
    (text: string) => {
      setSuggestionClicked(true);
      sendMessage({ text });
      setUserMessageCount((c) => c + 1);
    },
    [sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <main
      className="flex h-dvh flex-col overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      {/* Back button */}
      <button
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const originX = rect.left + rect.width / 2;
          const originY = rect.top + rect.height / 2;
          navigateWithReveal('/', originX, originY);
        }}
        className="absolute z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 active:scale-95"
        style={{
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-bg)',
          top: 'max(20px, env(safe-area-inset-top))',
          left: 'max(18px, env(safe-area-inset-left))',
        }}
        aria-label="Go back"
      >
        <FaArrowLeft size={18} />
      </button>

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-16 pb-4"
        style={{ paddingTop: 'calc(max(20px, env(safe-area-inset-top)) + 76px)' }}
      >
        {/* Empty state */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full opacity-50">
            <p
              className="text-lg font-light"
              style={{ color: 'var(--color-text)' }}
            >
              Start a conversation
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => {
          const isUser = message.role === 'user';
          const rawText = getMessageText(message.parts as Array<{ type: string; text?: string }>);
          const displayText = isUser ? rawText : sanitizeText(rawText);

          return (
            <div
              key={message.id}
              className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[65%] rounded-2xl px-4 py-3 ${
                  isUser ? 'rounded-br-md' : 'rounded-bl-md'
                }`}
                style={{
                  backgroundColor: isUser
                    ? 'var(--color-text)'
                    : 'transparent',
                  color: isUser ? 'var(--color-bg)' : 'var(--color-text)',
                  backdropFilter: isUser ? 'blur(10px)' : undefined,
                  border: isUser
                    ? 'none'
                    : '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)',
                }}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {isUser ? (
                    displayText
                  ) : (
                    <RenderLinkedText text={displayText} />
                  )}
                </p>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div
              className="rounded-2xl rounded-bl-md px-4 py-3"
              style={{
                border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)',
              }}
            >
              {/* Three dots animation */}
              <div className="flex items-center gap-1 mb-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: 'var(--color-text)',
                      animation: `dot-wave 1.4s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              {/* Rotating status text */}
              <p className="text-xs chat-shimmer-text">
                {loadingMessages[loadingMsgIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Error display */}
        {currentError && (
          <div className="flex justify-start mb-4">
            <div
              className="max-w-[80%] sm:max-w-[65%] rounded-2xl rounded-bl-md px-4 py-3"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-text)',
              }}
            >
              <p className="text-sm">{currentError}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips (desktop only) */}
      {showSuggestions && (
        <div
          className="px-4 sm:px-16 pb-2 flex flex-wrap gap-2 justify-center transition-opacity duration-200"
          style={{ opacity: showSuggestions ? 1 : 0 }}
        >
          <button
            onClick={() => handleSuggestionClick(suggestions.small)}
            className="min-h-11 px-4 py-2 rounded-full text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              border: '1px solid color-mix(in srgb, var(--color-text) 25%, transparent)',
              color: 'var(--color-text)',
              backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {suggestions.small}
          </button>
          <button
            onClick={() => handleSuggestionClick(suggestions.big)}
            className="min-h-11 px-4 py-2 rounded-full text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              border: '1px solid color-mix(in srgb, var(--color-text) 25%, transparent)',
              color: 'var(--color-text)',
              backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {suggestions.big}
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        className="px-4 sm:px-16 pt-2"
        style={{ paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }}
      >
        <div className="relative max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to my persona!"
            className="min-h-[56px] w-full rounded-full px-6 py-3 pr-16 text-sm outline-none chat-input-placeholder"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-text) 8%, transparent)',
              color: 'var(--color-text)',
              backdropFilter: 'blur(10px)',
              border: '1px solid color-mix(in srgb, var(--color-text) 15%, transparent)',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30 active:scale-95"
            style={{
              backgroundColor: 'var(--color-text)',
              color: 'var(--color-bg)',
            }}
            aria-label="Send message"
          >
            <FaArrowUp size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
