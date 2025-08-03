"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { BlogSummary, TemplateSummary, TimeLogSummary, UserProfile } from '@/types';

const Chart = dynamic(() => import("../components/TimeChart"), { ssr: false });

// 禅意圆环组件
const ZenCircle = ({ size = "md", children }: { size?: "sm" | "md" | "lg" | "xl", children?: React.ReactNode }) => (
  <div className={`zen-circle zen-circle-${size}`}>
    {children}
  </div>
);

// 时间圆环SVG组件
const TimeCircle = ({ progress = 75, size = 120 }: { progress?: number, size?: number }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="time-circle"
        style={{ strokeDasharray }}
      />
    </svg>
  );
};

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
      .then(data => {
        console.log('Blog API response:', data); // Debug log
        setBlog(data.data?.posts?.[0] || data.posts?.[0] || null);
      })
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
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 极简导航栏 */}
      <header className="zen-nav w-full flex justify-between items-center px-12 py-6 sticky top-0 z-10">
        <div className="zen-title text-3xl">
          <ZenCircle size="sm">
            <span className="ml-8">Helen</span>
          </ZenCircle>
        </div>
        <nav className="flex gap-12">
          {[
            { name: '时间', href: '/time', icon: '○' },
            { name: '投资', href: '/blog', icon: '◐' },
            { name: '模板', href: '/templates', icon: '◑' },
            { name: '关于', href: '/about', icon: '●' }
          ].map(item => (
            <Link
              key={item.name}
              href={item.href}
              className="zen-subtitle hover:text-current transition-colors duration-300 flex items-center gap-2"
            >
              <span className="text-xs">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* 核心理念区域 */}
      <section className="flex flex-col items-center justify-center py-32">
        <ZenCircle size="xl">
          <div className="text-center">
            <h1 className="zen-title text-5xl mb-4">时的力量</h1>
            <p className="zen-subtitle text-xl max-w-md">
              通过时间可视化，见证智识的数字化呈现
            </p>
          </div>
        </ZenCircle>
        
        <div className="mt-16 zen-subtitle text-center max-w-2xl px-8">
          如柳比歇夫的时间实验，每一刻都值得记录与思考
        </div>
      </section>

      {/* 三大功能模块 */}
      <main className="max-w-6xl mx-auto px-12 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          
          {/* 时间实验 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <ZenCircle size="lg">
                <TimeCircle progress={75} size={100} />
              </ZenCircle>
              <h3 className="zen-title text-2xl mt-8 mb-4">时间实验</h3>
              <p className="zen-subtitle mb-8 min-h-[3rem] flex items-center">
                如柳比歇夫般记录时间，将抽象的时间转化为可见的力量
              </p>
            </div>
            <Link href="/time" className="zen-button">进入实验</Link>
          </div>

          {/* 投资思考 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <ZenCircle size="lg">
                <div className="w-[100px] h-[100px] flex items-center justify-center">
                  <span className="text-6xl font-light leading-none">◐</span>
                </div>
              </ZenCircle>
              <h3 className="zen-title text-2xl mt-8 mb-4">投资思考</h3>
              <p className="zen-subtitle mb-8 min-h-[3rem] flex items-center">
                分享投资智慧，记录市场观察，探索价值发现的艺术
              </p>
            </div>
            <Link href="/blog" className="zen-button">阅读思考</Link>
          </div>

          {/* 模板工具 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <ZenCircle size="lg">
                <div className="w-[100px] h-[100px] flex items-center justify-center">
                  <span className="text-6xl font-light leading-none">◑</span>
                </div>
              </ZenCircle>
              <h3 className="zen-title text-2xl mt-8 mb-4">模板工具</h3>
              <p className="zen-subtitle mb-8 min-h-[3rem] flex items-center">
                精心设计的Notion模板，让知识管理回归本质
              </p>
            </div>
            <Link href="/templates" className="zen-button">获取模板</Link>
          </div>
        </div>

        {/* 时间可视化预览 */}
        {timelog.length > 0 && (
          <div className="zen-card mt-20">
            <div className="text-center mb-12">
              <h3 className="zen-title text-3xl mb-4">近期时间流</h3>
              <p className="zen-subtitle">每一条线都是时间的轨迹</p>
            </div>
            <div className="h-64 flex items-center justify-center">
              <Chart data={timelog} />
            </div>
          </div>
        )}
      </main>

      {/* 极简页脚 */}
      <footer className="py-16 text-center">
        <div className="zen-subtitle">
          <ZenCircle size="sm">
            <span className="ml-8">始于记录，成于思考</span>
          </ZenCircle>
        </div>
      </footer>
    </div>
  );
}
