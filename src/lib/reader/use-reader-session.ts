import { useState, useCallback, useRef } from 'react'
import { readSSE } from './sse'
import type { Session, SessionSource } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type FetchFn = (url: string, init: RequestInit) => Promise<Response>

export function useReaderSession(fetchFn: FetchFn = fetch) {
  const [status, setStatus] = useState<Status>('idle')
  const [session, setSession] = useState<Session | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const statusRef = useRef(status)
  statusRef.current = status

  // Restores the most recently read session on a return visit. Silent no-op
  // when nothing is stored, the API is locked, or the user already started
  // loading something else.
  const restoreLatest = useCallback(async () => {
    try {
      const resp = await fetchFn('/api/reader/session', { method: 'GET' })
      if (!resp.ok) return
      const data = await resp.json()
      if (!data?.rawText || statusRef.current !== 'idle') return
      setSession({
        id: 'restored',
        title: data.title ?? '',
        url: data.url ?? undefined,
        rawText: data.rawText,
        html: data.html ?? '',
        highlights: Array.isArray(data.highlights) ? data.highlights : [],
      })
      setStatus('ready')
    } catch {
      // offline or DB unavailable — stay idle
    }
  }, [fetchFn])

  const load = useCallback(async (source: SessionSource) => {
    setStatus('loading')
    setSession(null)
    setErrorMessage(null)

    try {
      const body = 'url' in source
        ? JSON.stringify({ url: source.url })
        : 'text' in source
          ? JSON.stringify({ text: source.text, title: source.title })
          : 'pastedHtml' in source
            ? JSON.stringify({ pastedHtml: source.pastedHtml, title: source.title })
            : (() => { const f = new FormData(); f.append('file', source.file, source.filename); return f })()

      const headers: HeadersInit = ('url' in source || 'text' in source || 'pastedHtml' in source) ? { 'Content-Type': 'application/json' } : {}
      const resp = await fetchFn('/api/reader/session', { method: 'POST', headers, body })

      if (resp.status === 401) {
        throw new Error('此浏览器未解锁 Reader：请用你保存的解锁链接（/api/unlock?key=…）访问一次，再重试。')
      }
      if (!resp.ok || !resp.body) throw new Error(`Server error ${resp.status}`)

      let receivedSession = false

      for await (const payload of readSSE(resp.body)) {
        const event = JSON.parse(payload)

        if (event.type === 'session') {
          setSession({ ...event, highlights: [] })
          receivedSession = true
        } else if (event.type === 'highlight') {
          setSession(prev => prev ? { ...prev, highlights: [...prev.highlights, event.highlight] } : prev)
        } else if (event.type === 'error') {
          throw new Error(event.message)
        }
      }

      if (!receivedSession) throw new Error('Stream ended without session data')
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchFn])

  return { status, session, errorMessage, load, restoreLatest }
}
