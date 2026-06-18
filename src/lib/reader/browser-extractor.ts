/**
 * browser-extractor.ts
 *
 * Playwright-based browser extraction for SPA domains (x.com articles).
 *
 * Uses a persistent Chromium profile stored at
 * ~/.config/heyhelen/browser-profile/<domain>/
 * so login cookies survive across restarts.
 *
 * If the rendered page looks like a login wall, throws an Error with a
 * human-readable message — no login flow is built into the reader.
 */
import path from 'path'
import os from 'os'
import type { BrowseFn } from './extractor'

// In Lambda (Vercel/AWS) the home dir is read-only; /tmp is the only writable path.
const IS_LAMBDA = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
const PROFILE_BASE = IS_LAMBDA
  ? path.join('/tmp', 'heyhelen', 'browser-profile')
  : path.join(os.homedir(), '.config', 'heyhelen', 'browser-profile')

const STEALTH_SCRIPT = `
Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
window.chrome = { runtime: {} };
Object.defineProperty(navigator, 'plugins', {
  get: () => [
    { name: 'Chrome PDF Plugin' },
    { name: 'Chrome PDF Viewer' },
    { name: 'Native Client' },
  ],
});
Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
`

const LOGIN_WALL_KEYWORDS = [
  'log in to x',
  'sign in to x',
  'create account',
  '/i/flow/login',
  'continue with phone',
  'continue with apple',
  'email or username',
  'happening now',        // X.com landing page when not logged in
]

function domainFromUrl(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '')
}

const LOGIN_WALL_TITLES = [
  'x - the everything app',
  'twitter',   // bare title when redirected to login
]

function isLoginWall(html: string, pageTitle?: string): boolean {
  const lower = html.toLowerCase()
  if (LOGIN_WALL_KEYWORDS.some((kw) => lower.includes(kw))) return true
  if (pageTitle && LOGIN_WALL_TITLES.some((t) => pageTitle.toLowerCase().includes(t))) return true
  return false
}

function extractContent(html: string, browserTitle: string): { title: string; html: string; text: string } {
  // linkedom is CJS-compatible (no ESM deps) — safe for Vercel Lambda.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { parseHTML } = require('linkedom') as typeof import('linkedom')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Readability } = require('@mozilla/readability') as typeof import('@mozilla/readability')

  const { document: doc } = parseHTML(html)

  // Prefer <article> or <main> directly over Readability for SPA-rendered pages
  const articleEl = doc.querySelector('article') ?? doc.querySelector('main')
  let contentHtml: string
  let title = browserTitle

  if (articleEl && articleEl.textContent && articleEl.textContent.trim().length > 80) {
    // 1. Remove X.com UI chrome: action bars, icons, user-card elements
    const uiSelectors = [
      '[role="group"]',
      '[data-testid="like"]', '[data-testid="retweet"]', '[data-testid="reply"]',
      '[data-testid="User-Name"]', '[data-testid="UserAvatar-Container"]',
      '[data-testid="caret"]', '[data-testid="app-bar-close"]',
      'nav', 'svg',
      // Non-article images (icons from abs.twimg.com, emoji.twimg.com, etc.)
    ]
    uiSelectors.forEach(sel => {
      articleEl.querySelectorAll(sel).forEach(el => el.remove())
    })

    // 2. Remove icon <img> tags (keep only pbs.twimg.com article images)
    articleEl.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') ?? ''
      if (!src.includes('pbs.twimg.com')) img.remove()
    })

    // 3. Collapse excessive whitespace & empty elements
    //    Remove elements whose only content is whitespace/&nbsp;
    articleEl.querySelectorAll('p, div, span').forEach(el => {
      if (!el.querySelector('img') && (el.textContent ?? '').trim() === '') {
        el.remove()
      }
    })

    contentHtml = articleEl.innerHTML

    // 4. Normalize the HTML string: collapse 3+ consecutive <br> into one,
    //    remove blank lines between block elements
    contentHtml = contentHtml
      .replace(/(<br\s*\/?>(\s*<br\s*\/?>){2,})/gi, '<br>')
      .replace(/\n{3,}/g, '\n\n')

  } else {
    const reader = new Readability(doc)
    const parsed = reader.parse()
    contentHtml = parsed?.content ?? html
    if (parsed?.title && parsed.title.length > title.length) title = parsed.title
  }

  // Strip tags for plain text
  const { document: textDoc } = parseHTML(`<body>${contentHtml}</body>`)
  const text = textDoc.body?.textContent?.trim() ?? ''

  return { title, html: contentHtml, text }
}

/**
 * Opens a visible Chromium window for the user to log in to the given domain.
 * Saves cookies to the persistent profile so future headless requests work.
 * Resolves when the user reaches the site's home feed, or rejects on timeout.
 */
