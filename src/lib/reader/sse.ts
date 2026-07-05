// Shared SSE transport for reader streams. Two protocols ride on it:
// the session stream sends one JSON event per frame; the concept stream
// sends raw text chunks (newlines escaped as \\n so they don't collide
// with the \n\n frame delimiter) plus [DONE]/[ERROR] sentinels.

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'X-Accel-Buffering': 'no',
} as const

export function sseFrame(payload: string): string {
  return `data: ${payload}\n\n`
}

export async function* readSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const frames = buf.split('\n\n')
      buf = frames.pop() ?? ''
      for (const frame of frames) {
        if (frame.startsWith('data: ')) yield frame.slice(6)
      }
    }
  } finally {
    reader.releaseLock()
  }
}
