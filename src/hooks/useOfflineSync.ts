
import { useEffect, useCallback } from 'react';
import { db } from '@/db/offline-db';
import { supabase } from '@/integrations/supabase/client';
import { useSyncStatus } from '@/contexts/SyncStatusContext';
import { useToast } from '@/hooks/use-toast';

export const useOfflineSync = () => {
  const { isOnline, isSyncing, triggerSync } = useSyncStatus();
  const { toast } = useToast();

  const flushSyncQueue = useCallback(async () => {
    if (!isOnline) return;

    const operations = await db.sync_queue.toArray();
    if (operations.length === 0) return;

    console.log(`Starting sync flusher: ${operations.length} operations pending`);
    
    let successCount = 0;
    let failCount = 0;

    for (const op of operations) {
      try {
        if (op.table === 'script_elements') {
          if (op.action === 'upsert') {
            const { error } = await supabase
              .from('script_elements')
              .upsert(op.data, { onConflict: 'id' });
            
            if (error) throw error;
          } else if (op.action === 'delete') {
            const { error } = await supabase
              .from('script_elements')
              .delete()
              .eq('id', op.data.id);
            
            if (error) throw error;
          }
        } else if (op.table === 'scripts') {
           if (op.action === 'upsert') {
            const { error } = await supabase
              .from('scripts')
              .upsert(op.data, { onConflict: 'id' });
            
            if (error) throw error;
          }
        }

        // Remove from queue after success
        if (op.id) await db.sync_queue.delete(op.id);
        successCount++;
      } catch (err) {
        console.error('Sync operation failed:', err, op);
        failCount++;
        // Stop flushing if we hit a serious error to preserve order
        break;
      }
    }

    if (successCount > 0) {
      toast({
        title: "Sync Complete",
        description: `Successfully synchronized ${successCount} changes with the cloud.`,
      });
    }

    if (failCount > 0) {
      toast({
        title: "Sync Warning",
        description: `Failed to sync ${failCount} changes. Will retry later.`,
        variant: "destructive"
      });
    }
  }, [isOnline, toast]);

  useEffect(() => {
    if (isOnline) {
      flushSyncQueue();
    }
  }, [isOnline, flushSyncQueue]);

  return { flushSyncQueue };
};
