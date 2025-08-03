"use client";
import React, { useEffect, useState, FormEvent, useRef } from "react";

// 禅意圆环组件
const ZenCircle = ({ size = "lg", children }: { size?: "sm" | "md" | "lg", children?: React.ReactNode }) => (
  <div className={`zen-circle zen-circle-${size}`}>
    {children}
  </div>
);

function AvatarUpload({ onInsert, current }: { onInsert: (url: string) => void, current?: string }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('头像大小不能超过 2MB');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/user/avatar", { 
        method: "POST", 
        body: formData,
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (data.success && data.data?.url) {
        onInsert(data.data.url);
      } else {
        throw new Error(data.error || "上传失败");
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      alert(error instanceof Error ? error.message : "头像上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="text-center mb-8">
      <input 
        type="file" 
        accept="image/*" 
        ref={inputRef} 
        className="hidden" 
        onChange={handleFile} 
      />
      
      {/* 头像展示区 */}
      <div className="relative inline-block mb-6">
        <ZenCircle size="lg">
          {current ? (
            <img 
              src={current} 
              alt="头像" 
              className="w-32 h-32 rounded-full object-cover ml-24"
              style={{ filter: 'grayscale(80%)' }}
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ml-24">
              <span className="text-4xl zen-subtitle">○</span>
            </div>
          )}
        </ZenCircle>
      </div>
      
      {/* 上传按钮 */}
      <button 
        type="button" 
        className="zen-button" 
        onClick={() => inputRef.current?.click()} 
        disabled={uploading}
      >
        {uploading ? "○ 上传中..." : "更换头像"}
      </button>
      
      <p className="zen-subtitle text-sm mt-2">
        支持 JPG、PNG、GIF、WebP 格式，大小不超过 2MB
      </p>
    </div>
  );
}

export default function ProfileEditPage() {
  const [form, setForm] = useState({ name: "", avatar: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/avatar", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.user) {
          const user = data.data.user;
          setForm({ 
            name: user.name || "", 
            avatar: user.avatar || "", 
            bio: user.bio || "" 
          });
        }
      })
      .catch(err => console.error('获取用户信息失败:', err));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include"
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess("保存成功！");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "保存失败");
      }
    } catch (error) {
      setError("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ background: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-16">
          <ZenCircle size="md">
            <h1 className="zen-title text-4xl ml-12">个人档案</h1>
          </ZenCircle>
          <p className="zen-subtitle mt-8">
            塑造数字化身份，展现真实自我
          </p>
        </div>

        {/* 表单区域 */}
        <div className="zen-card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 头像上传 */}
            <AvatarUpload 
              current={form.avatar} 
              onInsert={url => setForm(f => ({ ...f, avatar: url }))} 
            />
            
            {/* 基础信息 */}
            <div className="space-y-6">
              <div>
                <label className="block zen-subtitle mb-3">昵称</label>
                <input
                  type="text"
                  placeholder="请输入昵称"
                  className="w-full p-4 border focus:outline-none zen-subtitle"
                  style={{ 
                    borderColor: 'var(--zen-border)', 
                    background: 'transparent',
                    borderRadius: '2px'
                  }}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block zen-subtitle mb-3">个人简介</label>
                <textarea
                  placeholder="用几句话介绍自己..."
                  className="w-full p-4 border focus:outline-none zen-subtitle resize-none"
                  style={{ 
                    borderColor: 'var(--zen-border)', 
                    background: 'transparent',
                    borderRadius: '2px',
                    minHeight: '120px'
                  }}
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                />
              </div>
            </div>
            
            {/* 状态信息 */}
            {error && (
              <div className="text-center p-4" style={{ background: 'var(--zen-light)', border: '1px solid var(--zen-border)' }}>
                <span className="zen-subtitle text-red-500">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="text-center p-4" style={{ background: 'var(--zen-light)', border: '1px solid var(--zen-border)' }}>
                <span className="zen-subtitle text-green-600">{success}</span>
              </div>
            )}
            
            {/* 提交按钮 */}
            <div className="text-center">
              <button 
                type="submit" 
                className="zen-button px-12 py-3"
                disabled={loading}
              >
                {loading ? "○ 保存中..." : "保存档案"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 