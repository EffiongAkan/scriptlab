
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '@/db/offline-db';
import { useToast } from '@/hooks/use-toast';

interface SyncStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  triggerSync: () => Promise<void>;
}

const SyncStatusContext = createContext<SyncStatusContextType | undefined>(undefined);

export const SyncStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const { toast } = useToast();

  const updateOnlineStatus = useCallback(() => {
    const online = window.navigator.onLine;
    setIsOnline(online);
    if (online) {
      console.log('Online restored. Triggering sync...');
      triggerSync();
    }
  }, []);

  const updatePendingCount = useCallback(async () => {
    const count = await db.sync_queue.count();
    setPendingSyncCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!window.navigator.onLine || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const pendingCount = await db.sync_queue.count();
      if (pendingCount > 0) {
        console.log(`Flushing sync queue: ${pendingCount} operations`);
        // We'll implement the actual flush logic in useOfflineSync or similar
        // For now, this is a placeholder for the orchestration
      }
    } finally {
      setIsSyncing(false);
      await updatePendingCount();
    }
  }, [isSyncing, updatePendingCount]);

  useEffect(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial count
    updatePendingCount();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [updateOnlineStatus, updatePendingCount]);

  // Periodically check for pending items
  useEffect(() => {
    const interval = setInterval(updatePendingCount, 10000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  return (
    <SyncStatusContext.Provider value={{ isOnline, isSyncing, pendingSyncCount, triggerSync }}>
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
