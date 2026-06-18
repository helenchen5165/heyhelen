'use client'
import { useState } from 'react'
import Link from 'next/link'

function BrowserSetupButton({ domain, onSuccess }: { domain: string; onSuccess: () => void }) {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  async function handleClick() {
    setPhase('waiting')
    setErrMsg('')
    try {
      const res = await fetch(`/api/reader/browser-setup?domain=${encodeURIComponent(domain)}`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)
      setPhase('done')
      onSuccess()
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
      setPhase('error')
    }
  }

  if (phase === 'waiting') return (
    <div className="text-white/50 text-sm text-center">
      <p>正在从 Chrome 导入 {domain} 登录状态…</p>
    </div>
  )

  if (phase === 'error') return (
    <div className="text-center">
      <p className="text-red-400 text-sm mb-3">{errMsg}</p>
      <button onClick={handleClick} className="px-4 py-2 rounded-lg bg-white/10 text-white/80 text-sm hover:bg-white/20">
        重试
      </button>
    </div>
  )

  return (
    <button
      onClick={handleClick}
      className="px-5 py-2.5 rounded-lg bg-[#1d9bf0] text-white text-sm font-medium hover:bg-[#1a8cd8] transition-colors"
    >
      从 Chrome 导入 {domain} 登录状态 →
    </button>
  )
}
import { useReaderSession } from '@/lib/reader/use-reader-session'
import { UrlInput } from '@/components/reader/UrlInput'
import { ArticleView } from '@/components/reader/ArticleView'
import { BottomDrawer } from '@/components/reader/BottomDrawer'
import type { Highlight, SessionSource, DrawerMode } from '@/lib/reader/types'

export default function ReaderPage() {
  const { status, session, errorMessage, load } = useReaderSession()
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('closed')
  const [chatPhase, setChatPhase] = useState<'explain' | 'translate'>('explain')

  function handleSource(source: SessionSource) {
    setActiveHighlight(null)
    setDrawerMode('closed')
    load(source)
  }

  function handleHighlightClick(h: Highlight) {
    setActiveHighlight(h)
    setDrawerMode('detail')
  }

  function handleSelectionAction(text: string, action: 'explain' | 'translate') {
    const h: Highlight = { type: 'related-concept', text, offset: 0, len: text.length, preview: '' }
    setActiveHighlight(h)
    setChatPhase(action)
    setDrawerMode('chat')
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col">
      <div className="flex items-center justify-between pr-4">
        <UrlInput onSubmit={handleSource} disabled={status === 'loading'} />
        <Link href="/reader/vocabulary" className="shrink-0 text-xs text-white/30 hover:text-white/60 ml-3">词库</Link>
      </div>

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: drawerMode === 'chat' ? '60vh' : drawerMode === 'detail' ? '220px' : '0' }}
      >
        {status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-white/30 text-sm gap-2">
            <span className="text-4xl">📖</span>
            <p>Paste a URL or upload a PDF to start reading</p>
          </div>
        )}

        {status === 'loading' && !session && (
          <div className="flex items-center justify-center h-[60vh] text-white/40 text-sm">
            Extracting article…
          </div>
        )}

        {status === 'error' && errorMessage && (() => {
          const setupMatch = errorMessage.match(/^BROWSER_SETUP_REQUIRED:(.+)$/)
          if (setupMatch) {
            const domain = setupMatch[1]
            return (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-sm">
                <p className="text-white/60">
                  <strong className="text-white">{domain}</strong> 文章需要登录才能读取
                </p>
                <BrowserSetupButton domain={domain} onSuccess={() => window.location.reload()} />
              </div>
            )
          }
          return (
            <div className="flex items-center justify-center h-[60vh] text-red-400 text-sm">
              {errorMessage}
            </div>
          )
        })()}

        {session && (
          <>
            <div className="max-w-[680px] mx-auto px-6 pt-6 pb-2">
              <h1 className="text-2xl font-bold text-white/90 leading-snug">{session.title}</h1>
              {status === 'loading' && (
                <p className="text-xs text-white/30 mt-1">Detecting highlights…</p>
              )}
            </div>
            <ArticleView
              rawText={session.rawText}
              html={session.html}
              highlights={session.highlights}
              activeHighlight={activeHighlight}
              onHighlightClick={handleHighlightClick}
              onSelectionAction={handleSelectionAction}
            />
          </>
        )}
      </main>

      <BottomDrawer
        mode={drawerMode}
        highlight={activeHighlight}
        source={session?.url ?? ''}
        chatPhase={chatPhase}
        articleTitle={session?.title}
        onDeepen={() => { setChatPhase('explain'); setDrawerMode('chat') }}
        onClose={() => { setDrawerMode('closed'); setActiveHighlight(null) }}
      />
    </div>
  )
}
