interface Entry<T> {
  value: T
  storedAt: number
}

/**
 * Tiny per-isolate TTL cache. Entries past TTL are kept (up to maxStaleMs) so we can
 * serve clearly-labeled stale data when the upstream is down.
 */
export class MemoryCache<T> {
  private store = new Map<string, Entry<T>>()

  constructor(
    private ttlMs: number,
    private maxStaleMs: number,
    private maxEntries = 64,
    private now: () => number = Date.now,
  ) {}

  get(key: string): { value: T; fresh: boolean } | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    const age = this.now() - entry.storedAt
    if (age > this.maxStaleMs) {
      this.store.delete(key)
      return undefined
    }
    return { value: entry.value, fresh: age <= this.ttlMs }
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value
      if (oldest !== undefined) this.store.delete(oldest)
    }
    this.store.delete(key)
    this.store.set(key, { value, storedAt: this.now() })
  }
}
