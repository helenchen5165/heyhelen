import Anthropic from '@anthropic-ai/sdk'
import { createLLMHighlightDetector } from './highlight-detector'
import type { Highlight } from './types'

const SOURCE_TEXT =
  'Markets are efficient because idiosyncratic risks cancel out in a large portfolio.'

function makeClient(responseText: string): Anthropic {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: responseText }],
      }),
    },
  } as unknown as Anthropic
}

describe('createLLMHighlightDetector', () => {
  it('calls onHighlight for each valid item returned by LLM', async () => {
    const llmResponse = JSON.stringify([
      {
        type: 'key-argument',
        text: 'Markets are efficient',
        preview: 'The central claim of this sentence.',
      },
      {
        type: 'vocabulary',
        text: 'idiosyncratic',
        preview: 'Unique or peculiar to an individual.',
      },
    ])

    const client = makeClient(llmResponse)
    const detector = createLLMHighlightDetector(client)
    const received: Highlight[] = []

    await detector.detect(SOURCE_TEXT, (h) => received.push(h))

    expect(received).toHaveLength(2)
    expect(received[0].type).toBe('key-argument')
    expect(received[1].type).toBe('vocabulary')
  })

  it('sets offset and len so highlight.text === source[offset..offset+len]', async () => {
    const llmResponse = JSON.stringify([
      {
        type: 'vocabulary',
        text: 'idiosyncratic',
        preview: 'Unique or peculiar to an individual.',
      },
    ])

    const detector = createLLMHighlightDetector(makeClient(llmResponse))
    const received: Highlight[] = []

    await detector.detect(SOURCE_TEXT, (h) => received.push(h))

    const h = received[0]
    expect(SOURCE_TEXT.slice(h.offset, h.offset + h.len)).toBe(h.text)
    expect(h.len).toBe('idiosyncratic'.length)
  })

  it('skips items whose text is not found in source', async () => {
    const llmResponse = JSON.stringify([
      {
        type: 'vocabulary',
        text: 'hallucinated phrase not in text',
        preview: 'This does not appear in the source.',
      },
    ])

    const detector = createLLMHighlightDetector(makeClient(llmResponse))
    const received: Highlight[] = []

    await detector.detect(SOURCE_TEXT, (h) => received.push(h))

    expect(received).toHaveLength(0)
  })

  it('uses context prefix to locate the correct occurrence of a repeated phrase', async () => {
    const text = 'The risk is real. We must manage risk carefully to avoid systemic risk.'
    // "risk" appears 3 times; context prefix points to the second occurrence
    const llmResponse = JSON.stringify([
      {
        type: 'key-argument',
        text: 'risk',
        context: 'manage ',
        preview: 'The risk being managed.',
      },
    ])

    const detector = createLLMHighlightDetector(makeClient(llmResponse))
    const received: Highlight[] = []

    await detector.detect(text, (h) => received.push(h))

    expect(received).toHaveLength(1)
    // "manage risk" — "risk" starts at index 39
    expect(text.slice(received[0].offset, received[0].offset + received[0].len)).toBe('risk')
    expect(received[0].offset).toBe(text.indexOf('manage ') + 'manage '.length)
  })

  it('falls back to indexOf when context prefix is not found', async () => {
    const text = 'The risk is real. We must manage risk carefully.'
    const llmResponse = JSON.stringify([
      {
        type: 'key-argument',
        text: 'risk',
        context: 'XXXXXX ',
        preview: 'Some risk.',
      },
    ])

    const detector = createLLMHighlightDetector(makeClient(llmResponse))
    const received: Highlight[] = []

    await detector.detect(text, (h) => received.push(h))

    expect(received).toHaveLength(1)
    expect(received[0].offset).toBe(text.indexOf('risk'))
  })

  it('does not throw when LLM returns malformed JSON', async () => {
    const detector = createLLMHighlightDetector(makeClient('not json at all }{'))
    const received: Highlight[] = []

    await expect(
      detector.detect(SOURCE_TEXT, (h) => received.push(h))
    ).resolves.toBeUndefined()

    expect(received).toHaveLength(0)
  })
})
