import { useEffect, useRef } from 'react'

export function useRuler(enabled: boolean): void {
  const topRef = useRef<HTMLDivElement | null>(null)
  const lineRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const top = document.createElement('div')
    top.id = 'readerRulerTop'
    top.className = 'reader-ruler-top'

    const line = document.createElement('div')
    line.id = 'readerRulerLine'
    line.className = 'reader-ruler-line'

    const bottom = document.createElement('div')
    bottom.id = 'readerRulerBottom'
    bottom.className = 'reader-ruler-bottom'

    document.body.appendChild(top)
    document.body.appendChild(line)
    document.body.appendChild(bottom)

    topRef.current = top
    lineRef.current = line
    bottomRef.current = bottom

    return () => {
      top.remove()
      line.remove()
      bottom.remove()
      topRef.current = null
      lineRef.current = null
      bottomRef.current = null
    }
  }, [])

  useEffect(() => {
    const lineHeight = 32

    const handleMouseMove = (e: MouseEvent) => {
      const top = topRef.current
      const lineEl = lineRef.current
      const bot = bottomRef.current
      if (!top || !lineEl || !bot) return

      const lineTop = e.clientY - lineHeight / 2
      const lineBottom = e.clientY + lineHeight / 2

      top.style.top = '0'
      top.style.height = Math.max(0, lineTop) + 'px'

      lineEl.style.top = lineTop + 'px'
      lineEl.style.height = lineHeight + 'px'

      bot.style.top = lineBottom + 'px'
      bot.style.height = Math.max(0, window.innerHeight - lineBottom) + 'px'
    }

    if (enabled) {
      document.body.classList.add('reader-ruler-active')
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
    } else {
      document.body.classList.remove('reader-ruler-active')
    }

    return () => {
      document.body.classList.remove('reader-ruler-active')
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [enabled])
}
