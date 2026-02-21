
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/collaboration';
import { useToast } from '@/hooks/use-toast';

export const usePendingInvitations = () => {
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadPendingInvitations = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsLoading(false);
          return;
        }

        // Get the user's email
        const userEmail = session.user.email;
        
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
          console.log('Fetched pending invitations:', receivedInvitations);
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

    loadPendingInvitations();
    
    // Set up a subscription to refresh data when table changes
    const channel = supabase
      .channel('public:script_invitations')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'script_invitations' 
      }, () => {
        loadPendingInvitations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return { pendingInvitations, isLoading };
};
