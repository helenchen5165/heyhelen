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
