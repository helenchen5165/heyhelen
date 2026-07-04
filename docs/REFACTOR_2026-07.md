# 架构重构记录 — 2026-07-04

> 本文档面向日后接手的开发者/AI 模型。记录了本次重构做了什么、为什么做、
> 刻意没做什么，以及验证方式。分支：`refactor/architecture-cleanup`（基于 a6bbaa7）。

## 背景

对整个代码库做了一次架构摩擦审查（探查所有 src/ 模块、测试覆盖、API 路由、
Prisma 模型、依赖清单）。结论：**Reader 核心本身健康**——纯逻辑层
（extractor / segmentation / highlight-detector / vocabulary-store）全部依赖注入、
测试齐全；问题集中在重复代码、死代码和依赖膨胀。

## 每个提交做了什么

### 1. `e820685` 删除死代码

| 删除项 | 原因 |
|---|---|
| `src/lib/reader/session.ts` + `session-cache.ts`（含各自测试） | 被 `session-events.ts` 取代的早期设计，除自身测试外零引用 |
| `scripts/patch-whatwg-url.js`、`scripts/update-user-role.js` | 未接入 package.json，无任何引用 |
| `test-next15-app/` | 废弃的 Next 15 升级实验脚手架，整个目录与主应用无关 |
| `db.sqlite` | 0 字节残留；数据库早已迁移到 Postgres |

### 2. `6dbabb1` 共享 LLM 客户端 + SSE 传输层（本次核心）

**新模块 `src/lib/reader/llm.ts`**：
- `getAnthropic()` — 惰性单例，取代 concept route 和 session route 各自的 `new Anthropic()`
- `READER_MODEL = 'claude-opus-4-8'` — 唯一的模型 ID 来源（之前硬编码在
  highlight-detector.ts 和 concept/route.ts 两处，上次升级模型就要改两个文件）

**新模块 `src/lib/reader/sse.ts`**（有测试 `sse.test.ts`）：
- 服务端：`sseFrame(payload)` + `SSE_HEADERS`
- 客户端：`readSSE(body)` 异步生成器，处理 TextDecoder、跨 chunk 缓冲、`data: ` 帧解析
- 取代了三处各自手写、细节互不一致的流处理循环：
  `api/reader/session/route.ts`、`api/concept/route.ts`（服务端），
  `use-reader-session.ts`、`ConceptChat.tsx`（客户端）

**协议不变**：session 流走 JSON 事件；concept 流走转义文本 + `[DONE]`/`[ERROR]` 哨兵。
换行转义（`\n` → `\\n`）逻辑仍在 concept route / ConceptChat 两端，因为它是
concept 协议的一部分，不是传输层的。

### 3. `02a0f9d` 组件去重 + localStorage hook

- `ArticleView.tsx`：解释/翻译选中弹窗的 JSX 在 HTML 模式和分段模式里逐字重复
  两份 → 抽成同文件内的 `SelectionPopup` 组件（刻意不单独建文件，避免浅模块）
- 新 hook `src/lib/reader/use-persisted-state.ts`（有测试）：
  `usePersistedState(key, defaultValue, fromStored?)`，封装 SSR 守卫、JSON 编解码、
  try/catch、回写 effect。`page.tsx` 的 `chatHeight` 和 `prefs` 改用它。
  **存储格式向后兼容**：`heyhelen_drawer_height` 旧值是 `"480"` 纯字符串，
  JSON.parse 同样能读；`heyhelen_reader_prefs` 继续与 DEFAULT_PREFS 合并。

### 4. `50bdd44` browser-extractor 守卫收拢

x.com 反爬虫拦截提示 + `BROWSER_SETUP_REQUIRED:<domain>` 登录墙检测在三条提取
路径（本地 Playwright / Browserless REST / Browserless CDP）逐字重复 →
收拢为一个 `assertPageAccessible(rawHtml, domain, pageTitle?)`。
注意：`BROWSER_SETUP_REQUIRED:` 前缀会被 `reader/page.tsx` 正则解析以触发
cookie 设置流程，改动它要同步改两边。

### 5. `49d4d83` 删除 10 个无用依赖

移除（grep 全仓零引用 + 构建验证）：`next-auth`、`@next-auth/prisma-adapter`
（认证是手写 JWT，见 `src/lib/auth.ts`）、`jsdom`、`@types/jsdom`（已换 linkedom，
jsdom 的 ESM 依赖在 Vercel Lambda 上会崩）、`cloudinary`（上传直接 fetch REST 端点）、
`pdfjs-dist`（实际用 pdf-parse）、`dotenv`、`tapable`、`js-cookie`、`@tabler/icons-react`。
同步从 `next.config.mjs` 的 `serverComponentsExternalPackages` 移除了 jsdom。

**保留且勿删**：
- `sqlite3` — 看似残留，实际被 `api/reader/browser-setup/route.ts` 用来读 Chrome 的
  cookie 数据库（Chrome cookies 就是 SQLite 文件）
- `@mantine/core`、`@mantine/hooks` — 是 `@mantine/rte`（admin 博客编辑器）的 peer 依赖

## 验证记录

每个提交后均通过：
- `tsc --noEmit` 干净
- jest：14 套件 / 81 测试全绿（基线 78 个，删了死代码的 7 个，新增 sse + use-persisted-state 的 10 个）
- 依赖删除后额外跑了 `npx prisma generate && npx next build` 完整生产构建 ✓
- 冒烟测试：`next start` 后 `GET /reader` 200；`POST /api/reader/session`（text source）
  正确流出 `session` + `done` SSE 事件 ✓

## 刻意没做的事（给未来的重构者）

1. **没把 x.com 知识全部收拢成一个模块**。twimg 正则仍在 `ArticleView.tsx`
   （`hasImages` 判断）、SPA 域名列表在 `extractor.ts`。原因：服务端模块
   （browser-extractor 引 playwright）不能被客户端组件 import，为一个正则建新模块
   是浅模块。若日后要支持第二个 SPA 站点（LinkedIn 等），届时再抽 `x-content.ts`。
2. **没动 prompt 的存放位置**。highlight prompt 在 highlight-detector.ts，
   四个中文导师 prompt 在 concept/route.ts——各自只有一个消费方，集中注册表只增加跳转。
3. **没重构 blog/admin 半区**（RichTextEditor 544 行、admin/blog 461 行、
   Cloudinary cloud name 硬编码 5 处）。Reader 是活跃开发区，blog 侧稳定，
   动它的风险/收益比不划算。若要做：先抽共享的 Cloudinary 上传函数。
4. **没删孤儿 API 路由** `api/admin/users`、`api/auth/logout`——无前端调用方，
   但可能是有意保留的后门/未完成功能，需用户确认。
5. **测试文件名与模块布局不一致**（`rs-check.test.ts`、`html-to-text.test.ts`、
   `extract-content.test.ts` 测的都是 `extractor.ts` 的内部函数）——纯改名收益低，未动。
6. **根目录杂物未清**（`Helenloves.mp3/wav` 13MB、`月之暗面/自动驾驶_横纵分析报告.*`、
   `merge_notion.py`、`agent-rules/` 子模块）——属用户个人文件，不在代码重构范围。

## 特殊背景：为什么在 clone 里做

本次会话中 macOS TCC 中途收回了对 `~/Documents` 的访问权限（所有子进程
getcwd/open 均 EPERM），无法在原目录操作。因此从 GitHub（远端 main a6bbaa7
与本地 HEAD 一致、工作区干净）clone 到临时目录完成重构并推送分支。
本地合并方式：`git fetch && git checkout refactor/architecture-cleanup` 或直接在
GitHub 开 PR 合并。
