import { createSessionEvents } from './session-events'
import type { Extractor, HighlightDetector, Highlight } from './types'
import type { SessionStore, StoredSession } from './session-store'

const fakeExtractor: Extractor = {
  extract: async () => ({
    title: 'On Risk',
    text: 'Risk means more things can happen than will happen.',
    html: '<p>Risk means more things can happen than will happen.</p>',
  }),
}

const fakeDetector: HighlightDetector = {
  detect: async () => {},
}

async function collect(source: Parameters<typeof createSessionEvents>[0], deps: Parameters<typeof createSessionEvents>[1]) {
  const events = []
  for await (const event of createSessionEvents(source, deps)) {
    events.push(event)
  }
  return events
}

describe('createSessionEvents', () => {
  it('first event is session with title and rawText, last event is done', async () => {
    const events = await collect(
      { url: 'https://oaktreecapital.com/memo' },
      { extractor: fakeExtractor, detector: fakeDetector }
    )

    expect(events[0].type).toBe('session')
    expect(events[0]).toMatchObject({ title: 'On Risk', rawText: expect.stringContaining('Risk') })
    expect(events.at(-1)!.type).toBe('done')
  })

  it('emits a highlight event for each detected highlight', async () => {
    const fakeHighlight: Highlight = {
      type: 'vocabulary',
      text: 'Risk',
      offset: 0,
      len: 4,
      preview: 'The possibility of loss.',
    }
    const detectorWithOne: HighlightDetector = {
      detect: async (_text, cb) => { cb(fakeHighlight) },
    }

    const events = await collect(
      { url: 'https://example.com' },
      { extractor: fakeExtractor, detector: detectorWithOne }
    )

    const highlightEvents = events.filter((e) => e.type === 'highlight')
    expect(highlightEvents).toHaveLength(1)
    expect(highlightEvents[0]).toMatchObject({ highlight: fakeHighlight })
  })

  it('emits error then done when extractor fails', async () => {
    const brokenExtractor: Extractor = {
      extract: async () => { throw new Error('Network timeout') },
    }

    const events = await collect(
      { url: 'https://example.com' },
      { extractor: brokenExtractor, detector: fakeDetector }
    )

    expect(events[0]).toMatchObject({ type: 'error', message: expect.stringContaining('Network timeout') })
    expect(events.at(-1)!.type).toBe('done')
  })

  it('includes url in session event when source is a URL', async () => {
    const events = await collect(
      { url: 'https://oaktreecapital.com/memo' },
      { extractor: fakeExtractor, detector: fakeDetector }
    )

    expect(events[0]).toMatchObject({ type: 'session', url: 'https://oaktreecapital.com/memo' })
  })
})

describe('createSessionEvents with a session store', () => {
  const cachedHighlight: Highlight = {
    type: 'key-argument',
    text: 'Risk means',
    offset: 0,
    len: 10,
    preview: 'Core claim.',
  }

  function fakeStore(overrides: Partial<SessionStore> = {}): SessionStore & { saved: StoredSession[] } {
    const saved: StoredSession[] = []
    return {
      saved,
      findByHash: async () => null,
      save: async (s) => { saved.push(s) },
      latest: async () => null,
      ...overrides,
    }
  }

  it('cache hit: emits stored highlights and never calls the detector', async () => {
    const detect = jest.fn()
    const store = fakeStore({
      findByHash: async (hash) => ({
        contentHash: hash,
        title: 'On Risk',
        rawText: 'x',
        html: '<p>x</p>',
        highlights: [cachedHighlight],
      }),
    })

    const events = await collect(
      { url: 'https://example.com' },
      { extractor: fakeExtractor, detector: { detect }, store }
    )

    expect(detect).not.toHaveBeenCalled()
    expect(events.filter((e) => e.type === 'highlight')).toEqual([
      { type: 'highlight', highlight: cachedHighlight },
    ])
    expect(events.at(-1)!.type).toBe('done')
  })

  it('cache miss: runs detection and saves the session with its highlights', async () => {
    const store = fakeStore()
    const detector: HighlightDetector = {
      detect: async (_text, cb) => { cb(cachedHighlight) },
    }

    await collect({ url: 'https://example.com' }, { extractor: fakeExtractor, detector, store })

    expect(store.saved).toHaveLength(1)
    expect(store.saved[0]).toMatchObject({
      title: 'On Risk',
      url: 'https://example.com',
      highlights: [cachedHighlight],
    })
    expect(store.saved[0].contentHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('does not cache empty or failed detections, so they can retry', async () => {
    const store = fakeStore()
    const failingDetector: HighlightDetector = {
      detect: async () => { throw new Error('LLM down') },
    }

    await collect({ url: 'https://example.com' }, { extractor: fakeExtractor, detector: failingDetector, store })

    expect(store.saved).toHaveLength(0)
  })

  it('store failures are non-fatal: session still streams', async () => {
    const store = fakeStore({
      findByHash: async () => { throw new Error('DB unreachable') },
      save: async () => { throw new Error('DB unreachable') },
    })
    const detector: HighlightDetector = {
      detect: async (_text, cb) => { cb(cachedHighlight) },
    }

    const events = await collect({ url: 'https://example.com' }, { extractor: fakeExtractor, detector, store })

    expect(events[0].type).toBe('session')
    expect(events.filter((e) => e.type === 'highlight')).toHaveLength(1)
    expect(events.at(-1)!.type).toBe('done')
  })
})
