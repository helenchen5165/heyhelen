'use client'
import { useState, useCallback } from 'react'
import { segmentParagraphs } from '@/lib/reader/segment-paragraphs'
import { HighlightMark } from './HighlightMark'
import { bionicHTML } from '@/lib/reader/use-bionic'
import type { Highlight } from '@/lib/reader/types'

interface Props {
  rawText: string
  html?: string
  highlights: Highlight[]
  activeHighlight: Highlight | null
  onHighlightClick: (h: Highlight) => void
  onSelectionAction: (text: string, action: 'explain' | 'translate') => void
  bionicEnabled?: boolean
}

interface PopupPos {
  x: number
  y: number
}

export function ArticleView({ rawText, html, highlights, activeHighlight, onHighlightClick, onSelectionAction, bionicEnabled }: Props) {
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

  const hasImages = html ? /pbs\.twimg\.com|twimg\.com/.test(html) : false
  const paragraphs = segmentParagraphs(rawText, highlights)

  // HTML 渲染模式：保留图片和原始格式（x.com 文章等）
  if (hasImages && html) {
    return (
      <div
        className="max-w-[680px] mx-auto px-6 py-8 text-white/90 article-html-view"
        onMouseUp={handleMouseUp}
      >
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          className="prose prose-invert prose-lg max-w-none font-serif leading-8
            [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-6 [&_img]:block [&_img]:relative [&_img]:static
            [&_p]:mb-5 [&_p]:leading-8 [&_p:empty]:hidden
            [&_br+br]:hidden
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-8
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-6
            [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4
            [&_ul]:mb-4 [&_ol]:mb-4 [&_li]:mb-1
            [&_a]:text-blue-400 [&_a]:underline [&_a]:no-underline
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:italic
            [&_div:empty]:hidden [&_span:empty]:hidden"
        />
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
            ) : bionicEnabled ? (
              <span key={i} dangerouslySetInnerHTML={{ __html: bionicHTML(seg.text) }} />
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
