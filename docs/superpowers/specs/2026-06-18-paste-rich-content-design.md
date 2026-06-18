# 粘贴图文功能设计
Date: 2026-06-18

## 背景与目标

x.com 文章页被 Cloudflare Bot Management 封锁，Browserless（数据中心 IP）无法绕过，服务器端自动提取无解。

用户的实际工作流：在 x.com 打开文章 → 浏览器里 Ctrl+A 全选（文字 + 图片）→ Ctrl+C → 切到读书器 Ctrl+V。浏览器剪贴板会把选中内容以 `text/html` 格式传递，其中文字是结构化 HTML，图片是 `<img src="https://pbs.twimg.com/...">` 的 URL 引用。

**目标：** 让读书器接受这个粘贴操作，清洗 HTML，保留图片，走现有高亮检测流水线。

---

## 用户流程

```
1. 用户在 x.com 文章页 Ctrl+A + Ctrl+C
2. 切到 heyhelen.art/reader，在页面任意位置 Ctrl+V
3. 读书器检测到剪贴板包含 text/html → 自动触发提取
4. 顶部显示「正在提取图文内容...」
5. 文章出现：标题 + 正文（含内嵌图片）+ AI 逐步标出高亮
6. 点击高亮 → 解释 / 深入学习，与 URL 模式完全一致
```

---

## 架构：方案 A（最小改动，扩展现有路径）

改动 5 处，不新增文件，不新增依赖：

### 1. `src/lib/reader/types.ts`
新增 `SessionSource` 变体：
```ts
| { pastedHtml: string; title?: string }
```

### 2. `src/lib/reader/browser-extractor.ts`
将 `extractContent()` 改为 `export function extractContent()`。该函数已实现 x.com HTML 清洗：移除 UI chrome（按钮/头像/nav/svg），保留 `pbs.twimg.com` 图片，折叠多余空白。

### 3. `src/lib/reader/extractor.ts`
在 `extract()` 方法中新增分支：
```ts
if ('pastedHtml' in source) {
  const { title, text, html } = extractContent(source.pastedHtml, source.title ?? '')
  return { title, text, html }
}
```

### 4. `src/app/api/reader/session/route.ts`
在 JSON body 解析中新增条件：
```ts
} else if (body?.pastedHtml && typeof body.pastedHtml === 'string') {
  source = { pastedHtml: body.pastedHtml, title: body.title ?? '' }
}
```

### 5. `src/app/reader/page.tsx`
全局 paste 事件监听（`useEffect` + `window.addEventListener('paste', ...)`）：
- 检测 `clipboardData.types.includes('text/html')`
- 读取 HTML，调用 `load({ pastedHtml: html })`
- 状态 `loading` 时忽略粘贴
- 若 `e.target` 是 `<input>` 或 `<textarea>`，跳过（防止 URL 输入框粘贴被误拦截）
- 仅当 HTML 非空时触发

---

## 数据流

```
window paste event
  → clipboardData.getData('text/html')
  → load({ pastedHtml })                         [page.tsx]
  → POST /api/reader/session { pastedHtml }       [useReaderSession]
  → source = { pastedHtml }                       [session/route.ts]
  → extractContent(html, '')                      [extractor.ts → browser-extractor.ts]
  → { title, text, html: 清洗后 HTML }
  → createSessionEvents → highlight detection     [现有流水线]
  → SSE 流回前端
  → ArticleView 渲染 HTML（图片内嵌自动加载）
```

---

## 异常处理

| 情况 | 处理方式 |
|------|---------|
| 提取文字 < 80 字符 | 抛出「未能提取到文章内容，请确保选中了完整文章」 |
| `extractContent` 无法识别结构，回退 Readability | Readability 已作为 fallback，静默处理 |
| 图片 URL 失效/无法加载 | 浏览器原生空白占位，不影响文字 |
| 粘贴时正在加载另一篇 | `status === 'loading'` 时忽略 paste 事件 |
| 剪贴板仅含纯文字（无 HTML） | 不触发此路径；如用户想用纯文字，走现有 `{ text }` 路径 |

---

## 图片展示

`ArticleView` 已渲染 `session.html`（原始 HTML 字符串），`<img>` 标签自动生效。`extractContent()` 已过滤非文章图片（只保留 `pbs.twimg.com`），不需要额外改动 ArticleView。

---

## 测试计划

1. **单元测试**：`extractContent()` 导出后，补充对粘贴 HTML 的单元测试（含图片标签保留、UI chrome 清除）
2. **本地集成测试**：dev server 启动后，在 x.com 文章页全选复制，在 `/reader` 粘贴，验证：
   - 文章内容正确提取
   - 图片内嵌显示
   - AI 高亮正常流出
3. **边界测试**：粘贴空内容、粘贴非文章页 HTML、粘贴时正在加载

---

## 不在本次范围

- 截图 OCR（Claude Vision）：当前用户场景不需要
- 多图片/多次粘贴累加
- 非 x.com 站点的粘贴优化（可复用，但不专门处理）
- 移动端支持（Mobile Safari 剪贴板 API 限制，后续再看）
