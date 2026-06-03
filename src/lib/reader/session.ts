import { randomUUID } from 'crypto'
import type { Extractor, Highlight, HighlightDetector, Session, SessionSource } from './types'

interface Deps {
  extractor: Extractor
  detector: HighlightDetector
}

export async function createSession(
  source: SessionSource,
  onHighlight: (h: Highlight) => void,
  deps: Deps
): Promise<Session> {
  let extracted: { title: string; text: string; html: string }
  try {
    extracted = await deps.extractor.extract(source)
  } catch (cause) {
    throw new Error('Failed to extract content', { cause })
  }
  const { title, text, html } = extracted

  const session: Session = {
    id: randomUUID(),
    title,
    url: 'url' in source ? source.url : undefined,
    rawText: text,
    html,
    highlights: [],
  }

  await deps.detector.detect(text, (h) => {
    session.highlights.push(h)
    onHighlight(h)
  })

  return session
}
