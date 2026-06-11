import { prisma } from '@/lib/prisma'
import type { VocabularyDb, WordEntry } from './vocabulary-store'

export const prismaVocabularyDb: VocabularyDb = {
  async create(data) {
    return prisma.word.create({ data }) as Promise<WordEntry>
  },

  async list() {
    return prisma.word.findMany({
      orderBy: { createdAt: 'desc' },
    }) as Promise<WordEntry[]>
  },

  async listForReview() {
    const [unseen, reviewing] = await Promise.all([
      prisma.word.findMany({
        where: { reviewState: 'unseen' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.word.findMany({
        where: { reviewState: 'reviewing' },
        orderBy: { lastReviewedAt: 'asc' },
      }),
    ])
    return [...unseen, ...reviewing] as WordEntry[]
  },

  async markReviewed(wordId) {
    await prisma.word.update({
      where: { id: wordId },
      data: {
        reviewedAt: new Date(),
        lastReviewedAt: new Date(),
        reviewState: 'reviewing',
      },
    })
  },

  async markLearned(wordId) {
    await prisma.word.update({
      where: { id: wordId },
      data: { reviewState: 'learned' },
    })
  },
}
