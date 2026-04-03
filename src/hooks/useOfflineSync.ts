
import { useEffect } from 'react';
import { useSyncStatus } from '@/contexts/SyncStatusContext';

/**
 * Thin wrapper that activates the sync flush whenever the app comes back online.
 * The real flush logic lives in SyncStatusContext.triggerSync() so it can be
 * called from anywhere (manual button, reconnect event, etc.).
 */
export const useOfflineSync = () => {
  const { isOnline, triggerSync } = useSyncStatus();

  // Kick off a sync attempt whenever isOnline flips to true.
  // The context also does this via the 'online' window event, but this hook
  // provides an additional safety net for components that mount after reconnect.
  useEffect(() => {
    if (isOnline) {
      triggerSync();
    }
  }, [isOnline, triggerSync]);

  return { triggerSync };
};