async function _extractViaBrowserless(
  url: string,
  token: string,
): Promise<{ title: string; html: string; text: string }> {
  const domain = domainFromUrl(url)
  const waitSelector = {
    'x.com': "article, [data-testid='article']",
    'twitter.com': "article, [data-testid='article']",
  }[domain]

  // chrome.browserless.io is Puppeteer-based (not Playwright).
  // waitFor accepts ms (number) or a CSS selector string.
  // gotoOptions.waitUntil must be a Puppeteer value: networkidle2 (not "networkidle").
  const payload: Record<string, unknown> = {
    url,
    gotoOptions: { waitUntil: 'networkidle2', timeout: 35000 },
    waitFor: waitSelector ?? 3000,
  }

  const resp = await fetch(`https://chrome.browserless.io/content?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    throw new Error(`Browserless error: ${resp.status} ${resp.statusText}`)
  }

  const rawHtml = await resp.text()

  if (isLoginWall(rawHtml)) {
    throw new Error(`BROWSER_SETUP_REQUIRED:${domain}`)
  }

  const result = extractContent(rawHtml, url)
  if (result.text.trim().length < 80) {
    throw new Error('Could not extract article content — page may be empty or protected.')
  }
  return result
}

export async function setupBrowserLogin(domain: string, timeoutMs = 180_000): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { chromium } = require('playwright') as typeof import('playwright')
  const { mkdirSync } = await import('fs')

  const profileDir = path.join(PROFILE_BASE, domain.replace(/\./g, '_'))
  mkdirSync(profileDir, { recursive: true })

  const loginUrls: Record<string, string> = {
    'x.com': 'https://x.com/login',
    'twitter.com': 'https://twitter.com/login',
  }
  const homePatterns: Record<string, RegExp> = {
    'x.com': /x\.com\/home/,
    'twitter.com': /twitter\.com\/home/,
  }

  const loginUrl  = loginUrls[domain]  ?? `https://${domain}/login`
  const homeRegex = homePatterns[domain] ?? new RegExp(`${domain.replace('.', '\\.')}/home`)

  const context = await chromium.launchPersistentContext(profileDir, {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  })

  const page = await context.newPage()
  await page.goto(loginUrl, { waitUntil: 'domcontentloaded' })

  // Poll until the URL matches the home feed pattern
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1000))
    if (homeRegex.test(page.url())) {
      await new Promise((r) => setTimeout(r, 2000)) // let final cookies settle
      await context.close()
      return
    }
  }

  await context.close()
  throw new Error(`Login timed out after ${timeoutMs / 1000}s — please try again.`)
}

/**
 * Loads x.com cookies from ~/.config/heyhelen/x-cookies.json if available.
 * That file is produced by the /api/reader/browser-setup endpoint (Python decryption of Chrome cookies).
 */
async function loadSavedCookies(domain: string): Promise<Record<string, string>[]> {
  try {
    const { readFileSync } = await import('fs')
    const cookiesFile = path.join(os.homedir(), '.config', 'heyhelen', `${domain.replace(/\./g, '-')}-cookies.json`)
    const alt = path.join(os.homedir(), '.config', 'heyhelen', 'x-cookies.json')
    const file = require('fs').existsSync(cookiesFile) ? cookiesFile : alt
    return JSON.parse(readFileSync(file, 'utf-8'))
  } catch {
    return []
  }
}

export function createBrowseFn(): BrowseFn {
  return async (url: string) => {
    const browserlessToken = process.env.BROWSERLESS_TOKEN
    if (browserlessToken) {
      return _extractViaBrowserless(url, browserlessToken)
    }

    // Local dev: use Playwright with persistent Chromium profile
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { chromium } = require('playwright') as typeof import('playwright')

    const domain = domainFromUrl(url)
    const profileDir = path.join(PROFILE_BASE, domain.replace(/\./g, '_'))

    const { mkdirSync } = await import('fs')
    mkdirSync(profileDir, { recursive: true })

    const context = await chromium.launchPersistentContext(profileDir, {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
    })

    await context.addInitScript(STEALTH_SCRIPT)

    // Inject saved Chrome cookies so X.com sees an authenticated session
    const savedCookies = await loadSavedCookies(domain)
    if (savedCookies.length > 0) {
      await context.addCookies(savedCookies as unknown as Parameters<typeof context.addCookies>[0])
    }

    const page = await context.newPage()

    try {
      await page.goto(url, { timeout: 35_000, waitUntil: 'domcontentloaded' })

      // Wait for article content or settle on networkidle
      try {
        await page.waitForSelector('article, [data-testid="article"]', {
          timeout: 15_000,
          state: 'attached',
        })
      } catch {
        try {
          await page.waitForLoadState('networkidle', { timeout: 10_000 })
        } catch {
          // proceed with whatever is rendered
        }
      }

      // Extra settle time for XHR-driven rendering
      await new Promise((r) => setTimeout(r, 2000))

      const rawHtml     = await page.content()
      const browserTitle = await page.title()

      if (isLoginWall(rawHtml, browserTitle)) {
        throw new Error(`BROWSER_SETUP_REQUIRED:${domain}`)
      }

      const result = extractContent(rawHtml, browserTitle)

      if (result.text.trim().length < 80) {
        throw new Error('Could not extract article content — page may be empty or protected.')
      }

      return result
    } finally {
      await context.close()
    }
  }
}
