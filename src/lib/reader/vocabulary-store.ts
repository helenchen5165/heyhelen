export interface WordEntry {
  id: string
  word: string
  context: string
  source: string
  preview: string
  reviewedAt: Date | null
  createdAt: Date
  userId: string
}

export interface VocabularyDb {
  create(data: Omit<WordEntry, 'id' | 'reviewedAt' | 'createdAt'>): Promise<WordEntry>
  listByUser(userId: string): Promise<WordEntry[]>
  markReviewed(wordId: string, userId: string): Promise<void>
}

export interface VocabularyStore {
  add(params: Omit<WordEntry, 'id' | 'reviewedAt' | 'createdAt'>): Promise<WordEntry>
  list(userId: string): Promise<WordEntry[]>
  markReviewed(wordId: string, userId: string): Promise<void>
}

export function createVocabularyStore(db: VocabularyDb): VocabularyStore {
  return {
    add: (params) => db.create(params),
    list: (userId) => db.listByUser(userId),
    markReviewed: (wordId, userId) => db.markReviewed(wordId, userId),
  }
}
