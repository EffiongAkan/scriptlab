import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Activity {
    id: string;
    script_id: string;
    user_id: string;
    action_type: string;
    details: any;
    created_at: string;
    user?: {
        email: string;
        username?: string;
        avatar_url?: string;
    };
}

export const useScriptActivities = (scriptId: string) => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchActivities = useCallback(async () => {
        if (!scriptId) return;

        try {
            const { data, error } = await supabase
                .from('script_activities')
                .select(`
          *,
          user:user_id (
            email
          )
        `)
                .eq('script_id', scriptId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Fetch profiles separately to get username/avatar since they might be in a different table
            // or we can just rely on what we have. For now, let's assume basic user info.
            // Ideally we'd join with profiles table if it exists and has FK.

            // Let's try to fetch profiles for these users
            const userIds = [...new Set(data.map(a => a.user_id))];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            const activitiesWithProfiles = data.map(activity => {
                const profile = profiles?.find(p => p.id === activity.user_id);
                return {
                    ...activity,
                    user: {
                        ...activity.user,
                        username: profile?.username || activity.user?.email?.split('@')[0] || 'Unknown',
                        avatar_url: profile?.avatar_url
                    }
                };
            });

            setActivities(activitiesWithProfiles);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setIsLoading(false);
        }
    }, [scriptId]);

    // Log an activity
    const logActivity = useCallback(async (actionType: string, details: any = {}) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('script_activities').insert({
                script_id: scriptId,
                user_id: user.id,
                action_type: actionType,
                details
            });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }, [scriptId]);

    useEffect(() => {
        fetchActivities();

        const channel = supabase
            .channel(`activities:${scriptId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'script_activities',
                    filter: `script_id=eq.${scriptId}`
                },
                () => {
                    fetchActivities();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [scriptId, fetchActivities]);

    return {
        activities,
        isLoading,
        logActivity
    };
};
