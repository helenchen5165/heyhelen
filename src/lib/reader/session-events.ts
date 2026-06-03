import { randomUUID } from 'crypto'
import type { Extractor, Highlight, HighlightDetector, SessionSource } from './types'

export type SessionSSEEvent =
  | { type: 'session'; id: string; title: string; url?: string; rawText: string; html: string }
  | { type: 'highlight'; highlight: Highlight }
  | { type: 'error'; message: string }
  | { type: 'done' }

interface Deps {
  extractor: Extractor
  detector: HighlightDetector
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

  yield {
    type: 'session',
    id: randomUUID(),
    title,
    url: 'url' in source ? source.url : undefined,
    rawText: text,
    html,
  }

  const highlights: Highlight[] = []
  await deps.detector.detect(text, (h) => highlights.push(h))

  for (const highlight of highlights) {
    yield { type: 'highlight', highlight }
  }

  yield { type: 'done' }
}
