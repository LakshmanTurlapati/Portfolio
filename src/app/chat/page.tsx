'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { FaArrowUp, FaArrowLeft } from 'react-icons/fa6';
import { useMediaQuery } from '@/hooks/use-media-query';
import { sanitizeText } from '@/lib/sanitize-text';
import { linkifyText, type LinkPart } from '@/lib/linkify';
import { useTransition } from '@/providers/transition-provider';

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
  const { navigateWithReveal } = useTransition();
  const isDesktop = useMediaQuery('(min-width: 600px)');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    onError: () => {
      // Error handled via the error state from the hook
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const showSuggestions = isDesktop && !suggestionClicked && userMessageCount < 2;

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
      className="flex flex-col h-screen relative"
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
        className="absolute top-6 left-6 z-20 w-12 h-12 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-text)',
          color: 'var(--color-bg)',
        }}
        aria-label="Go back"
      >
        <FaArrowLeft size={18} />
      </button>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-16 pt-24 pb-4">
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
          className="px-4 sm:px-16 pb-2 flex gap-2 justify-center transition-opacity duration-200"
          style={{ opacity: showSuggestions ? 1 : 0 }}
        >
          <button
            onClick={() => handleSuggestionClick(suggestions.small)}
            className="px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
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
            className="px-4 py-2 rounded-full text-sm transition-all hover:scale-105"
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
      <div className="px-4 sm:px-16 pb-6 pt-2">
        <div className="relative max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Talk to my persona!"
            className="w-full rounded-full px-6 py-3 pr-14 text-sm outline-none chat-input-placeholder"
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
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-opacity disabled:opacity-30"
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
