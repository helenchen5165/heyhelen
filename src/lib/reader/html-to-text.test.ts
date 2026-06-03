import { htmlToText } from './extractor'

describe('htmlToText', () => {
  it('separates consecutive paragraphs with a blank line', () => {
    const html = '<p>First paragraph.</p><p>Second paragraph.</p>'
    const result = htmlToText(html)
    expect(result).toContain('First paragraph.')
    expect(result).toContain('Second paragraph.')
    // two paragraphs must be separated by \n\n (not run together)
    expect(result).toMatch(/First paragraph\.\s*\n\n\s*Second paragraph\./)
  })

  it('converts <br> to a single newline within a paragraph', () => {
    const html = '<p>Line one.<br>Line two.</p>'
    const result = htmlToText(html)
    expect(result).toMatch(/Line one\.\nLine two\./)
  })

  it('decodes common HTML entities', () => {
    const html = '<p>AT&amp;T &lt;ticker&gt; &quot;quoted&quot; it&apos;s&nbsp;fine</p>'
    const result = htmlToText(html)
    expect(result).toContain('AT&T')
    expect(result).toContain('<ticker>')
    expect(result).toContain('"quoted"')
    expect(result).toContain("it's fine")
  })

  it('strips all remaining HTML tags', () => {
    const html = '<div><strong>Bold</strong> and <em>italic</em> text.</div>'
    const result = htmlToText(html)
    expect(result).not.toMatch(/<[^>]+>/)
    expect(result).toContain('Bold and italic text.')
  })

  it('collapses three or more consecutive newlines into two', () => {
    const html = '<p>A</p><div>B</div><p>C</p>'
    const result = htmlToText(html)
    expect(result).not.toMatch(/\n{3,}/)
  })

  it('treats headings as paragraph breaks', () => {
    const html = '<h2>Title</h2><p>Body text here.</p>'
    const result = htmlToText(html)
    expect(result).toMatch(/Title\s*\n\n\s*Body text here\./)
  })

  it('returns trimmed text with no leading or trailing whitespace', () => {
    const html = '   <p>Content</p>   '
    const result = htmlToText(html)
    expect(result.startsWith(' ')).toBe(false)
    expect(result.endsWith(' ')).toBe(false)
    expect(result).toBe('Content')
  })
})
