import type { Highlight } from './types'

export interface CachedSession {
  key: string
  title: string
  rawText: string
  highlights: Highlight[]
  savedAt: number
}

interface SessionIndex {
  keys: string[]  // ordered oldest→newest by savedAt
}

interface SessionCacheOptions {
  maxSessions?: number
}

export interface SessionCache {
  save(key: string, session: CachedSession): void
  restore(key: string): CachedSession | null
  evict(): void
}

const INDEX_KEY = '__session_cache_index__'
const SESSION_PREFIX = '__session__'
const DEFAULT_MAX = 10

export function createSessionCache(
  storage: Storage = localStorage,
  options: SessionCacheOptions = {},
): SessionCache {
  const MAX = options.maxSessions ?? DEFAULT_MAX

  function readIndex(): SessionIndex {
    try {
      const raw = storage.getItem(INDEX_KEY)
      return raw ? (JSON.parse(raw) as SessionIndex) : { keys: [] }
    } catch {
      return { keys: [] }
    }
  }

  function writeIndex(index: SessionIndex): void {
    storage.setItem(INDEX_KEY, JSON.stringify(index))
  }

  function sessionKey(key: string): string {
    return SESSION_PREFIX + key
  }

  return {
    save(key, session) {
      const index = readIndex()
      // remove existing entry for this key (will re-insert at end = newest)
      const filtered = index.keys.filter(k => k !== key)
      storage.setItem(sessionKey(key), JSON.stringify(session))
      filtered.push(key)
      writeIndex({ keys: filtered })
      this.evict()
    },

    restore(key) {
      const raw = storage.getItem(sessionKey(key))
      if (!raw) return null
      try {
        return JSON.parse(raw) as CachedSession
      } catch {
        return null
      }
    },

    evict() {
      const index = readIndex()
      while (index.keys.length > MAX) {
        const oldest = index.keys.shift()!
        storage.removeItem(sessionKey(oldest))
        if (typeof console !== 'undefined') {
          console.warn(`[SessionCache] evicted session: ${oldest}`)
        }
      }
      writeIndex(index)
    },
  }
}
