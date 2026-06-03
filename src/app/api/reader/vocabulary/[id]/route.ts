import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth'
import { createVocabularyStore } from '@/lib/reader/vocabulary-store'
import { prismaVocabularyDb } from '@/lib/reader/vocabulary-db'

const store = createVocabularyStore(prismaVocabularyDb)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await store.markReviewed(params.id, user.id)
  return new Response(null, { status: 204 })
}
