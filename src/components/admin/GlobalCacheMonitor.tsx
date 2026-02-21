import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, Zap, DollarSign, Activity, Users } from 'lucide-react';
import { useGlobalCacheStats, useTopCacheUsers } from '@/hooks/useGlobalCacheStats';
import { formatCost, formatTokens } from '@/utils/costCalculation';

/**
 * Admin-only component showing platform-wide cache statistics
 */
const GlobalCacheMonitor = () => {
    const { data: stats, isLoading } = useGlobalCacheStats(30);
    const { data: topUsers } = useTopCacheUsers(5, 30);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const savingsPercent = stats && stats.totalRequests > 0
        ? ((stats.cacheHits / stats.totalRequests) * 100)
        : 0;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-2xl font-bold">AI Cache Performance</h3>
                <p className="text-sm text-muted-foreground">Platform-wide statistics (Last 30 days)</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cache Hit Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Global Hit Rate</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.hitRatePercent.toFixed(1)}%</div>
                        <Progress value={stats?.hitRatePercent || 0} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            {stats?.cacheHits} / {stats?.totalRequests} requests
                        </p>
                    </CardContent>
                </Card>

                {/* Cost Saved */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCost(stats?.costSavedUsd || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            {savingsPercent.toFixed(0)}% platform cost reduction
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

                {/* Active Users */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Using AI features
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Users by Savings */}
            {topUsers && topUsers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Top Users by Cost Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topUsers.map((user, idx) => (
                                <div key={user.user_id} className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline">#{idx + 1}</Badge>
                                        <div>
                                            <p className="text-sm font-mono">{user.user_id.substring(0, 8)}...</p>
                                            <p className="text-xs text-muted-foreground">
                                                {user.total_requests} requests
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">
                                            {formatCost(user.cost_saved_usd)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {user.hit_rate_percent}% hit rate
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default GlobalCacheMonitor;
