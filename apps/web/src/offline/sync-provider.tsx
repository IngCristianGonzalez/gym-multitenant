import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client';
import { setQueueWriter } from './api-client';
import {
  getSyncQueue,
  removeSyncQueueItem,
  incrementRetries,
  addToSyncQueue,
  getSyncQueueCount,
} from './db';

interface SyncContextValue {
  isOnline: boolean;
  pendingSync: number;
  syncing: boolean;
  lastSyncAt: number | null;
  syncNow: () => Promise<void>;
  queueWrite: (method: string, url: string, body: any) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  isOnline: true,
  pendingSync: 0,
  syncing: false,
  lastSyncAt: null,
  syncNow: async () => {},
  queueWrite: async () => {},
});

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const syncingRef = useRef(false);

  // Update pending count
  const refreshPending = useCallback(async () => {
    const count = await getSyncQueueCount();
    setPendingSync(count);
  }, []);

  // Process sync queue
  const processQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);

    try {
      const queue = await getSyncQueue();
      if (queue.length === 0) {
        setPendingSync(0);
        return;
      }

      const sorted = queue.sort((a, b) => a.createdAt - b.createdAt);

      for (const item of sorted) {
        try {
          await api.request({
            method: item.method as any,
            url: item.url,
            data: item.body,
            headers: item.headers,
          });
          if (item.id != null) await removeSyncQueueItem(item.id);
        } catch {
          if (item.id != null) {
            if (item.retries >= MAX_RETRIES) {
              await removeSyncQueueItem(item.id);
            } else {
              await incrementRetries(item.id);
            }
          }
          // Stop processing on first failure — retry later
          break;
        }
      }

      const remaining = await getSyncQueueCount();
      setPendingSync(remaining);
      setLastSyncAt(Date.now());
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }, []);

  // Queue a write for later sync
  const queueWrite = useCallback(
    async (method: string, url: string, body: any) => {
      await addToSyncQueue({ method, url, body });
      await refreshPending();
    },
    [refreshPending],
  );

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    await processQueue();
  }, [processQueue]);

  // Listen for online/offline events
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      setTimeout(() => processQueue(), 500);
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [processQueue]);

  // Initial pending count
  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  // Inject queue writer into api-client
  useEffect(() => {
    setQueueWriter(queueWrite);
  }, [queueWrite]);

  // Periodic sync check (every 30s when online)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      if (navigator.onLine && !syncingRef.current) {
        processQueue();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, processQueue]);

  return (
    <SyncContext.Provider value={{ isOnline, pendingSync, syncing, lastSyncAt, syncNow, queueWrite }}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  return useContext(SyncContext);
}
