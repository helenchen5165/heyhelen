import { NextResponse } from 'next/server'
import { createExtractor } from '@/lib/reader/extractor'
import { createLLMHighlightDetector } from '@/lib/reader/highlight-detector'
import { createSessionEvents } from '@/lib/reader/session-events'
import type { SessionSource } from '@/lib/reader/types'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()
const extractor = createExtractor()
const detector = createLLMHighlightDetector(anthropic)

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
    if (body?.text && typeof body.text === 'string') {
      source = { text: body.text, title: body.title ?? '' }
    } else if (body?.url && typeof body.url === 'string') {
      source = { url: body.url }
    } else {
      return NextResponse.json({ error: 'Missing url or text' }, { status: 400 })
    }
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of createSessionEvents(source, { extractor, detector })) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
