"use client";
import React, { useEffect, useState, useRef, FormEvent, ChangeEvent } from "react";
import Image from "next/image";
import AdvancedBlogEditor from "@/components/AdvancedBlogEditor";
import ErrorBoundary from "@/components/ErrorBoundary";
// import "@mantine/rte/styles.css"; // Commented out due to missing styles

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
  tags: "",
  isPublished: true,
};


function ImageUploadButton({ onInsert }: { onInsert: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", { 
        method: "POST", 
        body: formData 
      });
      
      if (!res.ok) {
        throw new Error('上传失败');
      }
      
      const data = await res.json();
      if (data.success && data.data?.url) {
        onInsert(data.data.url);
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (error) {
      console.error('图片上传失败:', error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <>
      <input type="file" accept="image/*" ref={inputRef} className="hidden" onChange={handleFile} />
      <button 
        type="button" 
        className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-xs hover:bg-blue-100 ml-2 disabled:opacity-50" 
        onClick={() => inputRef.current?.click()} 
        disabled={uploading}
      >
        {uploading ? "上传中..." : "插入图片"}
      </button>
    </>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<BlogPost, 'id'|'createdAt'|'updatedAt'|'authorId'|'author'|'likeCount'>>({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/admin/blog");
      const data = await res.json();
      if (data.success) {
        setPosts(data.data?.posts || []);
      } else {
        setError(data.error || '获取博客列表失败');
      }
    } catch (err) {
      setError('获取博客列表失败');
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleEdit = (post: BlogPost) => {
    const tags = post.tags ? JSON.parse(post.tags) : [];
    setForm({ ...post, tags: Array.isArray(tags) ? tags.join(", ") : "" });
    setEditId(post.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该博客吗？")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        setError(data.error || '删除失败');
      }
    } catch (err) {
      setError('删除失败');
    }
    setLoading(false);
  };

  // 自动保存功能
  const handleAutoSave = async (content: string) => {
    if (!editId) return; // 只在编辑时自动保存
    
    setAutoSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/blog/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      if (res.ok) {
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } else {
        setAutoSaveStatus('error');
      }
    } catch (error) {
      setAutoSaveStatus('error');
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // 调试：检查表单内容
    console.log('提交表单内容:', form);
    console.log('内容长度:', form.content.length);
    
    // 验证必填字段
    if (!form.title.trim()) {
      setError("请输入标题");
      setLoading(false);
      return;
    }
    
    if (!form.content.trim()) {
      setError("请输入正文内容");
      setLoading(false);
      return;
    }
    
    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/admin/blog/${editId}` : "/api/admin/blog";
      const tagsArray = (form.tags ?? "").split(",").map(t => t.trim()).filter(Boolean);
      
      const requestData = { ...form, tags: tagsArray };
      console.log('发送到服务器的数据:', requestData);
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      
      const data = await res.json();
      console.log('服务器响应:', data);
      
      if (data.success) {
        setShowForm(false);
        setForm(emptyForm);
        setEditId(null);
        fetchPosts();
      } else {
        setError(data.error || "操作失败");
      }
    } catch (err) {
      console.error('提交失败:', err);
      setError("操作失败");
    }
    
    setLoading(false);
  };

  return (
    <ErrorBoundary>
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
            <div className="mb-2 text-gray-700 line-clamp-2 min-h-[36px]">{post.excerpt || '暂无摘要'}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(post.tags ? JSON.parse(post.tags) : []).map((tag: string) => (
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
            
            {/* 状态信息 */}
            <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div>📊 文档状态：</div>
                  <div>• 标题长度: {form.title.length}</div>
                  <div>• 内容长度: {form.content.length}</div>
                  <div>• 标签: {form.tags || '无'}</div>
                </div>
                <div className="text-right">
                  {editId && (
                    <div className="mb-2">
                      {autoSaveStatus === 'saving' && <span className="text-blue-600">💾 自动保存中...</span>}
                      {autoSaveStatus === 'saved' && <span className="text-green-600">✅ 已自动保存</span>}
                      {autoSaveStatus === 'error' && <span className="text-red-600">❌ 保存失败</span>}
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={() => console.log('当前表单状态:', form)}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    调试状态
                  </button>
                </div>
              </div>
            </div>
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
              />
              <input
                type="text"
                placeholder="标签（逗号分隔）"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={form.tags ?? ""}
                onChange={e => setForm({ ...form, tags: e.target.value })}
              />
              <div>
                <div className="flex items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">封面图片：</label>
                  <ImageUploadButton onInsert={url => setForm({ ...form, coverImage: url })} />
                </div>
                {form.coverImage && (
                  <div className="flex items-center gap-2 mt-2">
                    <Image src={form.coverImage} alt="封面预览" width={100} height={60} className="rounded border" />
                    <button 
                      type="button" 
                      onClick={() => setForm({ ...form, coverImage: "" })}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
              <textarea
                placeholder="摘要（可选，建议不超过200字）"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px]"
                value={form.excerpt || ''}
                onChange={e => setForm({ ...form, excerpt: e.target.value })}
                maxLength={200}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">正文内容</label>
                <ErrorBoundary
                  fallback={
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-yellow-800">编辑器加载失败，请刷新页面重试</div>
                    </div>
                  }
                >
                  <AdvancedBlogEditor
                    value={form.content}
                    onChange={val => {
                      console.log('内容更新:', val);
                      setForm({ ...form, content: val });
                    }}
                    placeholder="请输入博客内容..."
                    className="mb-2"
                    autoSave={!!editId}
                    onAutoSave={handleAutoSave}
                  />
                </ErrorBoundary>
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
              >{loading ? "保存中..." : (editId ? "更新" : "创建")}</button>
            </div>
          </form>
        </div>
      )}
      </div>
    </ErrorBoundary>
  );
} 