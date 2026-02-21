import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'invitation' | 'collaboration' | 'comment' | 'system';
    read: boolean;
    action_url?: string;
    created_at: string;
}

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching notifications:', error);
                return;
            }

            setNotifications(data || []);
            const unread = (data || []).filter(n => !n.read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error in fetchNotifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (!error) {
                setNotifications(prev =>
                    prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);

            if (!error) {
                setNotifications(prev =>
                    prev.map(n => ({ ...n, read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Create notification helper
    const createNotification = async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    ...notification,
                    read: false
                });

            if (error) {
                console.error('Error creating notification:', error);
                return false;
            }

            // Refresh notifications
            await fetchNotifications();
            return true;
        } catch (error) {
            console.error('Error in createNotification:', error);
            return false;
        }
    };

    // Subscribe to real-time notifications
    useEffect(() => {
        fetchNotifications();

        const { data: { user } } = supabase.auth.getUser().then(({ data }) => {
            if (!data.user) return;

            // Subscribe to new notifications
            const channel = supabase
                .channel('notifications')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${data.user.id}`
                    },
                    (payload) => {
                        console.log('New notification received:', payload);
                        setNotifications(prev => [payload.new as Notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                )
                .subscribe();

            return () => {
                channel.unsubscribe();
            };
        });
    }, []);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        createNotification,
        refresh: fetchNotifications
    };
};
