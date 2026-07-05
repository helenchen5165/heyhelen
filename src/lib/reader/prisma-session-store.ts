import { prisma } from '@/lib/prisma'
import type { Highlight } from './types'
import type { SessionStore, StoredSession } from './session-store'

type Row = {
  contentHash: string
  title: string
  url: string | null
  rawText: string
  html: string
  highlights: unknown
}

function toStored(row: Row): StoredSession {
  return {
    contentHash: row.contentHash,
    title: row.title,
    url: row.url ?? undefined,
    rawText: row.rawText,
    html: row.html,
    highlights: Array.isArray(row.highlights) ? (row.highlights as Highlight[]) : [],
  }
}

export const prismaSessionStore: SessionStore = {
  async findByHash(contentHash) {
    const row = await prisma.readerSession.findUnique({ where: { contentHash } })
    if (!row) return null
    await prisma.readerSession.update({
      where: { contentHash },
      data: { lastReadAt: new Date() },
    })
    return toStored(row)
  },

  async save(session) {
    const data = {
      title: session.title,
      url: session.url ?? null,
      rawText: session.rawText,
      html: session.html,
      highlights: session.highlights as object[],
      lastReadAt: new Date(),
    }
    await prisma.readerSession.upsert({
      where: { contentHash: session.contentHash },
      update: data,
      create: { contentHash: session.contentHash, ...data },
    })
  },

  async latest() {
    const row = await prisma.readerSession.findFirst({ orderBy: { lastReadAt: 'desc' } })
    return row ? toStored(row) : null
  },
}
