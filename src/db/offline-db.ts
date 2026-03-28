
import Dexie, { type Table } from 'dexie';
import { ScriptElementType } from '@/hooks/useScriptContent';

export interface OfflineScript {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  language?: string;
  user_id: string;
  updated_at: string;
  created_at?: string;
  syncStatus: 'synced' | 'pending';
}

export interface OfflineElement extends ScriptElementType {
  script_id: string;
  updated_at: string;
  syncStatus: 'synced' | 'pending';
}

export interface SyncOperation {
  id?: number;
  action: 'upsert' | 'delete';
  table: 'scripts' | 'script_elements';
  data: any;
  timestamp: number;
}

export class ScriptLabOfflineDB extends Dexie {
  scripts!: Table<OfflineScript>;
  script_elements!: Table<OfflineElement>;
  sync_queue!: Table<SyncOperation>;

  constructor() {
    super('ScriptLabOfflineDB');
    this.version(1).stores({
      scripts: 'id, user_id, updated_at, syncStatus',
      script_elements: 'id, script_id, position, updated_at, syncStatus',
      sync_queue: '++id, table, action, timestamp'
    });
  }
}

export const db = new ScriptLabOfflineDB();

// Helper to save current elements to offline DB
export const saveElementsOffline = async (scriptId: string, elements: ScriptElementType[]) => {
  const timestamp = new Date().toISOString();
  const offlineElements: OfflineElement[] = elements.map(el => ({
    ...el,
    script_id: scriptId,
    updated_at: timestamp,
    syncStatus: 'pending'
  }));

  return db.transaction('rw', db.script_elements, async () => {
    // Clear existing for this script to keep it clean (or we could upsert)
    // Upsert is safer for incremental sync but batch save is better for performance
    await db.script_elements.where('script_id').equals(scriptId).delete();
    await db.script_elements.bulkAdd(offlineElements);
  });
};

// Helper to get offline script content
export const getOfflineScriptElements = async (scriptId: string) => {
  return db.script_elements
    .where('script_id')
    .equals(scriptId)
    .sortBy('position');
};
