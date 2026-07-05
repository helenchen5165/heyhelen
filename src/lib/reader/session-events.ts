import { randomUUID, createHash } from 'crypto'
import type { Extractor, Highlight, HighlightDetector, SessionSource } from './types'
import type { SessionStore } from './session-store'

export type SessionSSEEvent =
  | { type: 'session'; id: string; title: string; url?: string; rawText: string; html: string }
  | { type: 'highlight'; highlight: Highlight }
  | { type: 'error'; message: string }
  | { type: 'done' }

interface Deps {
  extractor: Extractor
  detector: HighlightDetector
  // Optional cache: a hit skips LLM detection entirely; failures are
  // non-fatal so the reader keeps working if the DB is unreachable.
  store?: SessionStore
}

export async function* createSessionEvents(
  source: SessionSource,
  deps: Deps
): AsyncGenerator<SessionSSEEvent> {
  let title: string, text: string, html: string

  try {
    ;({ title, text, html } = await deps.extractor.extract(source))
  } catch (err) {
    yield { type: 'error', message: err instanceof Error ? err.message : 'Extraction failed' }
    yield { type: 'done' }
    return
  }

  const url = 'url' in source ? source.url : undefined

  yield {
    type: 'session',
    id: randomUUID(),
    title,
    url,
    rawText: text,
    html,
  }

  const contentHash = createHash('sha256').update(text).digest('hex')

  if (deps.store) {
    let cached = null
    try {
      cached = await deps.store.findByHash(contentHash)
    } catch (err) {
      console.error('[session-events] session cache lookup failed:', err)
    }
    if (cached) {
      for (const highlight of cached.highlights) {
        yield { type: 'highlight', highlight }
      }
      yield { type: 'done' }
      return
    }
  }

  const highlights: Highlight[] = []
  try {
    await deps.detector.detect(text, (h) => highlights.push(h))
  } catch (err) {
    // highlight detection failure is non-fatal — session is still usable
    console.error('[session-events] highlight detection failed:', err)
  }

  for (const highlight of highlights) {
    yield { type: 'highlight', highlight }
  }

  // Only cache successful, non-empty detections — caching a failed run
  // would permanently prevent this article from retrying.
  if (deps.store && highlights.length > 0) {
    try {
      await deps.store.save({ contentHash, title, url, rawText: text, html, highlights })
    } catch (err) {
      console.error('[session-events] session save failed:', err)
    }
  }

  yield { type: 'done' }
}
