"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { BlogSummary, TemplateSummary, TimeLogSummary, UserProfile, CardProps } from '@/types';

const Chart = dynamic(() => import("../components/TimeChart"), { ssr: false });

const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200 p-8 flex flex-col items-start group cursor-pointer ${className}`}>
    {children}
  </div>
);

export default function HomePage() {
  // 精选内容
  const [template, setTemplate] = useState<TemplateSummary | null>(null);
  const [blog, setBlog] = useState<BlogSummary | null>(null);
  const [timelog, setTimelog] = useState<TimeLogSummary[]>([]);
  const [blogs, setBlogs] = useState<BlogSummary[]>([]);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => setTemplate(data.templates?.[0] || null))
      .catch(error => console.error('Error fetching templates:', error));
    
    fetch("/api/blog")
      .then(res => res.json())
      .then(data => setBlog(data.posts?.[0] || null))
      .catch(error => console.error('Error fetching blog:', error));
    
    fetch("/api/time/summary?limit=30")
      .then(res => res.json())
      .then(data => setTimelog(data.records || []))
      .catch(error => console.error('Error fetching timelog:', error));
    
    fetch("/api/user/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setUserLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setUserLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <header className="w-full flex justify-between items-center px-8 py-4 bg-white sticky top-0 z-10 shadow-sm">
        <div className="font-extrabold text-2xl text-black tracking-tight">HeyHelen</div>
        <nav className="flex gap-8 text-gray-700 text-base font-semibold">
          {['首页', '模板', '博客', '时间记录', '关于我'].map((item, i) => (
            <Link
              key={item}
              href={['/', '/templates', '/blog', '/dashboard', '/about'][i]}
              className="hover:text-blue-600 transition-colors duration-150 relative after:content-[''] after:block after:h-0.5 after:bg-blue-600 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-150 after:origin-left"
            >
              {item}
            </Link>
          ))}
        </nav>
      </header>

      {/* 个人简介横幅 */}
      <section className="flex flex-col items-center justify-center py-20 bg-white">
        {userLoading ? (
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-6 border border-gray-200 animate-pulse" />
        ) : user && user.avatar ? (
          <img src={user.avatar} alt={user.name || user.username} className="w-32 h-32 rounded-full object-cover mb-6 border border-gray-200 shadow" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center mb-6 border border-gray-200 text-5xl text-gray-400">
            {user?.name?.[0] || user?.username?.[0] || "?"}
          </div>
        )}
        <h1 className="text-4xl font-extrabold mb-2 text-black tracking-tight">{user?.name || user?.username || "Helen Chen"}</h1>
        <p className="text-gray-500 text-lg mb-2">{user?.bio || "Notion 爱好者 | 个人成长记录者 | 分享高效生活方式"}</p>
        <div className="text-gray-400 text-sm">{user?.email}</div>
      </section>

      {/* 内容区块 */}
      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 mt-12 mb-20">
        {/* 精选模板卡片 */}
        <Card>
          <div className="flex items-center gap-6 w-full">
            {template && template.imageUrl ? (
              <img src={template.imageUrl} alt={template.title} className="rounded-xl object-cover w-24 h-24 border border-gray-100" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl text-gray-300">📦</div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 text-black">精选模板</h2>
              {template ? (
                <>
                  <div className="text-lg font-semibold mb-1 text-black">{template.title}</div>
                  <div className="text-gray-700 mb-2 line-clamp-2">{template.description}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {template.tags && JSON.parse(template.tags).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-200">{tag}</span>
                    ))}
                  </div>
                  <Link href="/templates" className="text-blue-600 font-semibold hover:underline">查看更多模板 →</Link>
                </>
              ) : <div className="text-gray-400">暂无模板</div>}
            </div>
          </div>
        </Card>

        {/* 最新博客卡片 */}
        <Card>
          <div className="flex items-center gap-6 w-full">
            {blog && blog.coverImage ? (
              <img src={blog.coverImage} alt={blog.title} className="rounded-xl object-cover w-24 h-24 border border-gray-100" />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl text-gray-300">📝</div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 text-black">最新博客</h2>
              {blog ? (
                <>
                  <div className="text-lg font-semibold mb-1 text-black">{blog.title}</div>
                  <div className="text-gray-700 mb-2 line-clamp-2">{blog.excerpt}</div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {blog.tags && JSON.parse(blog.tags).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 border border-gray-200">{tag}</span>
                    ))}
                  </div>
                  <Link href="/blog" className="text-blue-600 font-semibold hover:underline">查看更多博客 →</Link>
                </>
              ) : <div className="text-gray-400">暂无博客</div>}
            </div>
          </div>
        </Card>

        {/* 时间记录可视化卡片 */}
        <Card className="md:col-span-2">
          <h2 className="text-2xl font-bold mb-4 text-black">时间记录可视化</h2>
          <div className="w-full h-48 flex items-center justify-center">
            <Chart data={timelog} />
          </div>
          <Link href="/dashboard" className="inline-block mt-2 text-blue-600 font-semibold hover:underline">查看更多时间记录 →</Link>
        </Card>
      </main>

      {/* 页脚 */}
      <footer className="py-8 text-center text-gray-400 text-sm border-t border-gray-200 bg-white">
        © {new Date().getFullYear()} HeyHelen | 个人主页
      </footer>
    </div>
  );
}
