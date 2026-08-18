import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { POST } from '@/app/api/chat/route';
import { PARZ_CHAT_MODEL_CONFIG } from '@/lib/ai-model-config';

describe('Parz chat model config', () => {
  it('uses the configured default model and pricing metadata', () => {
    expect(PARZ_CHAT_MODEL_CONFIG).toEqual({
      id: 'deepseek/deepseek-v4-flash-0731',
      contextWindowTokens: 1_048_576,
      inputPricePerMillionTokensUsd: 0.08,
      outputPricePerMillionTokensUsd: 0.252,
    });
  });

  it('wires the chat route through OpenRouter with low reasoning', () => {
    const route = readFileSync(
      join(process.cwd(), 'src/app/api/chat/route.ts'),
      'utf8',
    );

    expect(route).toContain("from '@openrouter/ai-sdk-provider'");
    expect(route).toContain("hasEnvVar('OPENROUTER_API_KEY')");
    expect(route).toContain('openrouter(PARZ_CHAT_MODEL_CONFIG.id');
    expect(route).toContain("reasoning: { effort: 'low', exclude: true }");
    expect(route).toContain('maxOutputTokens: 2048');
    expect(route).not.toContain("from '@ai-sdk/xai'");
    expect(route).not.toContain('XAI_API_KEY');
  });

  it('returns 503 when the OpenRouter key is missing', async () => {
    const previousKey = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;

    try {
      const response = await POST(new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      }));

      expect(response.status).toBe(503);
      await expect(response.json()).resolves.toEqual({
        error: 'Chat service is not configured. Please try again later.',
      });
    } finally {
      if (previousKey === undefined) delete process.env.OPENROUTER_API_KEY;
      else process.env.OPENROUTER_API_KEY = previousKey;
    }
  });
});
