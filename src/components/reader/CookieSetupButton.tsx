'use client'
import { useState, useEffect } from 'react'

interface Props {
  domain?: string
}

export function CookieSetupButton({ domain = 'x.com' }: Props) {
  const [open, setOpen]           = useState(false)
  const [connected, setConnected] = useState(false)
  const [cookieCount, setCookieCount] = useState(0)
  const [raw, setRaw]             = useState('')
  const [status, setStatus]       = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errMsg, setErrMsg]       = useState('')

  useEffect(() => {
    fetch(`/api/reader/browser-cookies?domain=${encodeURIComponent(domain)}`)
      .then(r => r.json())
      .then((d: { connected: boolean; count: number }) => {
        setConnected(d.connected)
        setCookieCount(d.count)
      })
      .catch(() => {})
  }, [domain])

  async function handleSave() {
    setStatus('saving')
    setErrMsg('')
    let parsed: unknown[]
    try {
      parsed = JSON.parse(raw.trim())
      if (!Array.isArray(parsed)) throw new Error('Expected a JSON array')
    } catch (e) {
      setErrMsg(`JSON parse error: ${e instanceof Error ? e.message : String(e)}`)
      setStatus('error')
      return
    }
    try {
      const res = await fetch('/api/reader/browser-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, cookies: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`)
      setConnected(true)
      setCookieCount(data.count)
      setStatus('saved')
      setRaw('')
      setTimeout(() => setOpen(false), 1200)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
      setStatus('error')
    }
  }

  async function handleDisconnect() {
    await fetch(`/api/reader/browser-cookies?domain=${encodeURIComponent(domain)}`, { method: 'DELETE' })
    setConnected(false)
    setCookieCount(0)
    setStatus('idle')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`shrink-0 text-xs ml-3 px-2 py-1 rounded-md transition-colors ${
          connected
            ? 'text-green-400 bg-green-900/30 hover:bg-green-900/50'
            : 'text-white/40 hover:text-white/70 hover:bg-white/10'
        }`}
        title={connected ? `x.com: ${cookieCount} cookies saved` : 'Connect x.com'}
      >
        {connected ? '🔑 x.com ✓' : '🔑 x.com'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md mx-4 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Connect x.com</h2>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>

            {connected ? (
              <div className="flex flex-col gap-3">
                <p className="text-green-400 text-sm">✓ Connected — {cookieCount} cookies saved</p>
                <button
                  onClick={handleDisconnect}
                  className="text-red-400 text-xs hover:text-red-300 text-left"
                >
                  Disconnect (clear saved cookies)
                </button>
              </div>
            ) : (
              <>
                <div className="bg-black/30 rounded-xl p-4 text-xs text-white/60 leading-relaxed flex flex-col gap-2">
                  <p className="font-semibold text-white/80">如何导出 x.com cookies：</p>
                  <ol className="list-decimal list-inside flex flex-col gap-1">
                    <li>Chrome 安装扩展 <span className="text-blue-400">Cookie-Editor</span></li>
                    <li>打开 x.com（已登录状态）</li>
                    <li>点击 Cookie-Editor 图标 → Export → Export as JSON</li>
                    <li>复制输出的 JSON，粘贴到下方</li>
                  </ol>
                </div>

                <textarea
                  value={raw}
                  onChange={e => { setRaw(e.target.value); setStatus('idle'); setErrMsg('') }}
                  placeholder='[{"name":"auth_token","value":"...","domain":".x.com",...}]'
                  rows={6}
                  className="w-full bg-black/30 rounded-xl px-4 py-3 text-xs text-white/80 placeholder-white/20 outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-none"
                />

                {errMsg && <p className="text-red-400 text-xs">{errMsg}</p>}
                {status === 'saved' && <p className="text-green-400 text-xs">✓ Saved! Reloading…</p>}

                <button
                  onClick={handleSave}
                  disabled={!raw.trim() || status === 'saving'}
                  className="px-4 py-2.5 bg-blue-600 text-white text-sm rounded-xl disabled:opacity-40 hover:bg-blue-500 transition-colors"
                >
                  {status === 'saving' ? 'Saving…' : 'Save cookies'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
