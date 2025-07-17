"use client";
import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// 动态导入 RichTextEditor，避免 SSR 问题
const RichTextEditor = dynamic(() => 
  import('@mantine/rte').then(mod => ({ default: mod.RichTextEditor })), 
  { ssr: false }
);

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// 图片上传组件
function ImageUploadButton({ onInsert }: { onInsert: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('图片大小不能超过5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'heyhelen');

      const res = await fetch('https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.secure_url) {
        onInsert(data.secure_url);
      } else {
        throw new Error('上传失败');
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
    </>
  );
}

export default function BlogEditor({ value, onChange, placeholder, className = '' }: BlogEditorProps) {
  const [mode, setMode] = useState<'rich' | 'markdown'>('rich');

  const handleImageInsert = (url: string) => {
    if (mode === 'rich') {
      onChange(value + `<img src="${url}" alt="插图" style="max-width: 100%; height: auto;" />`);
    } else {
      onChange(value + `![插图](${url})`);
    }
  };

  return (
    <div className={`blog-editor ${className}`}>
      {/* 编辑器模式切换 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`px-3 py-1 text-sm rounded ${
              mode === 'rich' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setMode('rich')}
          >
            富文本
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm rounded ${
              mode === 'markdown' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setMode('markdown')}
          >
            Markdown
          </button>
        </div>
        <ImageUploadButton onInsert={handleImageInsert} />
      </div>

      {/* 编辑器内容 */}
      {mode === 'rich' ? (
        <RichTextEditor
          value={value}
          onChange={onChange}
          controls={[
            ['bold', 'italic', 'underline', 'strike', 'clean'],
            ['h1', 'h2', 'h3', 'h4'],
            ['unorderedList', 'orderedList'],
            ['link', 'blockquote', 'code', 'codeBlock'],
            ['alignLeft', 'alignCenter', 'alignRight'],
          ]}
          className="min-h-[300px]"
          onImageUpload={async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'heyhelen');
            
            const res = await fetch('https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload', {
              method: 'POST',
              body: formData,
            });
            
            const data = await res.json();
            return data.secure_url;
          }}
        />
      ) : (
        <div className="border border-gray-300 rounded">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
            <span className="text-sm text-gray-600">
              支持标准 Markdown 语法
            </span>
          </div>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || '请输入内容...'}
            className="w-full min-h-[300px] p-3 border-none outline-none resize-none font-mono text-sm"
          />
        </div>
      )}

      {/* 编辑器提示 */}
      <div className="mt-2 text-xs text-gray-500">
        {mode === 'rich' ? (
          <span>支持富文本编辑，可直接粘贴图片或使用上方工具栏</span>
        ) : (
          <span>支持 Markdown 语法：**粗体**、*斜体*、[链接](url)、![图片](url) 等</span>
        )}
      </div>
    </div>
  );
}