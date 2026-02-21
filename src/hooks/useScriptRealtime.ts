
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScriptElementType } from './useScriptContent';
import { useToast } from '@/hooks/use-toast';

// Define types for Supabase realtime payloads to fix TypeScript errors
type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: {
    id: string;
    type: string;
    content: string | null;
    position: number | null;
    [key: string]: any;
  } | {};
  old: {
    id: string;
    [key: string]: any;
  } | {};
};


export const useScriptRealtime = (
  scriptId: string,
  initialElements: ScriptElementType[],
  ignoredElementIds: string[] = [] // New prop: IDs to ignore updates for
) => {
  const [elements, setElements] = useState<ScriptElementType[]>([]);
  const initialElementsRef = useRef<ScriptElementType[]>([]);
  const hasLoadedRef = useRef<boolean>(false);
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const subscriptionStatusRef = useRef<string | null>(null);

  // Use a ref for ignored IDs to avoid re-subscribing on every change
  const ignoredIdsRef = useRef(ignoredElementIds);
  useEffect(() => {
    ignoredIdsRef.current = ignoredElementIds;
  }, [ignoredElementIds]);

  // Track when initialElements actually contain data
  useEffect(() => {
    if (initialElements && initialElements.length > 0) {
      console.log("Initial elements received in realtime hook:", initialElements.length);

      // Only overwrite local state if we don't have any elements yet or if we have a new set
      if (!hasLoadedRef.current || JSON.stringify(initialElementsRef.current) !== JSON.stringify(initialElements)) {
        initialElementsRef.current = [...initialElements];
        setElements([...initialElements]);
        hasLoadedRef.current = true;
        console.log("Updated local elements state with initial elements");
      }
    }
  }, [initialElements]);

  // Clean up channel when component unmounts or scriptId changes
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        console.log("Cleaning up realtime subscription");
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        subscriptionStatusRef.current = null;
      }
    };
  }, [scriptId]);

  useEffect(() => {
    // Skip setup if scriptId is invalid or missing
    if (!scriptId || scriptId === '') {
      console.log("No valid scriptId provided to realtime hook");
      return;
    }

    // Clean up existing channel if it exists
    if (channelRef.current) {
      console.log("Removing existing channel before creating a new one");
      supabase.removeChannel(channelRef.current);
    }

    console.log("Setting up stable realtime subscription for script:", scriptId);

    // Create a real-time channel for the specific script
    const channel = supabase
      .channel(`script:${scriptId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'script_elements',
          filter: `script_id=eq.${scriptId}`
        },
        (payload: RealtimePayload) => {
          // Helper to check if we should ignore this update
          const shouldIgnore = (id: string) => ignoredIdsRef.current.includes(id);

          console.log('Realtime update received:', payload.eventType,
            'id' in payload.new ? (payload.new as any).id : 'unknown');

          setElements(currentElements => {
            let updatedElements = [...currentElements];

            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new && 'id' in payload.new) {
                  const newId = (payload.new as any).id;

                  if (shouldIgnore(newId)) {
                    console.log(`Ignoring realtime INSERT for active element: ${newId}`);
                    return currentElements;
                  }

                  if (!updatedElements.some(el => el.id === newId)) {
                    const newElement = {
                      id: newId,
                      type: payload.new['type'] as ScriptElementType['type'],
                      content: payload.new['content'] || '',
                      position: payload.new['position']
                    };
                    updatedElements.push(newElement);
                  }
                }
                break;

              case 'UPDATE':
                if (payload.new && 'id' in payload.new) {
                  const updateId = (payload.new as any).id;

                  if (shouldIgnore(updateId)) {
                    console.log(`Ignoring realtime UPDATE for active element: ${updateId}`);
                    return currentElements;
                  }

                  updatedElements = updatedElements.map(el =>
                    el.id === updateId
                      ? {
                        ...el,
                        content: payload.new['content'] || el.content,
                        type: payload.new['type'] as ScriptElementType['type'] || el.type,
                        position: payload.new['position'] ?? el.position
                      }
                      : el
                  );
                }
                break;

              case 'DELETE':
                if (payload.old && 'id' in payload.old) {
                  const deleteId = (payload.old as any).id;
                  if (shouldIgnore(deleteId)) return currentElements;
                  updatedElements = updatedElements.filter(el => el.id !== deleteId);
                }
                break;
            }

            // CRITICAL: Always sort correctly after any change
            return updatedElements.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
        subscriptionStatusRef.current = status;

        if (status === "SUBSCRIBED") {
          toast({
            title: "Connected",
            description: "Real-time updates enabled",
          });
        } else if (status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          toast({
            title: "Connection issue",
            description: "Real-time updates unavailable",
            variant: "destructive",
          });
        }
      });

    channelRef.current = channel;

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [scriptId, toast]); // scriptId is the correct dependency

  // If we have local elements, return those, otherwise return the initial elements
  return elements.length > 0 ? elements : initialElements;
};
