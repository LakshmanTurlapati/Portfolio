'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect, type CSSProperties } from 'react';
import { useChat } from '@ai-sdk/react';
import { FaXmark, FaArrowUp } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { ChatMorphRect, ChatVoiceSnapshot } from '@/lib/chat-morph';

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
            className="underline break-all"
            style={{ color: 'inherit' }}
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

interface ChatPopupProps {
  isDark: boolean;
  onClose: () => void;
  originRect?: ChatMorphRect;
  voiceSnapshot?: ChatVoiceSnapshot;
  onOpenAnimationComplete?: () => void;
}

const MORPH_DURATION_MS = 560;
const CONTENT_DELAY_MS = MORPH_DURATION_MS;
const CLOSE_DURATION_MS = 360;

type ChatMorphPhase = 'static' | 'origin' | 'expanding' | 'content';

type ChatPanelCssVars = CSSProperties & {
  '--chat-panel-fg': string;
  '--chat-panel-muted': string;
  '--chat-panel-focus': string;
  '--chat-input-placeholder': string;
};

function canAnimateFromOrigin(originRect?: ChatMorphRect): boolean {
  if (!originRect) return false;
  if (typeof window === 'undefined') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getFinalChatRect(isDesktop: boolean): ChatMorphRect {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (!isDesktop) {
    const inset = 8;
    return {
      left: inset,
      top: inset,
      width: Math.max(0, viewportWidth - inset * 2),
      height: Math.max(0, viewportHeight - inset * 2),
    };
  }

  const width = Math.min(400, viewportWidth - 48);
  const height = Math.min(600, Math.max(360, viewportHeight - 48));

  return {
    left: (viewportWidth - width) / 2,
    top: (viewportHeight - height) / 2,
    width,
    height,
  };
}

export function ChatPopup({
  isDark,
  onClose,
  originRect,
  onOpenAnimationComplete,
}: ChatPopupProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const prefersReducedRef = useRef(false);
  const closeRequestedRef = useRef(false);
  const [inputValue, setInputValue] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [suggestionClicked, setSuggestionClicked] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [sendHover, setSendHover] = useState(false);
  const initialCanMorphFromOrigin = canAnimateFromOrigin(originRect);
  const [shellRect, setShellRect] = useState<ChatMorphRect | null>(
    () => (initialCanMorphFromOrigin && originRect ? originRect : null),
  );
  const [shellExpanded, setShellExpanded] = useState(!initialCanMorphFromOrigin);
  const [contentReady, setContentReady] = useState(!initialCanMorphFromOrigin);
  const [backdropVisible, setBackdropVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(initialCanMorphFromOrigin);
  const [morphEnabled, setMorphEnabled] = useState(initialCanMorphFromOrigin);
  const [morphPhase, setMorphPhase] = useState<ChatMorphPhase>(
    initialCanMorphFromOrigin ? 'origin' : 'static',
  );

  // Randomly pick suggestion chips on mount (1 small + 1 big)
  const [suggestions] = useState(() => ({
    small: getRandomItem(smallQuestions),
    big: getRandomItem(bigQuestions),
  }));

  const { messages, sendMessage, status, error } = useChat({
    onError: () => {
      // Error handled via the error state from the hook
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const showSuggestions = !suggestionClicked && userMessageCount < 2;

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

  // Pick a random Parz error message when error state changes
  useEffect(() => {
    if (error) {
      setCurrentError(getRandomItem(PARZ_ERRORS));
    } else {
      setCurrentError(null);
    }
  }, [error]);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finalRect = getFinalChatRect(isDesktop);
    const canMorphFromOrigin = Boolean(originRect) && !prefersReduced;
    let firstFrame = 0;
    let secondFrame = 0;
    let contentTimer: ReturnType<typeof setTimeout> | null = null;
    let completeTimer: ReturnType<typeof setTimeout> | null = null;

    prefersReducedRef.current = prefersReduced;
    setMorphEnabled(canMorphFromOrigin);

    if (canMorphFromOrigin && originRect) {
      setShellRect(originRect);
      setShellExpanded(false);
      setContentReady(false);
      setBackdropVisible(false);
      setCardVisible(true);
      setMorphPhase('origin');

      firstFrame = window.requestAnimationFrame(() => {
        setBackdropVisible(true);
        secondFrame = window.requestAnimationFrame(() => {
          setShellRect(finalRect);
          setShellExpanded(true);
          setMorphPhase('expanding');
        });
      });

      contentTimer = setTimeout(() => {
        setContentReady(true);
        setMorphPhase('content');
      }, CONTENT_DELAY_MS);
      completeTimer = setTimeout(() => {
        onOpenAnimationComplete?.();
        inputRef.current?.focus();
      }, MORPH_DURATION_MS + 40);
    } else {
      setShellRect(finalRect);
      setShellExpanded(true);
      setContentReady(true);
      setMorphEnabled(false);
      setMorphPhase('static');

      firstFrame = window.requestAnimationFrame(() => {
        setBackdropVisible(true);
        setCardVisible(true);
        onOpenAnimationComplete?.();
      });
    }

    return () => {
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
      if (contentTimer) clearTimeout(contentTimer);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [isDesktop, originRect, onOpenAnimationComplete]);

  useEffect(() => {
    const onResize = () => {
      const nextRect = getFinalChatRect(isDesktop);
      if (!closeRequestedRef.current) setShellRect(nextRect);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isDesktop]);

  // Capture opener focus on mount; restore on unmount.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (contentReady) inputRef.current?.focus();
  }, [contentReady]);

  const requestClose = useCallback(() => {
    if (closeRequestedRef.current) return;
    closeRequestedRef.current = true;

    const canMorphBack = Boolean(originRect) && !prefersReducedRef.current;
    setContentReady(false);
    setBackdropVisible(false);
    setCardVisible(false);
    setMorphPhase(canMorphBack ? 'origin' : 'static');

    if (canMorphBack && originRect) {
      setShellExpanded(false);
      setShellRect(originRect);
      window.setTimeout(onClose, CLOSE_DURATION_MS);
      return;
    }

    window.setTimeout(onClose, 180);
  }, [onClose, originRect]);

  // Escape key closes the popup
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [requestClose]);

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

  const cardTransition = morphEnabled
    ? `left ${MORPH_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), top ${MORPH_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), width ${MORPH_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), height ${MORPH_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${MORPH_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), background-color 260ms ease, opacity 160ms ease`
    : 'opacity 180ms ease, transform 200ms cubic-bezier(0.2, 0.9, 0.2, 1)';
  const cardTransform = morphEnabled ? 'none' : cardVisible ? 'scale(1)' : 'scale(0.96)';
  const shellBorderRadius = shellExpanded ? 15 : 25;
  const legacyPanelSurface = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const shellBackground = morphEnabled && !contentReady ? 'var(--color-navbar-bg)' : legacyPanelSurface;
  const panelForeground = isDark ? '#000000' : '#ffffff';
  const panelMuted = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
  const panelSoftBorder = isDark ? 'rgba(189,189,189,0.3)' : 'rgba(97,97,97,0.2)';
  const panelStrongerBorder = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
  const panelHoverFill = isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
  const panelInputFill = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
  const panelInputText = isDark ? '#424242' : '#808080';
  const panelInputPlaceholder = isDark ? '#757575' : '#bdbdbd';
  const panelChipFill = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const panelUserBubbleFill = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
  const panelUserBubbleBorder = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)';
  const panelAssistantBubbleFill = isDark ? 'rgba(224,224,224,0.7)' : 'rgba(66,66,66,0.6)';
  const panelAssistantBubbleBorder = isDark ? 'rgba(189,189,189,0.3)' : 'rgba(97,97,97,0.2)';
  const panelFocus = isDark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.46)';
  const panelStatus = currentError ? '#ef4444' : '#00E676';
  const cardStyle: ChatPanelCssVars = {
    '--chat-panel-fg': panelForeground,
    '--chat-panel-muted': panelMuted,
    '--chat-panel-focus': panelFocus,
    '--chat-input-placeholder': panelInputPlaceholder,
    position: 'fixed',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    visibility: shellRect ? 'visible' : 'hidden',
    left: shellRect ? `${shellRect.left}px` : '0px',
    top: shellRect ? `${shellRect.top}px` : '0px',
    width: shellRect ? `${shellRect.width}px` : '0px',
    height: shellRect
      ? `${shellRect.height}px`
      : '0px',
    minHeight: shellExpanded ? '360px' : undefined,
    borderRadius: `${shellBorderRadius}px`,
    backgroundColor: shellBackground,
    color: panelForeground,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${panelBorder}`,
    boxShadow: '0 24px 64px rgba(0,0,0,0.30)',
    opacity: shellRect && cardVisible ? 1 : 0,
    transform: cardTransform,
    transformOrigin: 'center center',
    transition: shellRect ? cardTransition : 'none',
    willChange: morphEnabled ? 'left, top, width, height, border-radius, opacity' : 'opacity, transform',
  };

  return (
    <>
      {/* Keyframe animations scoped to this component */}
      <style>{`
        @keyframes dot-wave-popup {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes popup-shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        @keyframes messageAppear {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes sendSuccessPulse {
          from { box-shadow: 0 0 0 0 rgba(169, 227, 75, 0.55); }
          to { box-shadow: 0 0 0 6px rgba(169, 227, 75, 0); }
        }
        .popup-shimmer-text {
          background: linear-gradient(
            90deg,
            var(--chat-panel-fg) 0%,
            color-mix(in srgb, var(--chat-panel-fg) 40%, transparent) 50%,
            var(--chat-panel-fg) 100%
          );
          background-size: 200px 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: popup-shimmer 2s linear infinite;
        }
        [data-chat-input]:focus-visible,
        [data-chat-send]:focus-visible,
        [data-chat-close]:focus-visible,
        [data-chat-chip]:focus-visible {
          outline: 2px solid var(--chat-panel-focus);
          outline-offset: 2px;
        }
        [data-chat-input]::placeholder {
          color: var(--chat-input-placeholder);
          opacity: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-chat-popup-card],
          [data-chat-popup-backdrop],
          [data-chat-popup-content],
          [data-chat-message-wrapper] {
            animation: none !important;
            transition: none !important;
          }
          [data-chat-loading-dot] {
            animation: none !important;
            opacity: 0.6 !important;
          }
          .popup-shimmer-text {
            animation: none !important;
            background: var(--chat-panel-fg) !important;
            -webkit-text-fill-color: var(--chat-panel-fg) !important;
          }
          [data-chat-send-pulse] {
            animation: none !important;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        data-chat-popup-backdrop="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(42,42,42,0.3)',
          backdropFilter: 'blur(2px)',
          opacity: backdropVisible ? 1 : 0,
          transition: 'opacity 220ms ease-out',
        }}
        onClick={requestClose}
      />

      {/* Popup panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-popup-heading"
        data-chat-popup-card="true"
        data-chat-morph-source={originRect ? 'voice' : 'default'}
        data-chat-morph-state={morphEnabled ? morphPhase : 'static'}
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          data-chat-popup-content="true"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
            opacity: contentReady ? 1 : 0,
            transform: contentReady ? 'translateY(0)' : 'translateY(8px)',
            pointerEvents: contentReady ? 'auto' : 'none',
            transition: 'opacity 220ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '15px 15px 8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', minWidth: 0 }}>
            <span
              data-chat-status-dot="true"
              aria-hidden="true"
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: panelStatus,
                boxShadow: `0 0 8px ${currentError ? 'rgba(239,68,68,0.5)' : 'rgba(0,230,118,0.5)'}`,
                flex: '0 0 auto',
                marginTop: '5px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <h2
                id="chat-popup-heading"
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-lato), sans-serif',
                  fontSize: '15px',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: panelForeground,
                  letterSpacing: 0,
                }}
              >
                Parz
              </h2>
              <span
                data-chat-popup-subtitle="true"
                style={{
                  fontFamily: 'var(--font-lato), sans-serif',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  lineHeight: 1.25,
                  color: panelMuted,
                  overflowWrap: 'anywhere',
                }}
              >
                Legacy V2 Chat interface (Features may be limited)
              </span>
            </div>
          </div>
          <button
            onClick={requestClose}
            data-chat-close="true"
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = panelHoverFill;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.backgroundColor = isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
            }}
            style={{
              width: '30px',
              height: '30px',
              padding: 0,
              backgroundColor: isDark ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              cursor: 'pointer',
              color: panelForeground,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              opacity: 1,
              flex: '0 0 auto',
              transition: 'background-color 200ms ease',
            }}
            aria-label="Close chat"
          >
            <FaXmark size={15} />
          </button>
        </div>

        {/* Messages area */}
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '5px 15px 20px',
            minHeight: 0,
            scrollbarWidth: 'none',
          }}
        >
          {/* Messages */}
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const rawText = getMessageText(message.parts as Array<{ type: string; text?: string }>);
            const displayText = isUser ? rawText : sanitizeText(rawText);

            return (
              <div
                key={message.id}
                data-chat-message-wrapper="true"
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  margin: isUser ? '6px 0' : '6px 0 6px 4px',
                  animation: 'messageAppear 180ms ease-out',
                }}
              >
                <div
                  style={{
                    maxWidth: '270px',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-lato), sans-serif',
                    fontSize: '14px',
                    fontWeight: 400,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    color: isUser
                      ? (isDark ? '#ffffff' : '#000000')
                      : (isDark ? '#000000' : '#ffffff'),
                    backgroundColor: isUser ? panelUserBubbleFill : panelAssistantBubbleFill,
                    border: `0.5px solid ${isUser ? panelUserBubbleBorder : panelAssistantBubbleBorder}`,
                    backdropFilter: 'blur(5px)',
                    borderRadius: '16px',
                  }}
                >
                  {isUser ? (
                    displayText
                  ) : (
                    <RenderLinkedText text={displayText} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div
              role="status"
              aria-label="Parz is typing"
              style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0 6px 4px' }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  maxWidth: '270px',
                  padding: '8px 12px',
                  border: `0.5px solid ${panelAssistantBubbleBorder}`,
                  backgroundColor: panelAssistantBubbleFill,
                  color: isDark ? '#000000' : '#ffffff',
                  borderRadius: '16px',
                  backdropFilter: 'blur(5px)',
                }}
              >
                {/* Rotating status text */}
                <p className="popup-shimmer-text" style={{ fontSize: '12px', margin: 0, lineHeight: 1.3 }}>
                  {loadingMessages[loadingMsgIndex]}
                </p>
                {/* Three dots wave animation */}
                <div
                  aria-hidden="true"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '0 0 auto' }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      data-chat-loading-dot="true"
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#000000' : '#ffffff',
                        animation: `dot-wave-popup 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {currentError && (
            <div
              role="alert"
              style={{ display: 'flex', justifyContent: 'flex-start', margin: '6px 0 6px 4px' }}
            >
              <div
                style={{
                  maxWidth: '270px',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-lato), sans-serif',
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: 1.45,
                  backgroundColor: 'rgba(239, 68, 68, 0.10)',
                  border: '1px solid rgba(239, 68, 68, 0.30)',
                  color: panelForeground,
                  borderRadius: '16px',
                }}
              >
                {currentError}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion chips */}
        {showSuggestions && (
          <div
            role="group"
            aria-label="Suggested questions"
            style={{
              display: 'flex',
              gap: '8px',
              padding: '0 15px 15px',
              flexShrink: 0,
              ...(isDesktop
                ? { flexWrap: 'wrap' as const, justifyContent: 'center' }
                : {
                    flexWrap: 'nowrap' as const,
                    overflowX: 'auto' as const,
                    WebkitOverflowScrolling: 'touch' as const,
                    scrollbarWidth: 'none' as const,
                  }),
            }}
          >
            <button
              onClick={() => handleSuggestionClick(suggestions.small)}
              data-chat-chip="true"
              style={{
                padding: '8px 12px',
                borderRadius: '16px',
                fontFamily: 'var(--font-lato), sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.3,
                cursor: 'pointer',
                border: `0.5px solid ${panelStrongerBorder}`,
                color: panelInputText,
                backgroundColor: panelChipFill,
                transition: 'transform 200ms ease, border-color 200ms ease',
                whiteSpace: 'nowrap' as const,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            >
              {suggestions.small}
            </button>
            <button
              onClick={() => handleSuggestionClick(suggestions.big)}
              data-chat-chip="true"
              style={{
                padding: '8px 12px',
                borderRadius: '16px',
                fontFamily: 'var(--font-lato), sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: 0,
                lineHeight: 1.3,
                cursor: 'pointer',
                border: `0.5px solid ${panelStrongerBorder}`,
                color: panelInputText,
                backgroundColor: panelChipFill,
                transition: 'transform 200ms ease, border-color 200ms ease',
                whiteSpace: 'nowrap' as const,
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            >
              {suggestions.big}
            </button>
          </div>
        )}

        {/* Input row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '0 15px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: isDesktop ? 'min(300px, calc(100vw - 100px))' : 'min(360px, calc(100vw - 32px))',
              borderRadius: '22px',
              border: `1px solid ${currentError ? 'rgba(239, 68, 68, 0.45)' : 'transparent'}`,
              transition: 'border-color 200ms ease-in-out',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              aria-label="Message Parz"
              data-chat-input="true"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (e.target.value.length > 0 && currentError) setCurrentError(null);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setTimeout(() => {
                  inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }, 300);
              }}
              placeholder=""
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '52px',
                borderRadius: '22px',
                padding: '12px 54px 12px 20px',
                fontFamily: 'var(--font-lato), sans-serif',
                fontSize: '14px',
                fontWeight: 700,
                lineHeight: 1.35,
                outline: 'none',
                backgroundColor: panelInputFill,
                color: panelInputText,
                backdropFilter: 'blur(5px)',
                border: 'none',
                boxSizing: 'border-box' as const,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'text',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              data-chat-send="true"
              onMouseEnter={() => setSendHover(true)}
              onMouseLeave={() => setSendHover(false)}
              onMouseDown={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(0.94)';
                }
              }}
              onMouseUp={(e) => {
                if (inputValue.trim() && !isLoading) {
                  e.currentTarget.style.transform = sendHover
                    ? 'translateY(-50%) scale(1.04)'
                    : 'translateY(-50%)';
                }
              }}
              style={{
                position: 'absolute' as const,
                right: '6px',
                top: '50%',
                transform:
                  sendHover && inputValue.trim() && !isLoading
                    ? 'translateY(-50%) scale(1.04)'
                    : 'translateY(-50%)',
                width: '44px',
                height: '44px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                backgroundColor:
                  inputValue.trim() && !isLoading
                    ? (isDark ? '#000000' : '#ffffff')
                    : 'transparent',
                color:
                  inputValue.trim() && !isLoading
                    ? (isDark ? '#ffffff' : '#000000')
                    : panelInputText,
                opacity: inputValue.trim() && !isLoading ? 1 : 0.30,
                border:
                  inputValue.trim() && !isLoading
                    ? 'none'
                    : `1px solid ${panelSoftBorder}`,
                transition:
                  'transform 150ms ease, background-color 200ms ease, opacity 200ms ease, color 200ms ease',
              }}
              aria-label="Send message"
            >
              <FaArrowUp size={16} />
            </button>
          </div>
        </div>
        <p
          style={{
            margin: 0,
            padding: '15px 15px max(20px, env(safe-area-inset-bottom))',
            flexShrink: 0,
            textAlign: 'center',
            fontFamily: 'var(--font-lato), sans-serif',
            fontSize: '11px',
            fontStyle: 'italic',
            lineHeight: 1.3,
            color: panelMuted,
          }}
        >
          Still in experimental phase, will make mistakes
        </p>
        </div>
      </div>
    </>
  );
}
