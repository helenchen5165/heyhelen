'use client';

import Link from 'next/link';

export default function TypographyPlayground() {
  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link href="/playground" className="text-sm hover:opacity-60 transition-opacity">
            ← Playground
          </Link>
          <h1 className="text-lg font-light">排版系统</h1>
          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-20">
        <section>
          <h2 className="text-3xl font-light mb-12 text-center">Headings</h2>
          <div className="space-y-8 max-w-4xl mx-auto">
            <div>
              <h1 className="text-6xl md:text-7xl font-light mb-2">Display Large</h1>
              <p className="text-sm text-gray-500">72-96px / font-weight: 200</p>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-light mb-2">Heading 1</h1>
              <p className="text-sm text-gray-500">48px / font-weight: 200</p>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-light mb-2">Heading 2</h2>
              <p className="text-sm text-gray-500">36px / font-weight: 300</p>
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-light mb-2">Heading 3</h3>
              <p className="text-sm text-gray-500">30px / font-weight: 300</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-12 text-center">Body Text</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <div>
              <p className="text-lg font-light leading-relaxed mb-4">
                Large Body Text (18px / 300)
              </p>
              <p className="text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400">
                This is a sample of large body text with light font weight. Perfect for introductory paragraphs.
              </p>
            </div>
            <div>
              <p className="text-base font-light leading-relaxed mb-4">
                Regular Body Text (16px / 300)
              </p>
              <p className="text-base font-light leading-relaxed text-gray-600 dark:text-gray-400">
                This is the standard body text size with excellent readability for most content.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-12 text-center">Special Styles</h2>
          <div className="max-w-2xl mx-auto space-y-4">
            <p className="text-base font-light">
              This is <strong className="font-semibold">bold text</strong> for emphasis.
            </p>
            <p className="text-base font-light">
              This is <em className="italic">italic text</em> for emphasis.
            </p>
            <p className="text-base font-light">
              This is <code className="px-2 py-1 bg-gray-100 dark:bg-gray-900 text-sm">inline code</code> for technical content.
            </p>
            <p className="text-base font-light uppercase tracking-widest">
              Uppercase with wide tracking
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-light mb-12 text-center">Blockquote</h2>
          <div className="max-w-3xl mx-auto">
            <blockquote className="border-l-2 border-black dark:border-white pl-8 py-4">
              <p className="text-2xl font-light leading-relaxed mb-4">
                "Simplicity is the ultimate sophistication."
              </p>
              <cite className="text-base text-gray-500 dark:text-gray-400 not-italic">
                — Leonardo da Vinci
              </cite>
            </blockquote>
          </div>
        </section>
      </div>
    </div>
  );
}
