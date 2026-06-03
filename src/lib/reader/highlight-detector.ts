import Anthropic from '@anthropic-ai/sdk'
import type { Highlight, HighlightDetector } from './types'

const VALID_TYPES = new Set(['key-argument', 'vocabulary', 'complex-sentence', 'related-concept'])

const SYSTEM_PROMPT = `You are a reading assistant. Analyze the given English text and identify the most important highlights.

Return ONLY a valid JSON array (no markdown fences, no commentary). Each object must have exactly these three fields:
- "type": MUST be exactly one of these four strings (copy exactly, hyphens included):
    "key-argument"      ← the author's core claims or conclusions
    "vocabulary"        ← technical terms or words a non-expert might not know
    "complex-sentence"  ← sentences with dense or hard-to-parse structure
    "related-concept"   ← concepts worth exploring further
- "text": the exact verbatim phrase or sentence from the input text (must match character-for-character)
- "context": the ~30 characters immediately preceding the phrase in the input text (empty string if the phrase is at the start)
- "preview": one sentence plain-English explanation

Example output format:
[{"type":"key-argument","text":"exact phrase here","context":"words before it ","preview":"What this means."},{"type":"vocabulary","text":"another phrase","context":"","preview":"Definition here."}]

Identify 5–10 highlights. Prioritise key-argument and vocabulary. Output raw JSON only.`

export function createLLMHighlightDetector(client: Anthropic): HighlightDetector {
  return {
    async detect(text, onHighlight) {
      const msg = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ] as Anthropic.TextBlockParam[],
        messages: [{ role: 'user', content: text }],
      })

      const raw = msg.content[0]?.type === 'text' ? msg.content[0].text : ''

      let items: unknown[]
      try {
        const match = raw.match(/\[[\s\S]*\]/)
        items = match ? (JSON.parse(match[0]) as unknown[]) : []
      } catch {
        return
      }

      for (const item of items) {
        if (!isValidItem(item)) continue
        const offset = resolveOffset(text, item.text, item.context)
        if (offset < 0) continue
        onHighlight({
          type: item.type,
          text: item.text,
          offset,
          len: item.text.length,
          preview: item.preview,
        })
      }
    },
  }
}

type ValidItem = Pick<Highlight, 'type' | 'text' | 'preview'> & { context?: string }

function resolveOffset(source: string, phrase: string, context: string | undefined): number {
  if (context) {
    const needle = context + phrase
    const pos = source.indexOf(needle)
    if (pos >= 0) return pos + context.length
  }
  return source.indexOf(phrase)
}

function isValidItem(item: unknown): item is ValidItem {
  if (!item || typeof item !== 'object') return false
  const o = item as Record<string, unknown>
  return (
    typeof o.text === 'string' &&
    typeof o.preview === 'string' &&
    VALID_TYPES.has(o.type as string)
  )
}
