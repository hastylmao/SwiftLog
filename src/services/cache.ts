// Lazy-load AsyncStorage to prevent crash if native module is unavailable
let _AS: any = null;
let _checked = false;
async function getAS() {
  if (_checked) return _AS;
  _checked = true;
  try {
    const mod = require('@react-native-async-storage/async-storage');
    const AS = mod.default || mod;
    await AS.getItem('__cache_test__');
    _AS = AS;
  } catch { _AS = null; }
  return _AS;
}

const CACHE_PREFIX = '@swiftlogger_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export const cache = {
  async set<T>(key: string, data: T, ttl: number = CACHE_TTL): Promise<void> {
    try {
      const AS = await getAS();
      if (!AS) return;
      const entry: CacheEntry<T> = { data, timestamp: Date.now(), ttl };
      await AS.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const AS = await getAS();
      if (!AS) return null;
      const raw = await AS.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() - entry.timestamp > entry.ttl) {
        await AS.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  },

  async getStale<T>(key: string): Promise<T | null> {
    try {
      const AS = await getAS();
      if (!AS) return null;
      const raw = await AS.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch (error) {
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      const AS = await getAS();
      if (!AS) return;
      await AS.removeItem(CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const AS = await getAS();
      if (!AS) return;
      const keys = await AS.getAllKeys();
      const cacheKeys = keys.filter((k: string) => k.startsWith(CACHE_PREFIX));
      await Promise.all(cacheKeys.map((k: string) => AS.removeItem(k)));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  },
};

export function getCacheKey(userId: string, type: string, date?: string): string {
  return date ? `${userId}_${type}_${date}` : `${userId}_${type}`;
}

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateString(date?: string): Date {
  if (!date) return new Date();
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return new Date(date);
  return new Date(year, month - 1, day);
}

export function getLocalDateString(value?: string | Date): string {
  if (!value) return formatLocalDate(new Date());
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatLocalDate(new Date());
  }
  return formatLocalDate(date);
}

export function getTodayString(): string {
  return formatLocalDate(new Date());
}

export function getStartOfDay(date?: string): string {
  const d = parseLocalDateString(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getEndOfDay(date?: string): string {
  const d = parseLocalDateString(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
