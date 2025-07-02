"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []));
  }, []);

  // 提取所有标签
  const allTags = Array.from(new Set<string>(templates.flatMap((t: any) => t.tags ? JSON.parse(t.tags) : [])));
  // 搜索和筛选
  const filtered = templates.filter((t: any) => {
    const matchSearch = t.title.includes(search) || (t.description || "").includes(search);
    const matchTag = !tag || (t.tags && JSON.parse(t.tags).includes(tag));
    return matchSearch && matchTag;
  });

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-12">
      <h1 className="text-4xl font-bold mb-8 text-center text-black">Notion 模板区</h1>
      <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center">
        <input
          type="text"
          placeholder="搜索模板..."
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
        {filtered.map((tpl: any) => (
          <div key={tpl.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col relative hover:shadow-xl transition">
            {tpl.imageUrl && (
              <Image src={tpl.imageUrl} alt={tpl.title} width={400} height={200} className="rounded-lg mb-4 object-cover w-full h-40 border border-gray-200" />
            )}
            <h2 className="text-2xl font-bold mb-2 text-black">{tpl.title}</h2>
            <div className="text-gray-500 text-sm mb-2">{tpl.category}</div>
            <div className="mb-2 text-gray-700 line-clamp-2">{tpl.description}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tpl.tags && JSON.parse(tpl.tags).map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700 border border-gray-200">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              {tpl.isFree ? (
                <span className="text-green-600 font-semibold">免费</span>
              ) : (
                <span className="text-yellow-600 font-semibold">￥{tpl.price}</span>
              )}
            </div>
            <a
              href={tpl.downloadUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 rounded-lg bg-blue-600 text-white text-center font-semibold hover:bg-blue-700 transition"
            >
              {tpl.isFree ? "免费下载" : "付费下载"}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 