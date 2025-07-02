"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("../components/TimeChart"), { ssr: false });

export default function HomePage() {
  // 精选内容
  const [template, setTemplate] = useState<any>(null);
  const [blog, setBlog] = useState<any>(null);
  const [timelog, setTimelog] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/templates").then(res => res.json()).then(data => setTemplate(data.templates?.[0] || null));
    fetch("/api/blog").then(res => res.json()).then(data => setBlog(data.posts?.[0] || null));
    fetch("/api/timelog?limit=30").then(res => res.json()).then(data => setTimelog(data.records || []));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <header className="w-full flex justify-between items-center px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="font-bold text-xl text-black">HeyHelen</div>
        <nav className="flex gap-6 text-gray-700 text-base font-medium">
          <Link href="/">首页</Link>
          <Link href="/templates">模板</Link>
          <Link href="/blog">博客</Link>
          <Link href="/dashboard">时间记录</Link>
          <Link href="/about">关于我</Link>
        </nav>
      </header>

      {/* 个人简介横幅 */}
      <section className="flex flex-col items-center justify-center py-12 border-b border-gray-200 bg-white">
        <Image src="/avatar.png" alt="avatar" width={96} height={96} className="rounded-full mb-4 border border-gray-300" />
        <h1 className="text-3xl font-bold mb-2 text-black">Helen Chen</h1>
        <p className="text-gray-700 text-lg">Notion 爱好者 | 个人成长记录者 | 分享高效生活方式</p>
      </section>

      {/* Notion模板横幅 */}
      <section className="py-12 border-b border-gray-200 flex flex-col items-center bg-white">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-6 items-center border border-gray-200">
          {template && template.imageUrl && (
            <Image src={template.imageUrl} alt={template.title} width={180} height={100} className="rounded-lg object-cover w-44 h-28" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-black">精选模板</h2>
            {template ? (
              <>
                <div className="text-lg font-semibold mb-1 text-black">{template.title}</div>
                <div className="text-gray-700 mb-2 line-clamp-2">{template.description}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {template.tags && JSON.parse(template.tags).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </>
            ) : <div className="text-gray-400">暂无模板</div>}
            <Link href="/templates" className="inline-block mt-2 text-blue-600 hover:underline font-semibold">查看更多模板 →</Link>
          </div>
        </div>
      </section>

      {/* 博客横幅 */}
      <section className="py-12 border-b border-gray-200 flex flex-col items-center bg-white">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row gap-6 items-center border border-gray-200">
          {blog && blog.coverImage && (
            <img src={blog.coverImage} alt={blog.title} width={180} height={100} className="rounded-lg object-cover w-44 h-28" />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 text-black">最新博客</h2>
            {blog ? (
              <>
                <div className="text-lg font-semibold mb-1 text-black">{blog.title}</div>
                <div className="text-gray-700 mb-2 line-clamp-2">{blog.excerpt}</div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {blog.tags && JSON.parse(blog.tags).map((tag: string) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </>
            ) : <div className="text-gray-400">暂无博客</div>}
            <Link href="/blog" className="inline-block mt-2 text-blue-600 hover:underline font-semibold">查看更多博客 →</Link>
          </div>
        </div>
      </section>

      {/* 时间记录可视化横幅 */}
      <section className="py-12 border-b border-gray-200 flex flex-col items-center bg-white">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-black">时间记录可视化</h2>
          <div className="w-full h-48 flex items-center justify-center">
            <Chart data={timelog} />
          </div>
          <Link href="/dashboard" className="inline-block mt-2 text-blue-600 hover:underline font-semibold">查看更多时间记录 →</Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} HeyHelen | 个人主页
      </footer>
    </div>
  );
}
