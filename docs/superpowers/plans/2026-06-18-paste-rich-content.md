# 粘贴图文功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在 x.com 全选文章复制后，在读书器 Ctrl+V 粘贴即可提取图文，走现有高亮检测流水线。

**Architecture:** 扩展 `SessionSource` 增加 `pastedHtml` 变体；导出已有 `extractContent()` 供 extractor 调用；前端全局监听 `paste` 事件，检测 `text/html` 并触发 `load()`。不新增文件，不新增依赖，5 处改动。

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, linkedom, @mozilla/readability, Jest + jsdom

---

## 文件改动地图

| 动作 | 文件 | 改动内容 |
|------|------|---------|
| Modify | `src/lib/reader/browser-extractor.ts` | `extractContent` 加 `export` 关键字 |
| Modify | `src/lib/reader/types.ts` | `SessionSource` 新增 `pastedHtml` 变体 |
| Modify | `src/lib/reader/extractor.ts` | `extract()` 新增 `pastedHtml` 分支 |
| Modify | `src/app/api/reader/session/route.ts` | JSON body 解析新增 `pastedHtml` 字段 |
| Modify | `src/app/reader/page.tsx` | 全局 `paste` 事件监听 |
| Create | `src/lib/reader/extract-content.test.ts` | `extractContent()` 单元测试 |

---

## Task 1: 导出 `extractContent()` + 单元测试

**Files:**
- Modify: `src/lib/reader/browser-extractor.ts:68`
- Create: `src/lib/reader/extract-content.test.ts`

- [ ] **写失败测试**

```ts
// src/lib/reader/extract-content.test.ts
import { extractContent } from './browser-extractor'

const X_ARTICLE_HTML = `
<html><body>
<article>
  <nav>Site nav garbage</nav>
  <svg aria-label="icon"><path/></svg>
  <div role="group">Like Reply Retweet buttons</div>
  <div data-testid="User-Name">@author</div>
  <p>Understanding risk is the most important thing in investing.</p>
  <p>Risk means more things can happen than will happen.</p>
  <img src="https://pbs.twimg.com/media/article_image.jpg" alt="chart">
  <img src="https://abs.twimg.com/emoji/v2/😀.png" alt="emoji">
  <p>Superior investors know that risk control is paramount.</p>
</article>
</body></html>
`

const PLAIN_HTML = `
<html>
  <head><title>Howard Marks: On Risk</title></head>
  <body>
    <p>Understanding risk is the most important thing in investing.</p>
    <p>Risk means more things can happen than will happen.</p>
  </body>
</html>
`

describe('extractContent', () => {
  it('extracts text from article element', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.text).toContain('Understanding risk')
    expect(result.text).toContain('Superior investors')
  })

  it('removes UI chrome (nav, svg, role=group, data-testid=User-Name)', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.html).not.toContain('Site nav garbage')
    expect(result.html).not.toContain('Like Reply Retweet')
    expect(result.html).not.toContain('@author')
    expect(result.html).not.toContain('<svg')
  })

  it('keeps pbs.twimg.com images, removes icon images', () => {
    const result = extractContent(X_ARTICLE_HTML, '')
    expect(result.html).toContain('pbs.twimg.com/media/article_image.jpg')
    expect(result.html).not.toContain('abs.twimg.com')
  })

  it('falls back to Readability when no article/main element', () => {
    const result = extractContent(PLAIN_HTML, '')
    expect(result.text).toContain('Understanding risk')
    expect(result.text.length).toBeGreaterThan(20)
  })

  it('uses browserTitle when HTML has no extractable title', () => {
    const result = extractContent(X_ARTICLE_HTML, 'My Article Title')
    expect(result.title).toBe('My Article Title')
  })
})
```

- [ ] **运行测试，确认 RED（extractContent 未导出）**

```bash
npx jest src/lib/reader/extract-content.test.ts --no-coverage --forceExit 2>&1 | tail -15
```

期望：`SyntaxError: The requested module ... does not provide an export named 'extractContent'`

- [ ] **导出 `extractContent()`**

在 `src/lib/reader/browser-extractor.ts` 第 68 行，将：
```ts
function extractContent(html: string, browserTitle: string): { title: string; html: string; text: string } {
```
改为：
```ts
export function extractContent(html: string, browserTitle: string): { title: string; html: string; text: string } {
```

- [ ] **运行测试，确认 GREEN**

```bash
npx jest src/lib/reader/extract-content.test.ts --no-coverage --forceExit 2>&1 | tail -10
```

期望：`5 passed`

- [ ] **确认现有测试无回归**

```bash
npx jest src/lib/reader/ --no-coverage --forceExit 2>&1 | tail -10
```

