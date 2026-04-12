/**
 * OpenAI AI Provider — Full implementation
 * 
 * API docs: https://platform.openai.com/docs/api-reference
 */
import type { AIEngine, AIEngineConfig, ChatMessage, AIResponse } from '../types';
import OpenAI from 'openai';

export class OpenAIProvider implements AIEngine {
  readonly provider = 'openai';
  readonly model: string;
  private config: AIEngineConfig;
  private client: OpenAI;

  constructor(config: AIEngineConfig) {
    this.config = config;
    this.model = config.model;
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<AIResponse> {
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: {
        input_tokens: response.usage?.prompt_tokens || 0,
        output_tokens: response.usage?.completion_tokens || 0,
      },
      provider: this.provider,
      model: response.model,
    };
  }

  async *stream(messages: ChatMessage[], systemPrompt: string): AsyncGenerator<string> {
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) yield text;
    }
  }

  /**
   * Stream with usage tracking — yields text chunks and returns usage at the end
   */
  async streamWithUsage(
    messages: ChatMessage[],
    systemPrompt: string,
    onChunk: (text: string) => void,
  ): Promise<{ input_tokens: number; output_tokens: number }> {
    const openAIMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openAIMessages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: true,
      stream_options: { include_usage: true },
    });

    let usage = { input_tokens: 0, output_tokens: 0 };

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) onChunk(text);
      // Capture usage from the final chunk
      if (chunk.usage) {
        usage = {
          input_tokens: chunk.usage.prompt_tokens || 0,
          output_tokens: chunk.usage.completion_tokens || 0,
        };
      }
    }

    return usage;
  }

  /**
   * List available models from the OpenAI API
   */
  async listModels(): Promise<{ id: string; name: string; description?: string }[]> {
    try {
      const models = await this.client.models.list();
      return models.data
        .filter(m => m.id.includes('gpt') || m.id.includes('o3') || m.id.includes('o1'))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(m => ({
          id: m.id,
          name: m.id,
        }));
    } catch (e) {
      console.error('OpenAI listModels error:', e);
      return [];
    }
  }
}
