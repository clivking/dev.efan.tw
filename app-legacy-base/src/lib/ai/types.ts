/**
 * AI Engine — Shared type definitions
 * All AI providers must implement these interfaces
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  usage: { input_tokens: number; output_tokens: number };
  provider: string;
  model: string;
}

export interface AIEngine {
  /** Full response (for backend tasks, summaries, etc.) */
  chat(messages: ChatMessage[], systemPrompt: string): Promise<AIResponse>;
  /** Streaming response via AsyncGenerator (for live chat, token-by-token) */
  stream(messages: ChatMessage[], systemPrompt: string): AsyncGenerator<string>;
  /** Provider identifier */
  readonly provider: string;
  /** Model identifier */
  readonly model: string;
}

export interface AIEngineConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

/** Structured customer info extracted by AI from conversation */
export interface ExtractedCustomerInfo {
  contactName?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  email?: string;
  services?: string[];
  requirements?: string;
}

/** AI customer service response with embedded structured data */
export interface AICustomerServiceResponse {
  /** The message shown to the customer */
  message: string;
  /** Cumulative extracted customer info */
  extractedInfo?: ExtractedCustomerInfo;
  /** Whether all required fields have been collected */
  infoComplete?: boolean;
}

export type AIProviderName = 'gemini' | 'openai';
