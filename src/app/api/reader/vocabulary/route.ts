import { NextRequest, NextResponse } from 'next/server'
import { createVocabularyStore } from '@/lib/reader/vocabulary-store'
import { prismaVocabularyDb } from '@/lib/reader/vocabulary-db'

const store = createVocabularyStore(prismaVocabularyDb)

export async function GET() {
  const words = await store.list()
  return NextResponse.json(words)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body?.word || !body?.context || !body?.source || !body?.preview) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const entry = await store.add({
    word: body.word,
    context: body.context,
    source: body.source,
    preview: body.preview,
  })

  return NextResponse.json(entry, { status: 201 })
}
