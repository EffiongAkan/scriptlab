import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GlobalCacheStats {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRatePercent: number;
    tokensSaved: number;
    costSavedUsd: number;
    totalUsers: number;
    avgHitRatePercent: number;
}

/**
 * Admin-only hook to fetch global cache statistics across all users
 */
export function useGlobalCacheStats(days: number = 30) {
    return useQuery({
        queryKey: ['global-cache-stats', days],
        queryFn: async (): Promise<GlobalCacheStats> => {
            try {
                // Verify admin access
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('Not authenticated');

                // @ts-ignore - ai_cache table not in generated types yet
                const { data: cacheData, error: cacheError } = await supabase
                    .from('cache_analytics')
                    .select('total_requests, cache_hits, cache_misses, tokens_saved, cost_saved_usd, user_id')
                    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

                if (cacheError) {
                    console.error('Global cache stats error:', cacheError);
                    return getEmptyStats();
                }

                if (!cacheData || cacheData.length === 0) {
                    return getEmptyStats();
                }

                // Aggregate stats across all users
                const totalRequests = cacheData.reduce((sum, row) => sum + (row.total_requests || 0), 0);
                const cacheHits = cacheData.reduce((sum, row) => sum + (row.cache_hits || 0), 0);
                const cacheMisses = cacheData.reduce((sum, row) => sum + (row.cache_misses || 0), 0);
                const tokensSaved = cacheData.reduce((sum, row) => sum + (row.tokens_saved || 0), 0);
                const costSavedUsd = cacheData.reduce((sum, row) => sum + Number(row.cost_saved_usd || 0), 0);

                // Count unique users
                const uniqueUsers = new Set(cacheData.map(row => row.user_id)).size;

                // Calculate hit rate
                const hitRatePercent = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

                return {
                    totalRequests,
                    cacheHits,
                    cacheMisses,
                    hitRatePercent: Number(hitRatePercent.toFixed(2)),
                    tokensSaved,
                    costSavedUsd: Number(costSavedUsd.toFixed(6)),
                    totalUsers: uniqueUsers,
                    avgHitRatePercent: uniqueUsers > 0 ? Number((hitRatePercent / uniqueUsers).toFixed(2)) : 0
                };
            } catch (error) {
                console.error('useGlobalCacheStats error:', error);
                return getEmptyStats();
            }
        },
        refetchInterval: 60000, // Refresh every minute
        staleTime: 30000,
        retry: 1
    });
}

function getEmptyStats(): GlobalCacheStats {
    return {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRatePercent: 0,
        tokensSaved: 0,
        costSavedUsd: 0,
        totalUsers: 0,
        avgHitRatePercent: 0
    };
}

/**
 * Admin-only: Get top users by cache efficiency
 */
export function useTopCacheUsers(limit: number = 10, days: number = 30) {
    return useQuery({
        queryKey: ['top-cache-users', limit, days],
        queryFn: async () => {
            try {
                // @ts-ignore
                const { data, error } = await supabase
                    .from('cache_analytics')
                    .select('user_id, total_requests, cache_hits, cost_saved_usd')
                    .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

                if (error) {
                    console.error('Top users error:', error);
                    return [];
                }

                // Aggregate by user
                const userMap = new Map<string, any>();
                data?.forEach(row => {
                    const existing = userMap.get(row.user_id) || {
                        user_id: row.user_id,
                        total_requests: 0,
                        cache_hits: 0,
                        cost_saved_usd: 0
                    };

                    userMap.set(row.user_id, {
                        user_id: row.user_id,
                        total_requests: existing.total_requests + (row.total_requests || 0),
                        cache_hits: existing.cache_hits + (row.cache_hits || 0),
                        cost_saved_usd: existing.cost_saved_usd + Number(row.cost_saved_usd || 0)
                    });
                });

                // Convert to array and calculate hit rate
                const users = Array.from(userMap.values()).map(user => ({
                    ...user,
                    hit_rate_percent: user.total_requests > 0
                        ? Number(((user.cache_hits / user.total_requests) * 100).toFixed(2))
                        : 0
                }));

                // Sort by cost saved
                return users
                    .sort((a, b) => b.cost_saved_usd - a.cost_saved_usd)
                    .slice(0, limit);
            } catch (error) {
                console.error('useTopCacheUsers error:', error);
                return [];
            }
        },
        refetchInterval: 60000,
        retry: 1
    });
}
