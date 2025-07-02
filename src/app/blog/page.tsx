"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    fetch("/api/blog").then(res => res.json()).then(data => setPosts(data.posts || []));
  }, []);

  // 提取所有标签
  const allTags = Array.from(new Set<string>(posts.flatMap((p: any) => p.tags ? JSON.parse(p.tags) : [])));
  // 搜索和筛选
  const filtered = posts.filter((p: any) => {
    const matchSearch = p.title.includes(search) || (p.excerpt || "").includes(search);
    const matchTag = !tag || (p.tags && JSON.parse(p.tags).includes(tag));
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-black">博客</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
        <input
          type="text"
          placeholder="搜索文章..."
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 w-64 text-black bg-white"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 w-48 text-black bg-white"
          value={tag}
          onChange={e => setTag(e.target.value)}
        >
          <option value="">全部标签</option>
          {allTags.map((t: string) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {filtered.map((post: any) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden hover:-translate-y-1"
          >
            {post.coverImage && (
              <div className="w-full h-48 bg-gray-100 relative">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="object-cover w-full h-full transition group-hover:scale-105 duration-200"
                />
              </div>
            )}
            <div className="flex-1 flex flex-col p-5">
              <h2 className="text-lg font-bold mb-2 text-black group-hover:text-blue-600 transition">{post.title}</h2>
              <div className="flex items-center gap-2 text-gray-500 text-xs mb-2">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{post.author?.name?.[0] || post.author?.username?.[0]}</span>
                <span>{post.author?.name || post.author?.username}</span>
                <span>·</span>
                <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mb-2 text-gray-700 line-clamp-2 min-h-[40px]">{post.excerpt}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {post.tags && JSON.parse(post.tags).map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100 font-medium">#{tag}</span>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <span className="text-pink-500 text-base">❤️</span>
                <span className="text-gray-600 text-sm">{post.likeCount || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 