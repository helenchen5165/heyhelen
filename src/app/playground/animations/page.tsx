'use client';

import Link from 'next/link';

export default function AnimationsPlayground() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/playground" className="text-sm hover:opacity-60 transition-opacity">
            ← Playground
          </Link>
          <h1 className="text-lg font-light">动画效果</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Hover Effects</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-black dark:border-white flex items-center justify-center text-2xl transition-transform hover:scale-110 cursor-pointer">
                ◯
              </div>
              <p className="text-sm mt-4">Hover Scale</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto border-2 border-black dark:border-white flex items-center justify-center text-2xl transition-transform hover:rotate-45 cursor-pointer">
                ◐
              </div>
              <p className="text-sm mt-4">Hover Rotate</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-2xl transition-all hover:-translate-y-4 cursor-pointer">
                ●
              </div>
              <p className="text-sm mt-4">Hover Lift</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto rounded-full border-2 border-black dark:border-white flex items-center justify-center text-2xl transition-opacity hover:opacity-50 cursor-pointer">
                ◕
              </div>
              <p className="text-sm mt-4">Hover Fade</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Loading Spinners</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white animate-spin" />
              <p className="text-sm mt-4">Circle Spinner</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 h-12">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-black dark:bg-white animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-sm mt-4">Dots</p>
            </div>
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto">
                <div className="absolute inset-0 rounded-full bg-black dark:bg-white animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-full bg-black dark:bg-white" />
              </div>
              <p className="text-sm mt-4">Pulse</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
