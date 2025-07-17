"use client";
import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
  onInsert: (url: string) => void;
  className?: string;
}

export default function ImageUploader({ onInsert, className = '' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 重置错误状态
    setError('');

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 JPEG、PNG、GIF、WebP 格式的图片');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }

    setUploading(true);
    
    try {
      // 直接上传到 Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'heyhelen');
      formData.append('folder', 'blog');

      const response = await fetch('https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || '上传失败');
      }

      if (!data.secure_url) {
        throw new Error('上传失败，未获取到图片URL');
      }

      // 成功上传
      onInsert(data.secure_url);
      
    } catch (error) {
      console.error('图片上传失败:', error);
      setError(error instanceof Error ? error.message : '图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        className="px-3 py-1 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? '上传中...' : '插入图片'}
      </button>
      {error && (
        <div className="mt-1 text-xs text-red-600">{error}</div>
      )}
    </div>
  );
}