'use client'
import { useState } from 'react'

interface Props {
  domain: string
  onSuccess: () => void
}

export function BrowserSetupButton({ domain, onSuccess }: Props) {
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
