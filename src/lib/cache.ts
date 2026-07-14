import { getKeyValueStore } from "./storage";

const TTL_MS = 3 * 60 * 60 * 1000; // 3 heures

interface CacheEnvelope<T> {
  cachedAt: string;
  data: T;
}

export async function readCache<T>(
  key: string,
  ttlMs: number = TTL_MS
): Promise<T | null> {
  const envelope = await getKeyValueStore("cache").get<CacheEnvelope<T>>(key);
  if (!envelope) return null;
  const age = Date.now() - new Date(envelope.cachedAt).getTime();
  if (age > ttlMs) return null;
  return envelope.data;
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    cachedAt: new Date().toISOString(),
    data,
  };
  await getKeyValueStore("cache").set(key, envelope);
}

export async function cacheTimestamp(key: string): Promise<string | null> {
  const envelope = await getKeyValueStore("cache").get<CacheEnvelope<unknown>>(
    key
  );
  return envelope?.cachedAt ?? null;
}

export async function clearCache(key: string): Promise<void> {
  await getKeyValueStore("cache").delete(key);
}

export const TREND_CACHE_TTL_MS = TTL_MS;
