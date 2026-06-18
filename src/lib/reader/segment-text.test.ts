import { segmentText } from './segment-text'
import type { Highlight } from './types'

const h1: Highlight = { type: 'key-argument',  text: 'Markets are efficient', offset: 0,  len: 21, preview: 'Core claim.' }
const h2: Highlight = { type: 'vocabulary',    text: 'idiosyncratic',          offset: 30, len: 13, preview: 'Unique to one.' }

const RAW = 'Markets are efficient because idiosyncratic risks cancel out.'

describe('segmentText', () => {
  it('returns one segment when no highlights', () => {
    const segs = segmentText(RAW, [])
    expect(segs).toEqual([{ text: RAW, highlight: null }])
  })

  it('wraps highlighted ranges and fills gaps', () => {
    const segs = segmentText(RAW, [h1, h2])
    expect(segs).toEqual([
      { text: 'Markets are efficient', highlight: h1 },
      { text: ' because ',            highlight: null },
      { text: 'idiosyncratic',        highlight: h2 },
      { text: ' risks cancel out.',   highlight: null },
    ])
    expect(segs.map(s => s.text).join('')).toBe(RAW)
  })

  it('sorts highlights by offset before segmenting', () => {
    const segs = segmentText(RAW, [h2, h1]) // reversed order
    expect(segs[0].highlight).toBe(h1)
    expect(segs[2].highlight).toBe(h2)
  })

  it('handles highlight at the very end of text', () => {
    const h: Highlight = { type: 'vocabulary', text: 'out.', offset: 57, len: 4, preview: '' }
    const segs = segmentText(RAW, [h])
    expect(segs.at(-1)).toEqual({ text: 'out.', highlight: h })
    expect(segs.map(s => s.text).join('')).toBe(RAW)
  })
})
