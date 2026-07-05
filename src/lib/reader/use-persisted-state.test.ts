import { renderHook, act } from '@testing-library/react'
import { usePersistedState } from './use-persisted-state'

describe('usePersistedState', () => {
  beforeEach(() => localStorage.clear())

  it('falls back to default when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedState('k', () => 42))
    expect(result.current[0]).toBe(42)
  })

  it('reads a stored JSON value', () => {
    localStorage.setItem('k', '480')
    const { result } = renderHook(() => usePersistedState('k', () => 42))
    expect(result.current[0]).toBe(480)
  })

  it('writes updates back to localStorage', () => {
    const { result } = renderHook(() => usePersistedState('k', () => 42))
    act(() => result.current[1](7))
    expect(localStorage.getItem('k')).toBe('7')
    expect(result.current[0]).toBe(7)
  })

  it('falls back to default on unparseable stored value', () => {
    localStorage.setItem('k', 'not json{')
    const { result } = renderHook(() => usePersistedState('k', () => 42))
    expect(result.current[0]).toBe(42)
  })

  it('reshapes stored values via fromStored (prefs merge)', () => {
    localStorage.setItem('prefs', JSON.stringify({ fontSize: 20 }))
    const defaults = { fontSize: 18, bionic: false }
    const { result } = renderHook(() =>
      usePersistedState('prefs', () => defaults, (s) => ({ ...defaults, ...(s as object) })),
    )
    expect(result.current[0]).toEqual({ fontSize: 20, bionic: false })
  })
})
