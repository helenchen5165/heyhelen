'use client'
import { useState, useEffect, useRef } from 'react'
import { readSSE } from '@/lib/reader/sse'
import type { Highlight } from '@/lib/reader/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  type?: 'translation' | 'context'
}

interface Props {
  highlight: Highlight
  initialPhase?: 'explain' | 'translate'
  articleTitle?: string
  articleText?: string
  onDeepenReady?: (trigger: () => void) => void
}

// Pull a window of surrounding text from the article so the model can resolve
// pronouns, proper nouns, and word-sense ambiguity in the selected snippet.
// Manual selections carry a fake offset (0), so locate by content instead.
function buildContext(articleText: string | undefined, snippet: string, window = 600): string {
  if (!articleText) return ''
  const idx = articleText.indexOf(snippet)
  if (idx < 0) return ''
  const start = Math.max(0, idx - window)
  const end = Math.min(articleText.length, idx + snippet.length + window)
  return articleText.slice(start, end).trim()
}

export function ConceptChat({ highlight, initialPhase = 'explain', articleTitle, articleText, onDeepenReady }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Use a closure-scoped flag so React StrictMode's double-invoke doesn't
  // produce two interleaved streams: the first invocation is cancelled before
  // the second starts.
  useEffect(() => {
    let cancelled = false
    setMessages([])
    setInput('')

    if (initialPhase === 'translate') {
      const text = highlight.text
      const ctx = buildContext(articleText, text)
      const withContext = (snippet: string) =>
        ctx
          ? `（以下是文章上下文，仅供你理解词义和指代，不要翻译或复述它）：\n"""${ctx}"""\n\n请处理下面这句话：\n"${snippet}"`
          : snippet
      ;(async () => {
        await stream(withContext(text), 'translate', [], () => cancelled, 'translation')
        if (!cancelled) {
          await stream(withContext(text), 'context', [], () => cancelled, 'context')
        }
      })()
    } else {
      const userText = `${articleTitle ? `（文章：《${articleTitle}》）\n` : ''}这段话我不太理解：\n\n"${highlight.text}"\n\n请先解释它的含义，再提问帮我加深理解。`
      stream(userText, 'explain', [], () => cancelled)
    }

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight.text, initialPhase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function stream(
    userText: string,
    phase: string,
    history: Message[],
    isCancelled: () => boolean,
    type?: Message['type'],
  ) {
    if (isCancelled()) return
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '', type }])

    try {
      const resp = await fetch('/api/concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, history, phase }),
      })

      for await (const chunk of readSSE(resp.body!)) {
        if (isCancelled() || chunk === '[DONE]') break
        const text = chunk.replace(/\\n/g, '\n')
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { ...next[next.length - 1], content: next[next.length - 1].content + text }
          return next
        })
      }
    } finally {
      if (!isCancelled()) setStreaming(false)
    }
  }

  async function handleSend() {
    if (!input.trim() || streaming) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    await stream(userMsg.content, 'socratic', next, () => false)
  }

  function handleDeepen() {
    if (streaming) return
    const msg = '请用苏格拉底式追问帮我深入理解这个概念。'
    const userMsg: Message = { role: 'user', content: msg }
    const next = [...messages, userMsg]
    setMessages(next)
    stream(msg, 'socratic', next, () => false)
  }

  useEffect(() => {
    onDeepenReady?.(handleDeepen)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, streaming])

  function renderAssistant(msg: Message) {
    const { content, type } = msg
    if (!content) return <span className="px-4 py-2.5 opacity-40 animate-pulse">●●●</span>

    if (type === 'translation') {
      return (
        <div className="px-4 pt-3 pb-4">
          <span className="text-[10px] font-semibold tracking-widest mb-2 block text-indigo-400">译文</span>
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      )
    }

    if (type === 'context') {
      return (
        <div className="px-4 pt-4 pb-3 bg-white/[0.03] rounded-b-xl">
          <span className="text-[10px] font-semibold tracking-widest mb-2 block text-white/40">语境</span>
          <p className="whitespace-pre-wrap leading-relaxed text-white/70">{content}</p>
        </div>
      )
    }

    return <p className="px-4 py-2.5 whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl text-sm leading-relaxed ${
              msg.role === 'assistant'
                ? 'bg-indigo-950/60 text-white/90 self-start rounded-tl-sm'
                : 'bg-white/10 text-white self-end rounded-tr-sm px-4 py-2.5 whitespace-pre-wrap'
            }`}
          >
            {msg.role === 'assistant' ? renderAssistant(msg) : msg.content}
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
          placeholder="回复..."
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
