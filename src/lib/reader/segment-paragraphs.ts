import { segmentText, type TextSegment } from './segment-text'
import type { Highlight } from './types'

export interface Paragraph {
  text: string
  segments: TextSegment[]
}

export function segmentParagraphs(rawText: string, highlights: Highlight[]): Paragraph[] {
  const rawParas = rawText.split(/\n\n+/).filter(p => p.trim())
  let cursor = 0

  return rawParas.map(para => {
    const start = rawText.indexOf(para, cursor)
    cursor = start + para.length
    const paraHighlights = highlights
      .filter(h => h.offset >= start && h.offset < start + para.length)
      .map(h => ({ ...h, offset: h.offset - start }))
    return { text: para, segments: segmentText(para, paraHighlights) }
  })
}
