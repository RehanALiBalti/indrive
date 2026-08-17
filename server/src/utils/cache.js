import env from '../config/env.js';

/**
 * Small in-process TTL cache for public, read-heavy content endpoints.
 * Keeps Firestore reads (and cost) down without adding a Redis dependency.
 * Every write path calls `invalidate` so the CMS stays instantly consistent.
 */
const store = new Map();
const MAX_ENTRIES = 500;

export const cacheGet = (key) => {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
};

export const cacheSet = (key, value, ttlSeconds = env.cache.publicTtlSeconds) => {
  if (!ttlSeconds || ttlSeconds <= 0) return value;
  if (store.size >= MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  return value;
};

/** Drops every entry whose key starts with any of the given prefixes. */
export const invalidate = (...prefixes) => {
  if (!prefixes.length) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (prefixes.some((prefix) => key.startsWith(prefix))) store.delete(key);
  }
};

export const cacheStats = () => ({ entries: store.size });

export const withCache = async (key, ttlSeconds, producer) => {
  const hit = cacheGet(key);
  if (hit !== undefined) return hit;
  const value = await producer();
  cacheSet(key, value, ttlSeconds);
  return value;
};
