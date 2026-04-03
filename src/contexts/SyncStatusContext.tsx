
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/db/offline-db';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
  clearQueue: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | undefined>(undefined);

/**
 * Strip a script_element to only the fields the DB RPC and upsert expect.
 * Removes Dexie-only fields (syncStatus, updated_at) that Supabase rejects.
 */
const sanitizeElement = (el: any) => ({
  id: el.id,
  script_id: el.script_id,
  type: el.type,
  content: el.content ?? '',
  position: typeof el.position === 'number' ? el.position : 0,
});

/**
 * Strip a scripts metadata payload to only safe DB columns.
 */
const sanitizeScript = (data: any): Record<string, any> => {
  const clean: Record<string, any> = {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
  };
  if (data.description !== undefined) clean.description = data.description;
  if (data.genre !== undefined) clean.genre = data.genre;
  if (data.language !== undefined) clean.language = data.language;
  return clean;
};

export const SyncStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();
  const isSyncingRef = useRef(false);

  const updatePendingCount = useCallback(async () => {
    const count = await db.sync_queue.count();
    setPendingSyncCount(count);
    return count;
  }, []);

  /** Wipe the entire queue — escape hatch when entries are permanently stuck. */
  const clearQueue = useCallback(async () => {
    await db.sync_queue.clear();
    await updatePendingCount();
    console.log('[SyncStatusContext] Cleared sync queue');
  }, [updatePendingCount]);

  /**
   * Core flush logic. Strategy for script_elements:
   *
   * Problem: The `unique_script_position` constraint is DEFERRABLE but individual
   * upserts still race each other (even in parallel), causing 23505 violations when
   * positions overlap mid-write.
   *
   * Solution: Collect ALL pending element operations per script, build the full
   * authoritative ordered list, then call `sync_script_elements_bulk` RPC once per
   * script. The RPC defers the constraint for the entire transaction and handles
   * orphan cleanup atomically — exactly what undo/redo already uses.
   *
   * For deletes: mark the element absent from the full list so the RPC orphan-cleanup
   * step moves it out of the way (or we issue a targeted delete after the bulk upsert).
   */
  const triggerSync = useCallback(async () => {
    if (!window.navigator.onLine || isSyncingRef.current) return;

    const operations = await db.sync_queue.toArray();
    if (operations.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    console.log(`[SyncStatusContext] Starting sync flush: ${operations.length} operations`);

    let successCount = 0;
    let failCount = 0;

    // ─── Pass 1: Script metadata (sequential, order-sensitive) ────────────────
    const scriptOps = operations.filter(op => op.table === 'scripts');
    for (const op of scriptOps) {
      try {
        if (op.action === 'upsert') {
          const { error } = await supabase
            .from('scripts')
            .upsert(sanitizeScript(op.data), { onConflict: 'id' });
          if (error) throw error;
        }
        if (op.id !== undefined) await db.sync_queue.delete(op.id);
        successCount++;
      } catch (err: any) {
        console.error('[SyncStatusContext] Script metadata sync failed:', err?.message, 'code:', err?.code, 'op:', op);
        failCount++;
      }
    }

    // ─── Pass 2: Script elements — grouped by script_id, synced via RPC ──────
    //
    // We build a map: scriptId → { latestElementMap, idsToDelete, opIds }
    // The latestElementMap holds the "winning" (most recent) version of each
    // element, using the queue timestamp to resolve conflicts.
    const elementOps = operations.filter(op => op.table === 'script_elements');

    interface ScriptBatch {
      // Map of element id → sanitized element (latest wins)
      elements: Map<string, any>;
      // Set of element ids to delete
      deletes: Set<string>;
      // Queue row IDs to delete after success
      opIds: (number | undefined)[];
    }

    const batchByScript = new Map<string, ScriptBatch>();

    for (const op of elementOps) {
      // Each op's data is either a single element or an array
      const rawItems: any[] = Array.isArray(op.data) ? op.data : [op.data];

      for (const raw of rawItems) {
        const scriptId: string = raw?.script_id;
        if (!scriptId) continue;

        if (!batchByScript.has(scriptId)) {
          batchByScript.set(scriptId, { elements: new Map(), deletes: new Set(), opIds: [] });
        }
        const batch = batchByScript.get(scriptId)!;

        if (op.action === 'delete') {
          batch.deletes.add(raw.id);
          // Remove from upsert map if we had previously added it
          batch.elements.delete(raw.id);
        } else {
          // upsert — later queue entry (higher timestamp) wins
          const existing = batch.elements.get(raw.id);
          if (!existing || op.timestamp > (existing._ts ?? 0)) {
            const clean = sanitizeElement(raw);
            batch.elements.set(raw.id, { ...clean, _ts: op.timestamp });
          }
        }
      }

      // Track the queue row ID regardless of element type
      if (op.id !== undefined) {
        const scriptId = rawItems[0]?.script_id;
        if (scriptId && batchByScript.has(scriptId)) {
          batchByScript.get(scriptId)!.opIds.push(op.id);
        }
      }
    }

    // Now flush each script's batch via the bulk RPC
    const batchPromises = Array.from(batchByScript.entries()).map(async ([scriptId, batch]) => {
      try {
        // Build ordered payload — strip internal _ts field before sending
        const elementsArray = Array.from(batch.elements.values())
          .filter(el => !batch.deletes.has(el.id))
          .map(({ _ts, ...el }) => el);

        // Perform targeted deletes first (so the RPC doesn't re-introduce them as orphans)
        if (batch.deletes.size > 0) {
          const { error: delErr } = await supabase
            .from('script_elements')
            .delete()
            .in('id', Array.from(batch.deletes));
          if (delErr) {
            console.warn('[SyncStatusContext] Targeted element deletes failed:', delErr?.message);
            // Non-fatal — continue with the upsert
          }
        }

        if (elementsArray.length > 0) {
          // Sort by position so the RPC receives them in the right order
          elementsArray.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

          console.log(`[SyncStatusContext] Bulk syncing ${elementsArray.length} elements for script ${scriptId} via RPC`);

          const { error } = await supabase.rpc('sync_script_elements_bulk', {
            p_script_id: scriptId,
            p_elements: elementsArray,
          });

          if (error) {
            console.error(
              '[SyncStatusContext] RPC bulk sync failed:',
              err?.message ?? error?.message,
              '| code:', error?.code,
              '| details:', error?.details,
              '| hint:', error?.hint
            );
            throw error;
          }
        }

        // All good — remove these ops from the queue
        await Promise.all(
          batch.opIds
            .filter((id): id is number => id !== undefined)
            .map(id => db.sync_queue.delete(id))
        );

        return { success: true, count: elementsArray.length + batch.deletes.size };
      } catch (err: any) {
        console.error('[SyncStatusContext] Script batch sync failed for', scriptId, ':', err?.message ?? err);
        return { success: false, count: 0 };
      }
    });

    const results = await Promise.all(batchPromises);
    results.forEach(r => {
      if (r.success) successCount += r.count;
      else failCount++;
    });

    const remaining = await updatePendingCount();

    isSyncingRef.current = false;
    setIsSyncing(false);

    const totalOps = operations.length;
    if (failCount > 0 && successCount === 0) {
      toast({
        title: 'Sync Failed',
        description: 'Could not upload offline changes. Check your connection and try again.',
        variant: 'destructive',
      });
    } else if (failCount > 0) {
      toast({
        title: 'Sync Warning',
        description: `Synced ${successCount} change${successCount !== 1 ? 's' : ''}. Some failed — will retry.`,
        variant: 'destructive',
      });
    } else if (successCount > 0 && totalOps >= 3) {
      toast({
        title: 'Back Online — Synced',
        description: `${successCount} offline change${successCount !== 1 ? 's' : ''} saved to the cloud.`,
      });
    }

    console.log(`[SyncStatusContext] Sync complete: ${successCount} synced, ${failCount} script(s) failed, ${remaining} remaining in queue`);
  }, [toast, updatePendingCount]);

  const updateOnlineStatus = useCallback(() => {
    const online = window.navigator.onLine;
    setIsOnline(online);
    if (online) {
      console.log('[SyncStatusContext] Network restored — triggering sync...');
      triggerSync();
    }
  }, [triggerSync]);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updatePendingCount();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus, updatePendingCount]);

  useEffect(() => {
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return (
    <SyncStatusContext.Provider value={{ isOnline, isSyncing, pendingSyncCount, triggerSync, clearQueue }}>
      {children}
    </SyncStatusContext.Provider>
  );
};

export const useSyncStatus = () => {
  const context = useContext(SyncStatusContext);
  if (context === undefined) {
    throw new Error('useSyncStatus must be used within a SyncStatusProvider');
  }
  return context;
};
