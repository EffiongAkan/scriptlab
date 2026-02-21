
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

      // Insert the invitation into the database
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

      // Send email notification (graceful degradation if service unavailable)
      try {
        // Create or get share link for the script
        const shareResult = await ScriptSharingService.createShareLink(scriptId, {
          type: 'email',
          accessLevel: 'comment',
          allowDownload: false,
        });

        if (shareResult.success && shareResult.shareUrl) {
          // Get script title for better email
          const { data: script } = await supabase
            .from('scripts')
            .select('title')
            .eq('id', scriptId)
            .single();

          // Try to send invitation email via Edge Function
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
            // Show user that email wasn't sent but invitation was created
            toast({
              title: "Invitation created",
              description: `Important: Email notifications are not configured. ${email} must check their invitations in-app.`,
              duration: 6000,
            });
          } else {
            console.log('Invitation email sent successfully');
          }
        }
      } catch (emailError: any) {
        // Email service not configured or failed - this is okay
        console.warn('Email service unavailable:', emailError.message);
        toast({
          title: "Invitation created",
          description: `Important: ${email} must check their invitations in-app (email notifications not configured).`,
          duration: 6000,
        });
      }

      // TODO: Uncomment after running database migration
      // Create notification for invitee (if they have an account)
      // try {
      //   const { data: inviteeUser } = await supabase
      //     .from('profiles')
      //     .select('id')
      //     .eq('email', email)
      //     .single();

      //   if (inviteeUser) {
      //     // Get script title
      //     const { data: script } = await supabase
      //       .from('scripts')
      //       .select('title')
      //       .eq('id', scriptId)
      //       .single();

      //     await supabase
      //       .from('notifications')
      //       .insert({
      //         user_id: inviteeUser.id,
      //         title: 'New Collaboration Invitation',
      //         message: `You've been invited to collaborate on "${script?.title || 'a script'}" as ${role}`,
      //         type: 'invitation',
      //         action_url: `/dashboard` // Can be updated to specific invitation page
      //       });
      //   }
      // } catch (notifError) {
      //   // Notification creation failure shouldn't block invitation
      //   console.warn('Could not create notification:', notifError);
      // }

      // Always show success for invitation creation
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

      console.log(`Accepting invitation ${invitationId}`);

      // First, get the invitation details to make sure it's valid
      const { data: invitation, error: fetchError } = await supabase
        .from('script_invitations')
        .select('id, script_id, invitee_email, role')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        console.error('Error fetching invitation:', fetchError);
        throw new Error('Invitation not found');
      }

      if (invitation.invitee_email !== session.user.email) {
        throw new Error('This invitation is not for you');
      }

      // Update the invitation status
      const { error: updateError } = await supabase
        .from('script_invitations')
        .update({
          status: 'accepted',
          invitee_id: session.user.id
        })
        .eq('id', invitationId);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        throw updateError;
      }

      // Add the user to script_collaborators with the role from invitation
      const { error: collaboratorError } = await supabase
        .from('script_collaborators')
        .insert({
          script_id: invitation.script_id,
          user_id: session.user.id,
          role: invitation.role || 'editor'
        });

      if (collaboratorError) {
        console.error('Error adding collaborator:', collaboratorError);
        throw collaboratorError;
      }

      // TODO: Uncomment after running database migration
      // Create notification for inviter
      // try {
      //   const { data: inviterData } = await supabase
      //     .from('script_invitations')
      //     .select('inviter_id, script_id')
      //     .eq('id', invitationId)
      //     .single();

      //   if (inviterData) {
      //     const { data: script } = await supabase
      //       .from('scripts')
      //       .select('title')
      //       .eq('id', inviterData.script_id)
      //       .single();

      //     const { data: profile } = await supabase
      //       .from('profiles')
      //       .select('username, email')
      //       .eq('id', session.user.id)
      //       .single();

      //     await supabase
      //       .from('notifications')
      //       .insert({
      //         user_id: inviterData.inviter_id,
      //         title: 'Invitation Accepted',
      //         message: `${profile?.username || profile?.email || 'A user'} accepted your invitation to collaborate on "${script?.title || 'your script'}"`,
      //         type: 'collaboration',
      //         action_url: `/script/${inviterData.script_id}`
      //       });
      //   }
      // } catch (notifError) {
      //   console.warn('Could not create notification:', notifError);
      // }

      toast({
        title: "Invitation accepted",
        description: "You now have access to this script",
      });

      return invitation.script_id;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Failed to accept invitation",
        description: "There was a problem accepting the invitation",
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

      // Update the invitation status
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
