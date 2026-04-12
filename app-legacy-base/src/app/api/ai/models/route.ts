import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/middleware/auth';
import { getSetting } from '@/lib/settings';
import { GeminiProvider } from '@/lib/ai/providers/gemini';
import { MODEL_PRICING } from '@/lib/ai/pricing';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/models?provider=gemini
 * Optionally accepts ?apiKey=... to test models before saving.
 */
export async function GET(request: NextRequest) {
  return withAdmin(request, async () => {
    try {
      const url = request.nextUrl;
      const provider = url.searchParams.get('provider') || 'gemini';
      const apiKeyOverride = url.searchParams.get('apiKey') || '';

      let apiKey = apiKeyOverride;
      if (!apiKey) {
        switch (provider) {
          case 'gemini':
            apiKey = await getSetting<string>('ai_gemini_api_key', '');
            if (!apiKey) apiKey = await getSetting<string>('ai_api_key', '');
            break;
          case 'openai':
            apiKey = await getSetting<string>('ai_openai_api_key', '');
            break;
          default:
            apiKey = '';
        }
      }

      if (!apiKey) {
        return NextResponse.json(
          { error: '尚未設定所選供應商的 API Key。', models: [] },
          { status: 400 },
        );
      }

      let models: { id: string; name: string; description?: string }[] = [];

      switch (provider) {
        case 'gemini': {
          const engine = new GeminiProvider({
            apiKey,
            model: 'gemini-2.0-flash',
            maxTokens: 100,
            temperature: 0.7,
          });
          models = await engine.listModels();
          break;
        }

        case 'openai': {
          try {
            const res = await fetch('https://api.openai.com/v1/models', {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (res.ok) {
              const data = await res.json();
              models = (data.data || [])
                .filter((model: any) => model.id.startsWith('gpt-') || model.id.startsWith('o'))
                .sort((a: any, b: any) => a.id.localeCompare(b.id))
                .map((model: any) => ({ id: model.id, name: model.id }));
            }
          } catch (error) {
            console.error('OpenAI listModels error:', error);
          }

          if (!models.length) {
            models = [
              { id: 'gpt-4o', name: 'GPT-4o' },
              { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
              { id: 'o3-mini', name: 'o3-mini' },
            ];
          }
          break;
        }

        default:
          return NextResponse.json({ error: '不支援的 AI 供應商。', models: [] }, { status: 400 });
      }

      return NextResponse.json({
        provider,
        models: models.map((model) => ({
          ...model,
          pricing: MODEL_PRICING[model.id]
            ? {
                inputPer1M: MODEL_PRICING[model.id].inputPer1M,
                outputPer1M: MODEL_PRICING[model.id].outputPer1M,
              }
            : null,
        })),
      });
    } catch (error: any) {
      console.error('List models error:', error);
      return NextResponse.json(
        { error: error?.message || '無法載入 AI 模型清單。', models: [] },
        { status: 500 },
      );
    }
  });
}
