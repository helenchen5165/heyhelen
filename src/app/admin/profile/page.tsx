"use client";
import React, { useEffect, useState, FormEvent } from "react";

function ImageUploadButton({ onInsert, current }: { onInsert: (url: string) => void, current?: string }) {
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "heyhelen");
    const res = await fetch("https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload", { method: "POST", body: formData });
    const data = await res.json();
    setUploading(false);
    if (data.secure_url) {
      onInsert(data.secure_url);
    } else {
      alert("上传失败");
    }
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <input type="file" accept="image/*" id="avatar-upload" className="hidden" onChange={handleFile} />
      <button type="button" className="px-4 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100 text-sm hover:bg-blue-100" onClick={() => document.getElementById("avatar-upload")?.click()} disabled={uploading}>{uploading ? "上传中..." : "更换头像"}</button>
      {current && <img src={current} alt="头像预览" className="w-24 h-24 rounded-full object-cover border border-gray-200" />}
    </div>
  );
}

export default function ProfileEditPage() {
  const [form, setForm] = useState({ name: "", avatar: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.user) setForm({ name: data.user.name || "", avatar: data.user.avatar || "", bio: data.user.bio || "" });
      });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include"
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSuccess("保存成功！");
    } else {
      setError(data.error || "保存失败");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-16">
      <form onSubmit={handleSubmit} className="bg-gray-50 rounded-2xl shadow p-8 w-full max-w-md flex flex-col gap-6 border border-gray-100">
        <h2 className="text-2xl font-bold mb-2 text-black text-center">个人资料</h2>
        <ImageUploadButton current={form.avatar} onInsert={url => setForm(f => ({ ...f, avatar: url }))} />
        <input
          type="text"
          placeholder="昵称"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <textarea
          placeholder="个人简介"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px]"
          value={form.bio}
          onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
        />
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        {success && <div className="text-green-600 text-sm text-center">{success}</div>}
        <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow disabled:opacity-50" disabled={loading}>{loading ? "保存中..." : "保存"}</button>
      </form>
    </div>
  );
} 