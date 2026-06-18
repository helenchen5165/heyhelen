'use client'
import { useRef } from 'react'
import { DrawerDetail } from './DrawerDetail'
import { ConceptChat } from './ConceptChat'
import { VocabButton } from './VocabButton'
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
  const deepenTriggerRef = useRef<(() => void) | null>(null)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-[#12122a] border-t border-white/10 overflow-hidden transition-all duration-300 z-50"
      style={{ height: HEIGHT[mode] }}
    >
      {mode !== 'closed' && highlight && (
        <>
          <div className="relative flex items-center justify-center px-5 pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-white/20" />
            <div className="absolute right-4 top-2 flex items-center gap-2">
              {mode === 'chat' && (
                <>
                  <button
                    onClick={() => deepenTriggerRef.current?.()}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/80"
                  >
                    💬 深入学习
                  </button>
                  <VocabButton highlight={highlight} source={source} />
                </>
              )}
              <button onClick={onClose} className="text-white/40 hover:text-white text-lg leading-none">✕</button>
            </div>
          </div>

          {mode === 'detail' && (
            <DrawerDetail highlight={highlight} source={source} onDeepen={onDeepen} />
          )}

          {mode === 'chat' && (
            <ConceptChat
              highlight={highlight}
              initialPhase={chatPhase}
              articleTitle={articleTitle}
              onDeepenReady={(fn) => { deepenTriggerRef.current = fn }}
            />
          )}
        </>
      )}
    </div>
  )
}
