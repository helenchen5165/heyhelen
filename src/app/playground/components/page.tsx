'use client';

import Link from 'next/link';

export default function ComponentsPlayground() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/playground" className="text-sm hover:opacity-60 transition-opacity">
            ← Playground
          </Link>
          <h1 className="text-lg font-light">组件系统</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        {/* Buttons */}
        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Buttons</h2>
          <div className="space-y-4 max-w-md mx-auto">
            <button className="w-full px-6 py-3 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
              Default Button
            </button>
            <button className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity">
              Solid Button
            </button>
            <button className="w-full px-6 py-3 underline hover:no-underline transition-all">
              Text Button
            </button>
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Cards</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-black/10 dark:border-white/10 p-6 hover:border-black dark:hover:border-white transition-colors">
              <div className="w-12 h-12 rounded-full border border-black dark:border-white mb-4" />
              <h3 className="text-xl font-light mb-2">Basic Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Simple card with minimal styling.</p>
            </div>
            <div className="border border-black/10 dark:border-white/10 p-6 hover:border-black dark:hover:border-white transition-colors">
              <div className="w-12 h-12 rounded-full bg-black dark:bg-white mb-4" />
              <h3 className="text-xl font-light mb-2">Filled Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Card with filled icon.</p>
            </div>
            <div className="border border-black/10 dark:border-white/10 p-6 hover:border-black dark:hover:border-white transition-colors">
              <div className="w-12 h-12 rounded-full border-2 border-black dark:border-white mb-4" />
              <h3 className="text-xl font-light mb-2">Bold Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Card with bold border.</p>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section>
          <h2 className="text-3xl font-light mb-8 text-center">Form Elements</h2>
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-sm mb-2">Text Input</label>
              <input
                type="text"
                placeholder="Enter text..."
                className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Textarea</label>
              <textarea
                placeholder="Write something..."
                rows={4}
                className="w-full px-4 py-3 bg-transparent border border-black/20 dark:border-white/20 focus:border-black dark:focus:border-white outline-none resize-none"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
