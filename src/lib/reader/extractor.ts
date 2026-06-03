import type { Extractor, SessionSource } from './types'

type FetchFn = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'text' | 'arrayBuffer'>>
type ParsePdfFn = (buffer: ArrayBuffer) => Promise<{ title: string; text: string }>
type ParseHtmlFn = (html: string, url: string) => { title: string; text: string; content: string }

interface ExtractorDeps {
  fetch?: FetchFn
  parsePdf?: ParsePdfFn
  parseHtml?: ParseHtmlFn
}

const SPA_DOMAINS = new Set([
  'x.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'facebook.com',
  'threads.net',
])

export function createExtractor(deps?: ExtractorDeps): Extractor {
  const fetchFn = deps?.fetch ?? ((url) => fetch(url))
  const parsePdfFn = deps?.parsePdf ?? defaultParsePdf
  const parseHtmlFn = deps?.parseHtml ?? defaultParseHtml

  return {
    async extract(source: SessionSource) {
      if ('text' in source) {
        const text = source.text.trim()
        return { title: source.title ?? '', text, html: `<pre>${text}</pre>` }
      }

      if ('file' in source) {
        const buffer = await (source.file as Blob).arrayBuffer()
        const { title, text } = await parsePdfFn(buffer)
        return { title, text, html: `<pre>${text}</pre>` }
      }

      const { url } = source
      const hostname = new URL(url).hostname.replace(/^www\./, '')

      if (SPA_DOMAINS.has(hostname)) {
        throw new Error(`Browser rendering required for ${hostname} — not yet supported`)
      }

      const resp = await fetchFn(url)
      if (!resp.ok) {
        throw new Error(`Failed to extract content: server returned ${resp.status}`)
      }

      const html = await resp.text()
      const parsed = parseHtmlFn(html, url)

      if (!parsed.text || parsed.text.trim().length < 150) {
        throw new Error('Failed to extract content: page text too short or unreadable')
      }

      return {
        title: parsed.title,
        text: parsed.text.trim(),
        html: parsed.content,
      }
    },
  }
}

function defaultParseHtml(html: string, url: string): { title: string; text: string; content: string } {
  // Dynamic import keeps jsdom out of the module graph until runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { JSDOM } = require('jsdom') as typeof import('jsdom')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Readability } = require('@mozilla/readability') as typeof import('@mozilla/readability')
  const dom = new JSDOM(html, { url })
  const reader = new Readability(dom.window.document)
  const article = reader.parse()
  const content = article?.content ?? html
  return {
    title: article?.title ?? '',
    text: htmlToText(content),
    content,
  }
}

// Convert cleaned Readability HTML to plain text preserving paragraph breaks as \n\n
export function htmlToText(html: string): string {
  return html
    .replace(/<\/(?:p|h[1-6]|li|blockquote|div|article|section)\s*>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function defaultParsePdf(buffer: ArrayBuffer): Promise<{ title: string; text: string }> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer, opts?: object) => Promise<{ text: string; info: Record<string, string> }>
  const data = await pdfParse(Buffer.from(buffer))
  const title = data.info?.Title ?? ''
  return { title, text: data.text.trim() }
}
