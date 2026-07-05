import { NextRequest, NextResponse } from 'next/server'

// Protects the paid AI endpoints (Anthropic + Browserless) and personal-data
// routes from anonymous use — the reader is single-user but lives on a public
// domain. Auth is a long-lived cookie set once per browser via
// GET /api/unlock?key=<READER_API_KEY>.
//
// If READER_API_KEY is not configured, everything stays open (local dev and
// pre-rollout deploys keep working).
export function middleware(req: NextRequest) {
  const key = process.env.READER_API_KEY
  if (!key) return NextResponse.next()

  const provided =
    req.cookies.get('reader_key')?.value ?? req.headers.get('x-reader-key')
  if (provided === key) return NextResponse.next()

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export const config = {
  matcher: ['/api/concept', '/api/reader/:path*'],
}
