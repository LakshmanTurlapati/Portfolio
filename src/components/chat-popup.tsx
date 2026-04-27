'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { FaXmark, FaArrowUp } from 'react-icons/fa6';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useSiteControl, type ControlPage } from '@/providers/site-control-provider';
import { useMediaQuery } from '@/hooks/use-media-query';

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

const siteControlChatTransport = new DefaultChatTransport({
  body: { enableSiteControl: true },
});

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

type ToolPart = {
  type?: string;
  toolName?: string;
  toolCallId?: string;
  state?: string;
  input?: Record<string, unknown>;
  args?: Record<string, unknown>;
};

function getToolCall(part: ToolPart): { id: string; name: string; args: Record<string, unknown> } | null {
  const name = part.toolName || (part.type?.startsWith('tool-') ? part.type.slice(5) : '');
  if (!name) return null;
  if (part.state && part.state !== 'input-available' && part.state !== 'output-available') return null;
  return {
    id: part.toolCallId || `${name}:${JSON.stringify(part.input || part.args || {})}`,
    name,
    args: part.input || part.args || {},
  };
}

interface ChatPopupProps {
  isDark: boolean;
  onClose: () => void;
}

export function ChatPopup({ isDark, onClose }: ChatPopupProps) {
  const siteControl = useSiteControl();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const handledToolCallsRef = useRef<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [suggestionClicked, setSuggestionClicked] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [currentError, setCurrentError] = useState<string | null>(null);

  // Randomly pick suggestion chips on mount (1 small + 1 big)
  const [suggestions] = useState(() => ({
    small: getRandomItem(smallQuestions),
    big: getRandomItem(bigQuestions),
  }));

  const { messages, sendMessage, status, error } = useChat({
    transport: siteControlChatTransport,
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

  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const rawPart of message.parts as ToolPart[]) {
        const toolCall = getToolCall(rawPart);
        if (!toolCall || handledToolCallsRef.current.has(toolCall.id)) continue;
        handledToolCallsRef.current.add(toolCall.id);

        if (toolCall.name === 'navigate') {
          const page = toolCall.args.page;
          if (page === 'home' || page === 'portfolio' || page === 'about') siteControl.navigate(page as ControlPage);
        }
        if (toolCall.name === 'openProject' && typeof toolCall.args.name === 'string') {
          siteControl.openProject(toolCall.args.name);
        }
        if (toolCall.name === 'scrollTo' && typeof toolCall.args.section === 'string') {
          siteControl.scrollTo(toolCall.args.section);
        }
        if (toolCall.name === 'closeBrowser') siteControl.closeBrowser();
        if (toolCall.name === 'openCurrentProjectExternal') siteControl.openCurrentProjectExternal();
        if (toolCall.name === 'unsupportedIframeControl') siteControl.unsupportedIframeControl();
      }
    }
  }, [messages, siteControl]);

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

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    <>
      {/* Keyframe animations scoped to this component */}
      <style>{`
        @keyframes popupIn {
          from { transform: translate(-50%, 30px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dot-wave-popup {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes popup-shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }
        .popup-shimmer-text {
          background: linear-gradient(
            90deg,
            var(--color-text) 0%,
            color-mix(in srgb, var(--color-text) 40%, transparent) 50%,
            var(--color-text) 100%
          );
          background-size: 200px 100%;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: popup-shimmer 2s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(42,42,42,0.3)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.2s ease',
        }}
        onClick={onClose}
      />

      {/* Popup panel */}
      <div
        role="dialog"
        style={{
          position: 'fixed',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          background: isDark ? '#1a1a1c' : '#fafaf7',
          backdropFilter: 'blur(14px)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 24px 64px rgba(0,0,0,0.30)',
          ...(isDesktop
            ? {
                right: '24px',
                bottom: '24px',
                width: '420px',
                maxWidth: '420px',
                height: 'min(640px, calc(100vh - 48px))',
                minHeight: '420px',
              }
            : {
                inset: '8px',
                width: 'calc(100vw - 16px)',
                maxWidth: '100%',
                height:
                  'calc(100dvh - 16px - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                minHeight: '360px',
              }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '56px',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h2
              id="chat-popup-heading"
              style={{
                margin: 0,
                color: 'var(--color-text)',
                // Visual typography (Instrument Serif italic 22px) added in Plan 02.
              }}
            >
              Parz
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              padding: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              opacity: 0.7,
            }}
            aria-label="Close chat"
          >
            <FaXmark size={18} />
          </button>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            minHeight: 0,
            scrollbarWidth: 'none',
          }}
        >
          {/* Empty state / greeting */}
          {messages.length === 0 && !isLoading && (
            <div
              style={{
                padding: '16px 0',
                color: 'var(--color-text)',
                opacity: 0.7,
                fontSize: '14px',
                lineHeight: 1.6,
              }}
            >
              Hey! I&apos;m Parz — Lakshman&apos;s digital twin. Ask me anything about his work or projects.
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
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: '16px',
                    borderBottomRightRadius: isUser ? '4px' : '16px',
                    borderBottomLeftRadius: isUser ? '16px' : '4px',
                    padding: '10px 14px',
                    backgroundColor: isUser ? 'var(--color-text)' : 'transparent',
                    color: isUser ? 'var(--color-bg)' : 'var(--color-text)',
                    border: isUser
                      ? 'none'
                      : `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                    fontSize: '14px',
                    lineHeight: 1.6,
                    wordBreak: 'break-word',
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
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
              <div
                style={{
                  borderRadius: '16px',
                  borderBottomLeftRadius: '4px',
                  padding: '10px 14px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                }}
              >
                {/* Three dots wave animation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-text)',
                        animation: `dot-wave-popup 1.4s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                {/* Rotating status text */}
                <p className="popup-shimmer-text" style={{ fontSize: '12px', margin: 0 }}>
                  {loadingMessages[loadingMsgIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {currentError && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
              <div
                style={{
                  maxWidth: '80%',
                  borderRadius: '16px',
                  borderBottomLeftRadius: '4px',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-text)',
                  fontSize: '14px',
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
            style={{
              padding: '8px 16px',
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => handleSuggestionClick(suggestions.small)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                color: 'var(--color-text)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {suggestions.small}
            </button>
            <button
              onClick={() => handleSuggestionClick(suggestions.big)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                cursor: 'pointer',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`,
                color: 'var(--color-text)',
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                backdropFilter: 'blur(10px)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {suggestions.big}
            </button>
          </div>
        )}

        {/* Input row */}
        <div
          style={{
            padding: '8px 16px 16px',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="text"
              enterKeyHint="send"
              autoComplete="off"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setTimeout(() => {
                  inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }, 300);
              }}
              placeholder="Talk to my persona!"
              disabled={isLoading}
              style={{
                width: '100%',
                borderRadius: '24px',
                padding: '12px 52px 12px 20px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: 'var(--color-text)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}`,
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: inputValue.trim() && !isLoading ? 'pointer' : 'not-allowed',
                backgroundColor: 'var(--color-text)',
                color: 'var(--color-bg)',
                border: 'none',
                opacity: inputValue.trim() && !isLoading ? 1 : 0.3,
                transition: 'opacity 0.2s ease',
              }}
              aria-label="Send message"
            >
              <FaArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
