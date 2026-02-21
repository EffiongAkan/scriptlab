import { useState, useRef, useEffect, useCallback } from "react";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { useScriptRealtime } from "@/hooks/useScriptRealtime";

export const useLocalElementState = (
  scriptId: string,
  initialElements: ScriptElementType[]
) => {
  const [localElements, setLocalElements] = useState<ScriptElementType[]>([]);
  const [useLocalElements, setUseLocalElements] = useState(false);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [dirtyElementIds, setDirtyElementIds] = useState<Set<string>>(new Set());

  const localElementsRef = useRef<ScriptElementType[]>([]);
  const previousScriptIdRef = useRef<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backupIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // CRITICAL FIX: Track user edits separately from system syncs
  const lastUserEditRef = useRef<number>(0);
  const dirtyTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const { toast } = useToast();

  // Internalize Realtime Hook with Dirty Element Filtering
  // We pass the list of dirty IDs to the realtime hook so it can ignore updates for them
  // Array.from is used because the hook expects an array
  const realtimeElements = useScriptRealtime(scriptId, initialElements, Array.from(dirtyElementIds));

  // Helper to mark an element as dirty (being edited)
  const markElementDirty = useCallback((id: string) => {
    // Clear existing timeout for this element
    if (dirtyTimeoutsRef.current.has(id)) {
      clearTimeout(dirtyTimeoutsRef.current.get(id));
    }

    setDirtyElementIds(prev => {
      // Only trigger state update if not already dirty to avoid re-renders
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

    // Set timeout to clear dirty status after 5 seconds of inactivity on this element
    // This assumes that if no edits happen for 5s, the server has likely caught up
    const timeout = setTimeout(() => {
      setDirtyElementIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      dirtyTimeoutsRef.current.delete(id);
    }, 5000);

    dirtyTimeoutsRef.current.set(id, timeout);
  }, []);

  // Performance: Memoized element comparison
  const elementsAreEqual = useCallback((arr1: ScriptElementType[], arr2: ScriptElementType[]) => {
    if (arr1.length !== arr2.length) return false;

    return arr1.every((el1, index) => {
      const el2 = arr2[index];
      return el1.id === el2.id &&
        el1.content === el2.content &&
        el1.type === el2.type &&
        el1.position === el2.position;
    });
  }, []);

  // Reset local state when script changes
  useEffect(() => {
    if (scriptId !== previousScriptIdRef.current) {
      console.log("Script ID changed, resetting optimized local state");
      setLocalElements([]);
      localElementsRef.current = [];
      setUseLocalElements(false);
      setLastSyncTimestamp(Date.now());
      lastUserEditRef.current = 0; // Reset user edit timer
      previousScriptIdRef.current = scriptId;
      setDirtyElementIds(new Set());
      dirtyTimeoutsRef.current.forEach(t => clearTimeout(t));
      dirtyTimeoutsRef.current.clear();

      // Clear any pending operations
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    }
  }, [scriptId]);

  // Optimized initialization with loaded elements
  useEffect(() => {
    if (initialElements && initialElements.length > 0) {
      console.log("Initializing with loaded elements:", initialElements.length);

      // Only update if there's a meaningful difference
      if (!elementsAreEqual(localElementsRef.current, initialElements)) {
        console.log("Setting initial elements with optimizations and sorting");
        const elementsWithValidation = initialElements
          .map(el => ({
            ...el,
            content: el.content || '' // Ensure content is never null
          }))
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

        setLocalElements(elementsWithValidation);
        localElementsRef.current = elementsWithValidation;
        setLastSyncTimestamp(Date.now());
        setUseLocalElements(false); // PRIORITY: Always trust database data over local/stale state
      }
    } else if (initialElements && initialElements.length === 0) {
      console.log("Received empty initial elements array");
      if (localElements.length === 0) {
        setLocalElements([]);
        localElementsRef.current = [];
        setLastSyncTimestamp(Date.now());
      }
    }
  }, [initialElements, realtimeElements, localElements.length, elementsAreEqual]);

  // Smart realtime elements synchronization with intelligent change detection
  // This allows legitimate updates (new elements, undo/redo, tab switches) while blocking echo updates
  useEffect(() => {
    if (!realtimeElements || realtimeElements.length === 0) return;

    const currentJSON = JSON.stringify(localElementsRef.current);
    const realtimeJSON = JSON.stringify(realtimeElements);

    // Skip if content is identical
    if (currentJSON === realtimeJSON) {
      return;
    }

    // Detect MEANINGFUL changes that should trigger sync:
    // 1. Element count changed (new element added or deleted)
    // 2. User has been idle for 3+ seconds (safe to sync)
    // 3. Significant content difference (not just echo)

    const elementCountChanged = localElementsRef.current.length !== realtimeElements.length;
    const TIME_TO_IGNORE_REALTIME_AFTER_USER_EDIT = 3000; // 3 seconds
    const userIsIdle = Date.now() - lastUserEditRef.current >= TIME_TO_IGNORE_REALTIME_AFTER_USER_EDIT;

    // PROTECTION: If user is actively editing, simple content updates OR structural changes
    // might be "echoes" or stale data vs our local optimistic state.
    // We MUST ignore them until the user is idle to prevent overwriting local work.

    // NOTE: With dirty element tracking, we have finer-grained control, but the global idle check
    // is still a good fallback for structural changes (insert/delete) where strict ID matching might fail.
    if (!userIsIdle) {
      console.log("Ignoring realtime update: user is actively editing");
      return;
    }

    // User is idle - safe to sync if content actually changed
    // This handles both content updates AND structural changes (new/deleted elements)
    // from other users or delayed echoes.
    console.log("User idle: syncing with realtime data");
    const validatedElements = realtimeElements.map(el => ({
      ...el,
      content: el.content || ''
    }));

    setLocalElements(validatedElements);
    localElementsRef.current = validatedElements;
    setUseLocalElements(false);
    setLastSyncTimestamp(Date.now());
  }, [realtimeElements, lastSyncTimestamp]);

  // Optimized local element update with conflict resolution
  const updateLocalElement = useCallback((id: string, content: string) => {
    const sanitizedContent = content || '';

    const elementToUpdate = localElements.find(el => el.id === id);
    if (!elementToUpdate) {
      console.warn(`Element with id ${id} not found in local elements`);
      return null;
    }

    // Update user edit timestamp to enable the guard
    lastUserEditRef.current = Date.now();

    // Mark element as dirty
    markElementDirty(id);

    // Optimistic update with change tracking
    setLocalElements(prev => {
      const updated = prev.map(el =>
        el.id === id ? { ...el, content: sanitizedContent } : el
      );
      localElementsRef.current = updated;
      setLastSyncTimestamp(Date.now());
      return updated;
    });

    // Mark as using local elements for conflict resolution
    setUseLocalElements(true);

    return {
      ...elementToUpdate,
      content: sanitizedContent
    };
  }, [localElements, markElementDirty]);

  // Update element type locally
  const changeLocalElementType = useCallback((id: string, type: ScriptElementType['type']) => {
    const elementToUpdate = localElements.find(el => el.id === id);
    if (!elementToUpdate) {
      console.warn(`Element with id ${id} not found in local elements`);
      return null;
    }

    lastUserEditRef.current = Date.now();
    markElementDirty(id);

    setLocalElements(prev => {
      const updated = prev.map(el =>
        el.id === id ? { ...el, type } : el
      );
      localElementsRef.current = updated;
      setLastSyncTimestamp(Date.now());
      return updated;
    });

    setUseLocalElements(true);

    return {
      ...elementToUpdate,
      type
    };
  }, [localElements, markElementDirty]);

  // Delete element from local state
  const deleteLocalElement = useCallback((id: string) => {
    const elementToDelete = localElements.find(el => el.id === id);
    if (!elementToDelete) {
      console.warn(`Element with id ${id} not found in local elements`);
      return false;
    }

    // Update user edit timestamp
    lastUserEditRef.current = Date.now();
    markElementDirty(id); // Keep it dirty even if deleting (so we ignore resurrection echoes)

    // Remove element from local state
    setLocalElements(prev => {
      const filtered = prev.filter(el => el.id !== id);
      // Reindex positions
      const reindexed = filtered.map((el, index) => ({
        ...el,
        position: index
      }));
      localElementsRef.current = reindexed;
      setLastSyncTimestamp(Date.now());
      return reindexed;
    });

    // Mark as using local elements
    setUseLocalElements(true);

    return true;
  }, [localElements, markElementDirty]);

  // Batch delete local elements
  const deleteLocalElements = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return false;

    // Update user edit timestamp
    lastUserEditRef.current = Date.now();

    // Mark all as dirty
    ids.forEach(id => markElementDirty(id));

    // Remove elements from local state
    setLocalElements(prev => {
      const filtered = prev.filter(el => !ids.includes(el.id));
      // Reindex positions
      const reindexed = filtered.map((el, index) => ({
        ...el,
        position: index
      }));
      localElementsRef.current = reindexed;
      setLastSyncTimestamp(Date.now());
      return reindexed;
    });

    // Mark as using local elements
    setUseLocalElements(true);

    return true;
  }, [markElementDirty]);

  // Insert element at specific index and reindex all positions, returning the actual inserted element with its correct position
  const addLocalElement = useCallback((element: ScriptElementType, insertIndex: number = -1) => {
    const sanitizedElement = {
      ...element,
      content: element.content || '',
      position: 0, // will be re-assigned below
    };

    let insertedElement: ScriptElementType | null = null;

    // Update user edit timestamp
    lastUserEditRef.current = Date.now();
    markElementDirty(sanitizedElement.id);

    setLocalElements(prev => {
      // Defensive: if element exists, do not insert again!
      if (prev.some(e => e.id === sanitizedElement.id)) {
        insertedElement = prev.find(e => e.id === sanitizedElement.id) || null;
        return prev;
      }
      let newElements = [...prev];
      // Clamp index
      let idx = insertIndex;
      if (idx < 0) idx = newElements.length;
      if (idx > newElements.length) idx = newElements.length;
      newElements.splice(idx, 0, sanitizedElement);

      // Reassign positions
      newElements = newElements.map((el, i) => ({
        ...el,
        position: i
      }));

      // Set returned insertedElement to correct re-positioned version
      insertedElement = newElements.find(el => el.id === sanitizedElement.id) || null;

      localElementsRef.current = newElements;
      setLastSyncTimestamp(Date.now());
      return newElements;
    });

    setUseLocalElements(true);

    // Return the element with real assigned position
    return insertedElement;
  }, [markElementDirty]);

  const blockRealtimeSync = useCallback((duration: number = 2000) => {
    console.log(`Blocking realtime sync for ${duration}ms`);
    lastUserEditRef.current = Date.now() + duration; // Set into future to block for longer
  }, []);

  // Enhanced backup system with compression
  useEffect(() => {
    if (scriptId && localElements.length > 0) {
      // Clear existing backup interval
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }

      // Set up periodic backup (every 30 seconds)
      backupIntervalRef.current = setInterval(() => {
        try {
          const backupData = {
            elements: localElements,
            timestamp: Date.now(),
            version: '2.0' // Backup format version
          };

          localStorage.setItem(`scriptBackup_${scriptId}`, JSON.stringify(backupData));
          console.log(`Enhanced backup: ${localElements.length} elements`);
        } catch (e) {
          console.error('Failed to create enhanced backup:', e);
        }
      }, 30000);
    }

    return () => {
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
    };
  }, [localElements, scriptId]);

  // Enhanced backup restoration
  useEffect(() => {
    if (scriptId && (!initialElements || initialElements.length === 0) && localElements.length === 0) {
      try {
        const backup = localStorage.getItem(`scriptBackup_${scriptId}`);
        if (backup) {
          const parsedBackup = JSON.parse(backup);

          // Handle both old and new backup formats
          const elements = parsedBackup.elements || parsedBackup;
          const backupTimestamp = parsedBackup.timestamp || 0;

          if (Array.isArray(elements) && elements.length > 0) {
            // Check if backup is recent (within 24 hours)
            const isRecentBackup = Date.now() - backupTimestamp < 24 * 60 * 60 * 1000;

            console.log(`Restoring enhanced backup: ${elements.length} elements (recent: ${isRecentBackup})`);

            // SORT BACKUP before restoring
            const sortedBackup = [...elements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

            setLocalElements(sortedBackup);
            localElementsRef.current = sortedBackup;
            setUseLocalElements(true);
            setLastSyncTimestamp(backupTimestamp);

            toast({
              title: "Backup Restored",
              description: `Recovered ${elements.length} elements from ${isRecentBackup ? 'recent' : 'older'} backup. Please save to secure your changes.`,
              duration: 6000,
            });
          }
        }
      } catch (e) {
        console.error('Error restoring enhanced backup:', e);
      }
    }
  }, [scriptId, initialElements, localElements.length, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (backupIntervalRef.current) {
        clearInterval(backupIntervalRef.current);
      }
      dirtyTimeoutsRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Performance metrics for development
  const getPerformanceMetrics = useCallback(() => {
    return {
      localElementsCount: localElements.length,
      lastSyncAgo: Date.now() - lastSyncTimestamp,
      isUsingLocal: useLocalElements,
      backupAvailable: !!localStorage.getItem(`scriptBackup_${scriptId}`)
    };
  }, [localElements.length, lastSyncTimestamp, useLocalElements, scriptId]);

  return {
    localElements,
    realtimeElements, // Expose for useScriptContentState's own logic
    useLocalElements,
    setUseLocalElements,
    updateLocalElement,
    changeLocalElementType,
    deleteLocalElement,
    deleteLocalElements,
    addLocalElement,
    setAllElements: (elements: ScriptElementType[]) => {
      // Always ensure elements are sorted by position before setting
      const sortedElements = [...elements].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setLocalElements(sortedElements);
      localElementsRef.current = sortedElements;
      setUseLocalElements(true);
      setLastSyncTimestamp(Date.now());
      lastUserEditRef.current = Date.now(); // CRITICAL: Mark as user edit to prevent realtime override
    },
    blockRealtimeSync,
    performanceMetrics: getPerformanceMetrics(),
    lastSyncTimestamp
  };
};
