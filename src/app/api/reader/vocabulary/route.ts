import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createVocabularyStore } from '@/lib/reader/vocabulary-store'
import { prismaVocabularyDb } from '@/lib/reader/vocabulary-db'

const store = createVocabularyStore(prismaVocabularyDb)

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const words = await store.list(user.id)
  return NextResponse.json(words)
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.word || !body?.context || !body?.source || !body?.preview) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const entry = await store.add({
    word: body.word,
    context: body.context,
    source: body.source,
    preview: body.preview,
    userId: user.id,
  })

  return NextResponse.json(entry, { status: 201 })
}
