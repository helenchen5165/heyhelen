"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  createdAt: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/blog")
      .then(res => res.json())
      .then(data => {
        const all: Post[] = data.data?.posts || data.posts || [];
        setPosts(all.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 导航 */}
      <header className="w-full flex justify-between items-center px-6 sm:px-12 py-5 sticky top-0 z-10" style={{ borderBottom: '1px solid var(--zen-border)', background: 'var(--background)' }}>
        <div className="zen-title text-xl">Helen</div>
        <nav className="flex gap-6 sm:gap-10 text-sm">
          {[
            { name: '投资', href: '/blog' },
            { name: '模板', href: '/templates' },
            { name: '关于', href: '/about' },
          ].map(item => (
            <Link key={item.name} href={item.href} className="zen-subtitle hover:text-current transition-colors duration-200">
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center text-center pt-20 pb-16 px-6">
        <Image
          src="/helen-avatar.png"
          alt="Helen"
          width={120}
          height={120}
          className="mb-8"
          style={{ imageRendering: 'crisp-edges' }}
          priority
        />
        <h1 className="zen-title text-4xl sm:text-5xl mb-4">Helen</h1>
        <p className="zen-subtitle text-base sm:text-lg max-w-sm mb-8">
          写投资，记时间，分享让我变好的东西。
        </p>
        <Link href="/blog" className="zen-button-primary px-8 py-3 text-sm">
          读投资笔记
        </Link>
      </section>

      {/* 分割线 */}
      <div style={{ borderTop: '1px solid var(--zen-border)', maxWidth: '640px', margin: '0 auto' }} />

      {/* 最新文章 */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {posts.length > 0 ? (
          <ul className="space-y-10">
            {posts.map(post => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="flex items-center gap-3 mb-2">
                    <time className="zen-subtitle text-xs tabular-nums">
                      {new Date(post.createdAt).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </time>
                    {post.category && (
                      <span className="zen-subtitle text-xs" style={{ color: 'var(--zen-gray)' }}>{post.category}</span>
                    )}
                  </div>
                  <h2 className="zen-title text-lg sm:text-xl mb-2 group-hover:opacity-60 transition-opacity duration-200">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="zen-subtitle text-sm leading-relaxed line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="zen-subtitle text-center text-sm">暂无文章</p>
        )}

        {posts.length > 0 && (
          <div className="mt-14 text-center">
            <Link href="/blog" className="zen-button px-6 py-2 text-sm">
              查看全部文章
            </Link>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="py-12 text-center px-4" style={{ borderTop: '1px solid var(--zen-border)' }}>
        <p className="zen-subtitle text-xs tracking-widest">始于记录，成于思考</p>
      </footer>
    </div>
  );
}
