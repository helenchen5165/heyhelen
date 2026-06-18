import { createExtractor, rewriteTwitterUrl } from './extractor'

const ARTICLE_HTML = `
<html>
  <head><title>Howard Marks: On Risk</title></head>
  <body>
    <nav>Site navigation garbage</nav>
    <article>
      <h1>On Risk</h1>
      <p>Understanding risk is the most important thing in investing. Risk means more things can
      happen than will happen. The future is inherently uncertain and investors must grapple with
      that uncertainty every single day. Most people think risk is about losing money, but the
      real risk is not understanding what you own and why you own it. Superior investors know
      that risk control is the most important part of the investment process.</p>
    </article>
  </body>
</html>
`

function makeFetch(html: string, status = 200) {
  return async (_url: string) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => html,
    }) as unknown as Response
}

function fakeParseHtml(html: string, _url: string) {
  // Minimal parser: grab <article> text for tests
  const titleMatch = html.match(/<title>(.*?)<\/title>/)
  const bodyMatch = html.match(/<article>([\s\S]*?)<\/article>/)
  const text = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, '') : ''
  return { title: titleMatch?.[1] ?? '', text, content: html }
}

describe('rewriteTwitterUrl', () => {
  it('rewrites x.com thread URLs to threadreaderapp.com', () => {
    expect(rewriteTwitterUrl('https://x.com/pmarca/status/1234567890123456789'))
      .toBe('https://threadreaderapp.com/thread/1234567890123456789.html')
  })

  it('rewrites twitter.com thread URLs to threadreaderapp.com', () => {
    expect(rewriteTwitterUrl('https://twitter.com/pmarca/status/1234567890123456789'))
      .toBe('https://threadreaderapp.com/thread/1234567890123456789.html')
  })

  it('returns null for non-thread x.com URLs (profile, home)', () => {
    expect(rewriteTwitterUrl('https://x.com/pmarca')).toBeNull()
    expect(rewriteTwitterUrl('https://x.com/home')).toBeNull()
  })

  it('returns null for non-Twitter URLs', () => {
    expect(rewriteTwitterUrl('https://example.com/article')).toBeNull()
  })
})

describe('createExtractor', () => {
  it('extracts title and text from a standard HTML page', async () => {
    const extractor = createExtractor({ fetch: makeFetch(ARTICLE_HTML), parseHtml: fakeParseHtml })

    const result = await extractor.extract({ url: 'https://oaktreecapital.com/memo/on-risk' })

    expect(result.title).toBeTruthy()
    expect(result.text).toContain('Understanding risk')
    expect(result.text.length).toBeGreaterThan(150)
  })

  it('throws when server returns non-200', async () => {
    const extractor = createExtractor({
      fetch: makeFetch('', 404),
      parseHtml: fakeParseHtml,
    })

    await expect(
      extractor.extract({ url: 'https://example.com/missing' })
    ).rejects.toThrow('404')
  })

  it('throws when extracted text is too short', async () => {
    const shortHtml = '<html><body><article><p>Hi</p></article></body></html>'
    const extractor = createExtractor({
      fetch: makeFetch(shortHtml),
      parseHtml: fakeParseHtml,
    })

    await expect(
      extractor.extract({ url: 'https://example.com/stub' })
    ).rejects.toThrow('too short')
  })

  it('extracts an x.com thread by rewriting to threadreaderapp.com', async () => {
    const threadHtml = `
      <html><head><title>Thread by @pmarca</title></head>
      <body><article>
        <p>Software is eating the world. Every industry is being transformed by software.
        The companies that will survive are those that become software companies at their core.
        This is not a tech trend but a fundamental restructuring of the global economy.</p>
      </article></body></html>
    `
    let fetchedUrl = ''
    const mockFetch = async (url: string) => {
      fetchedUrl = url
      return { ok: true, status: 200, text: async () => threadHtml } as unknown as Response
    }

    const extractor = createExtractor({ fetch: mockFetch, parseHtml: fakeParseHtml })
    const result = await extractor.extract({ url: 'https://x.com/pmarca/status/9999999999' })

    expect(fetchedUrl).toBe('https://threadreaderapp.com/thread/9999999999.html')
    expect(result.text).toContain('Software is eating the world')
  })

  it('throws for x.com non-thread, non-article URLs (still unsupported)', async () => {
    const extractor = createExtractor({ fetch: makeFetch(''), parseHtml: fakeParseHtml })
    await expect(
      extractor.extract({ url: 'https://x.com/pmarca' })
    ).rejects.toThrow('not yet supported')
  })

  it('extracts an x.com article via browseFn', async () => {
    const articleResult = {
      title: 'Why I Invest in Uncertainty',
      html: '<article><p>Uncertainty is the source of all alpha.</p></article>',
      text: 'Uncertainty is the source of all alpha.',
    }
    const mockBrowse = jest.fn().mockResolvedValue(articleResult)
    const extractor = createExtractor({ fetch: makeFetch(''), parseHtml: fakeParseHtml, browse: mockBrowse })

    const result = await extractor.extract({ url: 'https://x.com/trq212/article/2061907337154367865' })

    expect(mockBrowse).toHaveBeenCalledWith('https://x.com/trq212/article/2061907337154367865')
    expect(result.title).toBe('Why I Invest in Uncertainty')
    expect(result.text).toContain('Uncertainty is the source of all alpha')
  })

  it('throws "not yet supported" for x.com article when browse not provided', async () => {
    const extractor = createExtractor({ fetch: makeFetch(''), parseHtml: fakeParseHtml })
    await expect(
      extractor.extract({ url: 'https://x.com/trq212/article/2061907337154367865' })
    ).rejects.toThrow('not yet supported')
  })

  it('extracts text from a PDF file via parsePdf', async () => {
    const fakeParsePdf = async (_buf: ArrayBuffer) => ({
      title: 'Oaktree Memo',
      text: 'Risk is not knowing what you are doing. '.repeat(10),
    })

    const extractor = createExtractor({ parsePdf: fakeParsePdf })

    // jsdom Blob lacks arrayBuffer(); use a plain object with the same shape
    const fakeBlob = { arrayBuffer: async () => new ArrayBuffer(0) } as unknown as Blob

    const result = await extractor.extract({
      file: fakeBlob,
      filename: 'memo.pdf',
    })

    expect(result.title).toBe('Oaktree Memo')
    expect(result.text).toContain('Risk is not knowing')
  })
})

describe('createExtractor - pastedHtml source', () => {
  it('extracts text and html from pasted HTML', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    const result = await extractor.extract({
      pastedHtml: `<html><body><article><p>Understanding risk is the most important thing in investing. Risk means more things can happen than will happen. Superior investors know risk control is paramount.</p></article></body></html>`,
      title: 'On Risk',
    })
    expect(result.title).toBe('On Risk')
    expect(result.text).toContain('Understanding risk')
    expect(result.html).toBeTruthy()
  })

  it('falls back to Readability title when title is empty', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    const result = await extractor.extract({
      pastedHtml: `<html><head><title>Marks On Risk</title></head><body><p>Understanding risk is the most important thing in investing. Risk means more things can happen than will happen. Superior investors know risk control is paramount.</p></body></html>`,
      title: '',
    })
    expect(result.text).toContain('Understanding risk')
    expect(result.html).toBeTruthy()
  })

  it('throws when pasted HTML has less than 80 chars of text', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    await expect(
      extractor.extract({ pastedHtml: '<article><p>Too short</p></article>', title: '' })
    ).rejects.toThrow('未能提取到文章内容')
  })
})
