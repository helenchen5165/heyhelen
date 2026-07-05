import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getAnthropic, READER_MODEL } from '@/lib/reader/llm'
import { SSE_HEADERS, sseFrame } from '@/lib/reader/sse'

const SYSTEM_PROMPTS: Record<string, string> = {
  explain: `你是一位温和、有洞察力的阅读导师，帮助学生读懂英文文章。

当学生发来一段不理解的文字时，你需要：
1. 用清晰流畅的中文解释这段话的含义（结合语境，深入浅出，2-3段）
2. 最后提出一个问题，帮助学生加深理解或引发进一步思考

语气温暖、鼓励，像朋友帮你看文章。不要使用 Markdown 标题（##）或粗体（**），直接写成自然段落。`,

  socratic: `你是一位苏格拉底式导师，正在与学生深入探讨一个概念。

规则：
- 每次只问一个问题，绝不超过一个
- 不直接给出答案，用问题引导学生思考
- 基于学生的回答，温和地探索认知盲点
- 每次回复：1-3句话加上一个问题
- 学生回答正确时，简短认可后继续深挖
- 全程用中文，语气自然亲切`,

  translate: `你是一位专业的中英翻译。用户可能会先给出一段文章上下文，再给出需要翻译的句子。请：
- 只输出被指定句子的中文翻译；不要翻译上下文，不添加任何解释、注释或背景信息。
- 借助上下文判断代词指代、专有名词和一词多义，确保译文准确。
- 用自然、地道、流畅的中文表达，符合中文行文习惯，不要逐字直译或套用英文句式。
- 保持原文的人称和语气。不重复原文英文。不使用 Markdown 标题或加粗。`,

  context: `你是一位英文阅读助手。用户可能会先给出一段文章上下文，再给出要解释的句子。用一到两段自然流畅的中文，结合上下文解释这句话的含义、背景和难点，帮助读者真正理解。不要逐句翻译原文，也不要解释上下文本身。不使用 Markdown 标题或加粗。语气像朋友帮你读文章。`,
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  let body: { text?: string; history?: Message[]; phase?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { text, history = [], phase = 'socratic' } = body
  if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 })

  const systemPrompt = SYSTEM_PROMPTS[phase] ?? SYSTEM_PROMPTS.socratic

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: text },
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await getAnthropic().messages.stream({
          model: READER_MODEL,
          max_tokens: 20000,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            // Escape newlines so payload line breaks don't collide with the
            // SSE frame delimiter (\n\n). The client restores them via
            // `.replace(/\\n/g, '\n')`. Without this, multi-paragraph output
            // loses every paragraph's opening text.
            const safe = chunk.delta.text.replace(/\r\n|\r|\n/g, '\\n')
            controller.enqueue(encoder.encode(sseFrame(safe)))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(sseFrame(`[ERROR] ${msg}`)))
      } finally {
        controller.enqueue(encoder.encode(sseFrame('[DONE]')))
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: SSE_HEADERS })
}
