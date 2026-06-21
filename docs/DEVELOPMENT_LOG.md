# 开发日志

## 2026年6月 - Reader 阅读器（当前主线）

> 旧 Python 原型 `/Users/chenhelen/PycharmProjects/Helen_reader` 已废弃，全部迁移到本项目（Next.js）。部署为 **Vercel**（不是下方旧记录里的 Netlify）。

### 🎯 功能定位
英文阅读教练：粘贴 URL / 上传 PDF / 粘贴图文 → AI 标注关键词论点 → 点高亮看解释 → Feynman+Socratic 对话深入。主力场景是读 x.com 付费/登录墙文章。

### ✅ 已完成（截至 2026-06-20）
- URL / 文本 / 图文粘贴 / PDF 四种输入（统一 `/api/reader/session` SSE）
- 仿生阅读、阅读标尺、设置面板（localStorage: `heyhelen_reader_prefs`）
- 概念学习对话（explain / translate / socratic 三阶段）+ 词库
- x.com 图文粘贴：清洗 DOM、修复图片
- **翻译抽屉可拖动调整高度**（localStorage: `heyhelen_drawer_height`）
- **选中文字保留淡蓝高亮**（CSS Custom Highlight API）

### 🔬 复盘：两场硬仗（根因 + 教训）

**1. x.com 图片粘贴后不显示（4 轮才找到根因）**
- 弯路：先后猜 `data-src` 懒加载、`padding-bottom` 宽高比包装器，都不对。
- 真根因：x.com 文章图片 inline style 是 `opacity:0; z-index:-1; position:absolute`，靠 x.com 自己的 JS 滚动时才改 opacity，粘贴到 reader 后这段 JS 不存在 → 永远透明。
- 教训：**渲染 bug 先加 console.log 打印真实 DOM/style，再动手**。加一条日志立刻定位，抵四轮盲改。已写入 memory `feedback-debug-first`。

**2. 翻译抽屉拖动 + 选区高亮（图文模式失效）**
- 选区高亮在文本模式正常、图文模式不显示。根因：`<div dangerouslySetInnerHTML={{__html:html}}>` 的 `{{__html}}` 每次 render 是新对象，React 每次 re-render 重设 innerHTML、替换全部文本节点，导致注册的 live `Range` 塌缩（`collapsed:true`）。修复：`useMemo` 缓存该 div（html 不变即同一 element，React 跳过子树协调）。
- 抽屉"拖不动"：监听器绑在把手节点 + `setPointerCapture`，拖动每次 `onResize` 触发 re-render 使监听/capture 失效，拖一下就断。修复：监听器改绑 `window`（全局对象 React 不碰，跨 re-render 存活）。
- 抽屉"只有 1mm 能拖"：ConceptChat 根节点 `h-full` 占满整个抽屉高度，盖住了顶部拖动条。修复：抽屉改 `flex flex-col`，拖动条 `shrink-0`，内容区 `flex-1 min-h-0`。
- 教训：**合成事件测试会漏掉真实交互 bug**（同步派发不触发 re-render）；用 browse 分步 + 延迟模拟真实拖动才复现。

### 🚧 已知限制 / 下一步
- Browserless 数据中心 IP 被 x.com Cloudflare 封锁，URL 直读 x.com 失败（`isBotBlocked()` 已检测报错）；BrowserCookies 表已建，等换 residential proxy。
- 高亮用 CSS Custom Highlight API，需 Chrome 105+ / Safari 17.2+。

### 📁 Reader 关键文件
见 `CLAUDE.md` 的完整项目地图。核心：`src/app/reader/page.tsx`（状态）、`src/components/reader/`（UI）、`src/lib/reader/browser-extractor.ts`（x.com 清洗）。

---

## 2025年7月30日 - 禅意博客系统重构

### 🎯 项目定位重新确认
**核心理念**: "智识的数字化呈现平台" + "时间实验的可视化展示"

**内容方向**:
- 投资分享 (市场观察、价值发现)
- 心理学内容分享
- 柳比歇夫式时间记录实验

**设计哲学**: 禅宗极简美学，如《降临》中七肢桶语言圆环的抽象简约

### ✨ 完成的重大重构

#### 1. 禅意视觉系统 (已完成)
- **色彩系统**: 黑白灰极简配色，支持深/浅色模式
- **圆环元素**: 核心视觉符号 (○◐◑●)，象征时间循环和智识流转
- **字体系统**: font-weight 200-300，大量留白，细线条分割
- **动画效果**: 缓慢的脉动和绘制效果，微妙不抢眼

#### 2. 首页重构 (已完成)
- **标题区**: 圆环包围的"时的力量"主题
- **导航栏**: 极简半透明设计，圆环符号导航
- **三大模块**: 
  - 时间实验 (动态圆环 + 时间进度)
  - 投资思考 (◐ 符号)
  - 模板工具 (◑ 符号)
- **布局优化**: 完全对齐的三列布局，等高卡片

#### 3. 博客系统重构 (已完成)

##### 博客列表页
- **禅意标题**: "思考记录" 圆环标题
- **分类导航**: 投资思考/心理学分类，用圆环符号区分
- **卡片设计**: 横向布局，去色图片，极简边框
- **功能简化**: 移除搜索，保留标签筛选

##### 博客详情页  
- **阅读体验**: 专业排版 (行高2.0，居中标题，两端对齐)
- **禅意文章样式**: 轻量字体，舒适间距，微妙边框
- **互动重设计**: 
  - 圆环点赞 (○●)
  - "思考回响" 评论区
  - 左侧引线标记评论
  - 透明输入框设计

#### 4. 深色模式优化 (已完成)
- **对比度修复**: 文字清晰可读
- **色彩变量**: 完整的深/浅色模式变量系统
- **导航适配**: 半透明背景适配

### 📋 V1 功能范围确认

#### ✅ 已实现功能
- 博客列表/详情展示
- 富文本内容支持  
- 标签和分类系统
- 分页功能
- 评论和点赞 (需要登录)
- 禅意视觉设计系统

#### 🎯 V1 待完成功能
- [ ] 匿名评论系统 (去除登录限制)
- [ ] 投资/心理学分类完善
- [ ] 管理后台优化

#### 📈 V2 规划功能  
- 时间可视化功能升级
- Notion模板商店完善
- 付费内容系统
- 高级编辑器功能

### 🛠 技术栈
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes + Prisma
- **数据库**: SQLite  
- **认证**: NextAuth.js
- **部署**: Netlify

### 📁 核心文件结构
```
src/
├── app/
│   ├── page.tsx (首页)
│   ├── blog/ (博客系统)
│   ├── templates/ (模板展示)
│   ├── time/ (时间可视化)
│   └── globals.css (禅意样式系统)
├── components/ (通用组件)
└── lib/ (工具函数)
```

### 🎨 设计资产
- **圆环组件**: ZenCircle, TimeCircle
- **CSS类**: zen-title, zen-subtitle, zen-card, zen-button, zen-article
- **颜色变量**: --circle-primary, --zen-gray, --zen-border
- **字体**: 系统字体 + 300重量

### 📝 待办事项优先级
1. **高优先级**: 匿名评论系统实现
2. **中优先级**: 博客分类系统完善  
3. **低优先级**: 时间可视化功能增强
4. **未来版本**: 变现功能开发

---
*更新时间: 2025年7月30日*