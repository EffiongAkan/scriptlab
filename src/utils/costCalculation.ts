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

    // xAI Grok 4 models (flagship & reasoning)
    'grok-4':                      { input: 0.003, output: 0.015 },
    'grok-4-0709':                 { input: 0.003, output: 0.015 },
    'grok-4-1-fast-reasoning':     { input: 0.003, output: 0.025 },
    'grok-4.20-0309-reasoning':    { input: 0.003, output: 0.025 },

    // xAI Grok 3 models
    'grok-3':                      { input: 0.003, output: 0.015 },
    'grok-3-mini':                 { input: 0.0003, output: 0.0005 },
    'grok-3-fast':                 { input: 0.005, output: 0.025 },
    'grok-3-mini-fast':            { input: 0.0006, output: 0.004 },

    // xAI Grok 2 models
    'grok-2':                      { input: 0.002, output: 0.010 },
    'grok-2-1212':                 { input: 0.002, output: 0.010 },
    'grok-2-vision-1212':          { input: 0.002, output: 0.010 },
    'grok-2-mini':                 { input: 0.001, output: 0.005 },

    // xAI Legacy
    'grok-beta':                   { input: 0.005, output: 0.015 },

    // DeepSeek V3 (latest chat)
    'deepseek-chat':                    { input: 0.00014, output: 0.00028 },
    'deepseek-v3':                      { input: 0.00014, output: 0.00028 },

    // DeepSeek R1 (reasoning)
    'deepseek-reasoner':                { input: 0.00055, output: 0.00219 },
    'deepseek-r1':                      { input: 0.00055, output: 0.00219 },
    'deepseek-r1-zero':                 { input: 0.00055, output: 0.00219 },

    // DeepSeek R1 Distill — Qwen base
    'deepseek-r1-distill-qwen-32b':     { input: 0.00012, output: 0.00018 },
    'deepseek-r1-distill-qwen-14b':     { input: 0.00007, output: 0.00011 },
    'deepseek-r1-distill-qwen-7b':      { input: 0.00004, output: 0.00008 },
    'deepseek-r1-distill-qwen-1.5b':    { input: 0.00001, output: 0.00002 },

    // DeepSeek R1 Distill — Llama base
    'deepseek-r1-distill-llama-70b':    { input: 0.00023, output: 0.00069 },
    'deepseek-r1-distill-llama-8b':     { input: 0.00004, output: 0.00008 },

    // DeepSeek V2 family
    'deepseek-v2':                      { input: 0.00020, output: 0.00060 },
    'deepseek-v2.5':                    { input: 0.00014, output: 0.00028 },

    // Legacy coder models
    'deepseek-coder':                   { input: 0.00014, output: 0.00028 },
    'deepseek-coder-v2':                { input: 0.00014, output: 0.00028 },
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
