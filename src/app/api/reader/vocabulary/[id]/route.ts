import { NextRequest, NextResponse } from 'next/server'
import { createVocabularyStore } from '@/lib/reader/vocabulary-store'
import { prismaVocabularyDb } from '@/lib/reader/vocabulary-db'

const store = createVocabularyStore(prismaVocabularyDb)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null)
  const action = body?.action ?? 'reviewed'

  if (action === 'learned') {
    await store.markLearned(params.id)
  } else {
    await store.markReviewed(params.id)
  }

  return new Response(null, { status: 204 })
}
