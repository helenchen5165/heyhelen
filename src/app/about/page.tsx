"use client";
import React, { useEffect, useState } from "react";

// 禅意圆环组件
const ZenCircle = ({ size = "lg", children }: { size?: "sm" | "md" | "lg" | "xl", children?: React.ReactNode }) => (
  <div className={`zen-circle zen-circle-${size}`}>
    {children}
  </div>
);

// 时间价值动画组件
const TimeValueAnimation = () => {
  const [currentValue, setCurrentValue] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentValue(prev => (prev >= 10000 ? 0 : prev + 500));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center mb-16">
      <div className="zen-title text-6xl mb-4">
        ${currentValue.toLocaleString()}
      </div>
      <div className="zen-subtitle text-lg">
        每小时的价值目标
      </div>
    </div>
  );
};

// 理念卡片组件
const PhilosophyCard = ({ 
  icon, 
  title, 
  description, 
  delay = 0 
}: { 
  icon: string; 
  title: string; 
  description: string; 
  delay?: number;
}) => (
  <div 
    className="zen-card group cursor-pointer"
    style={{ 
      animationDelay: `${delay}ms`,
      animation: 'zen-pulse 4s ease-in-out infinite'
    }}
  >
    <div className="text-center">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="zen-title text-2xl mb-4">{title}</h3>
      <p className="zen-subtitle leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function AboutPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 尝试获取管理员信息
    fetch("/api/user/avatar", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <ZenCircle size="md">
          <div className="zen-subtitle ml-12">加载中...</div>
        </ZenCircle>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 个人头像区域 */}
      <div className="py-20 text-center">
        {/* 头像在 Zen Circle 内 */}
        <div className="relative flex items-center justify-center mb-16">
          {/* Zen Circle 背景层 */}
          <div className="absolute">
            <ZenCircle size="xl" />
          </div>
          
          {/* 头像前景层 */}
          <div className="relative z-20">
            {user?.avatar ? (
              <img 
                src={user.avatar} 
                alt="Helen" 
                className="w-32 h-32 rounded-full object-cover"
                style={{ filter: 'grayscale(80%)' }}
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-4xl zen-subtitle">○</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 个人信息在 Circle 外 */}
        <div>
          <h1 className="zen-title text-5xl mb-4">
            {user?.name || "Helen"}
          </h1>
          <p className="zen-subtitle text-xl max-w-2xl mx-auto px-8">
            {user?.bio || "追求想不做什么就不做什么的自由"}
          </p>
        </div>
      </div>

      {/* 核心价值主张 */}
      <div className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-8">
          <div className="mb-16">
            <h2 className="zen-title text-4xl mb-8">
              海伦的一个小时价值$10,000
            </h2>
            <p className="zen-subtitle text-xl leading-relaxed">
              这不是一个狂妄的宣言，而是一种生活方式的选择
            </p>
          </div>
          
          <TimeValueAnimation />
        </div>
      </div>

      {/* 三大理念 */}
      <div className="py-20">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <PhilosophyCard
              icon="◐"
              title="自由的真谛"
              description="真正的自由不是想做什么就做什么，而是想不做什么就不做什么。通过创造足够的价值，获得选择的权利。"
              delay={0}
            />
            
            <PhilosophyCard
              icon="◑"
              title="影响力的复利"
              description="通过投资思考训练理性决策，通过心理学洞察理解人性。让每一次分享都成为影响力的复利。"
              delay={500}
            />
            
            <PhilosophyCard
              icon="○"
              title="时间的价值"
              description="像柳比歇夫一样记录时间，让每一个小时都成为投资。时间 × 专注 × 智慧 = 无限可能。"
              delay={1000}
            />
          </div>
        </div>
      </div>

      {/* 个人故事时间轴 */}
      <div className="py-20">
        <div className="max-w-4xl mx-auto px-8">
          <div className="text-center mb-16">
            <h3 className="zen-title text-3xl mb-4">2017年</h3>
            <p className="zen-subtitle">借姐姐1万块，开启了我的投资第一步</p>
          </div>
          
          <div className="space-y-12">
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
                <span className="zen-subtitle">○</span>
              </div>
              <div>
                <h4 className="zen-title text-xl mb-2">2018年</h4>
                <p className="zen-subtitle">选修双专业，跟着汤光华教授等前辈开始系统学习财务管理</p>
              </div>
            </div>
            
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
                <span className="zen-subtitle">◐</span>
              </div>
              <div>
                <h4 className="zen-title text-xl mb-2">2020年</h4>
                <p className="zen-subtitle">大量阅读，在大学期间广发阅读霍华德马斯克/查理芒格/费雪等投资大家的书籍</p>
              </div>
            </div>
            
            <div className="flex items-start gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-current flex items-center justify-center">
                <span className="zen-subtitle">◑</span>
              </div>
              <div>
                <h4 className="zen-title text-xl mb-2">2022年</h4>
                <p className="zen-subtitle">偶然加入唐书房，开始一种从更实战的方式配置资产</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 联系方式 */}
      <div className="py-20 text-center">
        <div className="max-w-2xl mx-auto px-8">
          <h3 className="zen-title text-3xl mb-8">连接与交流</h3>
          <p className="zen-subtitle mb-12">
            如果我的思考能为你带来价值，欢迎交流
          </p>
          
          <div className="zen-card">
            <div className="space-y-4">
              {user?.email && (
                <div className="zen-subtitle">
                  📧 {user.email}
                </div>
              )}
              <div className="zen-subtitle">
                ⏰ 每小时价值目标：$10,000
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 