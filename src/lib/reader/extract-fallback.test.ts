import { extractContent } from './browser-extractor'

// 提取器的健壮性契约：无论剪贴板 HTML 多奇形怪状，都不允许抛异常，
// 且尽量保留用户内容（2026-07 x.com 文章粘贴曾触发 Readability 崩溃）。
describe('extractContent never throws on weird clipboard HTML', () => {
  const LONG = '这是一段足够长的正文内容用来通过八十字符的门槛继续写继续写继续写继续写继续写继续写继续写继续写'

  const cases: Record<string, string> = {
    'plain fragment': `<meta charset="utf-8"><div>${LONG}<br><br>${LONG}</div>`,
    'bare text no wrapper': `${LONG}<br><br>${LONG}`,
    'article with broken nesting': `<article><div>${LONG}</div><div style="position: absolute"><img src="https://pbs.twimg.com/media/x?format=jpg"></div></article>`,
    'empty-ish': '<div>   </div>',
    'script-laden': `<script>var x=null;</script><style>.a{}</style><p>${LONG}</p>`,
  }

  for (const [name, html] of Object.entries(cases)) {
    it(`${name} → returns without throwing`, () => {
      const r = extractContent(html, 'T')
      expect(typeof r.html).toBe('string')
      expect(typeof r.text).toBe('string')
    })
  }

  it('keeps user content when Readability crashes (fallback path)', () => {
    // 通过 mock 让 Readability 稳定复现崩溃，验证降级保内容
    jest.isolateModules(() => {
      jest.doMock('@mozilla/readability', () => ({
        Readability: class { parse() { throw new TypeError("Cannot read properties of null (reading 'tagName')") } },
      }))
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractContent: ec } = require('./browser-extractor') as typeof import('./browser-extractor')
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const r = ec(`<script>bad()</script><p>${LONG}</p>`, 'T')
      expect(r.text).toContain('足够长的正文')
      expect(r.html).not.toContain('<script>')
      expect(spy).toHaveBeenCalled()
      spy.mockRestore()
      jest.dontMock('@mozilla/readability')
    })
  })
})
