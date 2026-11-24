/**
 * @file usePwa.js
 * @description React hooks for Progressive Web App (PWA) installation, offline detection,
 * storage persistence requests, and storage quota estimation.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to monitor device online/offline network connectivity.
 * @returns {{isOnline: boolean, isOffline: boolean}}
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    return (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean')
      ? navigator.onLine
      : true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline
  };
}

/**
 * Hook to manage PWA installation prompt and status.
 * @returns {{isInstallable: boolean, isInstalled: boolean, installApp: () => Promise<boolean>}}
 */
export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      return true;
    }
    return false;
  }, [installPrompt]);

  return {
    isInstallable: !!installPrompt,
    isInstalled,
    installApp
  };
}

/**
 * Hook to request persistent storage and monitor browser storage quota.
 * @returns {{isPersisted: boolean, quotaUsedBytes: number, quotaTotalBytes: number, quotaPercentUsed: number, requestPersistence: () => Promise<boolean>}}
 */
export function usePersistentStorage() {
  const [isPersisted, setIsPersisted] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState({ used: 0, total: 0 });

  const checkPersistence = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.storage) {
      if (navigator.storage.persisted) {
        const persisted = await navigator.storage.persisted();
        setIsPersisted(persisted);
      }
      if (navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        setStorageEstimate({
          used: estimate.usage || 0,
          total: estimate.quota || 0
        });
      }
    }
  }, []);

  useEffect(() => {
    checkPersistence();
  }, [checkPersistence]);

  const requestPersistence = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      setIsPersisted(granted);
      await checkPersistence();
      return granted;
    }
    return false;
  }, [checkPersistence]);

  const quotaPercentUsed = storageEstimate.total > 0
    ? Math.round((storageEstimate.used / storageEstimate.total) * 100)
    : 0;

  return {
    isPersisted,
    quotaUsedBytes: storageEstimate.used,
    quotaTotalBytes: storageEstimate.total,
    quotaPercentUsed,
    requestPersistence,
    refreshEstimate: checkPersistence
  };
}
