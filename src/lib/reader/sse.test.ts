import { readSSE, sseFrame } from './sse'

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

async function collect(body: ReadableStream<Uint8Array>): Promise<string[]> {
  const out: string[] = []
  for await (const payload of readSSE(body)) out.push(payload)
  return out
}

describe('sseFrame', () => {
  it('wraps a payload in a data frame', () => {
    expect(sseFrame('hello')).toBe('data: hello\n\n')
  })
})

describe('readSSE', () => {
  it('yields one payload per frame', async () => {
    const body = streamOf([sseFrame('a'), sseFrame('b')])
    expect(await collect(body)).toEqual(['a', 'b'])
  })

  it('reassembles frames split across chunks', async () => {
    const body = streamOf(['data: hel', 'lo\n\ndata: wor', 'ld\n\n'])
    expect(await collect(body)).toEqual(['hello', 'world'])
  })

  it('ignores non-data frames and incomplete trailing data', async () => {
    const body = streamOf([': comment\n\ndata: ok\n\ndata: never-terminated'])
    expect(await collect(body)).toEqual(['ok'])
  })

  it('passes JSON payloads through untouched', async () => {
    const event = JSON.stringify({ type: 'highlight', highlight: { text: 'x' } })
    const body = streamOf([sseFrame(event)])
    expect(await collect(body)).toEqual([event])
  })
})
