import { createVocabularyStore } from './vocabulary-store'
import type { WordEntry, VocabularyDb } from './vocabulary-store'

function makeDb(): VocabularyDb {
  const records: WordEntry[] = []

  return {
    create: async (data) => {
      const entry: WordEntry = {
        ...data,
        id: `id-${records.length + 1}`,
        reviewedAt: null,
        createdAt: new Date(),
      }
      records.push(entry)
      return entry
    },
    list: async () => [...records],
    markReviewed: async (wordId) => {
      const entry = records.find((w) => w.id === wordId)
      if (entry) entry.reviewedAt = new Date()
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

  it('list() returns all saved words in reverse-creation order', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    await store.add(PARAMS)
    await store.add({ ...PARAMS, word: 'convexity' })

    const words = await store.list()

    expect(words).toHaveLength(2)
  })

  it('markReviewed() sets reviewedAt on the correct word', async () => {
    const db = makeDb()
    const store = createVocabularyStore(db)

    const entry = await store.add(PARAMS)
    expect(entry.reviewedAt).toBeNull()

    await store.markReviewed(entry.id)

    const [updated] = await store.list()
    expect(updated.reviewedAt).toBeInstanceOf(Date)
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
})
