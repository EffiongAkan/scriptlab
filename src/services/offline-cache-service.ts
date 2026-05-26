import { supabase } from '@/integrations/supabase/client';
import { db } from '@/db/offline-db';

export const cacheUserScriptsOffline = async (userId: string) => {
  if (!window.navigator.onLine) return;

  try {
    console.log('[OfflineCache] Starting background sync for user scripts...');

    // 1. Fetch all scripts for user
    const { data: scripts, error: scriptsError } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', userId);

    if (scriptsError || !scripts) throw scriptsError;

    // Cache scripts to Dexie
    const offlineScripts = scripts.map(s => ({
      ...s,
      syncStatus: 'synced' as const
    }));
    await db.scripts.bulkPut(offlineScripts as any[]);

    // 2. Fetch elements for scripts
    // Fetch pending operations to avoid overwriting un-synced local changes
    const pendingOps = await db.sync_queue
      .where('table')
      .equals('script_elements')
      .toArray();
      
    const pendingElementIds = new Set(
      pendingOps.map(op => {
        if (!op.data) return [];
        return Array.isArray(op.data) ? op.data.map(d => d.id) : [op.data.id];
      }).flat().filter(Boolean)
    );

    // Process scripts sequentially to avoid overwhelming the network/DB
    for (const script of scripts) {
      // Use pagination or fetch all if not too many
      let allData: any[] = [];
      let page = 0;
      const CHUNK_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: elements, error: elementsError } = await supabase
          .from('script_elements')
          .select('*')
          .eq('script_id', script.id)
          .order('position', { ascending: true })
          .range(page * CHUNK_SIZE, (page + 1) * CHUNK_SIZE - 1);

        if (elementsError || !elements) {
          console.warn(`[OfflineCache] Failed to fetch elements for script ${script.id}`);
          hasMore = false;
          break;
        }

        allData = [...allData, ...elements];
        if (elements.length < CHUNK_SIZE) {
          hasMore = false;
        } else {
          page++;
        }
      }

      const offlineElements = allData.map(el => ({
        ...el,
        syncStatus: 'synced' as const
      }));

      // Filter out elements that have pending local changes
      const elementsToCache = offlineElements.filter(el => !pendingElementIds.has(el.id));

      await db.transaction('rw', db.script_elements, async () => {
        // Find existing elements for this script
        const existingIds = await db.script_elements.where('script_id').equals(script.id).primaryKeys();
        
        // Delete existing elements that don't have pending changes (to clean up deleted ones)
        const idsToDelete = existingIds.filter(id => !pendingElementIds.has(id as string));
        await db.script_elements.bulkDelete(idsToDelete as string[]);
        
        // Insert fresh elements
        await db.script_elements.bulkPut(elementsToCache as any[]);
      });
    }

    console.log(`[OfflineCache] Background sync complete. Cached ${scripts.length} scripts.`);
  } catch (error) {
    console.error('[OfflineCache] Background sync failed:', error);
  }
};
