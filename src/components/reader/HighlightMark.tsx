import type { Highlight } from '@/lib/reader/types'

// Conceptual group: key-argument + related-concept → amber
// Language group:   vocabulary + complex-sentence  → blue
const STYLES: Record<string, { underline: string; bg: string; borderStyle: string }> = {
  'key-argument':     { underline: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  borderStyle: 'solid' },
  'related-concept':  { underline: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  borderStyle: 'dotted' },
  'vocabulary':       { underline: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  borderStyle: 'solid' },
  'complex-sentence': { underline: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  borderStyle: 'dashed' },
}

interface Props {
  highlight: Highlight
  active: boolean
  onClick: (h: Highlight) => void
}

export function HighlightMark({ highlight, active, onClick }: Props) {
  const s = STYLES[highlight.type]
  return (
    <mark
      onClick={() => onClick(highlight)}
      style={{
        background: s.bg,
        color: 'inherit',
        borderBottom: `2px ${s.borderStyle} ${s.underline}`,
        borderRadius: '2px',
        padding: '1px 1px',
        cursor: 'pointer',
        outline: active ? `2px solid ${s.underline}` : 'none',
        outlineOffset: '2px',
      }}
    >
      {highlight.text}
    </mark>
  )
}
