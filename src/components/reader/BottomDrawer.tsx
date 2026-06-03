'use client'
import { DrawerDetail } from './DrawerDetail'
import { ConceptChat } from './ConceptChat'
import type { Highlight, DrawerMode } from '@/lib/reader/types'

interface Props {
  mode: DrawerMode
  highlight: Highlight | null
  source: string
  chatPhase?: 'explain' | 'translate'
  articleTitle?: string
  onDeepen: () => void
  onClose: () => void
}

const HEIGHT: Record<DrawerMode, string> = {
  closed: '0px',
  detail: '220px',
  chat:   '60vh',
}

export function BottomDrawer({ mode, highlight, source, chatPhase, articleTitle, onDeepen, onClose }: Props) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#12122a] border-t border-white/10 overflow-hidden transition-all duration-300 z-50"
      style={{ height: HEIGHT[mode] }}
    >
      {mode !== 'closed' && highlight && (
        <>
          <div className="relative flex items-center justify-center px-5 pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
            <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none absolute right-4 top-3">✕</button>
          </div>

          {mode === 'detail' && (
            <DrawerDetail highlight={highlight} source={source} onDeepen={onDeepen} />
          )}

          {mode === 'chat' && (
            <ConceptChat highlight={highlight} initialPhase={chatPhase} articleTitle={articleTitle} />
          )}
        </>
      )}
    </div>
  )
}
