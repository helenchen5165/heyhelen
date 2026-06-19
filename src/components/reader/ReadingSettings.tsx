'use client'
import { useState } from 'react'

export interface ReaderPrefs {
  fontSize: number        // px, e.g. 18
  lineHeight: number      // unitless multiplier, e.g. 1.8
  fontFamily: 'serif' | 'sans' | 'mono'
  maxWidth: number        // px, e.g. 680
  bionic: boolean         // bold-prefix reading aid
  ruler: boolean          // follow-cursor reading ruler
}

export const DEFAULT_PREFS: ReaderPrefs = {
  fontSize: 18,
  lineHeight: 1.8,
  fontFamily: 'serif',
  maxWidth: 680,
  bionic: false,
  ruler: false,
}

interface Props {
  prefs: ReaderPrefs
  onChange: (next: ReaderPrefs) => void
}

const FONT_OPTIONS: { value: ReaderPrefs['fontFamily']; label: string }[] = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans',  label: 'Sans' },
  { value: 'mono',  label: 'Mono' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function ReadingSettings({ prefs, onChange }: Props) {
  const [open, setOpen] = useState(false)

  function set<K extends keyof ReaderPrefs>(key: K, value: ReaderPrefs[K]) {
    onChange({ ...prefs, [key]: value })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Reading settings"
        className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
          open
            ? 'bg-white/15 text-white'
            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
        }`}
      >
        Aa
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-[#12122a] border border-white/10 rounded-xl shadow-2xl z-50 p-5 flex flex-col gap-5"
          onClick={e => e.stopPropagation()}
        >
          {/* Font size */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-wide">Font size</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => set('fontSize', clamp(prefs.fontSize - 1, 12, 32))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm text-white/80">{prefs.fontSize}px</span>
              <button
                onClick={() => set('fontSize', clamp(prefs.fontSize + 1, 12, 32))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Line height */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-wide">Line spacing</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => set('lineHeight', parseFloat(clamp(prefs.lineHeight - 0.1, 1.2, 2.4).toFixed(1)))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm text-white/80">{prefs.lineHeight.toFixed(1)}</span>
              <button
                onClick={() => set('lineHeight', parseFloat(clamp(prefs.lineHeight + 0.1, 1.2, 2.4).toFixed(1)))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Max width */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-wide">Column width</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => set('maxWidth', clamp(prefs.maxWidth - 40, 400, 960))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                −
              </button>
              <span className="flex-1 text-center text-sm text-white/80">{prefs.maxWidth}px</span>
              <button
                onClick={() => set('maxWidth', clamp(prefs.maxWidth + 40, 400, 960))}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-white/5 text-white/60 hover:bg-white/10 text-base leading-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Font family */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-wide">Typeface</label>
            <div className="flex gap-1">
              {FONT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => set('fontFamily', opt.value)}
                  className={`flex-1 py-1.5 rounded-md text-xs transition-colors ${
                    prefs.fontFamily === opt.value
                      ? 'bg-white/15 text-white'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <ToggleRow
              label="Bionic reading"
              description="Bold word-openers for faster scanning"
              value={prefs.bionic}
              onChange={v => set('bionic', v)}
            />
            <ToggleRow
              label="Reading ruler"
              description="Follow-cursor highlight band"
              value={prefs.ruler}
              onChange={v => set('ruler', v)}
            />
          </div>

          {/* Reset */}
          <button
            onClick={() => onChange(DEFAULT_PREFS)}
            className="text-xs text-white/30 hover:text-white/60 text-center pt-1 transition-colors"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  value: boolean
  onChange: (v: boolean) => void
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-white/80">{label}</span>
        <span className="text-xs text-white/35">{description}</span>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-indigo-500' : 'bg-white/15'
        }`}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  )
}
