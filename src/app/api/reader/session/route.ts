import { NextResponse } from 'next/server'
import { createExtractor } from '@/lib/reader/extractor'
import { createBrowseFn } from '@/lib/reader/browser-extractor'
import { createLLMHighlightDetector } from '@/lib/reader/highlight-detector'
import { createSessionEvents } from '@/lib/reader/session-events'
import type { SessionSource } from '@/lib/reader/types'
import { getAnthropic } from '@/lib/reader/llm'
import { SSE_HEADERS, sseFrame } from '@/lib/reader/sse'
import { prismaSessionStore } from '@/lib/reader/prisma-session-store'

export const dynamic = 'force-dynamic'

const extractor = createExtractor({ browse: createBrowseFn() })
const detector = createLLMHighlightDetector(getAnthropic())

// Returns the most recently read session so the reader can resume on a
// return visit. 404 when there is nothing stored (or the DB is unreachable).
export async function GET() {
  const session = await prismaSessionStore.latest().catch((err) => {
    console.error('[reader/session] latest lookup failed:', err)
    return null
  })
  if (!session) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(session)
}

export async function POST(request: Request) {
  let source: SessionSource

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    const filename = file instanceof File ? file.name : 'upload.pdf'
    source = { file, filename }
  } else {
    const body = await request.json().catch(() => null)
    if (body?.pastedHtml && typeof body.pastedHtml === 'string') {
      source = { pastedHtml: body.pastedHtml, title: body.title ?? '' }
    } else if (body?.text && typeof body.text === 'string') {
      source = { text: body.text, title: body.title ?? '' }
    } else if (body?.url && typeof body.url === 'string') {
      source = { url: body.url }
    } else {
      return NextResponse.json({ error: 'Missing url, text, or pastedHtml' }, { status: 400 })
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of createSessionEvents(source, { extractor, detector, store: prismaSessionStore })) {
        controller.enqueue(encoder.encode(sseFrame(JSON.stringify(event))))
      }
      controller.close()
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
