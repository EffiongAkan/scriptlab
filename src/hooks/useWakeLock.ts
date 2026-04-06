import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to manage the Screen Wake Lock API.
 * Prevents the device from sleeping while 'isEnabled' is true.
 * @param isEnabled - Whether the wake lock should be active.
 */
export function useWakeLock(isEnabled: boolean) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || wakeLockRef.current !== null) return;

    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      console.log('--- WAKE LOCK ACQUIRED ---');
      
      wakeLockRef.current.addEventListener('release', () => {
        console.log('--- WAKE LOCK RELEASED ---');
        wakeLockRef.current = null;
      });
    } catch (err: any) {
      console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isEnabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    return () => {
      releaseWakeLock();
    };
  }, [isEnabled, requestWakeLock, releaseWakeLock]);

  // Handle visibility changes (Wake Lock is released by the browser when the tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isEnabled && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isEnabled, requestWakeLock]);

  return { isSupported, isActive: !!wakeLockRef.current };
}
