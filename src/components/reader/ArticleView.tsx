'use client'
import { useState, useCallback } from 'react'
import { segmentParagraphs } from '@/lib/reader/segment-paragraphs'
import { HighlightMark } from './HighlightMark'
import type { Highlight } from '@/lib/reader/types'

interface Props {
  rawText: string
  highlights: Highlight[]
  activeHighlight: Highlight | null
  onHighlightClick: (h: Highlight) => void
  onSelectionAction: (text: string, action: 'explain' | 'translate') => void
}

interface PopupPos {
  x: number
  y: number
}

export function ArticleView({ rawText, highlights, activeHighlight, onHighlightClick, onSelectionAction }: Props) {
  const [selectionText, setSelectionText] = useState('')
  const [popupPos, setPopupPos] = useState<PopupPos | null>(null)

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim() ?? ''
    if (text.length > 1 && sel && sel.rangeCount > 0) {
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      setSelectionText(text)
      setPopupPos({ x: rect.left + rect.width / 2, y: rect.top })
    } else {
      setSelectionText('')
      setPopupPos(null)
    }
  }, [])

  function handleAction(action: 'explain' | 'translate') {
    window.getSelection()?.removeAllRanges()
    setPopupPos(null)
    onSelectionAction(selectionText, action)
  }

  const paragraphs = segmentParagraphs(rawText, highlights)

  return (
    <div
      className="max-w-[680px] mx-auto px-6 py-8 font-serif text-lg leading-8 text-white/90"
      onMouseUp={handleMouseUp}
    >
      {paragraphs.map((para, pi) => (
        <p key={pi} className="mb-5">
          {para.segments.map((seg, i) =>
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
        </p>
      ))}

      {popupPos && (
        <div
          className="fixed z-50 flex gap-1 bg-[#1e1e3a] border border-white/20 rounded-lg shadow-xl px-2 py-1.5"
          style={{
            left: popupPos.x,
            top: popupPos.y - 8,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
        >
          <button
            onMouseDown={e => { e.preventDefault(); handleAction('explain') }}
            className="px-3 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            解释
          </button>
          <button
            onMouseDown={e => { e.preventDefault(); handleAction('translate') }}
            className="px-3 py-1 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            翻译
          </button>
        </div>
      )}
    </div>
  )
}
