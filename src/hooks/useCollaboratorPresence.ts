
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator, PresenceStateEntry, PresenceUserState } from '@/types/collaboration';
import { isValidUuid } from '@/utils/validationUtils';
import { useToast } from '@/hooks/use-toast';

export const useCollaboratorPresence = (scriptId: string, initialCollaborators: Collaborator[]) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initialCollaborators);
  const channelRef = useRef<any>(null);
  const userProfileRef = useRef<{ username: string; userId: string } | null>(null);
  const presenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Optimized presence state processing
  const processPresenceState = useCallback((newState: any): PresenceUserState[] => {
    const onlineUsers: PresenceUserState[] = [];

    // newState is an object where keys are the presence keys (e.g. 'user_presence')
    // and values are arrays of presence objects for that key
    if (newState && typeof newState === 'object') {
      Object.keys(newState).forEach(key => {
        const stateArray = newState[key];

        if (Array.isArray(stateArray)) {
          stateArray.forEach(stateItem => {
            // stateItem contains the data we tracked, plus a presence_ref
            // We need to handle potential different structures based on Supabase version
            const entry = stateItem as PresenceStateEntry;

            if (entry?.user_id && entry?.username) {
              // Check if user is already in the list (avoid duplicates from multiple tabs)
              const existingIndex = onlineUsers.findIndex(u => u.user_id === String(entry.user_id));

              const userState: PresenceUserState = {
                user_id: String(entry.user_id),
                username: String(entry.username),
              };

              if (entry.cursor) {
                userState.cursor = {
                  elementId: entry.cursor.elementId,
                  position: entry.cursor.position
                };
              }

              if (existingIndex >= 0) {
                // Update existing user with latest info (e.g., cursor) 
                // Using the most recent presence usually preferred
                onlineUsers[existingIndex] = userState;
              } else {
                onlineUsers.push(userState);
              }
            }
          });
        }
      });
    }

    return onlineUsers;
  }, []);

  // Optimized collaborator status update
  const updateCollaboratorStatus = useCallback((onlineUsers: PresenceUserState[]) => {
    setCollaborators(prev => {
      // 1. Map existing collaborators to update their status
      const updatedKnown = prev.map(collaborator => {
        const onlineMatch = onlineUsers.find(user => user.user_id === collaborator.id);
        return onlineMatch
          ? {
            ...collaborator,
            status: 'online' as const,
            cursor: onlineMatch.cursor
          }
          : {
            ...collaborator,
            status: 'offline' as const,
            cursor: undefined
          };
      });

      // 2. Find online users who are NOT in the known collaborators list
      // (e.g. the owner if not explicitly in collaborators table, or new users)
      const unknownOnline = onlineUsers.filter(onlineUser =>
        !prev.some(known => known.id === onlineUser.user_id)
      );

      const newCollaborators = unknownOnline.map(user => ({
        id: user.user_id,
        username: user.username || 'Anonymous',
        email: '', // We might not know the email from presence alone
        status: 'online' as const,
        cursor: user.cursor
      }));

      // Return combined list
      return [...updatedKnown, ...newCollaborators];
    });
  }, []);

  // Debounced presence sync to avoid excessive updates
  const debouncedPresenceSync = useCallback((newState: any) => {
    if (presenceTimeoutRef.current) {
      clearTimeout(presenceTimeoutRef.current);
    }

    presenceTimeoutRef.current = setTimeout(() => {
      const onlineUsers = processPresenceState(newState);
      updateCollaboratorStatus(onlineUsers);
    }, 100); // 100ms debounce
  }, [processPresenceState, updateCollaboratorStatus]);

  // Get user profile data once and cache it
  const getUserProfile = useCallback(async () => {
    if (userProfileRef.current) {
      return userProfileRef.current;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    const username = data?.username || session.user.email?.split('@')[0] || 'Anonymous';

    userProfileRef.current = {
      username,
      userId: session.user.id
    };

    return userProfileRef.current;
  }, []);

  // Setup presence channel with optimizations
  useEffect(() => {
    if (!scriptId || !isValidUuid(scriptId)) {
      console.log('Invalid or missing scriptId for presence:', scriptId);
      return;
    }

    // Cleanup previous channel
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    const setupPresence = async () => {
      const userProfile = await getUserProfile();
      if (!userProfile) return;

      // Create optimized channel with presence configuration
      const channel = supabase.channel(`presence:script:${scriptId}`, {
        config: {
          presence: {
            key: 'user_presence',
          },
          broadcast: {
            self: false // Don't broadcast to self
          }
        },
      });

      channelRef.current = channel;

      const subscription = channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          debouncedPresenceSync(newState);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          console.log('User joined:', newPresences);
          newPresences.forEach((presence: any) => {
            // Avoid notifying for self if possible, or duplicates
            if (presence.username && presence.username !== userProfile.username) {
              toast({
                title: "Collaborator Joined",
                description: `${presence.username} is now online`,
                duration: 3000,
              });
            }
          });
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          console.log('User left:', leftPresences);
          leftPresences.forEach((presence: any) => {
            if (presence.username && presence.username !== userProfile.username) {
              toast({
                title: "Collaborator Left",
                description: `${presence.username} went offline`,
                duration: 3000,
                variant: "secondary"
              });
            }
          });
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;

          console.log('UseCollaboratorPresence: Subscribed to channel, tracking presence for:', userProfile.username);

          // Set initial presence
          await channel.track({
            user_id: userProfile.userId,
            username: userProfile.username,
            last_seen: new Date().toISOString()
          });
        });
    };

    setupPresence();

    // Cleanup on unmount or script change
    return () => {
      if (presenceTimeoutRef.current) {
        clearTimeout(presenceTimeoutRef.current);
      }
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [scriptId, debouncedPresenceSync, getUserProfile, toast]);

  // Update collaborators when initial collaborators change
  useEffect(() => {
    setCollaborators(initialCollaborators);
  }, [initialCollaborators]);

  // Optimized cursor position update with throttling
  const updateCursorPosition = useCallback(async (elementId: string, position: number) => {
    try {
      if (!scriptId || !isValidUuid(scriptId) || !channelRef.current) return;

      const userProfile = await getUserProfile();
      if (!userProfile) return;

      // Throttle cursor updates to prevent spam
      await channelRef.current.track({
        user_id: userProfile.userId,
        username: userProfile.username,
        cursor: { elementId, position },
        last_seen: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  }, [scriptId, getUserProfile]);

  return { collaborators, updateCursorPosition };
};
