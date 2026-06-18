'use client';

import Link from 'next/link';

export default function NavigationPlayground() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <header className="sticky top-0 z-50 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/playground" className="text-sm hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-2">
            <span>←</span>
            <span>Playground</span>
          </Link>
          <h1 className="text-lg font-light tracking-wide">导航模式</h1>
          <div className="w-20" />
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center space-y-4 py-20">
          <div className="text-6xl mb-8 animate-pulse">●</div>
          <h2 className="text-4xl font-light tracking-tight">Coming Soon</h2>
          <p className="text-gray-500 dark:text-gray-400">Navigation</p>
        </div>
      </div>
    </div>
  );
}
