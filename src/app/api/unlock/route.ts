import { NextRequest, NextResponse } from 'next/server'

// Must never be prerendered: the response depends on runtime env + query.
export const dynamic = 'force-dynamic'

// One-time browser unlock for the reader APIs: visit
//   /api/unlock?key=<READER_API_KEY>
// and a year-long httpOnly cookie authorizes all subsequent API calls
// from this browser (checked by src/middleware.ts).
export async function GET(req: NextRequest) {
  const key = process.env.READER_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'READER_API_KEY not configured' }, { status: 404 })
  }

  const provided = req.nextUrl.searchParams.get('key')
  if (provided !== key) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 401 })
  }

  const res = NextResponse.redirect(new URL('/reader', req.url))
  res.cookies.set('reader_key', key, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })
  return res
}
