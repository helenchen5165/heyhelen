import { VocabButton } from './VocabButton'
import type { Highlight } from '@/lib/reader/types'

const TYPE_LABELS: Record<string, string> = {
  'key-argument':     '关键论点',
  'vocabulary':       '生词',
  'complex-sentence': '复杂句',
  'related-concept':  '延伸概念',
}

interface Props {
  highlight: Highlight
  source: string
  onDeepen: () => void
}

export function DrawerDetail({ highlight, source, onDeepen }: Props) {
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{highlight.text}</span>
          <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">
            {TYPE_LABELS[highlight.type]}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDeepen}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-900/50 text-indigo-300"
          >
            💬 深入学习
          </button>
          <VocabButton highlight={highlight} source={source} />
        </div>
      </div>

      <p className="text-sm text-white/80 leading-relaxed">
        🇬🇧 {highlight.preview}
      </p>

      <p className="text-sm text-white/50 leading-relaxed">
        🇨🇳 {highlight.preview}
      </p>
    </div>
  )
}
