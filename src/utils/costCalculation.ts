// AI cost calculation utilities
// Pricing as of December 2024

export interface ModelPricing {
    input: number;  // Cost per 1K input tokens
    output: number; // Cost per 1K output tokens
}

// Pricing per 1000 tokens (in USD)
export const MODEL_PRICING: Record<string, ModelPricing> = {
    // Anthropic Claude models
    'claude-3-7-sonnet-20250219': { input: 0.003, output: 0.015 },
    'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
    'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },

    // OpenAI models
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

    // xAI models
    'grok-beta': { input: 0.005, output: 0.015 },

    // DeepSeek models
    'deepseek-chat': { input: 0.00014, output: 0.00028 },
    'deepseek-coder': { input: 0.00014, output: 0.00028 }
};

/**
 * Calculate cost for an AI API call
 */
export function calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
): number {
    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        console.warn(`Unknown model pricing for: ${model}, using default`);
        // Default to Claude Sonnet pricing
        return (inputTokens / 1000 * 0.003) + (outputTokens / 1000 * 0.015);
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;

    return inputCost + outputCost;
}

/**
 * Estimate tokens for a given text (rough approximation)
 * Rule of thumb: ~4 characters per token for English
 */
export function estimateTokens(text: string): number {
    // More accurate estimation considering words and characters
    const wordCount = text.split(/\s+/).length;
    const charCount = text.length;

    // Average: ~0.75 tokens per word, but at least charCount/4
    const wordTokens = wordCount * 0.75;
    const charTokens = charCount / 4;

    return Math.ceil(Math.max(wordTokens, charTokens));
}

/**
 * Calculate savings from cache hit
 */
export function calculateCacheSavings(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cacheOverheadPercent?: number;
}): {
    fullCost: number;
    cacheCost: number;
    savings: number;
    savingsPercent: number;
} {
    const fullCost = calculateCost(params.model, params.inputTokens, params.outputTokens);
    const overheadPercent = params.cacheOverheadPercent || 0.1; // 10% overhead for cache operations
    const cacheCost = fullCost * overheadPercent;
    const savings = fullCost - cacheCost;
    const savingsPercent = (savings / fullCost) * 100;

    return {
        fullCost,
        cacheCost,
        savings,
        savingsPercent
    };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        return `$${(cost * 100).toFixed(4)}¢`;
    }
    return `$${cost.toFixed(4)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
    if (tokens < 1000) {
        return `${tokens} tokens`;
    }
    return `${(tokens / 1000).toFixed(1)}K tokens`;
}

/**
 * Get pricing info for a model
 */
export function getModelPricing(model: string): ModelPricing | null {
    return MODEL_PRICING[model] || null;
}
