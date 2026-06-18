import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Normalise cookies from Cookie-Editor / EditThisCookie JSON export to the
// shape Playwright's context.addCookies() expects.
function normalizeCookies(raw: unknown[]): object[] {
  return raw.map((c: unknown) => {
    const cookie = c as Record<string, unknown>
    return {
      name:     String(cookie.name ?? ''),
      value:    String(cookie.value ?? ''),
      domain:   String(cookie.domain ?? ''),
      path:     String(cookie.path ?? '/'),
      // Cookie-Editor exports "expirationDate"; Playwright uses "expires"
      expires:  Number(cookie.expirationDate ?? cookie.expires ?? -1),
      httpOnly: Boolean(cookie.httpOnly ?? false),
      secure:   Boolean(cookie.secure ?? false),
      sameSite: (['Strict', 'Lax', 'None'].includes(String(cookie.sameSite))
        ? String(cookie.sameSite)
        : 'Lax') as 'Strict' | 'Lax' | 'None',
    }
  })
}

export async function POST(request: Request) {
  let body: { domain?: string; cookies?: unknown[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const domain = body.domain?.trim()
  const raw    = body.cookies

  if (!domain || !Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'domain and non-empty cookies array required' }, { status: 400 })
  }

  const cookies = normalizeCookies(raw)

  await prisma.browserCookies.upsert({
    where:  { domain },
    update: { cookies },
    create: { domain, cookies },
  })

  return NextResponse.json({ ok: true, count: cookies.length })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')?.trim()
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  const record = await prisma.browserCookies.findUnique({ where: { domain } })
  return NextResponse.json({
    connected: Boolean(record),
    count:     Array.isArray(record?.cookies) ? (record!.cookies as unknown[]).length : 0,
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')?.trim()
  if (!domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })

  await prisma.browserCookies.deleteMany({ where: { domain } })
  return NextResponse.json({ ok: true })
}
