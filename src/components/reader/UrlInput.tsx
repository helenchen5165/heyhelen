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
