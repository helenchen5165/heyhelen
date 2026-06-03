import { segmentParagraphs } from './segment-paragraphs'
import type { Highlight } from './types'

const h = (text: string, offset: number): Highlight => ({
  type: 'vocabulary',
  text,
  offset,
  len: text.length,
  preview: '',
})

describe('segmentParagraphs', () => {
  it('splits text into one paragraph per \\n\\n block', () => {
    const result = segmentParagraphs('First para.\n\nSecond para.', [])
    expect(result).toHaveLength(2)
    expect(result[0].text).toBe('First para.')
    expect(result[1].text).toBe('Second para.')
  })

  it('assigns a highlight to the paragraph that contains its offset', () => {
    const raw = 'Hello world.\n\nGoodbye world.'
    // 'world' in second paragraph starts at offset 21
    const result = segmentParagraphs(raw, [h('world', 21)])
    expect(result[0].segments.every(s => s.highlight === null)).toBe(true)
    expect(result[1].segments.some(s => s.highlight !== null)).toBe(true)
  })

  it('adjusts highlight offset to be relative to the paragraph start', () => {
    const raw = 'First.\n\nHello world.'
    // 'world' at absolute offset 14
    const result = segmentParagraphs(raw, [h('world', 14)])
    const highlighted = result[1].segments.find(s => s.highlight !== null)
    expect(highlighted?.text).toBe('world')
  })

  it('produces a plain text segment spanning the full paragraph when no highlights', () => {
    const result = segmentParagraphs('Just text.', [])
    expect(result[0].segments).toHaveLength(1)
    expect(result[0].segments[0].text).toBe('Just text.')
    expect(result[0].segments[0].highlight).toBeNull()
  })

  it('filters blank lines and does not produce empty paragraphs', () => {
    const result = segmentParagraphs('A\n\n\n\nB', [])
    expect(result).toHaveLength(2)
  })
})
