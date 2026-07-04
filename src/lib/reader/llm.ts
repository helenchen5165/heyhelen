import Anthropic from '@anthropic-ai/sdk'

export const READER_MODEL = 'claude-opus-4-8'

let client: Anthropic | undefined

export function getAnthropic(): Anthropic {
  return (client ??= new Anthropic())
}
