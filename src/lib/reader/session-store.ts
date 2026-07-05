import type { Highlight } from './types'

// Persisted reading session, keyed by content hash. Caching the highlights
// means each unique article pays for LLM detection exactly once; `latest`
// lets the reader restore the most recent article on a return visit.
export interface StoredSession {
  contentHash: string
  title: string
  url?: string
  rawText: string
  html: string
  highlights: Highlight[]
}

export interface SessionStore {
  // Returns the cached session and marks it as read now.
  findByHash(contentHash: string): Promise<StoredSession | null>
  save(session: StoredSession): Promise<void>
  latest(): Promise<StoredSession | null>
}
