
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
  /** Timeout that clears the user's own editingElementId after inactivity */
  const editingClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Local presence state tracking to avoid stomping on each other
  const localCursorRef = useRef<{ elementId: string; position: number } | null>(null);
  const localEditingElementRef = useRef<string | null>(null);
  
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

              // Carry the active editing element (clears itself server-side when presence updates)
              if (entry.editingElementId) {
                userState.editingElementId = entry.editingElementId;
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
    // Derive stable per-user colors (consistent across re-renders)
    const COLLAB_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorForUser = (userId: string) => {
      const index = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return COLLAB_COLORS[index % COLLAB_COLORS.length];
    };

    setCollaborators(prev => {
      // 1. Map existing collaborators to update their status
      const updatedKnown = prev.map(collaborator => {
        const onlineMatch = onlineUsers.find(user => user.user_id === collaborator.id);
        return onlineMatch
          ? {
            ...collaborator,
            status: 'online' as const,
            color: colorForUser(collaborator.id),
            cursor: onlineMatch.cursor,
            editingElementId: onlineMatch.editingElementId,
          }
          : {
            ...collaborator,
            status: 'offline' as const,
            color: colorForUser(collaborator.id),
            cursor: undefined,
            editingElementId: undefined,
          };
      });

      // 2. Find online users who are NOT in the known collaborators list
      const unknownOnline = onlineUsers.filter(onlineUser =>
        !prev.some(known => known.id === onlineUser.user_id)
      );

      const newCollaborators = unknownOnline.map(user => ({
        id: user.user_id,
        username: user.username || 'Anonymous',
        email: '',
        status: 'online' as const,
        color: colorForUser(user.user_id),
        cursor: user.cursor,
        editingElementId: user.editingElementId,
      }));

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

  /**
   * Centralized helper to synchronize local presence state to the Supabase channel.
   * This merges cursor position and active editing status into a single atomic update.
   */
  const syncPresence = useCallback(async () => {
    try {
      if (!scriptId || !isValidUuid(scriptId) || !channelRef.current) return;

      const userProfile = await getUserProfile();
      if (!userProfile) return;

      await channelRef.current.track({
        user_id: userProfile.userId,
        username: userProfile.username,
        cursor: localCursorRef.current,
        editingElementId: localEditingElementRef.current,
        last_seen: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing presence:', error);
    }
  }, [scriptId, getUserProfile]);

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
                variant: "default"
              });
            }
          });
        })
        .subscribe(async (status) => {
          if (status !== 'SUBSCRIBED') return;

          console.log('UseCollaboratorPresence: Subscribed to channel, tracking presence for:', userProfile.username);

          // Set initial presence using the centralized sync
          await syncPresence();
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
    localCursorRef.current = { elementId, position };
    await syncPresence();
  }, [syncPresence]);

  const lastBroadcastTimeRef = useRef<number>(0);

  /**
   * Broadcast that the current user is actively typing in a specific element.
   * The highlight auto-clears after 3 seconds of inactivity.
   */
  const broadcastEditActivity = useCallback(async (elementId: string) => {
    try {
      if (!scriptId || !isValidUuid(scriptId) || !channelRef.current) return;

      const userProfile = await getUserProfile();
      if (!userProfile) return;

      // Update local state
      localEditingElementRef.current = elementId;

      // Throttle broadcast updates to at most once per second
      const now = Date.now();
      if (now - lastBroadcastTimeRef.current < 1000) {
        // Reset clear timeout even if we don't broadcast, to keep it alive
        if (editingClearTimeoutRef.current) {
          clearTimeout(editingClearTimeoutRef.current);
        }
        editingClearTimeoutRef.current = setTimeout(async () => {
          localEditingElementRef.current = null;
          await syncPresence();
        }, 3000);
        return;
      }

      lastBroadcastTimeRef.current = now;

      // Synchronize entire state (cursor + newly set editing element)
      await syncPresence();

      // Auto-clear editing highlight after 3 seconds of inactivity
      if (editingClearTimeoutRef.current) {
        clearTimeout(editingClearTimeoutRef.current);
      }
      editingClearTimeoutRef.current = setTimeout(async () => {
        localEditingElementRef.current = null;
        await syncPresence();
      }, 3000);
    } catch (error) {
      console.error('Error broadcasting edit activity:', error);
    }
  }, [scriptId, getUserProfile, syncPresence]);

  return { collaborators, updateCursorPosition, broadcastEditActivity };
};
