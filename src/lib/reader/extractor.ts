import type { Extractor, SessionSource } from './types'

type FetchFn = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'text' | 'arrayBuffer'>>
type ParsePdfFn = (buffer: ArrayBuffer) => Promise<{ title: string; text: string }>
type ParseHtmlFn = (html: string, url: string) => { title: string; text: string; content: string }
export type BrowseFn = (url: string) => Promise<{ title: string; html: string; text: string }>

interface ExtractorDeps {
  fetch?: FetchFn
  parsePdf?: ParsePdfFn
  parseHtml?: ParseHtmlFn
  browse?: BrowseFn
}

const SPA_DOMAINS = new Set([
  'x.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'facebook.com',
  'threads.net',
])

// Rewrites x.com/twitter.com thread URLs to threadreaderapp.com for extraction.
// Returns null if the URL is not a rewritable thread (e.g. a profile or home page).
export function rewriteTwitterUrl(url: string): string | null {
  const { hostname, pathname } = new URL(url)
  const host = hostname.replace(/^www\./, '')
  if (host !== 'x.com' && host !== 'twitter.com') return null
  const match = pathname.match(/\/status\/(\d+)/)
  if (!match) return null
  return `https://threadreaderapp.com/thread/${match[1]}.html`
}

// Detects x.com/twitter.com article URLs: /{user}/article/{id}
export function isXArticleUrl(url: string): boolean {
  const { hostname, pathname } = new URL(url)
  const host = hostname.replace(/^www\./, '')
  if (host !== 'x.com' && host !== 'twitter.com') return false
  return /^\/[^/]+\/article\/\d+/.test(pathname)
}

export function createExtractor(deps?: ExtractorDeps): Extractor {
  const fetchFn    = deps?.fetch     ?? ((url) => fetch(url))
  const parsePdfFn = deps?.parsePdf  ?? defaultParsePdf
  const parseHtmlFn = deps?.parseHtml ?? defaultParseHtml
  const browseFn   = deps?.browse

  return {
    async extract(source: SessionSource) {
      if ('text' in source) {
        const text = source.text.trim()
        return { title: source.title ?? '', text, html: `<pre>${text}</pre>` }
      }

      if ('pastedHtml' in source) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { extractContent } = require('./browser-extractor') as typeof import('./browser-extractor')
        const { title, text, html } = extractContent(source.pastedHtml, source.title ?? '')
        if (text.trim().length < 80) {
          throw new Error('未能提取到文章内容，请确保选中了完整文章')
        }
        return { title, text, html }
      }

      if ('file' in source) {
        const buffer = await (source.file as Blob).arrayBuffer()
        const { title, text } = await parsePdfFn(buffer)
        return { title, text, html: `<pre>${text}</pre>` }
      }

      const { url } = source

      // x.com article URLs need browser rendering
      if (isXArticleUrl(url)) {
        if (browseFn) return browseFn(url)
        throw new Error(`Browser rendering required for x.com — not yet supported`)
      }

      // Rewrite x.com/twitter.com thread URLs to ThreadReaderApp before SPA check
      const effectiveUrl = rewriteTwitterUrl(url) ?? url
      const hostname = new URL(effectiveUrl).hostname.replace(/^www\./, '')

      if (SPA_DOMAINS.has(hostname)) {
        throw new Error(`Browser rendering required for ${hostname} — not yet supported`)
      }

      const resp = await fetchFn(effectiveUrl)
      if (!resp.ok) {
        throw new Error(`Failed to extract content: server returned ${resp.status}`)
      }

      const html = await resp.text()
      const parsed = parseHtmlFn(html, effectiveUrl)

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
  // linkedom is CJS-compatible (no ESM deps) — safe for Vercel Lambda.
  // jsdom@29 has multiple ESM-only transitive deps that crash on Lambda.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseHTML } = require('linkedom') as typeof import('linkedom')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Readability } = require('@mozilla/readability') as typeof import('@mozilla/readability')
  const { document } = parseHTML(html)
  const reader = new Readability(document as unknown as Document)
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
