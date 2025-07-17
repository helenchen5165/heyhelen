"use client";
import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface SimpleBlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// 图片上传组件
function ImageUploadButton({ onInsert }: { onInsert: (url: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 JPEG、PNG、GIF、WebP 格式的图片');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB');
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

      onInsert(data.secure_url);
    } catch (error) {
      console.error('图片上传失败:', error);
      setError(error instanceof Error ? error.message : '图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
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

// 格式化按钮组件
function FormatButton({ 
  onClick, 
  active = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  active?: boolean; 
  children: React.ReactNode; 
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-sm border rounded hover:bg-gray-100 ${
        active 
          ? 'bg-blue-100 text-blue-700 border-blue-300' 
          : 'bg-white text-gray-700 border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function SimpleBlogEditor({ value, onChange, placeholder, className = '' }: SimpleBlogEditorProps) {
  const [mode, setMode] = useState<'rich' | 'markdown'>('rich');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageInsert = useCallback((url: string) => {
    const imageTag = mode === 'rich' 
      ? `<img src="${url}" alt="插图" style="max-width: 100%; height: auto;" />`
      : `![插图](${url})`;
    
    onChange(value + imageTag);
  }, [mode, value, onChange]);

  const insertFormat = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [value, onChange]);

  const formatButtons = [
    { 
      title: '粗体', 
      onClick: () => insertFormat(mode === 'rich' ? '<strong>' : '**', mode === 'rich' ? '</strong>' : '**'),
      icon: 'B'
    },
    { 
      title: '斜体', 
      onClick: () => insertFormat(mode === 'rich' ? '<em>' : '*', mode === 'rich' ? '</em>' : '*'),
      icon: 'I'
    },
    { 
      title: '标题', 
      onClick: () => insertFormat(mode === 'rich' ? '<h2>' : '## ', mode === 'rich' ? '</h2>' : ''),
      icon: 'H'
    },
    { 
      title: '链接', 
      onClick: () => insertFormat(mode === 'rich' ? '<a href="URL">' : '[', mode === 'rich' ? '</a>' : '](URL)'),
      icon: '🔗'
    },
    { 
      title: '列表', 
      onClick: () => insertFormat(mode === 'rich' ? '<ul><li>' : '- ', mode === 'rich' ? '</li></ul>' : ''),
      icon: '•'
    },
    { 
      title: '引用', 
      onClick: () => insertFormat(mode === 'rich' ? '<blockquote>' : '> ', mode === 'rich' ? '</blockquote>' : ''),
      icon: '❝'
    },
    { 
      title: '代码', 
      onClick: () => insertFormat(mode === 'rich' ? '<code>' : '`', mode === 'rich' ? '</code>' : '`'),
      icon: '</>'
    },
  ];

  return (
    <div className={`simple-blog-editor ${className}`}>
      {/* 工具栏 */}
      <div className="border border-gray-300 rounded-t bg-gray-50 p-2">
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
        
        <div className="flex items-center gap-1 flex-wrap">
          {formatButtons.map((button, index) => (
            <FormatButton
              key={index}
              onClick={button.onClick}
              title={button.title}
            >
              {button.icon}
            </FormatButton>
          ))}
        </div>
      </div>

      {/* 编辑器 */}
      <div className="border border-gray-300 rounded-b border-t-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '请输入内容...'}
          className="w-full min-h-[400px] p-4 border-none outline-none resize-none font-mono text-sm"
          style={{ 
            fontFamily: mode === 'rich' ? 'inherit' : 'monospace',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* 预览区域 */}
      {mode === 'rich' && value && (
        <div className="mt-4 border border-gray-300 rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">预览:</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}

      {/* 提示信息 */}
      <div className="mt-2 text-xs text-gray-500">
        {mode === 'rich' ? (
          <span>支持HTML标签，使用工具栏快速插入格式</span>
        ) : (
          <span>支持 Markdown 语法：**粗体**、*斜体*、[链接](url)、![图片](url) 等</span>
        )}
      </div>
    </div>
  );
}