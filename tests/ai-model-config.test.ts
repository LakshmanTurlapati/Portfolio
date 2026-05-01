import { describe, expect, it } from 'vitest';
import { PARZ_CHAT_MODEL_CONFIG } from '@/lib/ai-model-config';

describe('Parz chat model config', () => {
  it('uses the configured default model and pricing metadata', () => {
    expect(PARZ_CHAT_MODEL_CONFIG).toEqual({
      id: 'grok-4.20-0309-non-reasoning',
      contextWindowTokens: 2_000_000,
      inputPricePerMillionTokensUsd: 1.25,
      outputPricePerMillionTokensUsd: 2.5,
    });
  });
});
