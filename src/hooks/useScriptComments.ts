import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Comment {
    id: string;
    script_id: string;
    element_id?: string;
    user_id: string;
    content: string;
    is_resolved: boolean;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        name: string;
        email?: string;
        avatar?: string;
    };
    replies?: CommentReply[];
}

export interface CommentReply {
    id: string;
    comment_id: string;
    user_id: string;
    content: string;
    created_at: string;
    updated_at: string;
    author?: {
        id: string;
        name: string;
        email?: string;
        avatar?: string;
    };
}

export const useScriptComments = (scriptId: string, elementId?: string) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // Fetch comments from database
    const fetchComments = useCallback(async () => {
        if (!scriptId) {
            setComments([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Simplified query without profiles join to avoid errors
            let query = supabase
                .from('script_comments')
                .select(`
          *,
          script_comment_replies (
            *
          )
        `)
                .eq('script_id', scriptId)
                .order('created_at', { ascending: false });

            // Filter by element if specified
            if (elementId) {
                query = query.eq('element_id', elementId);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Collect all user IDs to fetch profiles manually
            // This avoids foreign key issues with direct joins 
            const userIds = new Set<string>();
            data?.forEach((comment: any) => {
                if (comment.user_id) userIds.add(comment.user_id);
                comment.script_comment_replies?.forEach((reply: any) => {
                    if (reply.user_id) userIds.add(reply.user_id);
                });
            });

            // Fetch profiles map
            const profilesMap: Record<string, any> = {};
            if (userIds.size > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, username, full_name, email, avatar_url')
                    .in('id', Array.from(userIds));

                profiles?.forEach((profile: any) => {
                    profilesMap[profile.id] = profile;
                });
            }

            // Transform data to match our Comment interface
            const transformedComments: Comment[] = (data || []).map((comment: any) => {
                const commentProfile = profilesMap[comment.user_id];
                return {
                    id: comment.id,
                    script_id: comment.script_id,
                    element_id: comment.element_id,
                    user_id: comment.user_id,
                    content: comment.content,
                    is_resolved: comment.is_resolved,
                    created_at: comment.created_at,
                    updated_at: comment.updated_at,
                    author: {
                        id: comment.user_id,
                        name: commentProfile?.username || commentProfile?.full_name || commentProfile?.email?.split('@')[0] || 'Unknown User',
                        email: commentProfile?.email,
                        avatar: commentProfile?.avatar_url
                    },
                    replies: comment.script_comment_replies?.map((reply: any) => {
                        const replyProfile = profilesMap[reply.user_id];
                        return {
                            id: reply.id,
                            comment_id: reply.comment_id,
                            user_id: reply.user_id,
                            content: reply.content,
                            created_at: reply.created_at,
                            updated_at: reply.updated_at,
                            author: {
                                id: reply.user_id,
                                name: replyProfile?.username || replyProfile?.full_name || replyProfile?.email?.split('@')[0] || 'Unknown User',
                                email: replyProfile?.email,
                                avatar: replyProfile?.avatar_url
                            },
                            timestamp: new Date(reply.created_at)
                        };
                    }) || []
                };
            });

            setComments(transformedComments);
        } catch (err: any) {
            console.error('Error fetching comments:', err);
            setError(err.message || 'Failed to load comments');
            toast({
                title: 'Error',
                description: 'Failed to load comments',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    }, [scriptId, elementId, toast]);

    // Subscribe to real-time updates
    useEffect(() => {
        fetchComments();

        if (!scriptId) return;

        // Subscribe to comment changes
        const commentsChannel = supabase
            .channel(`script_comments:${scriptId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'script_comments',
                    filter: `script_id=eq.${scriptId}`
                },
                () => {
                    fetchComments();
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'script_comment_replies'
                },
                () => {
                    fetchComments();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(commentsChannel);
        };
    }, [scriptId, fetchComments]);

    // Add a new comment
    const addComment = useCallback(async (content: string, elementId?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: insertError } = await supabase
                .from('script_comments')
                .insert({
                    script_id: scriptId,
                    element_id: elementId,
                    user_id: user.id,
                    content: content.trim()
                });

            if (insertError) throw insertError;

            toast({
                title: 'Comment Added',
                description: 'Your comment has been posted successfully.'
            });

            // Comments will update via real-time subscription
        } catch (err: any) {
            console.error('Error adding comment:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to add comment',
                variant: 'destructive'
            });
            throw err;
        }
    }, [scriptId, toast]);

    // Add a reply to a comment
    const addReply = useCallback(async (commentId: string, content: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: insertError } = await supabase
                .from('script_comment_replies')
                .insert({
                    comment_id: commentId,
                    user_id: user.id,
                    content: content.trim()
                });

            if (insertError) throw insertError;

            toast({
                title: 'Reply Added',
                description: 'Your reply has been posted successfully.'
            });

            // Replies will update via real-time subscription
        } catch (err: any) {
            console.error('Error adding reply:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to add reply',
                variant: 'destructive'
            });
            throw err;
        }
    }, [toast]);

    // Update a comment
    const updateComment = useCallback(async (commentId: string, content: string) => {
        try {
            const { error: updateError } = await supabase
                .from('script_comments')
                .update({ content: content.trim() })
                .eq('id', commentId);

            if (updateError) throw updateError;

            toast({
                title: 'Comment Updated',
                description: 'Your comment has been updated successfully.'
            });
        } catch (err: any) {
            console.error('Error updating comment:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to update comment',
                variant: 'destructive'
            });
            throw err;
        }
    }, [toast]);

    // Delete a comment
    const deleteComment = useCallback(async (commentId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('script_comments')
                .delete()
                .eq('id', commentId);

            if (deleteError) throw deleteError;

            toast({
                title: 'Comment Deleted',
                description: 'The comment has been deleted.'
            });
        } catch (err: any) {
            console.error('Error deleting comment:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to delete comment',
                variant: 'destructive'
            });
            throw err;
        }
    }, [toast]);

    // Toggle resolved status
    const toggleResolved = useCallback(async (commentId: string, isResolved: boolean) => {
        try {
            const { error: updateError } = await supabase
                .from('script_comments')
                .update({ is_resolved: isResolved })
                .eq('id', commentId);

            if (updateError) throw updateError;

            toast({
                title: isResolved ? 'Comment Resolved' : 'Comment Reopened',
                description: isResolved ? 'The comment has been marked as resolved.' : 'The comment has been reopened.'
            });
        } catch (err: any) {
            console.error('Error toggling resolved status:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to update comment status',
                variant: 'destructive'
            });
            throw err;
        }
    }, [toast]);

    return {
        comments,
        isLoading,
        error,
        addComment,
        addReply,
        updateComment,
        deleteComment,
        toggleResolved,
        refetch: fetchComments
    };
};
