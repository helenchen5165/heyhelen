import { createExtractor } from './extractor'

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
