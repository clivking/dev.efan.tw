/**
 * Gemini AI Provider — Full implementation using @google/generative-ai SDK
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIEngine, AIEngineConfig, ChatMessage, AIResponse } from '../types';

export class GeminiProvider implements AIEngine {
  private genAI: GoogleGenerativeAI;
  readonly provider = 'gemini';
  readonly model: string;
  private config: AIEngineConfig;

  constructor(config: AIEngineConfig) {
    this.config = config;
    this.model = config.model;
    this.genAI = new GoogleGenerativeAI(config.apiKey);
  }

  async chat(messages: ChatMessage[], systemPrompt: string): Promise<AIResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      usage: {
        input_tokens: response.usageMetadata?.promptTokenCount || 0,
        output_tokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
      provider: this.provider,
      model: this.model,
    };
  }

  async *stream(messages: ChatMessage[], systemPrompt: string): AsyncGenerator<string> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    for await (const chunk of result.stream) {
      const text = chunk.text();
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
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      },
    });

    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastMessage.content);

    let usage = { input_tokens: 0, output_tokens: 0 };

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) onChunk(text);
      // Capture usage from the last chunk
      if (chunk.usageMetadata) {
        usage = {
          input_tokens: chunk.usageMetadata.promptTokenCount || 0,
          output_tokens: chunk.usageMetadata.candidatesTokenCount || 0,
        };
      }
    }

    return usage;
  }

  /**
   * List available models from the Gemini API
   */
  async listModels(): Promise<{ id: string; name: string; description?: string }[]> {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.config.apiKey}`,
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      return (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => ({
          id: m.name?.replace('models/', '') || m.name,
          name: m.displayName || m.name,
          description: m.description,
        }));
    } catch (e) {
      console.error('Gemini listModels error:', e);
      return [];
    }
  }
}
