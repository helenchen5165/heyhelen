import type { Highlight } from '@/lib/reader/types'

const STYLES: Record<string, { underline: string; bg: string; borderStyle: string }> = {
  'key-argument':     { underline: '#7ec668', bg: 'rgba(126,198,104,0.15)', borderStyle: 'solid' },
  'vocabulary':       { underline: '#64a8e0', bg: 'rgba(100,168,224,0.15)', borderStyle: 'solid' },
  'complex-sentence': { underline: '#e09664', bg: 'rgba(224,150,100,0.15)', borderStyle: 'dashed' },
  'related-concept':  { underline: '#b482dc', bg: 'rgba(180,130,220,0.15)', borderStyle: 'dotted' },
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
