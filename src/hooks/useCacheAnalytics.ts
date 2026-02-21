import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CacheStats {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRatePercent: number;
    tokensSaved: number;
    costSavedUsd: number;
}

/**
 * Hook to fetch and monitor cache analytics for the current user
 */
export function useCacheAnalytics(days: number = 30) {
    return useQuery({
        queryKey: ['cache-analytics', days],
        queryFn: async (): Promise<CacheStats> => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');

                // Call the database function to get aggregated stats
                // @ts-ignore - Custom RPC function not in generated types yet
                const { data, error } = await supabase.rpc('get_user_cache_stats', {
                    p_user_id: user.id,
                    p_days: days
                });

                if (error) {
                    console.error('Cache stats error:', error);
                    return {
                        totalRequests: 0,
                        cacheHits: 0,
                        cacheMisses: 0,
                        hitRatePercent: 0,
                        tokensSaved: 0,
                        costSavedUsd: 0
                    };
                }

                if (!data || data.length === 0) {
                    return {
                        totalRequests: 0,
                        cacheHits: 0,
                        cacheMisses: 0,
                        hitRatePercent: 0,
                        tokensSaved: 0,
                        costSavedUsd: 0
                    };
                }

                const stats = data[0];
                return {
                    totalRequests: Number(stats.total_requests) || 0,
                    cacheHits: Number(stats.cache_hits) || 0,
                    cacheMisses: Number(stats.cache_misses) || 0,
                    hitRatePercent: Number(stats.hit_rate_percent) || 0,
                    tokensSaved: Number(stats.tokens_saved) || 0,
                    costSavedUsd: Number(stats.cost_saved_usd) || 0
                };
            } catch (err) {
                console.error('useCacheAnalytics error:', err);
                throw err;
            }
        },
        refetchInterval: 30000,
        staleTime: 10000,
        retry: 1
    });
}

/**
 * Hook to get recent cache activity
 */
export function useRecentCacheActivity(limit: number = 10) {
    return useQuery({
        queryKey: ['recent-cache-activity', limit],
        queryFn: async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User not authenticated');

                // @ts-ignore - ai_cache table not in generated types yet
                const { data, error } = await supabase
                    .from('ai_cache')
                    .select('id, provider, model, hit_count, created_at, last_accessed, cache_type')
                    .eq('user_id', user.id)
                    .order('last_accessed', { ascending: false })
                    .limit(limit);

                if (error) {
                    console.error('Recent activity error:', error);
                    return [];
                }
                return data || [];
            } catch (err) {
                console.error('useRecentCacheActivity error:', err);
                return [];
            }
        },
        refetchInterval: 30000,
        retry: 1
    });
}
