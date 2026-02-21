
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Invitation } from '@/types/collaboration';
import { useToast } from '@/hooks/use-toast';

export const useSentInvitations = (scriptId: string) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadSentInvitations = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, user not logged in');
          setIsLoading(false);
          return;
        }

        const userId = session.user.id;
        console.log('Fetching sent invitations for script:', scriptId, 'and user:', userId);

        const { data: sentInvitations, error } = await supabase
          .from('script_invitations')
          .select('*')
          .eq('script_id', scriptId)
          .eq('inviter_id', userId);
          
        if (error) {
          console.error('Error fetching sent invitations:', error);
          throw error;
        }
        
        if (sentInvitations) {
          console.log('Fetched sent invitations:', sentInvitations);
          const formattedInvitations = sentInvitations.map((item: any) => ({
            id: item.id,
            scriptId: item.script_id,
            inviterId: item.inviter_id,
            inviterEmail: item.inviter_email,
            inviteeEmail: item.invitee_email,
            status: item.status as 'pending' | 'accepted' | 'rejected',
            createdAt: item.created_at,
          }));
          
          setInvitations(formattedInvitations);
        } else {
          console.log('No sent invitations found');
          setInvitations([]);
        }
      } catch (error) {
        console.error('Error loading sent invitations:', error);
        toast({
          title: "Failed to load invitations",
          description: "Could not retrieve sent invitation information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (scriptId) {
      loadSentInvitations();
      
      // Set up a subscription to refresh data when table changes
      const channel = supabase
        .channel('public:script_invitations:' + scriptId)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'script_invitations',
          filter: `script_id=eq.${scriptId}`
        }, () => {
          loadSentInvitations();
        })
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setInvitations([]);
      setIsLoading(false);
    }
  }, [scriptId, toast]);

  return { invitations, isLoading };
};
