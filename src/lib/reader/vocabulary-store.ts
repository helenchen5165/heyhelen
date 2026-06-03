export interface WordEntry {
  id: string
  word: string
  context: string
  source: string
  preview: string
  reviewedAt: Date | null
  createdAt: Date
}

export interface VocabularyDb {
  create(data: Omit<WordEntry, 'id' | 'reviewedAt' | 'createdAt'>): Promise<WordEntry>
  list(): Promise<WordEntry[]>
  markReviewed(wordId: string): Promise<void>
}

export interface VocabularyStore {
  add(params: Omit<WordEntry, 'id' | 'reviewedAt' | 'createdAt'>): Promise<WordEntry>
  list(): Promise<WordEntry[]>
  markReviewed(wordId: string): Promise<void>
}

export function createVocabularyStore(db: VocabularyDb): VocabularyStore {
  return {
    add: (params) => db.create(params),
    list: () => db.list(),
    markReviewed: (wordId) => db.markReviewed(wordId),
  }
}
