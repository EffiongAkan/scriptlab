
/**
 * Utility to manage localStorage quota and cleanup legacy data.
 * This is critical to prevent QuotaExceededError which can block Supabase Auth.
 */
export const cleanupLegacyStorage = () => {
  try {
    const keysToRemove: string[] = [];
    
    // Identify legacy script backup keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('scriptBackup_') || key.startsWith('sb-backup-'))) {
        keysToRemove.push(key);
      }
    }

    if (keysToRemove.length > 0) {
      console.log(`[StorageCleanup] Removing ${keysToRemove.length} legacy backup keys from localStorage...`);
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('[StorageCleanup] Cleanup complete.');
    }

    // Check for other large non-essential data
    const plotData = localStorage.getItem('plotGeneratorData');
    if (plotData && plotData.length > 1000000) { // > 1MB
      console.warn('[StorageCleanup] plotGeneratorData is very large, consider clearing if issues persist');
    }

  } catch (error) {
    console.error('[StorageCleanup] Error during storage cleanup:', error);
  }
};

/**
 * Safely set an item in localStorage with error handling.
 */
export const safeSetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('[StorageCleanup] Quota exceeded! Attempting emergency cleanup...');
      cleanupLegacyStorage();
      
      // Retry once after cleanup
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.error('[StorageCleanup] Retry failed even after cleanup.');
        return false;
      }
    }
    return false;
  }
};
