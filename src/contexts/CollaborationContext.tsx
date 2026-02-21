
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Collaborator, Invitation } from '@/types/collaboration';
import { useCollaborators } from '@/hooks/useCollaborators';
import { useInvitations } from '@/hooks/useInvitations';
import { useCollaboratorPresence } from '@/hooks/useCollaboratorPresence';

type CollaborationContextType = {
  collaborators: Collaborator[];
  invitations: Invitation[];
  pendingInvitations: Invitation[];
  isLoading: boolean;
  isOnline: boolean;
  inviteCollaborator: (email: string, scriptId: string, role?: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  rejectInvitation: (invitationId: string) => Promise<void>;
  updateCursorPosition: (elementId: string, position: number) => void;
};

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export function CollaborationProvider({
  children,
  scriptId
}: {
  children: React.ReactNode;
  scriptId: string;
}) {
  // Initialize with default values first
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only use hooks here after the useState calls are initialized
  const {
    collaborators: fetchedCollaborators,
    isLoading: collaboratorsLoading,
    setCollaborators: updateCollaborators
  } = useCollaborators(scriptId);

  const {
    invitations: fetchedInvitations,
    pendingInvitations: fetchedPendingInvitations,
    isLoading: invitationsLoading,
    inviteCollaborator,
    acceptInvitation: acceptInvitationOriginal,
    rejectInvitation: rejectInvitationOriginal
  } = useInvitations(scriptId);

  // Update the state with fetched data
  useEffect(() => {
    if (fetchedCollaborators) {
      setCollaborators(fetchedCollaborators);
    }
  }, [fetchedCollaborators]);

  useEffect(() => {
    if (fetchedInvitations) {
      setInvitations(fetchedInvitations);
    }
  }, [fetchedInvitations]);

  useEffect(() => {
    if (fetchedPendingInvitations) {
      setPendingInvitations(fetchedPendingInvitations);
    }
  }, [fetchedPendingInvitations]);

  useEffect(() => {
    setIsLoading(collaboratorsLoading || invitationsLoading);
  }, [collaboratorsLoading, invitationsLoading]);

  const {
    collaborators: liveCollaborators,
    updateCursorPosition
  } = useCollaboratorPresence(
    scriptId,
    collaborators
  );

  // Wrap the acceptInvitation function to match the expected return type
  const acceptInvitation = async (invitationId: string): Promise<void> => {
    await acceptInvitationOriginal(invitationId);
  };

  // Wrap the rejectInvitation function to match the expected return type
  const rejectInvitation = async (invitationId: string): Promise<void> => {
    await rejectInvitationOriginal(invitationId);
  };

  const value: CollaborationContextType = {
    collaborators: liveCollaborators, // Use the live list with presence info
    invitations,
    pendingInvitations,
    isLoading,
    isOnline,
    inviteCollaborator,
    acceptInvitation,
    rejectInvitation,
    updateCursorPosition
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
