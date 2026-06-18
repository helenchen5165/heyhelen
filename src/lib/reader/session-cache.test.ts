import { createSessionCache } from './session-cache'
import type { CachedSession } from './session-cache'

function makeStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = v },
    removeItem: (k) => { delete store[k] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
    key: (i) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
}

const SESSION: CachedSession = {
  key: 'https://example.com/article',
  title: 'Test Article',
  rawText: 'Markets are efficient.',
  highlights: [],
  savedAt: Date.now(),
}

describe('SessionCache', () => {
  it('restore returns null for an unknown key', () => {
    const cache = createSessionCache(makeStorage())
    expect(cache.restore('unknown-key')).toBeNull()
  })

  it('save then restore round-trips a session without data loss', () => {
    const cache = createSessionCache(makeStorage())
    cache.save(SESSION.key, SESSION)
    const restored = cache.restore(SESSION.key)
    expect(restored).not.toBeNull()
    expect(restored!.title).toBe(SESSION.title)
    expect(restored!.rawText).toBe(SESSION.rawText)
    expect(restored!.key).toBe(SESSION.key)
  })

  it('saving with the same key overwrites the previous session', () => {
    const storage = makeStorage()
    const cache = createSessionCache(storage)
    cache.save(SESSION.key, SESSION)
    const updated = { ...SESSION, title: 'Updated Title' }
    cache.save(SESSION.key, updated)
    expect(cache.restore(SESSION.key)!.title).toBe('Updated Title')
  })

  it('evicts the oldest session when count exceeds MAX_SESSIONS', () => {
    const storage = makeStorage()
    const cache = createSessionCache(storage, { maxSessions: 3 })

    const oldest = { ...SESSION, key: 'url-oldest', savedAt: 1000 }
    const middle = { ...SESSION, key: 'url-middle', savedAt: 2000 }
    const newest = { ...SESSION, key: 'url-newest', savedAt: 3000 }
    const overflow = { ...SESSION, key: 'url-overflow', savedAt: 4000 }

    cache.save(oldest.key, oldest)
    cache.save(middle.key, middle)
    cache.save(newest.key, newest)
    cache.save(overflow.key, overflow) // triggers eviction of oldest

    expect(cache.restore(oldest.key)).toBeNull()
    expect(cache.restore(middle.key)).not.toBeNull()
    expect(cache.restore(newest.key)).not.toBeNull()
    expect(cache.restore(overflow.key)).not.toBeNull()
  })
})
