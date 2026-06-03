import { createVocabularyStore } from './vocabulary-store'
import type { WordEntry, VocabularyDb } from './vocabulary-store'

function makeDb(): VocabularyDb {
  const store: WordEntry[] = []

  return {
    create: async (data) => {
      const entry: WordEntry = {
        ...data,
        id: `id-${store.length + 1}`,
        reviewedAt: null,
        createdAt: new Date(),
      }
      store.push(entry)
      return entry
    },
    listByUser: async (userId) => store.filter((w) => w.userId === userId),
    markReviewed: async (wordId, userId) => {
      const entry = store.find((w) => w.id === wordId && w.userId === userId)
      if (entry) entry.reviewedAt = new Date()
    },
  }
}

const PARAMS = {
  word: 'idiosyncratic',
  context: 'idiosyncratic risks cancel out in large portfolios',
  source: 'https://oaktreecapital.com/memo',
  preview: 'Peculiar to a specific individual or group.',
  userId: 'user-1',
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

  it('list() returns only words belonging to that user', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    await store.add({ ...PARAMS, userId: 'user-1' })
    await store.add({ ...PARAMS, word: 'convexity', userId: 'user-2' })

    const user1Words = await store.list('user-1')

    expect(user1Words).toHaveLength(1)
    expect(user1Words[0].word).toBe('idiosyncratic')
  })

  it('markReviewed() sets reviewedAt on the correct word', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const entry = await store.add(PARAMS)
    expect(entry.reviewedAt).toBeNull()

    await store.markReviewed(entry.id, 'user-1')

    const [updated] = await store.list('user-1')
    expect(updated.reviewedAt).toBeInstanceOf(Date)
  })

  it('markReviewed() does nothing when userId does not match', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const entry = await store.add(PARAMS)
    await store.markReviewed(entry.id, 'user-other')

    const [unchanged] = await store.list('user-1')
    expect(unchanged.reviewedAt).toBeNull()
  })
})
