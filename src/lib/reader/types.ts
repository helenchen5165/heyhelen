export type HighlightType =
  | 'key-argument'
  | 'vocabulary'
  | 'complex-sentence'
  | 'related-concept'

export interface Highlight {
  type: HighlightType
  text: string
  offset: number
  len: number
  preview: string
}

export interface Session {
  id: string
  title: string
  url?: string
  rawText: string
  html: string
  highlights: Highlight[]
}

export type SessionSource = { url: string } | { file: Blob; filename: string }

export interface Extractor {
  extract(source: SessionSource): Promise<{ title: string; text: string; html: string }>
}

export interface HighlightDetector {
  detect(text: string, onHighlight: (h: Highlight) => void): Promise<void>
}

export type DrawerMode = 'closed' | 'detail' | 'chat'
