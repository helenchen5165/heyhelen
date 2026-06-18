/**
 * POST /api/reader/browser-setup?domain=x.com
 *
 * Opens a visible Chromium window so the user can log in to the given domain.
 * Blocks until login is detected (URL reaches /home) or times out (3 min).
 * Cookies are saved to the persistent profile and reused in future headless requests.
 */
/**
 * POST /api/reader/browser-setup?domain=x.com
 *
 * Imports x.com cookies from the local Chrome installation into
 * ~/.config/heyhelen/x-cookies.json so Playwright can reuse them.
 * Requires Python + cryptography library (standard on macOS).
 */
import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import os from 'os'
import fs from 'fs'

const execFileAsync = promisify(execFile)

const IMPORT_SCRIPT = `
import sqlite3, subprocess, hashlib, json, shutil, os, sys
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

domain = sys.argv[1]

raw_key = subprocess.check_output(
    ['security', 'find-generic-password', '-a', 'Chrome', '-s', 'Chrome Safe Storage', '-w']
).strip()
key = hashlib.pbkdf2_hmac('sha1', raw_key, b'saltysalt', 1003, dklen=16)

src = os.path.expanduser('~/Library/Application Support/Google/Chrome/Default/Cookies')
dst = '/tmp/chrome-cookies-import.db'
shutil.copy2(src, dst)

conn = sqlite3.connect(dst)
rows = conn.execute(
    "SELECT name, host_key, path, encrypted_value, is_secure, is_httponly "
    f"FROM cookies WHERE host_key LIKE '%.{domain}%' OR host_key LIKE '{domain}%'"
).fetchall()
conn.close()

iv = b' ' * 16
cookies = []
for name, host, cpath, enc_val, secure, httponly in rows:
    if isinstance(enc_val, bytes) and enc_val[:3] == b'v10':
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
        dec = cipher.decryptor()
        decrypted = dec.update(enc_val[3:]) + dec.finalize()
        content = decrypted[32:]  # Chrome v127+ 在明文前有 32 字节前缀
        pad = content[-1]
        value = content[:-pad].decode('utf-8') if 1 <= pad <= 16 else content.decode('utf-8')
    else:
        value = enc_val.decode('utf-8') if enc_val else ''
    cookies.append({
        'name': name, 'value': value, 'domain': host,
        'path': cpath, 'secure': bool(secure), 'httpOnly': bool(httponly),
        'sameSite': 'Lax',
    })

out = os.path.expanduser('~/.config/heyhelen/x-cookies.json')
os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, 'w') as f:
    json.dump(cookies, f)

print(f"ok:{len(cookies)}")
`

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain') ?? 'x.com'

  const scriptPath = path.join(os.tmpdir(), 'heyhelen-cookie-import.py')
  fs.writeFileSync(scriptPath, IMPORT_SCRIPT)

  try {
    const { stdout } = await execFileAsync('python3', [scriptPath, domain], { timeout: 15_000 })
    const count = stdout.trim().split(':')[1] ?? '0'
    return NextResponse.json({ ok: true, cookies: Number(count) })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    fs.unlinkSync(scriptPath)
  }
}
