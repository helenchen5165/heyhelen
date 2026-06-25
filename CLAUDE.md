# HeyHelen 项目文档

**线上地址**：https://heyhelen.art  
**仓库**：https://github.com/helenchen5165/heyhelen  
**部署**：Vercel，推送 main 分支自动部署

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 14 App Router + TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | Prisma ORM + SQLite |
| AI | Anthropic SDK（claude-opus-4-8） |
| 部署 | Vercel |

---

## 项目结构

```
src/
  app/
    page.tsx              首页
    blog/                 投资笔记
    reader/               阅读器主页 ← 主要开发区域
      page.tsx            管理 prefs 状态、paste handler、session 加载
    api/
      reader/session/     统一 session API (url / text / pastedHtml / file)
      reader/browser-cookies/  获取本地浏览器 cookies（x.com 登录态）
  components/
    reader/
      ArticleView.tsx     文章渲染（文本模式 + HTML图文模式）
      BottomDrawer.tsx    底部抽屉（ConceptChat / 词库 / AI问答）
      ReadingSettings.tsx  Aa 设置面板（字体/字号/行高/仿生/标尺）
      HighlightMark.tsx   关键词高亮
  lib/
    reader/
      extractor.ts        URL/text/pastedHtml/PDF 提取入口
      browser-extractor.ts  x.com 粘贴 HTML 清洗（核心逻辑）
      use-bionic.ts       仿生阅读工具函数
      use-ruler.ts        阅读标尺 React hook
      highlight-detector.ts  LLM 关键词检测
      session-events.ts   SSE 流事件
      types.ts            共享类型
```

---

## Reader 功能清单（截至 2026-06 全部可用）

| 功能 | 入口 | 备注 |
|---|---|---|
| URL 加载 | 输入框 → Load | 走 Readability 提取 |
| 文本粘贴 | 粘贴文本 tab | 直接存为 text |
| 图文粘贴 | Ctrl+V 全局 | 走 browser-extractor 清洗 |
| PDF 上传 | PDF 按钮 | pdf-parse 提取 |
| x.com 文章 | 全选复制粘贴 | browser-extractor 处理 |
| 仿生阅读 | Aa → Bionic | 英文单词前N字母加粗 |
| 阅读标尺 | Aa → Ruler | 鼠标位置 3 层 overlay |
| 设置面板 | Aa 按钮 | 字体/字号/行高，存 localStorage |
| 概念学习 | 选中文字 → 解释 | ConceptChat 三阶段 |
| 翻译 | 选中文字 → 翻译 | SSE 流式输出 |
| 词库 | 底部抽屉 | 生词收藏 |

---

## x.com 图片粘贴 — 关键实现细节

`browser-extractor.ts` 的 `extractContent()` 负责清洗粘贴的 x.com HTML。

**x.com 文章图片的真实 DOM 结构（坑）：**
```html
<!-- 外层容器：position:absolute，不是 padding-based aspect-ratio -->
<div style="width:700px; height:280px; position:absolute; top:0; left:0;">
  <div style="align-items:stretch;">
    <!-- 图片本身：opacity:0 + z-index:-1，x.com JS 滚动时才改 opacity -->
    <img style="opacity:0; z-index:-1; position:absolute; width:700px; height:280px;"
         src="https://pbs.twimg.com/media/XXX?format=jpg&name=large" />
  </div>
</div>
```

**修复逻辑（当前代码）：**
1. 找到 `pbs.twimg.com` URL（检查 src / data-src / data-lazy-src / srcset）
2. `removeAttribute('style')` — 消除 `opacity:0`
3. 向上遍历 DOM，找最外层的 `position:absolute` 或 `padding-bottom/top` 容器
4. 把 `<img>` 提升到该容器前面，删掉整个容器
5. 结果：普通 block `<img>` 在文章正常流里，Tailwind prose 样式直接生效

---

## 重要约定

- **永远在 heyhelen 目录工作**，`/Users/chenhelen/PycharmProjects/Helen_reader` 已废弃
- `hasImages` 判断（`ArticleView.tsx`）：HTML 含 `pbs.twimg.com` 或 `twimg.com` 则进图文模式
- localStorage key：`heyhelen_reader_prefs`
- TypeScript 验证：`node_modules/.bin/tsc --noEmit`，必须干净才能 commit

---

## 全局 CLAUDE.md 规则

见 `~/.claude/CLAUDE.md`，其中 `# 4` 和 `# 5` 是从历史 session 提炼的质量纪律：
- 修改前先验证
- 不破坏现有功能
- 不自行扩大范围
- 遇到 `[Request interrupted]` 先问意图
