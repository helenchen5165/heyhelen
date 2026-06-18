# Reader Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `heyhelen.art/reader` — an English reading coach that streams AI highlights onto an article and lets users explore each highlight via a bottom drawer + Feynman/Socratic chatbot.

**Architecture:** The page fetches a reading session from `/api/reader/session` via SSE; highlights stream in progressively and are rendered as coloured underline spans. Clicking a span opens a bottom drawer (detail → chat). All state lives in `page.tsx`; child components are pure/presentational where possible.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, existing `/api/reader/*` and `/api/concept` endpoints.

---

## Task 1: `segmentText` — pure text-to-spans utility

**Files:**
- Create: `src/lib/reader/segment-text.ts`
- Create: `src/lib/reader/segment-text.test.ts`

### What it does
Given `rawText` and a sorted list of non-overlapping `Highlight[]`, split the text into segments: `{ text, highlight: Highlight | null }[]`. The segments concatenated equal `rawText`. Used by `ArticleView` to render coloured spans without touching DOM.

- [ ] **Write the failing test**

```ts
// src/lib/reader/segment-text.test.ts
import { segmentText } from './segment-text'
import type { Highlight } from './types'

const h1: Highlight = { type: 'key-argument',  text: 'Markets are efficient', offset: 0,  len: 21, preview: 'Core claim.' }
const h2: Highlight = { type: 'vocabulary',    text: 'idiosyncratic',          offset: 30, len: 13, preview: 'Unique to one.' }

const RAW = 'Markets are efficient because idiosyncratic risks cancel out.'

describe('segmentText', () => {
  it('returns one segment when no highlights', () => {
    const segs = segmentText(RAW, [])
    expect(segs).toEqual([{ text: RAW, highlight: null }])
  })

  it('wraps highlighted ranges and fills gaps', () => {
    const segs = segmentText(RAW, [h1, h2])
    expect(segs).toEqual([
      { text: 'Markets are efficient', highlight: h1 },
      { text: ' because ',            highlight: null },
      { text: 'idiosyncratic',        highlight: h2 },
      { text: ' risks cancel out.',   highlight: null },
    ])
    expect(segs.map(s => s.text).join('')).toBe(RAW)
  })

  it('sorts highlights by offset before segmenting', () => {
    const segs = segmentText(RAW, [h2, h1]) // reversed order
    expect(segs[0].highlight).toBe(h1)
    expect(segs[2].highlight).toBe(h2)
  })

  it('handles highlight at the very end of text', () => {
    const h: Highlight = { type: 'vocabulary', text: 'out.', offset: 57, len: 4, preview: '' }
    const segs = segmentText(RAW, [h])
    expect(segs.at(-1)).toEqual({ text: 'out.', highlight: h })
    expect(segs.map(s => s.text).join('')).toBe(RAW)
  })
})
```

- [ ] **Run test — expect RED**

```bash
cd /Users/chenhelen/Documents/Github/heyhelen
./node_modules/.bin/jest src/lib/reader/segment-text.test.ts --no-coverage --forceExit
```
Expected: `Cannot find module './segment-text'`

- [ ] **Write minimal implementation**

```ts
// src/lib/reader/segment-text.ts
import type { Highlight } from './types'

export interface TextSegment {
  text: string
  highlight: Highlight | null
}

export function segmentText(raw: string, highlights: Highlight[]): TextSegment[] {
  const sorted = [...highlights].sort((a, b) => a.offset - b.offset)
  const segments: TextSegment[] = []
  let cursor = 0

  for (const h of sorted) {
    if (h.offset > cursor) {
      segments.push({ text: raw.slice(cursor, h.offset), highlight: null })
    }
    segments.push({ text: raw.slice(h.offset, h.offset + h.len), highlight: h })
    cursor = h.offset + h.len
  }

  if (cursor < raw.length) {
    segments.push({ text: raw.slice(cursor), highlight: null })
  }

  return segments
}
```

- [ ] **Run test — expect GREEN**

```bash
./node_modules/.bin/jest src/lib/reader/segment-text.test.ts --no-coverage --forceExit
```
Expected: `4 passed`

- [ ] **Commit**

```bash
git add src/lib/reader/segment-text.ts src/lib/reader/segment-text.test.ts
git commit -m "feat(reader): add segmentText utility"
```

