import type { Highlight } from './types'

export interface TextSegment {
  text: string
  highlight: Highlight | null
}

export function segmentText(raw: string, highlights: Highlight[]): TextSegment[] {
  const sorted = [...highlights].sort((a, b) => a.offset - b.offset)
  const segments: TextSegment[] = []
  let cursor = 0

  for (const h of sorted) {
    if (h.offset > cursor) {
      segments.push({ text: raw.slice(cursor, h.offset), highlight: null })
    }
    segments.push({ text: raw.slice(h.offset, h.offset + h.len), highlight: h })
    cursor = h.offset + h.len
  }

  if (cursor < raw.length) {
    segments.push({ text: raw.slice(cursor), highlight: null })
  }

  return segments
}
