import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic()

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

  translate: `你是一位英文翻译助手。用户发来一段英文，只输出中文翻译，不添加任何解释、注释或背景信息。保持原文的人称、语气和句式结构。不重复原文英文。不使用 Markdown 标题或加粗。`,

  context: `你是一位英文阅读助手。用户发来一段英文，用一到两段自然流畅的中文解释这段话的含义、背景和难点，帮助读者真正理解。不要重复翻译原文。不使用 Markdown 标题或加粗。语气像朋友帮你读文章。`,
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
        const response = await anthropic.messages.stream({
          model: 'claude-opus-4-7',
          max_tokens: 20000,
          system: systemPrompt,
          messages,
        })

        for await (const chunk of response) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(`data: ${chunk.delta.text}\n\n`))
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        controller.enqueue(encoder.encode(`data: [ERROR] ${msg}\n\n`))
      } finally {
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
