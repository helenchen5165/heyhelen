'use client'
import { useState, useEffect, useRef } from 'react'
import type { Highlight } from '@/lib/reader/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  highlight: Highlight
  initialPhase?: 'explain' | 'translate'
  articleTitle?: string
}

export function ConceptChat({ highlight, initialPhase = 'explain', articleTitle }: Props) {
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

    const userText = initialPhase === 'translate'
      ? `请翻译并解释这段英文：\n\n"${highlight.text}"`
      : `${articleTitle ? `（文章：《${articleTitle}》）\n` : ''}这段话我不太理解：\n\n"${highlight.text}"\n\n请先解释它的含义，再提问帮我加深理解。`

    stream(userText, initialPhase === 'translate' ? 'translate' : 'explain', [], () => cancelled)

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
  ) {
    if (isCancelled()) return
    setStreaming(true)
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

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
        if (isCancelled()) break
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
          if (!isCancelled()) {
            setMessages(prev => {
              const next = [...prev]
              next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + text }
              return next
            })
          }
        }
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

  function renderAssistant(content: string) {
    if (!content) return <span className="px-4 py-2.5 opacity-40 animate-pulse">●●●</span>

    const translationMatch = content.match(/<译文>([\s\S]*?)(?:<\/译文>|$)/)
    const contextMatch = content.match(/<语境>([\s\S]*?)(?:<\/语境>|$)/)

    if (!translationMatch && !contextMatch) {
      return <p className="px-4 py-2.5 whitespace-pre-wrap">{content}</p>
    }

    const sections = [
      translationMatch ? { label: '译文', body: translationMatch[1].trim(), accent: true } : null,
      contextMatch    ? { label: '语境', body: contextMatch[1].trim(),    accent: false } : null,
    ].filter(Boolean) as { label: string; body: string; accent: boolean }[]

    return (
      <div className="flex flex-col divide-y divide-white/10">
        {sections.map((s, i) => (
          <div key={i} className="px-4 py-3">
            <span className={`text-[10px] font-semibold tracking-widest mb-1.5 block ${
              s.accent ? 'text-indigo-400' : 'text-white/40'
            }`}>{s.label}</span>
            <p className="whitespace-pre-wrap leading-relaxed">
              {s.body || <span className="opacity-40 animate-pulse">●●●</span>}
            </p>
          </div>
        ))}
      </div>
    )
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
            {msg.role === 'assistant'
              ? renderAssistant(msg.content)
              : msg.content}
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
