
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ScriptSharingService } from '@/services/script-sharing-service';

export const useInvitationActions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const inviteCollaborator = async (email: string, scriptId: string, role: string = 'editor') => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to invite collaborators",
          variant: "destructive",
        });
        return null;
      }

      console.log(`Inviting ${email} to collaborate on script ${scriptId} as ${role}`);

      // Insert the invitation into the database.
      // The `on_script_invitation_created` DB trigger automatically creates
      // an in-app notification for the invitee (looks up via auth.users.email).
      const { data, error } = await supabase
        .from('script_invitations')
        .insert({
          script_id: scriptId,
          inviter_id: session.user.id,
          inviter_email: session.user.email,
          invitee_email: email,
          status: 'pending',
          role: role
        });

      if (error) {
        console.error('Error creating invitation:', error);
        throw error;
      }

      // Attempt to send an email notification via the Edge Function
      try {
        const shareResult = await ScriptSharingService.createShareLink(scriptId, {
          type: 'email',
          accessLevel: 'comment',
          allowDownload: false,
        });

        if (shareResult.success && shareResult.shareUrl) {
          const { data: script } = await supabase
            .from('scripts')
            .select('title')
            .eq('id', scriptId)
            .single();

          const emailResponse = await supabase.functions.invoke('send-invite-email', {
            body: {
              to: [email],
              shareUrl: shareResult.shareUrl,
              scriptTitle: script?.title || 'Untitled Script',
              message: 'You have been invited to collaborate on this script.'
            }
          });

          if (emailResponse.error) {
            console.warn('Email sending not available:', emailResponse.error);
          } else {
            console.log('Invitation email sent successfully');
          }
        }
      } catch (emailError: any) {
        // Email service not configured or failed - this is non-blocking
        console.warn('Email service unavailable:', emailError?.message);
      }

      toast({
        title: "Invitation sent",
        description: `${email} has been invited to collaborate`,
      });

      return data;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Failed to send invitation",
        description: "There was a problem sending the invitation",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string): Promise<string | null> => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to accept invitations",
          variant: "destructive",
        });
        return null;
      }

      console.log(`Accepting invitation ${invitationId} via RPC`);

      // Use the SECURITY DEFINER RPC function which bypasses RLS policy conflicts
      // Cast as any to bypass stale generated type union — the function is registered in types.ts
      const { data: rpcData, error: rpcError } = await (supabase as any)
        .rpc('accept_script_invitation', { p_invitation_id: invitationId });

      const result = rpcData as { success: boolean; error?: string; script_id?: string } | null;

      if (rpcError) {
        console.error('RPC error accepting invitation:', rpcError);
        throw new Error(rpcError.message);
      }

      if (!result?.success) {
        console.error('Invitation acceptance returned failure:', result?.error);
        throw new Error(result?.error || 'Could not accept invitation');
      }

      toast({
        title: "Invitation accepted",
        description: "You now have access to this script",
      });

      return result.script_id ?? null;
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Failed to accept invitation",
        description: error?.message || "There was a problem accepting the invitation",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  const rejectInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Authentication required",
          description: "You need to be logged in to reject invitations",
          variant: "destructive",
        });
        return false;
      }

      console.log(`Rejecting invitation ${invitationId}`);

      const { error } = await supabase
        .from('script_invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId)
        .eq('invitee_email', session.user.email);

      if (error) {
        console.error('Error rejecting invitation:', error);
        throw error;
      }

      toast({
        title: "Invitation rejected",
        description: "The invitation has been rejected",
      });

      return true;
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: "Failed to reject invitation",
        description: "There was a problem rejecting the invitation",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    inviteCollaborator,
    acceptInvitation,
    rejectInvitation
  };
};
