import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { createAIEngineForProvider } from '@/lib/ai/ai-engine';
import { calculateCost } from '@/lib/ai/pricing';
import { recordAIUsageEvent } from '@/lib/ai/usage';
import type { AIProviderName } from '@/lib/ai/types';

export const dynamic = 'force-dynamic';

const ENCRYPTED_MASK = '••••••••';
const MASK_ONLY_PATTERN = /^[•*.\u2022\u25cf\u2027\u00b7\s]+$/u;

function normalizeApiKey(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === ENCRYPTED_MASK || MASK_ONLY_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

export async function POST(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const body = await request.json().catch(() => ({}));
      const provider = (body.provider || 'gemini') as AIProviderName;
      const apiKey = normalizeApiKey(body.apiKey);
      const modelId = typeof body.modelId === 'string' && body.modelId.trim() ? body.modelId.trim() : undefined;

      const engine = await createAIEngineForProvider(provider, apiKey, modelId);
      const result = await engine.chat(
        [{ role: 'user', content: '你好' }],
        '請用繁體中文簡短打招呼。',
      );

      const inputTokens = result.usage?.input_tokens || 0;
      const outputTokens = result.usage?.output_tokens || 0;
      const estimatedCost = calculateCost(result.model, inputTokens, outputTokens);

      await recordAIUsageEvent({
        source: 'admin_test_connection',
        provider: result.provider,
        model: result.model,
        inputTokens,
        outputTokens,
        estimatedCost,
        metadata: { provider },
      });

      return NextResponse.json({
        success: true,
        message: `${provider} 連線成功。`,
        response: result.content,
        model: result.model,
        usage: result.usage,
      });
    } catch (error: any) {
      console.error('AI test connection error:', error);
      return NextResponse.json(
        {
          error: error?.message || 'AI 連線測試失敗。',
          details: String(error),
        },
        { status: 500 },
      );
    }
  });
}