期望：所有测试通过

- [ ] **提交**

```bash
git add src/lib/reader/browser-extractor.ts src/lib/reader/extract-content.test.ts
git commit -m "feat(reader): export extractContent + add unit tests"
```

---

## Task 2: `SessionSource` 增加 `pastedHtml` 变体

**Files:**
- Modify: `src/lib/reader/types.ts`

- [ ] **修改 `SessionSource` 类型**

在 `src/lib/reader/types.ts` 找到：
```ts
export type SessionSource = { url: string } | { file: Blob; filename: string } | { text: string; title?: string }
```

改为：
```ts
export type SessionSource =
  | { url: string }
  | { file: Blob; filename: string }
  | { text: string; title?: string }
  | { pastedHtml: string; title?: string }
```

- [ ] **TypeScript 检查无错误**

```bash
npx tsc --noEmit 2>&1 | head -20
```

期望：无输出（零错误）

- [ ] **提交**

```bash
git add src/lib/reader/types.ts
git commit -m "feat(reader): add pastedHtml variant to SessionSource"
```

---

## Task 3: `extractor.ts` 新增 `pastedHtml` 分支 + 测试

**Files:**
- Modify: `src/lib/reader/extractor.ts`
- Modify: `src/lib/reader/extractor.test.ts`

- [ ] **在 `extractor.test.ts` 末尾追加失败测试**

打开 `src/lib/reader/extractor.test.ts`，在文件最后追加：

```ts
describe('createExtractor - pastedHtml source', () => {
  it('extracts text and html from pasted HTML', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    const result = await extractor.extract({
      pastedHtml: `<html><body><article><p>Understanding risk is the most important thing in investing. Risk means more things can happen than will happen. Superior investors know risk control is paramount.</p></article></body></html>`,
      title: 'On Risk',
    })
    expect(result.title).toBe('On Risk')
    expect(result.text).toContain('Understanding risk')
    expect(result.html).toBeTruthy()
  })

  it('falls back to Readability title when title is empty', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    const result = await extractor.extract({
      pastedHtml: `<html><head><title>Marks On Risk</title></head><body><p>Understanding risk is the most important thing in investing. Risk means more things can happen than will happen. Superior investors know risk control is paramount.</p></body></html>`,
      title: '',
    })
    // Readability or extractContent picks up the title
    expect(result.text).toContain('Understanding risk')
    expect(result.html).toBeTruthy()
  })

  it('throws when pasted HTML has less than 80 chars of text', async () => {
    const extractor = createExtractor({ parseHtml: fakeParseHtml })
    await expect(
      extractor.extract({ pastedHtml: '<article><p>Too short</p></article>', title: '' })
    ).rejects.toThrow('未能提取到文章内容')
  })
})
```

- [ ] **运行测试，确认 RED**

```bash
npx jest src/lib/reader/extractor.test.ts --no-coverage --forceExit 2>&1 | tail -15
```

期望：3 tests failed（`pastedHtml` 分支不存在）

- [ ] **在 `extractor.ts` 的 `extract()` 方法中新增 `pastedHtml` 分支**

在 `src/lib/reader/extractor.ts` 找到：
```ts
    if ('text' in source) {
      const text = source.text.trim()
      return { title: source.title ?? '', text, html: `<pre>${text}</pre>` }
    }
```

在其**正上方**插入：

```ts
    if ('pastedHtml' in source) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { extractContent } = require('./browser-extractor') as typeof import('./browser-extractor')
      const { title, text, html } = extractContent(source.pastedHtml, source.title ?? '')
      if (text.trim().length < 80) {
        throw new Error('未能提取到文章内容，请确保选中了完整文章')
      }
      return { title, text, html }
    }
```

- [ ] **运行测试，确认 GREEN**

```bash
npx jest src/lib/reader/extractor.test.ts --no-coverage --forceExit 2>&1 | tail -10
```

期望：所有测试通过

- [ ] **全量 reader 测试无回归**

```bash
npx jest src/lib/reader/ --no-coverage --forceExit 2>&1 | tail -10
```

期望：所有测试通过

- [ ] **提交**

```bash
git add src/lib/reader/extractor.ts src/lib/reader/extractor.test.ts
git commit -m "feat(reader): handle pastedHtml in extractor with extractContent"
```

---

## Task 4: Session API 解析 `pastedHtml` 字段

**Files:**
- Modify: `src/app/api/reader/session/route.ts`

- [ ] **在 session route 的 JSON 解析分支中加入 `pastedHtml`**

在 `src/app/api/reader/session/route.ts` 找到：
```ts
    if (body?.text && typeof body.text === 'string') {
      source = { text: body.text, title: body.title ?? '' }
    } else if (body?.url && typeof body.url === 'string') {
      source = { url: body.url }
    } else {
      return NextResponse.json({ error: 'Missing url or text' }, { status: 400 })
    }
```

