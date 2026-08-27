import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  getCachedData,
  setCachedData,
  getCachedAuth,
  setCachedAuth,
  clearCachedAuth,
} from './db';

const api = axios.create({
  baseURL: '/api',
});

// ---------- Offline detection ----------
let _isOnline = navigator.onLine;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { _isOnline = true; });
  window.addEventListener('offline', () => { _isOnline = false; });
}

export function isOnline() {
  return _isOnline;
}

// ---------- Sync queue callback (injected by SyncProvider) ----------
let _queueWrite: ((method: string, url: string, body: any) => Promise<void>) | null = null;

export function setQueueWriter(fn: (method: string, url: string, body: any) => Promise<void>) {
  _queueWrite = fn;
}

// ---------- Request interceptor ----------
api.interceptors.request.use(async (config) => {
  // Try cached auth first (works offline)
  const cached = await getCachedAuth();
  if (cached?.token) {
    config.headers.Authorization = `Bearer ${cached.token}`;
  } else {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------- Response interceptor ----------
api.interceptors.response.use(
  (res) => {
    // Cache auth responses
    if (res.config.url?.includes('/auth/login') && res.data?.access_token) {
      const { access_token, user } = res.data;
      setCachedAuth(access_token, user).catch(() => {});
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    return res;
  },
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      await clearCachedAuth().catch(() => {});
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ---------- Offline-aware request helpers ----------

interface OfflineConfig extends AxiosRequestConfig {
  cacheKey?: string;        // Key for caching GET responses
  cacheTTL?: number;        // Max age in ms (default 5 min)
  offlineWrite?: boolean;   // If true, queue writes when offline
  forceOnline?: boolean;    // Skip cache, only use network
}

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 min

/**
 * Offline-aware GET request.
 * - Online: fetch from network, cache result
 * - Offline: serve from cache if available
 */
export async function offlineGet<T = any>(url: string, config?: OfflineConfig): Promise<AxiosResponse<T>> {
  const cacheKey = config?.cacheKey ?? url;
  const ttl = config?.cacheTTL ?? DEFAULT_CACHE_TTL;

  if (_isOnline && !config?.forceOnline) {
    try {
      const res = await api.get<T>(url, config);
      // Cache successful response
      setCachedData(cacheKey, res.data).catch(() => {});
      return res;
    } catch (err) {
      // Network failed, try cache
      const cached = await getCachedData(cacheKey);
      if (cached !== null) {
        return { data: cached, status: 200, statusText: 'OK (cached)', headers: {}, config: config as any };
      }
      throw err;
    }
  }

  // Offline: try cache
  const cached = await getCachedData(cacheKey);
  if (cached !== null) {
    // Check if cache is stale
    return { data: cached, status: 200, statusText: 'OK (cached)', headers: {}, config: config as any };
  }

  throw new Error('Sin conexión y sin datos en caché');
}

/**
 * Offline-aware POST/PUT/PATCH/DELETE.
 * - Online: execute normally
 * - Offline: queue for later sync, return fake 202
 */
export async function offlineMutate<T = any>(
  method: string,
  url: string,
  body?: any,
): Promise<AxiosResponse<T>> {
  if (_isOnline) {
    try {
      const res = await api.request<T>({ method: method as any, url, data: body });
      return res;
    } catch (err) {
      if (!err || !(err as any).response) {
        if (_queueWrite) {
          await _queueWrite(method, url, body);
        }
        return { data: {} as T, status: 202, statusText: 'Accepted (queued)', headers: {}, config: { method, url } as any };
      }
      throw err;
    }
  }

  if (_queueWrite) {
    await _queueWrite(method, url, body);
  }
  return { data: {} as T, status: 202, statusText: 'Accepted (queued)', headers: {}, config: { method, url } as any };
}

/**
 * Authenticated fetch for PDFs (works offline with cached auth).
 */
export async function offlineFetchPdf(url: string): Promise<Blob> {
  const cached = await getCachedAuth();
  const token = cached?.token ?? localStorage.getItem('token');

  if (_isOnline) {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('No se pudo generar el PDF');
    return res.blob();
  }

  throw new Error('Sin conexión — los PDFs no están disponibles offline');
}

export default api;
