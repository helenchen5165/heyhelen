"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string;
  isPublished: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: { username: string; name?: string };
};

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  excerpt: "",
  coverImage: "",
  tags: [],
  isPublished: true,
};

const RichTextEditor = dynamic(() => import("@mantine/rte").then(mod => mod.RichTextEditor), { ssr: false });

function ImageUploadButton({ onInsert }: { onInsert: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ml_default");
    const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.secure_url) {
      onInsert(data.secure_url);
    } else {
      alert("上传失败");
    }
  };
  return (
    <>
      <input type="file" accept="image/*" ref={inputRef} className="hidden" onChange={handleFile} />
      <button type="button" className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs hover:bg-blue-100 ml-2" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? "上传中..." : "插入图片"}</button>
    </>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts || []);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleEdit = (post: any) => {
    setForm({ ...post, tags: post.tags ? JSON.parse(post.tags) : [] });
    setEditId(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该博客吗？")) return;
    setLoading(true);
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchPosts();
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/admin/blog/${editId}` : "/api/admin/blog";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: form.tags }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "操作失败");
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">博客管理</h1>
          <div className="text-blue-700 bg-blue-50 rounded-lg px-4 py-2 text-base font-medium shadow-sm border border-blue-100 max-w-xl">
            通过写作，弄明白自己在想什么，扩大影响力。
          </div>
        </div>
        <button
          className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-base"
          onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); }}
        >
          新增博客
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {posts.map((post: any) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 flex flex-col relative hover:shadow-xl transition-all duration-200 group overflow-hidden">
            {post.coverImage && (
              <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image src={post.coverImage} alt={post.title} width={400} height={128} className="object-cover w-full h-full group-hover:scale-105 transition" />
              </div>
            )}
            <h2 className="text-lg font-bold mb-2 text-black group-hover:text-blue-600 transition">{post.title}</h2>
            <div className="text-gray-500 text-xs mb-2 flex items-center gap-2">
              <span className="inline-block w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">{post.author?.name?.[0] || post.author?.username?.[0]}</span>
              <span>{post.author?.name || post.author?.username}</span>
              <span>·</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="mb-2 text-gray-700 line-clamp-2 min-h-[36px]">{post.excerpt}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {post.tags && JSON.parse(post.tags).map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100 font-medium">#{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-pink-500 text-base">❤️</span>
              <span className="text-gray-600 text-sm">{post.likeCount || 0}</span>
              {post.isPublished ? (
                <span className="ml-2 text-blue-600 text-xs">已发布</span>
              ) : (
                <span className="ml-2 text-gray-400 text-xs">未发布</span>
              )}
            </div>
            <div className="flex gap-2 mt-auto">
              <button
                className="px-4 py-1 rounded-lg bg-gray-100 hover:bg-blue-100 text-sm text-blue-700 font-semibold border border-blue-100 shadow-sm"
                onClick={() => handleEdit(post)}
              >编辑</button>
              <button
                className="px-4 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-sm text-red-600 font-semibold border border-red-100 shadow-sm"
                onClick={() => handleDelete(post.id)}
                disabled={loading}
              >删除</button>
            </div>
          </div>
        ))}
      </div>
      {/* 弹窗表单 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto border border-blue-100"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold mb-6 text-black">{editId ? "编辑博客" : "新增博客"}</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="标题"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="URL别名（英文，如：my-first-blog）"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="标签（逗号分隔）"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.tags.join(",")}
                onChange={e => setForm({ ...form, tags: e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean) })}
              />
              <div>
                <ImageUploadButton onInsert={url => setForm({ ...form, coverImage: url })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">作者头像（仅演示）</label>
                <ImageUploadButton onInsert={url => setForm({ ...form, avatar: url })} />
              </div>
              <textarea
                placeholder="摘要"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px]"
                value={form.excerpt}
                onChange={e => setForm({ ...form, excerpt: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                />
                已发布
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">正文内容</label>
                <RichTextEditor
                  value={form.content}
                  onChange={val => setForm({ ...form, content: val })}
                  controls={[
                    ['bold', 'italic', 'underline', 'link', 'unorderedList', 'orderedList', 'h1', 'h2', 'h3'],
                    ['blockquote', 'code', 'image'],
                  ]}
                  sticky
                  stickyOffset={60}
                  className="rounded-lg border border-gray-300 min-h-[200px] mb-2"
                  onImageUpload={async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', 'ml_default');
                    const res = await fetch('https://api.cloudinary.com/v1_1/demo/image/upload', { method: 'POST', body: formData });
                    const data = await res.json();
                    return data.secure_url;
                  }}
                />
                <ImageUploadButton onInsert={url => setForm({ ...form, content: form.content + `<img src='${url}' alt='插图' />` })} />
              </div>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            </div>
            <div className="flex gap-4 mt-8 justify-end">
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200"
                onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }}
                disabled={loading}
              >取消</button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow"
                disabled={loading}
              >{loading ? "保存中..." : "保存"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 