import { createSessionEvents } from './session-events'
import type { Extractor, HighlightDetector, Highlight } from './types'

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
