"use client";
import React, { useEffect, useState, FormEvent } from "react";
import Image from "next/image";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  imageUrl: string;
  downloadUrl: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  authorId: string;
};

const emptyForm = {
  title: "",
  description: "",
  category: "",
  tags: "",
  imageUrl: "",
  downloadUrl: "",
  price: 0,
  isFree: true,
  isPublished: true,
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Template, 'id'|'authorId'>>({ ...emptyForm });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchTemplates = async () => {
    const res = await fetch("/api/admin/templates");
    const data = await res.json();
    setTemplates(data.templates || []);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleEdit = (tpl: Template) => {
    setForm({ ...tpl, tags: tpl.tags || "" });
    setEditId(tpl.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除该模板吗？")) return;
    setLoading(true);
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" });
    setLoading(false);
    fetchTemplates();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const method = editId ? "PUT" : "POST";
    const url = editId ? `/api/admin/templates/${editId}` : "/api/admin/templates";
    const tagsString = JSON.stringify((form.tags ?? "").split(",").map(t => t.trim()).filter(Boolean));
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tags: tagsString }),
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
    fetchTemplates();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">模板管理</h1>
        <button
          className="px-6 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800"
          onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); }}
        >
          新增模板
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {templates.map((tpl: Template) => (
          <div key={tpl.id} className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 flex flex-col relative">
            {tpl.imageUrl && (
              <Image src={tpl.imageUrl} alt={tpl.title} width={400} height={200} className="rounded-lg mb-4 object-cover w-full h-40" />
            )}
            <h2 className="text-xl font-bold mb-2">{tpl.title}</h2>
            <div className="text-gray-500 text-sm mb-2">{tpl.category}</div>
            <div className="mb-2 text-gray-700 line-clamp-2">{tpl.description}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(tpl.tags ?? "").length > 0 && JSON.parse(tpl.tags).map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs">{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-2 mb-4">
              {tpl.isFree ? (
                <span className="text-green-600 font-semibold">免费</span>
              ) : (
                <span className="text-yellow-600 font-semibold">￥{tpl.price}</span>
              )}
              {tpl.isPublished ? (
                <span className="ml-2 text-blue-600 text-xs">已发布</span>
              ) : (
                <span className="ml-2 text-gray-400 text-xs">未发布</span>
              )}
            </div>
            <div className="flex gap-2 mt-auto">
              <button
                className="px-4 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                onClick={() => handleEdit(tpl)}
              >编辑</button>
              <button
                className="px-4 py-1 rounded bg-red-100 hover:bg-red-200 text-sm text-red-600"
                onClick={() => handleDelete(tpl.id)}
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
            className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg relative"
            onSubmit={handleSubmit}
          >
            <h2 className="text-2xl font-bold mb-6">{editId ? "编辑模板" : "新增模板"}</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="标题"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="分类"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="标签（逗号分隔）"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.tags ?? ""}
                onChange={e => setForm({ ...form, tags: e.target.value })}
              />
              <input
                type="text"
                placeholder="图片URL"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.imageUrl}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              />
              <input
                type="text"
                placeholder="下载链接"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.downloadUrl}
                onChange={e => setForm({ ...form, downloadUrl: e.target.value })}
              />
              <input
                type="number"
                placeholder="价格"
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                value={form.price}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) })}
                min={0}
                step={0.01}
                disabled={form.isFree}
              />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFree}
                    onChange={e => setForm({ ...form, isFree: e.target.checked })}
                  />
                  免费
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                  />
                  已发布
                </label>
              </div>
              <textarea
                placeholder="简介"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 min-h-[80px]"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            </div>
            <div className="flex gap-4 mt-8 justify-end">
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                onClick={() => { setShowForm(false); setForm(emptyForm); setEditId(null); }}
                disabled={loading}
              >取消</button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-black text-white font-semibold hover:bg-gray-800"
                disabled={loading}
              >{loading ? "保存中..." : "保存"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 