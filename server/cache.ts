import crypto from "crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlMs: number): void {
    // If cache is at capacity, evict least recently accessed entries
    if (this.store.size >= this.maxEntries) {
      this.evictOldest(Math.max(1, Math.floor(this.maxEntries * 0.1)));
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    });
  }

  public delete(key: string): void {
    this.store.delete(key);
  }

  public clear(): void {
    this.store.clear();
  }

  public size(): number {
    return this.store.size;
  }

  private evictOldest(count: number): void {
    // Remove expired entries first
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }

    if (this.store.size < this.maxEntries) return;

    // Evict based on LRU
    const entries = Array.from(this.store.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.store.delete(entries[i][0]);
    }
  }

  public static hashKey(namespace: string, payload: any): string {
    const serialized = typeof payload === "string" ? payload : JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(serialized).digest("hex");
    return `${namespace}:${hash}`;
  }
}

// Global server caches
export const perspectivesCache = new MemoryCache(300); // TTL: 1 hour
export const moderationCache = new MemoryCache(500);   // TTL: 10 minutes
export const aiContentCache = new MemoryCache(500);    // TTL: 10 minutes
export const evaluationCache = new MemoryCache(300);   // TTL: 5 minutes
