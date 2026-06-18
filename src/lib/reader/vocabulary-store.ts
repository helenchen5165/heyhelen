export type ReviewState = 'unseen' | 'reviewing' | 'learned'

export interface WordEntry {
  id: string
  word: string
  context: string
  source: string
  preview: string
  reviewState: ReviewState
  reviewedAt: Date | null
  lastReviewedAt: Date | null
  createdAt: Date
}

export interface VocabularyDb {
  create(data: Omit<WordEntry, 'id' | 'reviewedAt' | 'lastReviewedAt' | 'reviewState' | 'createdAt'>): Promise<WordEntry>
  list(): Promise<WordEntry[]>
  listForReview(): Promise<WordEntry[]>
  markReviewed(wordId: string): Promise<void>
  markLearned(wordId: string): Promise<void>
}

export interface VocabularyStore {
  add(params: Omit<WordEntry, 'id' | 'reviewedAt' | 'lastReviewedAt' | 'reviewState' | 'createdAt'>): Promise<WordEntry>
  list(): Promise<WordEntry[]>
  listForReview(): Promise<WordEntry[]>
  markReviewed(wordId: string): Promise<void>
  markLearned(wordId: string): Promise<void>
}

export function createVocabularyStore(db: VocabularyDb): VocabularyStore {
  return {
    add: (params) => db.create(params),
    list: () => db.list(),
    listForReview: () => db.listForReview(),
    markReviewed: (wordId) => db.markReviewed(wordId),
    markLearned: (wordId) => db.markLearned(wordId),
  }
}
