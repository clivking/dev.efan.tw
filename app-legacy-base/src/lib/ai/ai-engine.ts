/**
 * AI engine factory.
 * Reads settings and returns the configured provider implementation.
 */
import { getSetting } from '@/lib/settings';
import type { AIEngine, AIProviderName } from './types';
import { GeminiProvider } from './providers/gemini';
import { OpenAIProvider } from './providers/openai';

export async function createAIEngine(): Promise<AIEngine> {
  const provider = await getSetting<string>('ai_provider', 'gemini') as AIProviderName;
  const maxTokens = await getSetting<number>('ai_max_tokens', 2000);
  const temperature = await getSetting<number>('ai_temperature', 0.7);

  let apiKey = '';
  let model = '';

  switch (provider) {
    case 'openai':
      apiKey = await getSetting<string>('ai_openai_api_key', '');
      model = await getSetting<string>('ai_openai_model', 'gpt-4o');
      if (!apiKey) throw new Error('OpenAI API key is missing.');
      return new OpenAIProvider({ apiKey, model, maxTokens, temperature });

    case 'gemini':
    default:
      apiKey = await getSetting<string>('ai_gemini_api_key', '');
      if (!apiKey) {
        apiKey = await getSetting<string>('ai_api_key', '');
      }
      model = await getSetting<string>('ai_gemini_model', 'gemini-2.0-flash');
      if (!model) {
        model = await getSetting<string>('ai_model', 'gemini-2.0-flash');
      }
      if (!apiKey) throw new Error('Gemini API key is missing.');
      return new GeminiProvider({ apiKey, model, maxTokens, temperature });
  }
}

/**
 * Create an engine for a specific provider, typically for admin-side connection tests.
 */
export async function createAIEngineForProvider(
  provider: AIProviderName,
  overrideApiKey?: string,
  overrideModel?: string,
): Promise<AIEngine> {
  const maxTokens = await getSetting<number>('ai_max_tokens', 2000);
  const temperature = await getSetting<number>('ai_temperature', 0.7);

  switch (provider) {
    case 'openai': {
      const apiKey = overrideApiKey || await getSetting<string>('ai_openai_api_key', '');
      const model = overrideModel || await getSetting<string>('ai_openai_model', 'gpt-4o');
      if (!apiKey) throw new Error('OpenAI API key is missing.');
      return new OpenAIProvider({ apiKey, model, maxTokens, temperature });
    }

    case 'gemini':
    default: {
      let apiKey = overrideApiKey || await getSetting<string>('ai_gemini_api_key', '');
      if (!apiKey) {
        apiKey = await getSetting<string>('ai_api_key', '');
      }
      const model = overrideModel || await getSetting<string>('ai_gemini_model', 'gemini-2.0-flash');
      if (!apiKey) throw new Error('Gemini API key is missing.');
      return new GeminiProvider({ apiKey, model, maxTokens, temperature });
    }
  }
}
