'use client'
import { useState, useRef } from 'react'
import type { SessionSource } from '@/lib/reader/types'

interface Props {
  onSubmit: (source: SessionSource) => void
  disabled?: boolean
}

type Mode = 'url' | 'text'

export function UrlInput({ onSubmit, disabled }: Props) {
  const [mode, setMode] = useState<Mode>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (url.trim()) onSubmit({ url: url.trim() })
  }

  function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (text.trim()) onSubmit({ text: text.trim(), title: title.trim() || undefined })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onSubmit({ file, filename: file.name })
  }

  return (
    <div className="border-b border-white/10">
      <div className="flex gap-1 px-4 pt-3">
        {(['url', 'text'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              mode === m ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {m === 'url' ? 'URL / PDF' : '粘贴文本'}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <form onSubmit={handleUrlSubmit} className="flex gap-2 p-4">
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
      ) : (
        <form onSubmit={handleTextSubmit} className="flex flex-col gap-2 p-4">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="标题（可选）"
            disabled={disabled}
            className="bg-white/5 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="粘贴文章或推文内容..."
              disabled={disabled}
              rows={3}
              className="flex-1 bg-white/5 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
            <button
              type="submit"
              disabled={disabled || !text.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-40 self-end"
            >
              Load
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
