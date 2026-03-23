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

// 一小时价值创造计数器组件
const HourlyValueCounter = () => {
  const [currentValue, setCurrentValue] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        const newSeconds = prev + 1;
        if (newSeconds >= 60) {
          setMinutes(prevMin => {
            const newMinutes = prevMin + 1;
            if (newMinutes >= 60) {
              // 一小时完成，重置
              setCurrentValue(0);
              return 0;
            }
            return newMinutes;
          });
          return 0;
        }
        return newSeconds;
      });
      
      // 每秒增加约166.67 ($10,000 / 3600 seconds)
      setCurrentValue(prev => {
        const totalSeconds = minutes * 60 + seconds + 1;
        const newValue = Math.floor((totalSeconds / 3600) * 10000);
        return Math.min(newValue, 10000);
      });
    }, 1000); // 每秒更新一次
    
    return () => clearInterval(interval);
  }, [minutes, seconds]);

  return (
    <div className="text-center">
      <ZenCircle size="xl">
        <div className="text-center">
          <div className="zen-title text-4xl mb-2 font-light tracking-tight">
            ${currentValue.toLocaleString()}
          </div>
          <div className="zen-subtitle text-sm">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
        </div>
      </ZenCircle>
      <div className="zen-subtitle text-lg mt-4">
        一小时创造进度
      </div>
    </div>
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
      <header className="zen-nav w-full flex justify-between items-center px-4 sm:px-8 lg:px-12 py-4 sm:py-6 sticky top-0 z-10">
        <div className="zen-title text-xl sm:text-2xl">
          Helen
        </div>
        <nav className="flex gap-4 sm:gap-8 lg:gap-12 text-sm sm:text-base">
          {[
            { name: '时间', href: '/time', icon: '○' },
            { name: '投资', href: '/blog', icon: '◐' },
            { name: '模板', href: '/templates', icon: '◑' },
            { name: '关于', href: '/about', icon: '●' }
          ].map(item => (
            <Link
              key={item.name}
              href={item.href}
              className="zen-subtitle hover:text-current transition-colors duration-300 flex items-center gap-1 sm:gap-2"
            >
              <span className="text-xs hidden sm:inline">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* Hero区域 - 价值主张 */}
      <section className="flex flex-col items-center justify-center py-10 sm:py-14 lg:py-20 px-4">
        {/* 一小时价值创造计数器 */}
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <HourlyValueCounter />
        </div>

        {/* 核心宣言 */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <h1 className="zen-title text-2xl sm:text-3xl lg:text-5xl mb-4 sm:mb-6">
            海伦一小时值 $10,000
          </h1>
          <p className="zen-subtitle text-base sm:text-lg mb-3 sm:mb-4 max-w-xl mx-auto">
            不是因为它真的值这么多——是因为这个数字让我不得不认真。
          </p>
          <p className="zen-subtitle text-sm sm:text-base max-w-xl mx-auto">
            这个网站记录我怎么思考、怎么做事，以及结果如何。
          </p>
        </div>

        {/* CTA按钮组 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto px-4">
          <Link href="/blog" className="zen-button-primary px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base text-center">
            投资思考笔记
          </Link>
          <Link href="/about" className="zen-button px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base text-center">
            关于海伦
          </Link>
        </div>

      </section>

      {/* 三大功能模块 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 lg:gap-16">

          {/* 时间实验 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-20 flex items-center justify-center">
                <TimeCircle progress={75} size={80} />
              </div>
              <h3 className="zen-title text-xl sm:text-2xl mt-6 mb-3 sm:mb-4">时间实验</h3>
              <p className="zen-subtitle mb-6 sm:mb-8 text-sm sm:text-base min-h-[3rem] flex items-center px-2">
                如柳比歇夫般记录时间，将抽象的时间转化为可见的力量
              </p>
            </div>
            <Link href="/time" className="zen-button text-sm sm:text-base">进入实验</Link>
          </div>

          {/* 投资思考 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-20 flex items-center justify-center">
                <span className="text-6xl font-light leading-none" style={{ color: 'var(--foreground)' }}>◐</span>
              </div>
              <h3 className="zen-title text-xl sm:text-2xl mt-6 mb-3 sm:mb-4">投资思考</h3>
              <p className="zen-subtitle mb-6 sm:mb-8 text-sm sm:text-base min-h-[3rem] flex items-center px-2">
                分享投资智慧，记录市场观察，探索价值发现的艺术
              </p>
            </div>
            <Link href="/blog" className="zen-button text-sm sm:text-base">阅读思考</Link>
          </div>

          {/* 模板工具 */}
          <div className="zen-card text-center h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-20 flex items-center justify-center">
                <span className="text-6xl font-light leading-none" style={{ color: 'var(--foreground)' }}>◑</span>
              </div>
              <h3 className="zen-title text-xl sm:text-2xl mt-6 mb-3 sm:mb-4">模板工具</h3>
              <p className="zen-subtitle mb-6 sm:mb-8 text-sm sm:text-base min-h-[3rem] flex items-center px-2">
                精心设计的Notion模板，让知识管理回归本质
              </p>
            </div>
            <Link href="/templates" className="zen-button text-sm sm:text-base">获取模板</Link>
          </div>
        </div>

        {/* 时间可视化预览 */}
        {timelog.length > 0 && (
          <div className="zen-card mt-12 sm:mt-16 lg:mt-20">
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="zen-title text-2xl sm:text-3xl mb-3 sm:mb-4">近期时间流</h3>
              <p className="zen-subtitle text-sm sm:text-base">每一条线都是时间的轨迹</p>
            </div>
            <div className="h-48 sm:h-64 flex items-center justify-center overflow-x-auto">
              <Chart data={timelog} />
            </div>
          </div>
        )}
      </main>

      {/* 极简页脚 */}
      <footer className="py-12 sm:py-16 text-center px-4">
        <p className="zen-subtitle text-sm tracking-widest">始于记录，成于思考</p>
      </footer>
    </div>
  );
}
