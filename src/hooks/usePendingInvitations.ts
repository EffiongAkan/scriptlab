
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/collaboration';
import { useToast } from '@/hooks/use-toast';

export const usePendingInvitations = () => {
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  // Track if initial load has been done
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let userEmail: string | null = null;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    const loadPendingInvitations = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        userEmail = session.user.email ?? null;

        if (!userEmail) {
          console.error('User email not found in session');
          setIsLoading(false);
          return;
        }

        const { data: receivedInvitations, error } = await supabase
          .from('script_invitations')
          .select('*')
          .eq('invitee_email', userEmail)
          .eq('status', 'pending');

        if (error) {
          console.error('Error fetching pending invitations:', error);
          throw error;
        }

        if (receivedInvitations) {
          const formattedInvitations = receivedInvitations.map((item: any) => ({
            id: item.id,
            scriptId: item.script_id,
            inviterId: item.inviter_id,
            inviterEmail: item.inviter_email,
            inviteeEmail: item.invitee_email,
            status: item.status as 'pending' | 'accepted' | 'rejected',
            createdAt: item.created_at,
          }));

          setPendingInvitations(formattedInvitations);
        }

        initialLoadDone.current = true;
      } catch (error) {
        console.error('Error loading pending invitations:', error);
        toast({
          title: "Failed to load invitations",
          description: "Could not retrieve pending invitation information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const setupSubscription = async () => {
      await loadPendingInvitations();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) return;

      userEmail = session.user.email;

      // Subscribe with an email-specific filter so only relevant changes trigger updates
      channelRef = supabase
        .channel(`pending_invitations_${userEmail}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'script_invitations',
          filter: `invitee_email=eq.${userEmail}`,
        }, (payload) => {
          // Instant optimistic update – no round-trip needed on INSERT
          const newInv = payload.new as any;
          if (newInv.status === 'pending') {
            const formatted: Invitation = {
              id: newInv.id,
              scriptId: newInv.script_id,
              inviterId: newInv.inviter_id,
              inviterEmail: newInv.inviter_email,
              inviteeEmail: newInv.invitee_email,
              status: 'pending',
              createdAt: newInv.created_at,
            };
            setPendingInvitations(prev => {
              // Avoid duplicates
              if (prev.some(i => i.id === formatted.id)) return prev;
              return [formatted, ...prev];
            });
            toast({
              title: "New Collaboration Invite",
              description: `${newInv.inviter_email || 'Someone'} invited you to collaborate on a script.`,
              duration: 7000,
            });
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'script_invitations',
          filter: `invitee_email=eq.${userEmail}`,
        }, (payload) => {
          // When status changes (accepted/rejected) remove from pending list
          const updated = payload.new as any;
          setPendingInvitations(prev => prev.filter(i => i.id !== updated.id || updated.status === 'pending'));
        })
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, [toast]);

  return { pendingInvitations, isLoading };
};
