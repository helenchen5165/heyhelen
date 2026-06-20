'use client'
import { useRef, useState, useCallback } from 'react'
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
  chatHeight: number
  onResize: (height: number) => void
  onDeepen: () => void
  onClose: () => void
}

const DETAIL_HEIGHT = 220

export function BottomDrawer({ mode, highlight, source, chatPhase, articleTitle, chatHeight, onResize, onDeepen, onClose }: Props) {
  const deepenTriggerRef = useRef<(() => void) | null>(null)
  const [dragging, setDragging] = useState(false)

  // 监听器绑在 window 上：拖动每次 onResize 都会触发 re-render，绑在把手节点上的
  // 监听会因节点被 React 处理 / pointer capture 释放而中断；window 是全局对象，跨 re-render 必然存活
  const startResize = useCallback((e: React.PointerEvent) => {
    if (mode !== 'chat') return
    e.preventDefault()
    const startY = e.clientY
    const startHeight = chatHeight
    setDragging(true)
    document.body.style.userSelect = 'none'

    const onMove = (ev: PointerEvent) => {
      const delta = startY - ev.clientY // 向上拖为正 → 变高
      const next = Math.min(Math.max(startHeight + delta, 180), window.innerHeight * 0.9)
      onResize(Math.round(next))
    }
    const onUp = () => {
      setDragging(false)
      document.body.style.userSelect = ''
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [mode, chatHeight, onResize])

  const height = mode === 'closed' ? 0 : mode === 'detail' ? DETAIL_HEIGHT : chatHeight

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[#12122a] border-t border-white/10 overflow-hidden z-50 flex flex-col ${dragging ? '' : 'transition-all duration-300'}`}
      style={{ height: `${height}px` }}
    >
      {mode !== 'closed' && highlight && (
        <>
          <div className="relative shrink-0">
            <div
              onPointerDown={mode === 'chat' ? startResize : undefined}
              className={`group flex items-center justify-center h-7 ${mode === 'chat' ? 'cursor-ns-resize bg-white/[0.04] hover:bg-white/10' : ''} transition-colors`}
              style={mode === 'chat' ? { touchAction: 'none' } : undefined}
              title={mode === 'chat' ? '拖动调整抽屉高度' : undefined}
            >
              <div className={`w-16 h-1.5 rounded-full bg-white/40 ${mode === 'chat' ? 'group-hover:bg-white/80' : ''} transition-colors`} />
            </div>
            <div className="absolute right-4 top-1.5 flex items-center gap-2">
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
            <div className="flex-1 min-h-0 overflow-y-auto">
              <DrawerDetail highlight={highlight} source={source} onDeepen={onDeepen} />
            </div>
          )}

          {mode === 'chat' && (
            <div className="flex-1 min-h-0">
              <ConceptChat
                highlight={highlight}
                initialPhase={chatPhase}
                articleTitle={articleTitle}
                onDeepenReady={(fn) => { deepenTriggerRef.current = fn }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
