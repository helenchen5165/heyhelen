'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Word {
  id: string
  word: string
  context: string
  source: string
  preview: string
  reviewState: 'unseen' | 'reviewing' | 'learned'
  reviewedAt: string | null
  createdAt: string
}

type ViewMode = 'list' | 'review'

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ViewMode>('list')
  const [reviewQueue, setReviewQueue] = useState<Word[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)

  useEffect(() => {
    fetch('/api/reader/vocabulary')
      .then(r => r.json())
      .then(data => { setWords(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function startReview() {
    const res = await fetch('/api/reader/vocabulary?review=1')
    const queue: Word[] = await res.json()
    setReviewQueue(queue)
    setReviewIndex(0)
    setMode('review')
  }

  async function markReviewed(id: string) {
    await fetch(`/api/reader/vocabulary/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reviewed' }),
    })
    setWords(prev => prev.map(w => w.id === id ? { ...w, reviewState: 'reviewing', reviewedAt: new Date().toISOString() } : w))
  }

  async function markLearned(id: string) {
    await fetch(`/api/reader/vocabulary/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'learned' }),
    })
    setWords(prev => prev.map(w => w.id === id ? { ...w, reviewState: 'learned' } : w))
    setReviewQueue(prev => prev.filter(w => w.id !== id))
    setReviewIndex(i => Math.min(i, reviewQueue.length - 2))
  }

  async function nextWord() {
    const current = reviewQueue[reviewIndex]
    if (current) await markReviewed(current.id)
    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex(i => i + 1)
    } else {
      setMode('list')
    }
  }

  const unseen = words.filter(w => w.reviewState === 'unseen')
  const reviewing = words.filter(w => w.reviewState === 'reviewing')
  const learned = words.filter(w => w.reviewState === 'learned')
  const pendingCount = unseen.length + reviewing.length

  if (mode === 'review') {
    const current = reviewQueue[reviewIndex]
    if (!current) {
      return (
        <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center gap-4">
          <p className="text-white/60 text-sm">复习完成 🎉</p>
          <button onClick={() => setMode('list')} className="text-sm text-indigo-400 hover:text-indigo-300">返回词库</button>
        </div>
      )
    }
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
        <div className="max-w-[600px] mx-auto px-6 py-8 w-full flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <span className="text-xs text-white/30">{reviewIndex + 1} / {reviewQueue.length}</span>
            <button onClick={() => setMode('list')} className="text-xs text-white/30 hover:text-white/60">退出复习</button>
          </div>

          <div className="flex-1 flex flex-col gap-6 justify-center">
            <div className="bg-white/5 rounded-2xl p-6 flex flex-col gap-4">
              <span className="text-2xl font-bold text-white/90">{current.word}</span>
              <p className="text-sm text-white/70 leading-relaxed">{current.preview}</p>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-white/30 italic">"{current.context}"</p>
                {current.source && <p className="text-xs text-white/20 mt-1 truncate">{current.source}</p>}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={nextWord}
                className="flex-1 py-3 bg-white/10 text-white text-sm rounded-xl hover:bg-white/15"
              >
                下一个 →
              </button>
              <button
                onClick={() => markLearned(current.id)}
                className="flex-1 py-3 bg-green-900/50 text-green-400 text-sm rounded-xl hover:bg-green-900/70"
              >
                ✓ 已掌握
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <div className="max-w-[680px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">词库</h1>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button
                onClick={startReview}
                className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
              >
                复习 {pendingCount} 个
              </button>
            )}
            <Link href="/reader" className="text-sm text-white/40 hover:text-white/70">← 返回阅读</Link>
          </div>
        </div>

        {loading && <p className="text-white/40 text-sm">加载中…</p>}

        {!loading && words.length === 0 && (
          <p className="text-white/30 text-sm">还没有保存任何词汇。在阅读时点击「加入词库」开始积累。</p>
        )}

        {unseen.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold tracking-widest text-white/40 mb-4">待学习 · {unseen.length}</h2>
            <ul className="flex flex-col gap-3">
              {unseen.map(w => <WordCard key={w.id} word={w} onReview={markReviewed} />)}
            </ul>
          </section>
        )}

        {reviewing.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold tracking-widest text-amber-400/60 mb-4">复习中 · {reviewing.length}</h2>
            <ul className="flex flex-col gap-3">
              {reviewing.map(w => <WordCard key={w.id} word={w} onLearned={markLearned} />)}
            </ul>
          </section>
        )}

        {learned.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold tracking-widest text-green-400/40 mb-4">已掌握 · {learned.length}</h2>
            <ul className="flex flex-col gap-3 opacity-40">
              {learned.map(w => <WordCard key={w.id} word={w} />)}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function WordCard({
  word,
  onReview,
  onLearned,
}: {
  word: Word
  onReview?: (id: string) => void
  onLearned?: (id: string) => void
}) {
  return (
    <li className="bg-white/5 rounded-xl px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold text-white/90">{word.word}</span>
        <div className="flex gap-2 shrink-0">
          {onReview && (
            <button
              onClick={() => onReview(word.id)}
              className="px-2.5 py-1 text-xs rounded-md bg-indigo-900/40 text-indigo-400 hover:bg-indigo-900/60"
            >
              开始复习
            </button>
          )}
          {onLearned && (
            <button
              onClick={() => onLearned(word.id)}
              className="px-2.5 py-1 text-xs rounded-md bg-green-900/40 text-green-400 hover:bg-green-900/60"
            >
              ✓ 已掌握
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-white/60 leading-relaxed">{word.preview}</p>
      <p className="text-xs text-white/30 italic">"{word.context}"</p>
      {word.source && <p className="text-xs text-white/20 truncate">{word.source}</p>}
    </li>
  )
}
