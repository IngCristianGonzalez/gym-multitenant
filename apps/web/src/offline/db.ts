const DB_NAME = 'gym-offline';
const DB_VERSION = 1;

const STORES = {
  data: 'data',        // Cached API responses: { key: 'miembros', data: [...], updatedAt: timestamp }
  syncQueue: 'syncQueue', // Pending writes: { id, method, url, body, createdAt, retries }
  auth: 'auth',        // Auth token and user info
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.data)) {
        db.createObjectStore(STORES.data, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORES.syncQueue)) {
        const store = db.createObjectStore(STORES.syncQueue, { keyPath: 'id', autoIncrement: true });
        store.createIndex('by createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORES.auth)) {
        db.createObjectStore(STORES.auth, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

// ---------- Generic helpers ----------

async function txGet<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function txGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as T[]);
    req.onerror = () => reject(req.error);
  });
}

async function txPut<T>(storeName: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function txDelete(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function txClear(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ---------- Data cache (API responses) ----------

export interface CachedData {
  key: string;        // e.g. "miembros", "rutinas", "facturas"
  data: any;
  updatedAt: number;  // Date.now()
}

export async function getCachedData(key: string): Promise<any | null> {
  const cached = await txGet<CachedData>(STORES.data, key);
  return cached?.data ?? null;
}

export async function setCachedData(key: string, data: any): Promise<void> {
  await txPut<CachedData>(STORES.data, {
    key,
    data,
    updatedAt: Date.now(),
  });
}

export async function clearCachedData(key?: string): Promise<void> {
  if (key) {
    await txDelete(STORES.data, key);
  } else {
    await txClear(STORES.data);
  }
}

// ---------- Sync queue (pending writes) ----------

export interface SyncQueueItem {
  id?: number;
  method: string;
  url: string;
  body: any;
  createdAt: number;
  retries: number;
  headers?: Record<string, string>;
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retries'>): Promise<number> {
  const entry: SyncQueueItem = {
    ...item,
    createdAt: Date.now(),
    retries: 0,
  };
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readwrite');
    const store = tx.objectStore(STORES.syncQueue);
    const req = store.add(entry);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return txGetAll<SyncQueueItem>(STORES.syncQueue);
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  await txDelete(STORES.syncQueue, id);
}

export async function incrementRetries(id: number): Promise<void> {
  const item = await txGet<SyncQueueItem>(STORES.syncQueue, id);
  if (item) {
    await txPut<SyncQueueItem>(STORES.syncQueue, { ...item, retries: item.retries + 1 });
  }
}

export async function clearSyncQueue(): Promise<void> {
  await txClear(STORES.syncQueue);
}

// ---------- Auth cache ----------

export interface CachedAuth {
  key: 'auth';
  token: string;
  user: any;
}

export async function getCachedAuth(): Promise<Omit<CachedAuth, 'key'> | null> {
  const cached = await txGet<CachedAuth>(STORES.auth, 'auth');
  return cached ? { token: cached.token, user: cached.user } : null;
}

export async function setCachedAuth(token: string, user: any): Promise<void> {
  await txPut<CachedAuth>(STORES.auth, { key: 'auth', token, user });
}

export async function clearCachedAuth(): Promise<void> {
  await txDelete(STORES.auth, 'auth');
}

// ---------- DB stats ----------

export async function getSyncQueueCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.syncQueue, 'readonly');
    const store = tx.objectStore(STORES.syncQueue);
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