---

## Task 2: `useReaderSession` — SSE session hook

**Files:**
- Create: `src/lib/reader/use-reader-session.ts`
- Create: `src/lib/reader/use-reader-session.test.ts`

### What it does
React hook that POSTs to `/api/reader/session`, reads the SSE stream, and returns reactive state. Tests use a fake `fetchFn`.

- [ ] **Write the failing test**

```ts
// src/lib/reader/use-reader-session.test.ts
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
})
```

- [ ] **Run test — expect RED**

```bash
./node_modules/.bin/jest src/lib/reader/use-reader-session.test.ts --no-coverage --forceExit
```

- [ ] **Write minimal implementation**

```ts
// src/lib/reader/use-reader-session.ts
'use client'
import { useState, useCallback } from 'react'
import type { Highlight, Session, SessionSource } from './types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

type FetchFn = (url: string, init: RequestInit) => Promise<Response>

interface ReaderSession extends Omit<Session, 'highlights'> {
  highlights: Highlight[]
}

export function useReaderSession(fetchFn: FetchFn = fetch) {
  const [status, setStatus] = useState<Status>('idle')
  const [session, setSession] = useState<ReaderSession | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const load = useCallback(async (source: SessionSource) => {
    setStatus('loading')
    setSession(null)
    setErrorMessage(null)

    try {
      const body = 'url' in source
        ? JSON.stringify({ url: source.url })
        : (() => { const f = new FormData(); f.append('file', source.file); return f })()

      const headers = 'url' in source ? { 'Content-Type': 'application/json' } : {}
      const resp = await fetchFn('/api/reader/session', { method: 'POST', headers, body })

      if (!resp.ok || !resp.body) throw new Error(`Server error ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

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
          } else if (event.type === 'highlight') {
            setSession(prev => prev ? { ...prev, highlights: [...prev.highlights, event.highlight] } : prev)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [fetchFn])

  return { status, session, errorMessage, load }
}
```

- [ ] **Run test — expect GREEN**

```bash
./node_modules/.bin/jest src/lib/reader/use-reader-session.test.ts --no-coverage --forceExit
```
Expected: `3 passed`

- [ ] **Run all reader tests to confirm no regression**

```bash
./node_modules/.bin/jest src/lib/reader/ --no-coverage --forceExit
```
Expected: all pass

- [ ] **Commit**

```bash
git add src/lib/reader/use-reader-session.ts src/lib/reader/use-reader-session.test.ts
git commit -m "feat(reader): add useReaderSession SSE hook"
```

---

## Task 3: `UrlInput` component

**Files:**
- Create: `src/components/reader/UrlInput.tsx`

### What it does
Text input for URL + "Load" button + PDF file upload button. Calls `onSubmit` with `SessionSource`. No internal state beyond the input value.

- [ ] **Write the component**

```tsx
// src/components/reader/UrlInput.tsx
'use client'
import { useState, useRef } from 'react'
import type { SessionSource } from '@/lib/reader/types'

interface Props {
  onSubmit: (source: SessionSource) => void
  disabled?: boolean
}

