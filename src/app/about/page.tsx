"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

const timeline = [
  { year: "2017", text: "借姐姐1万块，开启了我的投资第一步" },
  { year: "2018", text: "选修双专业，跟着汤光华教授等前辈开始系统学习财务管理" },
  { year: "2020", text: "大量阅读霍华德马克斯/查理芒格/费雪等投资大家的书籍" },
  { year: "2022", text: "偶然加入唐书房，开始一种从更实战的方式配置资产" },
];

const AvatarReveal = () => (
  <>
    <style>{`
      @keyframes avatar-in {
        from { opacity: 0; transform: translateY(16px) scale(0.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .avatar-reveal {
        animation: avatar-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: 0.15s;
      }
      @media (prefers-reduced-motion: reduce) {
        .avatar-reveal { animation: none; }
      }
    `}</style>
    <div
      className="avatar-reveal rounded-full flex items-center justify-center"
      style={{
        width: 220,
        height: 220,
        background: '#ffffff',
        boxShadow: '0 0 0 1px var(--zen-border)',
      }}
    >
      <Image
        src="/helen-avatar.png"
        alt="Helen"
        width={190}
        height={190}
        priority
        style={{ borderRadius: '50%' }}
      />
    </div>
  </>
);

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 导航 */}
      <header className="w-full flex justify-between items-center px-6 sm:px-12 py-5 sticky top-0 z-10"
        style={{ borderBottom: '1px solid var(--zen-border)', background: 'var(--background)' }}>
        <Link href="/" className="zen-title text-xl hover:opacity-70 transition-opacity duration-200">Helen</Link>
        <nav className="flex gap-6 sm:gap-10 text-sm">
          {[
            { name: '投资', href: '/blog' },
            { name: '模板', href: '/templates' },
            { name: '关于', href: '/about' },
          ].map(item => (
            <Link key={item.name} href={item.href}
              className="zen-subtitle hover:text-current transition-colors duration-200">
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      <section className="max-w-4xl mx-auto px-6 sm:px-12 pt-16 pb-12">
        <h1 className="zen-title text-4xl sm:text-5xl mb-10">About</h1>
        <div className="flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-16">
          <div className="flex-shrink-0">
            <AvatarReveal />
          </div>
          <div className="flex-1 pt-2">
            <p className="zen-subtitle text-base leading-relaxed mb-4">
              我是 Helen，追求想不做什么就不做什么的自由。
            </p>
            <p className="zen-subtitle text-base leading-relaxed mb-4">
              2017 年借了姐姐 1 万块入市，从那以后慢慢建立起自己的投资体系——读书、记录、思考，在一次次市场的起伏里磨练判断力。
            </p>
            <p className="zen-subtitle text-base leading-relaxed">
              这个网站是我思考过程的公开记录：投资笔记、时间实验、以及那些让我变好的工具和方法。
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-12">
        <div style={{ borderTop: '1px solid var(--zen-border)' }} />
      </div>

      <section className="max-w-4xl mx-auto px-6 sm:px-12 py-14">
        <h2 className="zen-title text-2xl mb-10">投资之旅</h2>
        <div className="space-y-8">
          {timeline.map(({ year, text }) => (
            <div key={year} className="flex gap-8 items-start">
              <span className="zen-title text-base tabular-nums flex-shrink-0 w-12" style={{ color: 'var(--zen-gray)' }}>
                {year}
              </span>
              <p className="zen-subtitle text-base leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 sm:px-12">
        <div style={{ borderTop: '1px solid var(--zen-border)' }} />
      </div>

      <section className="max-w-4xl mx-auto px-6 sm:px-12 py-14">
        <h2 className="zen-title text-2xl mb-6">连接</h2>
        <p className="zen-subtitle text-base mb-6">如果我的思考能为你带来价值，欢迎交流。</p>
        <Link href="/blog" className="zen-button-primary px-6 py-2 text-sm inline-block">
          读投资笔记
        </Link>
      </section>

      <footer className="py-12 text-center px-4" style={{ borderTop: '1px solid var(--zen-border)' }}>
        <p className="zen-subtitle text-xs tracking-widest">始于记录，成于思考</p>
      </footer>
    </div>
  );
}
