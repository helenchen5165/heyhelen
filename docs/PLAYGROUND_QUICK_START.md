# Design Playground 快速开始指南

## 🚀 立即体验

### 1. 启动项目

```bash
# 安装依赖（如果还没有）
npm install

# 启动开发服务器
npm run dev
```

### 2. 访问 Playground

在浏览器中打开：[http://localhost:3000/playground](http://localhost:3000/playground)

你将看到一个优雅的导航页面，展示10个设计模块。

---

## 📖 Playground 导览

### ✅ 完整实现的模块（可直接使用）

#### 1. **组件系统** (`/playground/components`)
**包含内容：**
- 4种按钮样式（Primary, Secondary, Icon, Button Groups）
- 3种卡片变体（Basic, Elevated, Gradient）
- 完整表单元素（Input, Textarea, Checkbox, Radio, Select）
- 模态框组件（带动画和backdrop）
- 导航组件（Tabs, Breadcrumb, Pagination）

**如何使用：**
```tsx
// 复制代码示例
import { useState } from 'react';

// 1. 基础按钮
<button className="zen-button">Click Me</button>

// 2. 带加载状态的按钮
<button className="zen-button flex items-center gap-2" disabled={loading}>
  {loading && <div className="w-4 h-4 rounded-full border-2 border-gray-400 border-t-black animate-spin" />}
  {loading ? 'Loading...' : 'Submit'}
</button>

// 3. 卡片
<div className="zen-card">
  <h3 className="text-xl font-light mb-2">Card Title</h3>
  <p className="text-sm text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

#### 2. **动画效果** (`/playground/animations`)
**包含内容：**
- 微交互（Hover Scale, Rotate, Bounce, Ripple）
- 持续动画（Pulse, Spin, Orbit）
- 加载动画（Spinner, Dots, Bars, Progress）
- 页面过渡（Fade In, Slide In）
- 交错动画（Stagger）
- 滚动动画（Scroll-triggered）

**如何使用：**
```tsx
// 1. 悬停缩放
<div className="transition-transform duration-300 hover:scale-110">
  Hover me
</div>

// 2. 淡入动画
<div className="animate-fade-in-up">
  Content
</div>

// 3. 脉冲效果
<div className="zen-circle zen-circle-lg">
  <div className="w-16 h-16 rounded-full bg-black dark:bg-white" />
</div>
```

#### 3. **加载状态** (`/playground/loading`)
**包含内容：**
- 4种骨架屏（Profile, Card, List, Table）
- Shimmer 效果
- 5种进度条（Linear, Thick, Indeterminate, Stepped, Circle）
- 6种 Spinner 样式
- 3种空状态（No Data, No Results, Error）

**如何使用：**
```tsx
// 1. 骨架屏
<div className="zen-card">
  <div className="flex items-center gap-4 mb-6">
    <div className="w-16 h-16 rounded-full skeleton" />
    <div className="flex-1 space-y-2">
      <div className="h-4 skeleton w-3/4" />
      <div className="h-3 skeleton w-1/2" />
    </div>
  </div>
</div>

// 2. Shimmer 效果
<div className="shimmer h-32 w-full" />

// 3. 进度条
<div className="h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
  <div className="h-full bg-black dark:bg-white w-3/4 transition-all duration-1000" />
</div>
```

#### 4. **排版系统** (`/playground/typography`)
**包含内容：**
- 9级标题层级（Display Large → H6）
- 8种正文样式（Light/Normal × 4 sizes）
- 3种行高（Tight, Normal, Relaxed）
- 6种字间距（Tighter → Widest）
- 4种对齐方式
- 特殊样式（Bold, Italic, Code, 等）
- 列表和引用块

**如何使用：**
```tsx
// 1. 标题
<h1 className="text-6xl md:text-7xl font-light tracking-tight">
  Display Large
</h1>

// 2. 正文
<p className="text-base font-light leading-relaxed">
  Body text
</p>

// 3. 引用
<blockquote className="zen-card border-l-2 border-black dark:border-white pl-8">
  <p className="text-2xl font-light leading-relaxed mb-4">
    "Quote text"
  </p>
  <cite className="text-base text-gray-500 not-italic">
    — Author
  </cite>
</blockquote>
```

### 🚧 占位模块（Coming Soon）

这些模块已创建占位页面，未来可以扩展：

5. **布局系统** - Grid, Flex, Responsive
6. **颜色与主题** - Color system, Theme switcher
7. **数据可视化** - Charts, Stats, Data display
8. **交互模式** - Drag & drop, Gestures, Scroll effects
9. **表单系统** - Validation, Feedback, Complete forms
10. **导航模式** - Sidebar, Mobile menu, Multilevel

---

## 💡 最佳实践

### 1. 复制代码前先理解

每个组件都有其设计意图：
- **zen-button**: 极简透明边框，悬停反转
- **zen-card**: 轻边框，悬停加强
- **skeleton**: 加载占位，渐变扫过
- **animate-fade-in-up**: 淡入上升，用于入场

### 2. 保持样式一致性

使用已定义的 CSS 类：
```css
/* 推荐 */
<div className="zen-card">

/* 不推荐 */
<div className="p-8 border border-gray-200 rounded">
```

### 3. 遵循响应式模式

```tsx
// 移动端优先
<h1 className="text-4xl md:text-5xl lg:text-6xl">
  Responsive Title
</h1>
```

### 4. 使用 CSS 变量

```css
/* 颜色 */
color: var(--circle-primary);
background: var(--zen-light);
border-color: var(--zen-border);

/* 不要硬编码 */
color: #000000;  /* ❌ */
color: var(--circle-primary);  /* ✅ */
```

---

## 🛠️ 常见使用场景

### 场景 1: 添加一个博客卡片

```tsx
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

function BlogCard({ post }) {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`
        zen-card transition-all duration-700 cursor-pointer
        hover:border-black dark:hover:border-white
        hover:-translate-y-2
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}
    >
      <div className="h-48 bg-gray-100 dark:bg-gray-900 mb-4" />
      <h3 className="text-xl font-light mb-2">{post.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {post.excerpt}
      </p>
    </div>
  );
}
```

### 场景 2: 添加表单验证反馈

```tsx
function ContactForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-light">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`
            w-full px-4 py-3 bg-transparent border
            font-light outline-none transition-all
            ${error ? 'border-red-500' : 'border-black/20 dark:border-white/20'}
            focus:border-black dark:focus:border-white
          `}
        />
        {error && (
          <p className="text-sm text-red-500 animate-fade-in-up">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-500 animate-fade-in-up">
            Email sent successfully!
          </p>
        )}
      </div>
    </form>
  );
}
```

### 场景 3: 添加加载状态

```tsx
function DataList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="zen-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full skeleton" />
              <div className="flex-1 space-y-2">
                <div className="h-4 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map(item => (
        <div key={item.id} className="zen-card animate-fade-in-up">
          {/* 实际内容 */}
        </div>
      ))}
    </div>
  );
}
```

---

## 🎨 自定义和扩展

### 修改颜色

```css
/* src/app/globals.css */
:root {
  --circle-primary: #000000;  /* 改成你的主色 */
  --zen-gray: #6b7280;        /* 改成你的灰色 */
  --zen-border: #e2e8f0;      /* 改成你的边框色 */
}
```

### 添加新动画

```css
/* 在 globals.css 中添加 */
@keyframes my-custom-animation {
  from { /* 起始状态 */ }
  to { /* 结束状态 */ }
}

.my-custom-class {
  animation: my-custom-animation 1s ease-out;
}
```

### 创建新组件

```tsx
// 基于现有模式创建
function MyComponent() {
  return (
    <div className="zen-card">
      {/* 使用已有的样式类 */}
      <h3 className="text-xl font-light mb-4">Title</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Content
      </p>
      <button className="zen-button mt-4">
        Action
      </button>
    </div>
  );
}
```

---

## 🐛 常见问题

### Q: 动画在移动端不流畅？
```css
/* 添加硬件加速 */
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}
```

### Q: 深色模式颜色不对？
```css
/* 确保使用 CSS 变量 */
color: var(--foreground);  /* ✅ */
color: #000;               /* ❌ */
```

### Q: 骨架屏布局偏移？
```tsx
// 确保骨架屏尺寸匹配实际内容
<div className="skeleton h-48 w-full" />  {/* 明确高度 */}
```

---

## 📚 相关文档

- **详细说明**: [`PLAYGROUND_SUMMARY.md`](./PLAYGROUND_SUMMARY.md)
- **优化指南**: [`FRONTEND_OPTIMIZATION_GUIDE.md`](./FRONTEND_OPTIMIZATION_GUIDE.md)
- **设计规范**: [`../CLAUDE.md`](../CLAUDE.md)
- **全局样式**: [`../src/app/globals.css`](../src/app/globals.css)

---

## 🎯 下一步

1. **浏览所有模块** - 理解每个组件的设计意图
2. **选择要使用的组件** - 根据需求选择
3. **复制代码** - 直接复制到你的项目
4. **调整样式** - 根据具体需求微调
5. **测试响应式** - 确保移动端正常
6. **优化性能** - 检查动画性能

---

**享受创建美好界面的过程！** ✨

有问题？查看完整文档或访问 Playground 查看实时示例。
