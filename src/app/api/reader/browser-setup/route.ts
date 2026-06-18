/**
 * POST /api/reader/browser-setup?domain=x.com
 *
 * Imports cookies from the local Chrome installation into
 * ~/.config/heyhelen/<domain>-cookies.json so Playwright can reuse them.
 *
 * Only works when running locally on macOS — reads Chrome's SQLite cookie DB
 * and decrypts via macOS Keychain. Returns HTTP 400 on Vercel Lambda.
 */
import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import fs from 'fs'
import crypto from 'crypto'

const execFileAsync = promisify(execFile)

const IS_LAMBDA = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

interface ChromeCookieRow {
  name: string
  host_key: string
  path: string
  encrypted_value: Buffer
  is_secure: number
  is_httponly: number
}

export async function POST(request: Request) {
  if (IS_LAMBDA) {
    return NextResponse.json(
      { error: 'Cookie import requires a local Chrome installation — run the dev server locally and try again.' },
      { status: 400 },
    )
  }

  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain') ?? 'x.com'

  try {
    const count = await importChromeCookies(domain)
    return NextResponse.json({ ok: true, cookies: count })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function importChromeCookies(domain: string): Promise<number> {
  // Retrieve Chrome's AES encryption key from macOS Keychain
  const { stdout: rawKey } = await execFileAsync(
    'security',
    ['find-generic-password', '-a', 'Chrome', '-s', 'Chrome Safe Storage', '-w'],
    { timeout: 5_000 },
  )
  const key = crypto.pbkdf2Sync(rawKey.trim(), 'saltysalt', 1003, 16, 'sha1')

  // Copy cookie DB to /tmp because Chrome may hold a lock on the original
  const src = path.join(
    os.homedir(),
    'Library',
    'Application Support',
    'Google',
    'Chrome',
    'Default',
    'Cookies',
  )
  const dst = path.join(os.tmpdir(), 'heyhelen-chrome-cookies.db')
  fs.copyFileSync(src, dst)

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sqlite3 = require('sqlite3') as typeof import('sqlite3')
  const db = new sqlite3.Database(dst, sqlite3.OPEN_READONLY)

  const rows = await new Promise<ChromeCookieRow[]>((resolve, reject) => {
    db.all(
      `SELECT name, host_key, path, encrypted_value, is_secure, is_httponly
       FROM cookies
       WHERE host_key LIKE '%.${domain}%' OR host_key LIKE '${domain}%'`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: Error | null, dbRows: any[]) => {
        db.close()
        try { fs.unlinkSync(dst) } catch { /* ignore */ }
        if (err) reject(err)
        else resolve((dbRows ?? []) as ChromeCookieRow[])
      },
    )
  })

  // Chrome uses 16 space characters as CBC IV
  const iv = Buffer.alloc(16, 0x20)

  const cookies = rows.map((row) => {
    let value = ''
    const enc: Buffer = row.encrypted_value
    if (enc && enc.slice(0, 3).toString() === 'v10') {
      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
      decipher.setAutoPadding(false)
      const decrypted = Buffer.concat([decipher.update(enc.slice(3)), decipher.final()])
      // Chrome v127+: 32-byte prefix before the actual cookie value
      const content = decrypted.slice(32)
      const pad = content[content.length - 1]
      value = (pad >= 1 && pad <= 16 ? content.slice(0, -pad) : content).toString('utf-8')
    } else if (enc) {
      value = enc.toString('utf-8')
    }
    return {
      name: row.name,
      value,
      domain: row.host_key,
      path: row.path,
      secure: Boolean(row.is_secure),
      httpOnly: Boolean(row.is_httponly),
      sameSite: 'Lax',
    }
  })

  const outDir = path.join(os.homedir(), '.config', 'heyhelen')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${domain.replace(/\./g, '-')}-cookies.json`)
  fs.writeFileSync(outFile, JSON.stringify(cookies, null, 2))

  return cookies.length
}
