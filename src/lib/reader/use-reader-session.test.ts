import { renderHook, act } from '@testing-library/react'
import { useReaderSession } from './use-reader-session'

function makeStream(events: string[]): Response {
  const text = events.map(e => `data: ${e}\n\n`).join('')
  return {
    ok: true,
    body: new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(new TextEncoder().encode(text))
        ctrl.close()
      },
    }),
  } as unknown as Response
}

const SESSION_EVENT = JSON.stringify({ type: 'session', id: 's1', title: 'On Risk', rawText: 'Risk matters.', html: '<p>Risk matters.</p>' })
const HIGHLIGHT_EVENT = JSON.stringify({ type: 'highlight', highlight: { type: 'vocabulary', text: 'Risk', offset: 0, len: 4, preview: 'Exposure to loss.' } })
const DONE_EVENT = JSON.stringify({ type: 'done' })

describe('useReaderSession', () => {
  it('transitions from idle → loading → ready', async () => {
    const fakeFetch = async () => makeStream([SESSION_EVENT, DONE_EVENT])
    const { result } = renderHook(() => useReaderSession(fakeFetch))

    expect(result.current.status).toBe('idle')

    await act(async () => { result.current.load({ url: 'https://example.com' }) })

    expect(result.current.status).toBe('ready')
    expect(result.current.session?.title).toBe('On Risk')
  })

  it('appends highlights as they stream in', async () => {
    const fakeFetch = async () => makeStream([SESSION_EVENT, HIGHLIGHT_EVENT, DONE_EVENT])
    const { result } = renderHook(() => useReaderSession(fakeFetch))

    await act(async () => { result.current.load({ url: 'https://example.com' }) })

    expect(result.current.session?.highlights).toHaveLength(1)
    expect(result.current.session?.highlights[0].type).toBe('vocabulary')
  })

  it('sets status to error when fetch fails', async () => {
    const fakeFetch = async () => { throw new Error('Network error') }
    const { result } = renderHook(() => useReaderSession(fakeFetch))

    await act(async () => { result.current.load({ url: 'https://example.com' }) })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toContain('Network error')
  })

  it('sets status to error when stream ends without session data', async () => {
    const fakeFetch = async () => makeStream([DONE_EVENT])
    const { result } = renderHook(() => useReaderSession(fakeFetch))

    await act(async () => { result.current.load({ url: 'https://example.com' }) })

    expect(result.current.status).toBe('error')
  })

  it('sets status to error when server returns non-ok response', async () => {
    const fakeFetch = async () => ({ ok: false, status: 500, body: null } as unknown as Response)
    const { result } = renderHook(() => useReaderSession(fakeFetch))

    await act(async () => { result.current.load({ url: 'https://example.com' }) })

    expect(result.current.status).toBe('error')
    expect(result.current.errorMessage).toContain('500')
  })
})
