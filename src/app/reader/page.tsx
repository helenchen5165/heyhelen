'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useReaderSession } from '@/lib/reader/use-reader-session'
import { UrlInput } from '@/components/reader/UrlInput'
import { ArticleView } from '@/components/reader/ArticleView'
import { BottomDrawer } from '@/components/reader/BottomDrawer'
import { BrowserSetupButton } from '@/components/reader/BrowserSetupButton'
import { CookieSetupButton } from '@/components/reader/CookieSetupButton'
import { ReadingSettings, DEFAULT_PREFS } from '@/components/reader/ReadingSettings'
import { useRuler } from '@/lib/reader/use-ruler'
import { usePersistedState } from '@/lib/reader/use-persisted-state'
import type { Highlight, SessionSource, DrawerMode } from '@/lib/reader/types'
import type { ReaderPrefs } from '@/components/reader/ReadingSettings'

const FONT_FAMILIES: Record<ReaderPrefs['fontFamily'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans:  'system-ui, -apple-system, sans-serif',
  mono:  '"JetBrains Mono", "Fira Code", monospace',
}

function defaultChatHeight(): number {
  return typeof window === 'undefined' ? 480 : Math.round(window.innerHeight * 0.6)
}

export default function ReaderPage() {
  const { status, session, errorMessage, load, restoreLatest } = useReaderSession()
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null)
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('closed')
  const [chatPhase, setChatPhase] = useState<'explain' | 'translate'>('explain')
  const [chatHeight, setChatHeight] = usePersistedState<number>(
    'heyhelen_drawer_height',
    defaultChatHeight,
    (stored) => (typeof stored === 'number' && Number.isFinite(stored) ? stored : defaultChatHeight()),
  )
  const [prefs, setPrefs] = usePersistedState<ReaderPrefs>(
    'heyhelen_reader_prefs',
    () => DEFAULT_PREFS,
    (stored) => ({ ...DEFAULT_PREFS, ...(stored as Partial<ReaderPrefs>) }),
  )

  useRuler(prefs.ruler)

  // 回访恢复：打开页面即载入上次阅读的文章（含缓存的高亮）
  useEffect(() => {
    restoreLatest()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // Don't intercept paste in input/textarea elements (e.g. URL input)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (status === 'loading') return
      const types = Array.from(e.clipboardData?.types ?? [])
      if (!types.includes('text/html')) return
      const html = e.clipboardData!.getData('text/html')
      if (!html.trim()) return
      e.preventDefault()
      load({ pastedHtml: html })
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [status, load])

  const setupMatch = status === 'error' && errorMessage
    ? errorMessage.match(/^BROWSER_SETUP_REQUIRED:(.+)$/)
    : null

  return (
    <div
      className="min-h-screen bg-[#0d0d0d] text-white flex flex-col"
      style={{
        fontFamily: FONT_FAMILIES[prefs.fontFamily],
        fontSize: prefs.fontSize,
        lineHeight: prefs.lineHeight,
      }}
    >
      <div className="flex items-center justify-between pr-4">
        <UrlInput onSubmit={handleSource} disabled={status === 'loading'} />
        <CookieSetupButton domain="x.com" />
        <ReadingSettings prefs={prefs} onChange={setPrefs} />
        <Link href="/reader/vocabulary" className="shrink-0 text-xs text-white/30 hover:text-white/60 ml-3">词库</Link>
      </div>

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: drawerMode === 'chat' ? `${chatHeight}px` : drawerMode === 'detail' ? '220px' : '0' }}
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

        {status === 'error' && setupMatch && (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-sm">
            <p className="text-white/60">
              <strong className="text-white">{setupMatch[1]}</strong> 文章需要登录才能读取
            </p>
            <BrowserSetupButton domain={setupMatch[1]} onSuccess={() => window.location.reload()} />
          </div>
        )}

        {status === 'error' && !setupMatch && errorMessage && (
          <div className="flex items-center justify-center h-[60vh] text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

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
              bionicEnabled={prefs.bionic}
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
        articleText={session?.rawText}
        chatHeight={chatHeight}
        onResize={setChatHeight}
        onDeepen={() => { setChatPhase('explain'); setDrawerMode('chat') }}
        onClose={() => { setDrawerMode('closed'); setActiveHighlight(null) }}
      />
    </div>
  )
}
