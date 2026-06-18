import { extractContent } from './browser-extractor'

const X_ARTICLE_HTML = `
<html><body>
<article>
  <nav>Site nav garbage</nav>
  <svg aria-label="icon"><path/></svg>
  <div role="group">Like Reply Retweet buttons</div>
  <div data-testid="User-Name">@author</div>
  <p>Understanding risk is the most important thing in investing.</p>
  <p>Risk means more things can happen than will happen.</p>
  <img src="https://pbs.twimg.com/media/article_image.jpg" alt="chart">
  <img src="https://abs.twimg.com/emoji/v2/😀.png" alt="emoji">
  <p>Superior investors know that risk control is paramount.</p>
</article>
</body></html>
`

const PLAIN_HTML = `
<html>
  <head><title>Howard Marks: On Risk</title></head>
  <body>
    <p>Understanding risk is the most important thing in investing.</p>
    <p>Risk means more things can happen than will happen.</p>
  </body>
</html>
`

describe('extractContent', () => {
  it('extracts text from article element', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.text).toContain('Understanding risk')
    expect(result.text).toContain('Superior investors')
  })

  it('removes UI chrome (nav, svg, role=group, data-testid=User-Name)', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.html).not.toContain('Site nav garbage')
    expect(result.html).not.toContain('Like Reply Retweet')
    expect(result.html).not.toContain('@author')
    expect(result.html).not.toContain('<svg')
  })

  it('keeps pbs.twimg.com images, removes icon images', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.html).toContain('pbs.twimg.com/media/article_image.jpg')
    expect(result.html).not.toContain('abs.twimg.com')
  })

  it('falls back to Readability when no article/main element', () => {
    const result = extractContent(PLAIN_HTML, '')
    expect(result.text).toContain('Understanding risk')
    expect(result.text.length).toBeGreaterThan(20)
  })

  it('uses browserTitle when HTML has no extractable title', () => {
    const result = extractContent(X_ARTICLE_HTML, 'My Article Title')
    expect(result.title).toBe('My Article Title')
  })
})
