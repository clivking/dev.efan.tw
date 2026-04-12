/**
 * AI Provider Pricing — Hardcoded rates per 1M tokens (USD)
 * Updated: 2025-06 — Update these when providers change pricing
 */

// USD → TWD conversion rate (approximate)
export const USD_TO_TWD = 32.5;

export interface ModelPricing {
  inputPer1M: number;   // USD per 1 million input tokens
  outputPer1M: number;  // USD per 1 million output tokens
  name: string;         // Display name
}

/**
 * Known model pricing.
 * Key = model identifier string (as returned by provider API)
 */
export const MODEL_PRICING: Record<string, ModelPricing> = {
  // ─── Gemini ───────────────────────────
  'gemini-3-flash-preview':        { inputPer1M: 0.10, outputPer1M: 0.40, name: 'Gemini 3 Flash' },
  'gemini-3-pro-preview':          { inputPer1M: 1.25, outputPer1M: 10.00, name: 'Gemini 3 Pro' },
  'gemini-3.1-pro-preview':        { inputPer1M: 1.25, outputPer1M: 10.00, name: 'Gemini 3.1 Pro' },
  'gemini-3.1-flash-lite-preview': { inputPer1M: 0.025, outputPer1M: 0.10, name: 'Gemini 3.1 Flash Lite' },
  'gemini-2.5-flash':              { inputPer1M: 0.15, outputPer1M: 0.60, name: 'Gemini 2.5 Flash' },
  'gemini-2.5-pro':                { inputPer1M: 1.25, outputPer1M: 10.00, name: 'Gemini 2.5 Pro' },

  // ─── Claude ───────────────────────────

  // ─── OpenAI ───────────────────────────
  'gpt-4o':                        { inputPer1M: 2.50, outputPer1M: 10.00, name: 'GPT-4o' },
  'gpt-4o-mini':                   { inputPer1M: 0.15, outputPer1M: 0.60, name: 'GPT-4o Mini' },
  'o3-mini':                       { inputPer1M: 1.10, outputPer1M: 4.40, name: 'o3-mini' },
};

// Default fallback pricing for unknown models
const DEFAULT_PRICING: ModelPricing = {
  inputPer1M: 1.00,
  outputPer1M: 3.00,
  name: 'Unknown Model',
};

/**
 * Calculate cost for a single message
 */
export function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing = getModelPricing(model);
  const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPer1M;
  return Number((inputCost + outputCost).toFixed(8));
}

/**
 * Get pricing for a model (with fallback)
 */
export function getModelPricing(model: string): ModelPricing {
  // Try exact match first
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Try prefix match (e.g., "gemini-2.0-flash-001" → "gemini-2.0-flash")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing;
  }

  return DEFAULT_PRICING;
}

/**
 * Format cost for display in TWD
 */
export function formatCostTWD(costUSD: number): string {
  const twd = costUSD * USD_TO_TWD;
  if (twd < 0.01) return 'NT$0';
  if (twd < 1) return `NT$${twd.toFixed(2)}`;
  return `NT$${twd.toFixed(2)}`;
}

/**
 * Format cost for display in USD
 */
export function formatCost(costUSD: number): string {
  if (costUSD < 0.01) {
    return `$${(costUSD * 100).toFixed(4)}¢`;
  }
  return `$${costUSD.toFixed(4)} USD`;
}

/**
 * Format token count for display
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(2)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}
