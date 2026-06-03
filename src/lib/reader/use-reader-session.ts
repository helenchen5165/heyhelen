import { useState, useCallback } from 'react'
import type { Session, SessionSource } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type FetchFn = (url: string, init: RequestInit) => Promise<Response>

export function useReaderSession(fetchFn: FetchFn = fetch) {
  const [status, setStatus] = useState<Status>('idle')
  const [session, setSession] = useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async (source: SessionSource) => {
    setStatus('loading')
    setSession(null)
    setErrorMessage(null)

    try {
      const body = 'url' in source
        ? JSON.stringify({ url: source.url })
        : 'text' in source
          ? JSON.stringify({ text: source.text, title: source.title })
          : (() => { const f = new FormData(); f.append('file', source.file, source.filename); return f })()

      const headers: HeadersInit = ('url' in source || 'text' in source) ? { 'Content-Type': 'application/json' } : {}
      const resp = await fetchFn('/api/reader/session', { method: 'POST', headers, body })

      if (!resp.ok || !resp.body) throw new Error(`Server error ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let receivedSession = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event = JSON.parse(line.slice(6))

          if (event.type === 'session') {
            setSession({ ...event, highlights: [] })
            receivedSession = true
          } else if (event.type === 'highlight') {
            setSession(prev => prev ? { ...prev, highlights: [...prev.highlights, event.highlight] } : prev)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      if (!receivedSession) throw new Error('Stream ended without session data')
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchFn])

  return { status, session, errorMessage, load }
}