export function UrlInput({ onSubmit, disabled }: Props) {
  const [url, setUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (url.trim()) onSubmit({ url: url.trim() })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onSubmit({ file, filename: file.name })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-b border-white/10">
      <input
        type="url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste a URL to start reading..."
        disabled={disabled}
        className="flex-1 bg-white/5 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled || !url.trim()}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40"
      >
        Load
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        className="px-4 py-2 bg-white/10 text-white text-sm rounded-lg disabled:opacity-40"
      >
        PDF
      </button>
      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFile} />
    </form>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/UrlInput.tsx
git commit -m "feat(reader): add UrlInput component"
```

---

## Task 4: `ArticleView` + `HighlightMark` components

**Files:**
- Create: `src/components/reader/HighlightMark.tsx`
- Create: `src/components/reader/ArticleView.tsx`

### Highlight colour map

```ts
const HIGHLIGHT_STYLES: Record<string, { underline: string; bg: string }> = {
  'key-argument':    { underline: '#7ec668', bg: 'rgba(126,198,104,0.15)' },
  'vocabulary':      { underline: '#64a8e0', bg: 'rgba(100,168,224,0.15)' },
  'complex-sentence':{ underline: '#e09664', bg: 'rgba(224,150,100,0.15)' },
  'related-concept': { underline: '#b482dc', bg: 'rgba(180,130,220,0.15)' },
}
```

- [ ] **Write `HighlightMark`**

```tsx
// src/components/reader/HighlightMark.tsx
import type { Highlight } from '@/lib/reader/types'

const STYLES: Record<string, { underline: string; bg: string; borderStyle: string }> = {
  'key-argument':     { underline: '#7ec668', bg: 'rgba(126,198,104,0.15)', borderStyle: 'solid' },
  'vocabulary':       { underline: '#64a8e0', bg: 'rgba(100,168,224,0.15)', borderStyle: 'solid' },
  'complex-sentence': { underline: '#e09664', bg: 'rgba(224,150,100,0.15)', borderStyle: 'dashed' },
  'related-concept':  { underline: '#b482dc', bg: 'rgba(180,130,220,0.15)', borderStyle: 'dotted' },
}

interface Props {
  highlight: Highlight
  active: boolean
  onClick: (h: Highlight) => void
}

export function HighlightMark({ highlight, active, onClick }: Props) {
  const s = STYLES[highlight.type]
  return (
    <mark
      onClick={() => onClick(highlight)}
      style={{
        background: s.bg,
        borderBottom: `2px ${s.borderStyle} ${s.underline}`,
        borderRadius: '2px',
        padding: '1px 1px',
        cursor: 'pointer',
        outline: active ? `2px solid ${s.underline}` : 'none',
        outlineOffset: '2px',
      }}
    >
      {highlight.text}
    </mark>
  )
}
```

- [ ] **Write `ArticleView`**

```tsx
// src/components/reader/ArticleView.tsx
import { segmentText } from '@/lib/reader/segment-text'
import { HighlightMark } from './HighlightMark'
import type { Highlight } from '@/lib/reader/types'

interface Props {
  rawText: string
  highlights: Highlight[]
  activeHighlight: Highlight | null
  onHighlightClick: (h: Highlight) => void
}

export function ArticleView({ rawText, highlights, activeHighlight, onHighlightClick }: Props) {
  const segments = segmentText(rawText, highlights)

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8 font-serif text-lg leading-8 text-white/90">
      {segments.map((seg, i) =>
        seg.highlight ? (
          <HighlightMark
            key={i}
            highlight={seg.highlight}
            active={activeHighlight?.text === seg.highlight.text}
            onClick={onHighlightClick}
          />
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/HighlightMark.tsx src/components/reader/ArticleView.tsx
git commit -m "feat(reader): add ArticleView with highlight spans"
```

---

## Task 5: `VocabButton` component

**Files:**
- Create: `src/components/reader/VocabButton.tsx`

### What it does
POSTs to `/api/reader/vocabulary`. Shows `＋ 加入词库` → loading → `✓ 已保存`. Disabled after first save.

- [ ] **Write the component**

```tsx
// src/components/reader/VocabButton.tsx
'use client'
import { useState } from 'react'
import type { Highlight } from '@/lib/reader/types'

interface Props {
  highlight: Highlight
  source: string
}

type SaveState = 'idle' | 'saving' | 'saved'

export function VocabButton({ highlight, source }: Props) {
  const [state, setState] = useState<SaveState>('idle')

  async function handleSave() {
    if (state !== 'idle') return
    setState('saving')
    try {
      await fetch('/api/reader/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: highlight.text,
          context: highlight.text,
          source,
          preview: highlight.preview,
        }),
      })
      setState('saved')
    } catch {
      setState('idle')
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={state !== 'idle'}
      className="px-3 py-1.5 rounded-md text-xs font-medium bg-green-900/40 text-green-400 disabled:opacity-50"
    >
      {state === 'idle' ? '＋ 加入词库' : state === 'saving' ? '保存中…' : '✓ 已保存'}
    </button>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/VocabButton.tsx
git commit -m "feat(reader): add VocabButton component"
```

---

## Task 6: `DrawerDetail` component

**Files:**
- Create: `src/components/reader/DrawerDetail.tsx`

### What it does
Displays one highlight's details: type badge, EN explanation, CN explanation, two action buttons.

- [ ] **Write the component**

```tsx
// src/components/reader/DrawerDetail.tsx
import { VocabButton } from './VocabButton'
import type { Highlight } from '@/lib/reader/types'

const TYPE_LABELS: Record<string, string> = {
  'key-argument':     '关键论点',
  'vocabulary':       '生词',
  'complex-sentence': '复杂句',
  'related-concept':  '延伸概念',
}

interface Props {
  highlight: Highlight
  source: string
  onDeepen: () => void
}

export function DrawerDetail({ highlight, source, onDeepen }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{highlight.text}</span>
          <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
            {TYPE_LABELS[highlight.type]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDeepen}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-900/50 text-indigo-300"
          >
            💬 深入学习
          </button>
          <VocabButton highlight={highlight} source={source} />
        </div>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">
        🇬🇧 {highlight.preview}
      </p>

      <p className="text-sm text-white/50 leading-relaxed">
        🇨🇳 {/* CN explanation comes from a second /api/concept call — rendered on demand (Task 7) */}
        {highlight.preview /* temporary: show EN preview until CN is fetched */}
      </p>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/DrawerDetail.tsx
git commit -m "feat(reader): add DrawerDetail component"
```

---

## Task 7: `ConceptChat` component

**Files:**
- Create: `src/components/reader/ConceptChat.tsx`

### What it does
Feynman → Socratic chat. On mount, auto-fires first message (`phase: 'explain'`). After user's first reply, all subsequent AI turns use `phase: 'socratic'`.

- [ ] **Write the component**

```tsx
// src/components/reader/ConceptChat.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import type { Highlight } from '@/lib/reader/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  highlight: Highlight
}

export function ConceptChat({ highlight }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const userTurnCount = useRef(0)

  useEffect(() => {
    // Auto-fire Feynman opener on mount
    fireAI(`Please explain the concept "${highlight.text}" to me as if I were your student. Start by asking me to explain it in my own words first.`, 'explain', [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight.text])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fireAI(userText: string, phase: string, history: Message[]) {
    setStreaming(true)
    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const resp = await fetch('/api/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, history, phase }),
      })

      const reader = resp.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const chunk = line.slice(6)
          if (chunk === '[DONE]') break
          const text = chunk.replace(/\\n/g, '\n')
          setMessages(prev => {
            const next = [...prev]
            next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + text }
            return next
          })
        }
      }
    } finally {
      setStreaming(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    userTurnCount.current += 1
    // After first user reply, switch to socratic
    const phase = userTurnCount.current === 1 ? 'socratic' : 'socratic'
    await fireAI(userMsg.content, phase, nextMessages)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'assistant'
                ? 'bg-indigo-950/60 text-white/90 self-start rounded-tl-sm'
                : 'bg-white/10 text-white self-end rounded-tr-sm'
            }`}
          >
            {msg.content || <span className="opacity-40 animate-pulse">●●●</span>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 px-4 py-3 border-t border-white/10">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={streaming}
          placeholder="回答..."
          className="flex-1 bg-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl disabled:opacity-40"
        >
          ↑
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/ConceptChat.tsx
git commit -m "feat(reader): add ConceptChat Feynman/Socratic component"
```

---

## Task 8: `BottomDrawer` component

**Files:**
- Create: `src/components/reader/BottomDrawer.tsx`

### What it does
Animated container. `mode: 'closed' | 'detail' | 'chat'`. Detail = ~220px tall; chat = 60vh. Slides with CSS transform. Renders `DrawerDetail` or `ConceptChat` inside.

- [ ] **Write the component**

```tsx
// src/components/reader/BottomDrawer.tsx
'use client'
import { DrawerDetail } from './DrawerDetail'
import { ConceptChat } from './ConceptChat'
import type { Highlight } from '@/lib/reader/types'

type DrawerMode = 'closed' | 'detail' | 'chat'

interface Props {
  mode: DrawerMode
  highlight: Highlight | null
  source: string
  onDeepen: () => void
  onClose: () => void
}

const HEIGHT: Record<DrawerMode, string> = {
  closed: '0px',
  detail: '220px',
  chat:   '60vh',
}

export function BottomDrawer({ mode, highlight, source, onDeepen, onClose }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#12122a] border-t border-white/10 overflow-hidden transition-all duration-300 z-50"
      style={{ height: HEIGHT[mode] }}
    >
      {mode !== 'closed' && highlight && (
        <>
          {/* Drag handle + close */}
          <div className="flex items-center justify-between px-5 pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto" />
            <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none absolute right-4 top-3">✕</button>
          </div>

          {mode === 'detail' && (
            <DrawerDetail highlight={highlight} source={source} onDeepen={onDeepen} />
          )}

          {mode === 'chat' && (
            <ConceptChat highlight={highlight} />
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/reader/BottomDrawer.tsx
git commit -m "feat(reader): add BottomDrawer animated container"
```

---

## Task 9: `page.tsx` — wire everything together

**Files:**
- Create: `src/app/reader/page.tsx`

- [ ] **Write the page**

```tsx
// src/app/reader/page.tsx
'use client'
import { useState } from 'react'
import { useReaderSession } from '@/lib/reader/use-reader-session'
import { UrlInput } from '@/components/reader/UrlInput'
import { ArticleView } from '@/components/reader/ArticleView'
import { BottomDrawer } from '@/components/reader/BottomDrawer'
import type { Highlight } from '@/lib/reader/types'
import type { SessionSource } from '@/lib/reader/types'

type DrawerMode = 'closed' | 'detail' | 'chat'

export default function ReaderPage() {
  const { status, session, errorMessage, load } = useReaderSession()
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('closed')

  function handleSource(source: SessionSource) {
    setActiveHighlight(null)
    setDrawerMode('closed')
    load(source)
  }

  function handleHighlightClick(h: Highlight) {
    setActiveHighlight(h)
    setDrawerMode('detail')
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      <UrlInput
        onSubmit={handleSource}
        disabled={status === 'loading'}
      />

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: drawerMode === 'chat' ? '60vh' : drawerMode === 'detail' ? '220px' : '0' }}
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/30 text-sm gap-2">
            <span className="text-4xl">📖</span>
            <p>Paste a URL or upload a PDF to start reading</p>
          </div>
        )}

        {status === 'loading' && !session && (
          <div className="flex items-center justify-center h-[60vh] text-white/40 text-sm">
            Extracting article…
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center justify-center h-[60vh] text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        {session && (
          <>
            <div className="max-w-[680px] mx-auto px-6 pt-6 pb-2">
              <h1 className="text-2xl font-bold text-white/90 leading-snug">{session.title}</h1>
              {status === 'loading' && (
                <p className="text-xs text-white/30 mt-1">Detecting highlights…</p>
              )}
            </div>
            <ArticleView
              rawText={session.rawText}
              highlights={session.highlights}
              activeHighlight={activeHighlight}
              onHighlightClick={handleHighlightClick}
            />
          </>
        )}
      </main>

      <BottomDrawer
        mode={drawerMode}
        highlight={activeHighlight}
        source={session?.url ?? ''}
        onDeepen={() => setDrawerMode('chat')}
        onClose={() => { setDrawerMode('closed'); setActiveHighlight(null) }}
      />
    </div>
  )
}
```

- [ ] **Run TypeScript check**

```bash
cd /Users/chenhelen/Documents/Github/heyhelen
./node_modules/.bin/tsc --noEmit 2>&1 | grep -E "reader|Reader"
```
Expected: no errors

- [ ] **Commit**

```bash
git add src/app/reader/page.tsx
git commit -m "feat(reader): wire page with session hook + drawer"
```

---

## Task 10: Smoke test in browser

- [ ] **Start dev server**

```bash
cd /Users/chenhelen/Documents/Github/heyhelen
npm run dev
```

- [ ] **Open http://localhost:3000/reader**

Verify:
1. Empty state shows "Paste a URL" message
2. Paste `https://block.xyz/inside/from-hierarchy-to-intelligence` → Loading state appears
3. Article text appears with title
4. Highlights stream in one by one with coloured underlines
5. Click a highlight → bottom drawer slides up with EN explanation
6. Click "加入词库" → button changes to ✓ 已保存
7. Click "深入学习" → drawer expands to chat, AI asks Feynman question
8. Type a reply → AI responds in Socratic mode
9. Click ✕ → drawer closes

- [ ] **Final commit**

```bash
git add -p   # review any remaining changes
git commit -m "feat(reader): complete reader page MVP"
```