改为：
```ts
    if (body?.pastedHtml && typeof body.pastedHtml === 'string') {
      source = { pastedHtml: body.pastedHtml, title: body.title ?? '' }
    } else if (body?.text && typeof body.text === 'string') {
      source = { text: body.text, title: body.title ?? '' }
    } else if (body?.url && typeof body.url === 'string') {
      source = { url: body.url }
    } else {
      return NextResponse.json({ error: 'Missing url, text, or pastedHtml' }, { status: 400 })
    }
```

- [ ] **TypeScript 检查无错误**

```bash
npx tsc --noEmit 2>&1 | head -20
```

期望：无输出

- [ ] **提交**

```bash
git add src/app/api/reader/session/route.ts
git commit -m "feat(reader): accept pastedHtml in session API"
```

---

## Task 5: 前端全局 paste 事件监听

**Files:**
- Modify: `src/app/reader/page.tsx`

- [ ] **在 `page.tsx` 中添加 paste 监听**

首先确认 `src/app/reader/page.tsx` 第 1 行的 import 包含 `useEffect`：
```tsx
import { useState, useEffect } from 'react'
```
如果只有 `useState`，改为上面这行。

然后在 `export default function ReaderPage()` 函数体中，在 `const setupMatch = ...` 这行**之前**插入以下 `useEffect`：

```tsx
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // 不拦截 input/textarea 内的粘贴（URL 输入框等）
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (status === 'loading') return
      const types = e.clipboardData?.types ?? []
      if (!Array.from(types).includes('text/html')) return
      const html = e.clipboardData!.getData('text/html')
      if (!html.trim()) return
      e.preventDefault()
      load({ pastedHtml: html })
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [status, load])
```

（loading 提示文案 "Extracting article…" 对图文模式同样适用，无需改动。）

- [ ] **TypeScript 检查无错误**

```bash
npx tsc --noEmit 2>&1 | head -20
```

期望：无输出

- [ ] **提交**

```bash
git add src/app/reader/page.tsx
git commit -m "feat(reader): global paste handler for rich HTML content"
```

---

## Task 6: 本地集成测试（必须通过后才能 push）

**目标：** 在本地验证完整端到端流程。

- [ ] **启动 dev server**

```bash
npx next dev --port 3001 > /tmp/next-dev.log 2>&1 &
sleep 15 && curl -s http://localhost:3001/ -o /dev/null -w "%{http_code}"
```

期望：`200`

- [ ] **用 curl 模拟 pastedHtml 请求**

```bash
curl -s -X POST http://localhost:3001/api/reader/session \
  -H 'Content-Type: application/json' \
  -d '{
    "pastedHtml": "<html><body><article><p>Understanding risk is the most important thing in investing. Risk means more things can happen than will happen. The future is uncertain and investors must grapple with that uncertainty every single day. Most people think risk is about losing money, but the real risk is not understanding what you own and why you own it. Superior investors know that risk control is paramount.</p><img src=\"https://pbs.twimg.com/media/test.jpg\" alt=\"chart\"></article></body></html>",
    "title": "On Risk"
  }' 2>&1 | head -5
```

期望：SSE 流开始，首行包含 `data: {"type":"session"` 和 `"title":"On Risk"`

- [ ] **浏览器实测：x.com 全选复制 → 读书器粘贴**

1. 打开 x.com 文章（例：`https://x.com/trq212/article/2061907337154367865`）
2. `Ctrl+A` 全选 → `Ctrl+C`
3. 打开 `http://localhost:3001/reader`
4. 在页面任意空白处 `Ctrl+V`

验证清单：
- [ ] 页面出现「Extracting article…」提示
- [ ] 文章标题出现
- [ ] 正文文字正确（无 UI chrome：无按钮文字、无 @用户名）
- [ ] 图片内嵌在正文中（`pbs.twimg.com` 图片可见）
- [ ] AI 高亮逐步出现（蓝/绿/橙/紫下划线）
- [ ] 点击高亮 → 底部抽屉出现解释
- [ ] 在 URL 输入框中 Ctrl+V 粘贴 URL → **不触发图文模式**（正常粘贴）

- [ ] **停止 dev server**

```bash
pkill -f "next dev" 2>/dev/null || true
```

- [ ] **全量测试最终确认**

```bash
npx jest src/lib/reader/ --no-coverage --forceExit 2>&1 | tail -10
```

期望：所有测试通过

- [ ] **最终提交（如尚有未提交的改动）**

```bash
git status
# 若有遗漏，补充提交
```
