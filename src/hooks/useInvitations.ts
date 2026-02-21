
import { useState, useEffect } from 'react';
import { useSentInvitations } from './useSentInvitations';
import { usePendingInvitations } from './usePendingInvitations';
import { useInvitationActions } from './useInvitationActions';

export const useInvitations = (scriptId: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const { invitations, isLoading: sentInvitationsLoading } = useSentInvitations(scriptId);
  const { pendingInvitations, isLoading: pendingInvitationsLoading } = usePendingInvitations();
  const { inviteCollaborator, acceptInvitation, rejectInvitation } = useInvitationActions();

  // Set loading to false once we have data from both invitation sources
  useEffect(() => {
    if (!sentInvitationsLoading && !pendingInvitationsLoading) {
      setIsLoading(false);
    }
  }, [sentInvitationsLoading, pendingInvitationsLoading]);

  return {
    invitations,
    pendingInvitations,
    isLoading,
    inviteCollaborator,
    acceptInvitation,
    rejectInvitation
  };
};
