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

  async markReviewed(wordId) {
    await prisma.word.update({
      where: { id: wordId },
      data: { reviewedAt: new Date() },
    })
  },
}
