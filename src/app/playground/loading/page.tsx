'use client';

import Link from 'next/link';

export default function LoadingPlayground() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/playground" className="text-sm hover:opacity-60 transition-opacity">
            ← Playground
          </Link>
          <h1 className="text-lg font-light">加载状态</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Skeleton Screens</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="border border-black/10 dark:border-white/10 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 w-1/2 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 w-full animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 w-5/6 animate-pulse" />
              </div>
            </div>

            <div className="border border-black/10 dark:border-white/10 p-6">
              <div className="h-40 w-full bg-gray-200 dark:bg-gray-800 mb-4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 w-full animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Progress Bars</h2>
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Linear Progress</span>
                <span>75%</span>
              </div>
              <div className="h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-black dark:bg-white w-3/4" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Thick Progress</span>
                <span>50%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-black dark:bg-white w-1/2" />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Empty States</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-black/10 dark:border-white/10 p-8 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-black/20 dark:border-white/20 flex items-center justify-center text-3xl mx-auto mb-4">
                ◯
              </div>
              <h3 className="text-lg font-light mb-2">No Data</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
            </div>
            <div className="border border-black/10 dark:border-white/10 p-8 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-black/20 dark:border-white/20 flex items-center justify-center text-3xl mx-auto mb-4">
                ⊗
              </div>
              <h3 className="text-lg font-light mb-2">No Results</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
            </div>
            <div className="border border-black/10 dark:border-white/10 p-8 text-center">
              <div className="w-16 h-16 rounded-full border-2 border-black/20 dark:border-white/20 flex items-center justify-center text-3xl mx-auto mb-4">
                ⚠
              </div>
              <h3 className="text-lg font-light mb-2">Error</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Something went wrong</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
