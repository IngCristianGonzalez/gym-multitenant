import { useState, useEffect, useCallback } from 'react';
import { offlineGet, offlineMutate, isOnline } from './api-client';
import { getCachedData } from './db';

interface UseOfflineDataOptions {
  cacheKey: string;
  cacheTTL?: number;
}

interface UseOfflineDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  isStale: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook that fetches data with offline support.
 * - Tries network first, falls back to IndexedDB cache.
 * - When offline, serves from cache.
 */
export function useOfflineData<T = any>(
  url: string,
  options: UseOfflineDataOptions,
): UseOfflineDataResult<T> {
  const { cacheKey, cacheTTL = 5 * 60 * 1000 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await offlineGet<T>(url, { cacheKey, cacheTTL });
      setData(res.data);
      setIsStale(res.statusText === 'OK (cached)');
    } catch (err: any) {
      const cached = await getCachedData(cacheKey);
      if (cached !== null) {
        setData(cached);
        setIsStale(true);
      } else {
        setError(err?.message ?? 'Error al cargar datos');
      }
    } finally {
      setLoading(false);
    }
  }, [url, cacheKey, cacheTTL]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, isStale, refresh: fetch };
}

/**
 * Hook for offline-aware mutations (POST/PUT/PATCH/DELETE).
 * Queues writes when offline.
 */
export function useOfflineMutate() {
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(async <T = any>(
    method: string,
    url: string,
    body?: any,
  ): Promise<T | null> => {
    setLoading(true);
    try {
      const res = await offlineMutate<T>(method, url, body);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading };
}

export { isOnline };
