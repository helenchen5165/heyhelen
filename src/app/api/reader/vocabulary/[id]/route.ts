import { NextRequest, NextResponse } from 'next/server'
import { createVocabularyStore } from '@/lib/reader/vocabulary-store'
import { prismaVocabularyDb } from '@/lib/reader/vocabulary-db'

const store = createVocabularyStore(prismaVocabularyDb)

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  await store.markReviewed(params.id)
  return new Response(null, { status: 204 })
}
