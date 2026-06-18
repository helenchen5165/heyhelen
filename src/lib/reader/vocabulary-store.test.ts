import { createVocabularyStore } from './vocabulary-store'
import type { WordEntry, VocabularyDb, ReviewState } from './vocabulary-store'

function makeDb(): VocabularyDb {
  const records: WordEntry[] = []

  return {
    create: async (data) => {
      const entry: WordEntry = {
        ...data,
        id: `id-${records.length + 1}`,
        reviewState: 'unseen',
        reviewedAt: null,
        lastReviewedAt: null,
        createdAt: new Date(),
      }
      records.push(entry)
      return entry
    },
    list: async () => [...records],
    listForReview: async () => {
      const unseen = records
        .filter(w => w.reviewState === 'unseen')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      const reviewing = records
        .filter(w => w.reviewState === 'reviewing')
        .sort((a, b) => {
          const aTime = a.lastReviewedAt?.getTime() ?? 0
          const bTime = b.lastReviewedAt?.getTime() ?? 0
          return aTime - bTime
        })
      return [...unseen, ...reviewing]
    },
    markReviewed: async (wordId) => {
      const entry = records.find((w) => w.id === wordId)
      if (entry) {
        entry.reviewedAt = new Date()
        entry.lastReviewedAt = new Date()
        entry.reviewState = 'reviewing'
      }
    },
    markLearned: async (wordId) => {
      const entry = records.find((w) => w.id === wordId)
      if (entry) entry.reviewState = 'learned'
    },
  }
}

const PARAMS = {
  word: 'idiosyncratic',
  context: 'idiosyncratic risks cancel out in large portfolios',
  source: 'https://oaktreecapital.com/memo',
  preview: 'Peculiar to a specific individual or group.',
}

describe('VocabularyStore', () => {
  it('add() stores a word and returns it with an id', async () => {
    const store = createVocabularyStore(makeDb())

    const entry = await store.add(PARAMS)

    expect(entry.id).toBeTruthy()
    expect(entry.word).toBe('idiosyncratic')
    expect(entry.preview).toBe(PARAMS.preview)
    expect(entry.reviewedAt).toBeNull()
  })

  it('add() creates words with reviewState "unseen"', async () => {
    const store = createVocabularyStore(makeDb())
    const entry = await store.add(PARAMS)
    expect(entry.reviewState).toBe('unseen')
  })

  it('list() returns all saved words', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    await store.add(PARAMS)
    await store.add({ ...PARAMS, word: 'convexity' })

    const words = await store.list()

    expect(words).toHaveLength(2)
  })

  it('markReviewed() sets reviewedAt and transitions state to "reviewing"', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const entry = await store.add(PARAMS)
    expect(entry.reviewedAt).toBeNull()

    await store.markReviewed(entry.id)

    const [updated] = await store.list()
    expect(updated.reviewedAt).toBeInstanceOf(Date)
    expect(updated.reviewState).toBe('reviewing')
  })

  it('markReviewed() does not affect other words', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const a = await store.add(PARAMS)
    const b = await store.add({ ...PARAMS, word: 'convexity' })

    await store.markReviewed(a.id)

    const words = await store.list()
    const bEntry = words.find(w => w.id === b.id)
    expect(bEntry?.reviewedAt).toBeNull()
  })

  it('markLearned() transitions state to "learned"', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const entry = await store.add(PARAMS)
    await store.markLearned(entry.id)

    const [updated] = await store.list()
    expect(updated.reviewState).toBe('learned')
  })

  it('listForReview() returns unseen words before reviewing words', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const a = await store.add(PARAMS)
    const b = await store.add({ ...PARAMS, word: 'convexity' })

    await store.markReviewed(a.id) // a becomes 'reviewing'
    // b stays 'unseen'

    const queue = await store.listForReview()
    expect(queue[0].id).toBe(b.id)   // unseen first
    expect(queue[1].id).toBe(a.id)   // reviewing second
  })

  it('listForReview() excludes learned words', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const a = await store.add(PARAMS)
    await store.add({ ...PARAMS, word: 'convexity' })

    await store.markLearned(a.id)

    const queue = await store.listForReview()
    expect(queue.every(w => w.reviewState !== 'learned')).toBe(true)
    expect(queue).toHaveLength(1)
  })
})
