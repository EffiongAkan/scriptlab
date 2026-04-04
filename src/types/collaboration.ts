
// Collaboration related types
export type Collaborator = {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  status: 'online' | 'offline';
  lastActiveAt?: string;
  /** Stable color hex for this collaborator (derived from their ID) */
  color?: string;
  cursor?: {
    elementId: string;
    position: number;
  };
  /** ID of the element this collaborator is currently actively typing in */
  editingElementId?: string;
};

export type Invitation = {
  id: string;
  scriptId: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
};

// Database table types mapped to our domain types
export type ScriptCollaborator = {
  id: string;
  script_id: string;
  user_id: string;
  created_at: string;
  profiles: {
    id: string;
    username: string | null;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
};

export type ScriptInvitation = {
  id: string;
  script_id: string;
  inviter_id: string;
  inviter_email: string;
  invitee_email: string;
  invitee_id?: string;
  status: string;
  created_at: string;
};

// Types for the presence tracking system
export type PresenceUserState = {
  user_id: string;
  username: string;
  cursor?: {
    elementId: string;
    position: number;
  };
  /** ID of the element this user is actively typing in */
  editingElementId?: string;
};

export interface PresenceStateEntry {
  presence_ref: string;
  user_id?: string;
  username?: string;
  cursor?: {
    elementId: string;
    position: number;
  };
  editingElementId?: string;
}
