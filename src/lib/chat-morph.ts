'use client';

export interface ChatMorphRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ChatVoiceSnapshot {
  state: string;
  caption: string;
  transcript: string;
  micDenied: boolean;
  compact: boolean;
}

export interface OpenTextChatDetail {
  originRect?: ChatMorphRect;
  voiceSnapshot?: ChatVoiceSnapshot;
  source?: 'voice' | 'default';
}

export function rectFromElement(element: Element | null): ChatMorphRect | undefined {
  if (!element) return undefined;

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return undefined;

  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function getCurrentChatMorphOrigin(): ChatMorphRect | undefined {
  if (typeof document === 'undefined') return undefined;
  return rectFromElement(document.querySelector('[data-chat-morph-origin="true"]'));
}
