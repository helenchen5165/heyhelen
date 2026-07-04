import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'

// localStorage-backed useState. Handles the SSR guard, JSON codec, and
// write-back. `fromStored` lets callers reshape a stale stored value
// (e.g. merge saved prefs over new defaults).
export function usePersistedState<T>(
  key: string,
  defaultValue: () => T,
  fromStored: (parsed: unknown) => T = (parsed) => parsed as T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue()
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? fromStored(JSON.parse(raw)) : defaultValue()
    } catch {
      return defaultValue()
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
