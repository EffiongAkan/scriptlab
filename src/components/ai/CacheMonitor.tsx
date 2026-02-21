import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Zap, DollarSign, Activity } from 'lucide-react';
import { useCacheAnalytics, useRecentCacheActivity } from '@/hooks/useCacheAnalytics';
import { formatCost, formatTokens } from '@/utils/costCalculation';

const CacheMonitor = () => {
    const { data: stats, isLoading, error } = useCacheAnalytics(30);
    const { data: recentActivity } = useRecentCacheActivity(5);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>Failed to load cache analytics</AlertDescription>
            </Alert>
        );
    }

    const savingsPercent = stats && stats.totalRequests > 0
        ? ((stats.cacheHits / stats.totalRequests) * 100)
        : 0;

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-3xl font-bold">AI Cache Monitor</h2>
                <p className="text-muted-foreground">Last 30 days performance</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cache Hit Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.hitRatePercent.toFixed(1)}%</div>
                        <Progress value={stats?.hitRatePercent || 0} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.cacheHits} hits / {stats?.totalRequests} requests
                        </p>
                    </CardContent>
                </Card>

                {/* Cost Saved */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Money Saved</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCost(stats?.costSavedUsd || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {savingsPercent.toFixed(0)}% cost reduction
                        </p>
                    </CardContent>
                </Card>

                {/* Tokens Saved */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tokens Saved</CardTitle>
                        <Zap className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTokens(stats?.tokensSaved || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            API calls avoided
                        </p>
                    </CardContent>
                </Card>

                {/* Efficiency Score */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats && stats.hitRatePercent > 70 ? 'Excellent' :
                                stats && stats.hitRatePercent > 40 ? 'Good' : 'Fair'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Cache performance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Cache Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivity.map((item) => (
                                <div key={item.id} className="flex items-center justify-between border-b pb-3">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{item.provider}</Badge>
                                            <span className="text-sm text-muted-foreground">{item.model}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(item.last_accessed).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge
                                            variant={item.cache_type === 'session' ? 'secondary' :
                                                item.cache_type === 'popular' ? 'default' : 'outline'}
                                        >
                                            {item.cache_type}
                                        </Badge>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {item.hit_count} {item.hit_count === 1 ? 'hit' : 'hits'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            No cache activity yet. Generate some AI content to see stats!
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tips */}
            <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                    <strong>Pro tip:</strong> Regenerating the same content within 5 minutes uses the cache,
                    saving up to 90% on API costs and delivering instant results!
                </AlertDescription>
            </Alert>
        </div>
    );
};

export default CacheMonitor;
