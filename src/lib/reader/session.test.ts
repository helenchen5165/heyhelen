import { createSession } from './session'
import type { Extractor, HighlightDetector } from './types'

const fakeExtractor: Extractor = {
  extract: async () => ({
    title: 'Test Article',
    text: 'This is the article body.',
    html: '<p>This is the article body.</p>',
  }),
}

const fakeDetector: HighlightDetector = {
  detect: async () => {},
}

const deps = { extractor: fakeExtractor, detector: fakeDetector }

describe('createSession', () => {
  it('returns session with title and rawText from extracted content', async () => {
    const session = await createSession(
      { url: 'https://example.com/article' },
      () => {},
      deps
    )

    expect(session.title).toBe('Test Article')
    expect(session.rawText).toBe('This is the article body.')
    expect(session.url).toBe('https://example.com/article')
    expect(session.highlights).toEqual([])
  })

  it('calls onHighlight for each detected highlight with correct shape', async () => {
    const fakeHighlight = {
      type: 'vocabulary' as const,
      text: 'article',
      offset: 13,
      len: 7,
      preview: 'A written work published in a newspaper or magazine.',
    }

    const detectorWithOne: HighlightDetector = {
      detect: async (_text, cb) => { cb(fakeHighlight) },
    }

    const received: typeof fakeHighlight[] = []

    const session = await createSession(
      { url: 'https://example.com/article' },
      (h) => received.push(h as typeof fakeHighlight),
      { extractor: fakeExtractor, detector: detectorWithOne }
    )

    expect(received).toHaveLength(1)
    expect(received[0]).toEqual(fakeHighlight)
    expect(session.highlights).toEqual([fakeHighlight])
  })

  it('throws ExtractionError when extractor fails', async () => {
    const brokenExtractor: Extractor = {
      extract: async () => { throw new Error('Network timeout') },
    }

    await expect(
      createSession({ url: 'https://example.com' }, () => {}, {
        extractor: brokenExtractor,
        detector: fakeDetector,
      })
    ).rejects.toThrow('Failed to extract content')
  })
})
