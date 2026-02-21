// Cache key generation utilities for AI responses
// Uses SHA-256 hashing to create deterministic cache keys

export interface CacheKeyParams {
    provider: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}

/**
 * Generate a deterministic cache key from AI request parameters
 * Same inputs will always produce the same cache key
 */
export function generateCacheKey(params: CacheKeyParams): string {
    // Normalize parameters to ensure consistent hashing
    const normalized = {
        provider: params.provider.toLowerCase().trim(),
        model: params.model.trim(),
        prompt: params.prompt.trim(),
        system: params.systemPrompt?.trim() || '',
        temp: params.temperature || 0.7,
        maxTokens: params.maxTokens || 1000
    };

    // Create deterministic string representation
    const keyString = JSON.stringify(normalized, Object.keys(normalized).sort());

    // Generate SHA-256 hash (using Web Crypto API for Deno)
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);

    return crypto.subtle.digest('SHA-256', data)
        .then(hashBuffer => {
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        })
        .then(hash => hash);
}

/**
 * Generate a simpler prompt hash for analytics (synchronous)
 */
export function generatePromptHash(prompt: string): string {
    const normalized = prompt.trim().toLowerCase();
    // Simple hash for grouping similar prompts
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Calculate cache expiry time based on cache type
 */
export function calculateExpiryTime(cacheType: 'session' | 'popular' | 'template'): Date {
    const now = new Date();

    switch (cacheType) {
        case 'session':
            // 5 minutes for session-based caching
            return new Date(now.getTime() + 5 * 60 * 1000);
        case 'popular':
            // 30 minutes for popular scripts
            return new Date(now.getTime() + 30 * 60 * 1000);
        case 'template':
            // 24 hours for template prompts
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() + 5 * 60 * 1000);
    }
}

/**
 * Determine cache type based on request characteristics
 */
export function determineCacheType(params: {
    scriptId?: string;
    userId: string;
    isTemplate?: boolean;
}): 'session' | 'popular' | 'template' {
    if (params.isTemplate) {
        return 'template';
    }

    // For now, default to session-based
    // Popular detection will be handled by background jobs
    return 'session';
}
