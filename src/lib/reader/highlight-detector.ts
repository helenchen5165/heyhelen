import Anthropic from '@anthropic-ai/sdk'
import { READER_MODEL } from './llm'
import type { Highlight, HighlightDetector } from './types'

const VALID_TYPES = new Set(['key-argument', 'vocabulary', 'complex-sentence', 'related-concept'])

const SYSTEM_PROMPT = `You are a reading assistant for a Chinese-native reader engaging with complex English texts (investment memos, academic papers, research reports). Analyze the given English text and identify the most important highlights.

Return ONLY a valid JSON array (no markdown fences, no commentary). Each object must have exactly these four fields:
- "type": MUST be exactly one of these four strings (copy exactly, hyphens included):
    "key-argument"      ← the author's core claims, conclusions, or central thesis
    "vocabulary"        ← domain-specific terms, technical jargon, or words a non-expert likely does not know
    "complex-sentence"  ← sentences with dense, convoluted, or hard-to-parse structure
    "related-concept"   ← concepts or ideas referenced but not explained, worth exploring further
- "text": the exact verbatim phrase or sentence from the input text (must match character-for-character)
- "context": the ~30 characters immediately preceding the phrase in the input text (empty string "" if the phrase starts at the beginning)
- "preview": one concise sentence explaining what this highlight means or why it matters

Composition rules — follow these strictly:
- Total highlights: 8–15. Never fewer than 8, never more than 15.
- "key-argument": 3–5 picks. Choose the author's actual claims, not scene-setting or transitions.
- "vocabulary": 3–5 picks. Choose words a well-educated non-specialist genuinely would not know. Skip common words.
- "complex-sentence": at most 3 picks. Only sentences that are genuinely hard to parse — dense syntax, multiple nested clauses, or unusual inversion. Do not pad.
- "related-concept": 1–3 picks. Concepts mentioned but not explained that reward further reading.
- Quality over quantity: a highlight that does not clearly fit a category should be omitted.
- Never invent text. "text" must appear verbatim in the input.

Example output format:
[{"type":"key-argument","text":"exact phrase here","context":"words before it ","preview":"What this means."},{"type":"vocabulary","text":"jargon term","context":"","preview":"Definition here."}]

Output raw JSON only. No explanation, no markdown, no preamble.`

export function createLLMHighlightDetector(client: Anthropic): HighlightDetector {
  return {
    async detect(text, onHighlight) {
      const msg = await client.messages.create({
        model: READER_MODEL,
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
