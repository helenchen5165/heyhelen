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
