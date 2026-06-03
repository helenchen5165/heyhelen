'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Word {
  id: string
  word: string
  context: string
  source: string
  preview: string
  reviewedAt: string | null
  createdAt: string
}

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reader/vocabulary')
      .then(r => r.json())
      .then(data => { setWords(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function markReviewed(id: string) {
    await fetch(`/api/reader/vocabulary/${id}`, { method: 'PATCH' })
    setWords(prev => prev.map(w => w.id === id ? { ...w, reviewedAt: new Date().toISOString() } : w))
  }

  const pending = words.filter(w => !w.reviewedAt)
  const reviewed = words.filter(w => w.reviewedAt)

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">词库</h1>
          <Link href="/reader" className="text-sm text-white/40 hover:text-white/70">← 返回阅读</Link>
        </div>

        {loading && <p className="text-white/40 text-sm">加载中…</p>}

        {!loading && words.length === 0 && (
          <p className="text-white/30 text-sm">还没有保存任何词汇。在阅读时点击「加入词库」开始积累。</p>
        )}

        {pending.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold tracking-widest text-white/40 mb-4">待复习 · {pending.length}</h2>
            <ul className="flex flex-col gap-3">
              {pending.map(w => <WordCard key={w.id} word={w} onReview={markReviewed} />)}
            </ul>
          </section>
        )}

        {reviewed.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-white/40 mb-4">已复习 · {reviewed.length}</h2>
            <ul className="flex flex-col gap-3 opacity-50">
              {reviewed.map(w => <WordCard key={w.id} word={w} />)}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function WordCard({ word, onReview }: { word: Word; onReview?: (id: string) => void }) {
  return (
    <li className="bg-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-white/90">{word.word}</span>
        {onReview && (
          <button
            onClick={() => onReview(word.id)}
            className="shrink-0 px-2.5 py-1 text-xs rounded-md bg-green-900/40 text-green-400 hover:bg-green-900/60"
          >
            ✓ 已复习
          </button>
        )}
      </div>
      <p className="text-sm text-white/60 leading-relaxed">{word.preview}</p>
      <p className="text-xs text-white/30 italic">"{word.context}"</p>
      {word.source && (
        <p className="text-xs text-white/20 truncate">{word.source}</p>
      )}
    </li>
  )
}
