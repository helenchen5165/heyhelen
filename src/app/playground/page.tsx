'use client';

import Link from 'next/link';

const playgroundSections = [
  { id: 'components', title: '组件系统', subtitle: 'Components', icon: '◯' },
  { id: 'animations', title: '动画效果', subtitle: 'Animations', icon: '◐' },
  { id: 'layouts', title: '布局系统', subtitle: 'Layouts', icon: '◑' },
  { id: 'colors', title: '颜色与主题', subtitle: 'Colors & Themes', icon: '◒' },
  { id: 'typography', title: '排版系统', subtitle: 'Typography', icon: '◓' },
  { id: 'data-viz', title: '数据可视化', subtitle: 'Data Visualization', icon: '◔' },
  { id: 'interactions', title: '交互模式', subtitle: 'Interactions', icon: '◕' },
  { id: 'loading', title: '加载状态', subtitle: 'Loading States', icon: '◖' },
  { id: 'forms', title: '表单系统', subtitle: 'Forms', icon: '◗' },
  { id: 'navigation', title: '导航模式', subtitle: 'Navigation', icon: '●' },
];

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      {/* Header */}
      <header className="border-b border-black/10 dark:border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <Link href="/" className="text-sm hover:opacity-60 transition-opacity">
            ← 返回首页
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto rounded-full border-2 border-black dark:border-white flex items-center justify-center">
              <div className="w-20 h-20 rounded-full border border-black/30 dark:border-white/30 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-black dark:bg-white" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-light mb-4">
            Design Playground
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 mb-2">
            前端设计能力展示
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xl mx-auto">
            A comprehensive showcase of modern frontend design capabilities
          </p>
        </div>
      </section>

      {/* Sections Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {playgroundSections.map((section) => (
              <Link
                key={section.id}
                href={`/playground/${section.id}`}
                className="border border-black/10 dark:border-white/10 p-8 hover:border-black dark:hover:border-white transition-colors"
              >
                <div className="text-4xl mb-4">{section.icon}</div>
                <h2 className="text-xl font-light mb-1">{section.title}</h2>
                <p className="text-sm text-gray-400 uppercase tracking-wider">
                  {section.subtitle}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-black/10 dark:border-white/10 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Built with Next.js 14, TypeScript, and Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
