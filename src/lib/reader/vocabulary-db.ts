import { prisma } from '@/lib/prisma'
import type { VocabularyDb, WordEntry } from './vocabulary-store'

export const prismaVocabularyDb: VocabularyDb = {
  async create(data) {
    return prisma.word.create({ data }) as Promise<WordEntry>
  },

  async listByUser(userId) {
    return prisma.word.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }) as Promise<WordEntry[]>
  },

  async markReviewed(wordId, userId) {
    await prisma.word.updateMany({
      where: { id: wordId, userId },
      data: { reviewedAt: new Date() },
    })
  },
}
