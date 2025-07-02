"use client";
import React, { useEffect, useState } from "react";

export default function AboutPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/profile")
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-gray-500">未找到用户信息</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-16">
      <div className="w-32 h-32 rounded-full overflow-hidden shadow border border-gray-200 mb-6">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name || user.username} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl text-gray-400">
            {user.name?.[0] || user.username?.[0] || "?"}
          </div>
        )}
      </div>
      <h1 className="text-3xl font-bold mb-2 text-black">{user.name || user.username}</h1>
      <div className="text-gray-600 text-lg mb-4 text-center max-w-xl whitespace-pre-line">{user.bio || "这个人很神秘，还没有填写简介。"}</div>
      <div className="text-gray-400 text-sm">{user.email}</div>
    </div>
  );
} 