// hooks/useOnlineStatus.ts - Online/Offline Detection

import { useState, useEffect, useCallback } from 'react';

interface UseOnlineStatusOptions {
  pingUrl?: string;
  pingInterval?: number;
  onOnline?: () => void;
  onOffline?: () => void;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const {
    pingUrl,
    pingInterval = 30000,
    onOnline,
    onOffline,
  } = options;

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    if (!pingUrl) {
      setIsOnline(navigator.onLine);
      setLastChecked(new Date());
      return navigator.onLine;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeout);
      const online = response.ok;
      
      if (online !== isOnline) {
        setIsOnline(online);
        if (online) onOnline?.();
        else onOffline?.();
      }
      
      setLastChecked(new Date());
      return online;
    } catch {
      if (isOnline) {
        setIsOnline(false);
        onOffline?.();
      }
      setLastChecked(new Date());
      return false;
    }
  }, [pingUrl, isOnline, onOnline, onOffline]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      onOnline?.();
    };

    const handleOffline = () => {
      setIsOnline(false);
      onOffline?.();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    checkConnection();

    // Periodic check if pingUrl provided
    let intervalId: NodeJS.Timeout | undefined;
    if (pingUrl && pingInterval > 0) {
      intervalId = setInterval(checkConnection, pingInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pingUrl, pingInterval, checkConnection, onOnline, onOffline]);

  return {
    isOnline,
    lastChecked,
    checkConnection,
  };
}