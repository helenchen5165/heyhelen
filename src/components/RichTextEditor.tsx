"use client";
import React, { useState, useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoSave?: boolean;
  onAutoSave?: (content: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "请输入内容...",
  className = "",
  autoSave = false,
  onAutoSave
}: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算字数
  const calculateWordCount = useCallback((text: string) => {
    const words = text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }, []);

  // 处理内容变化
  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const content = e.currentTarget.innerHTML;
    onChange(content);
    setIsDirty(true);
    setWordCount(calculateWordCount(content));
    
    // 自动保存
    if (autoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave(content);
        setLastSaved(new Date());
        setIsDirty(false);
      }, 2000);
    }
  }, [onChange, autoSave, onAutoSave, calculateWordCount]);

  // 格式化工具函数
  const formatText = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    
    // 触发内容变化事件
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      setIsDirty(true);
      setWordCount(calculateWordCount(content));
    }
  }, [onChange, calculateWordCount]);

  // 插入链接
  const insertLink = useCallback(() => {
    const url = prompt('请输入链接地址:');
    if (url) {
      formatText('createLink', url);
    }
  }, [formatText]);

  // 插入图片
  const insertImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error('上传失败');
        }
        
        const data = await res.json();
        if (data.success && data.data?.url) {
          formatText('insertImage', data.data.url);
        } else {
          throw new Error(data.error || '上传失败');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败，请重试');
      }
    };
    input.click();
  }, [formatText]);

  // 粘贴处理 - 保留格式
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    
    // 优先使用HTML格式，然后是纯文本
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    if (htmlData) {
      // 清理HTML，保留基本格式标签
      const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'div', 'span'];
      
      const cleanHtml = htmlData
        // 移除危险的标签和属性
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
        // 移除不必要的属性，但保留href和src
        .replace(/\s(id|class|style|data-[^=]*|contenteditable|spellcheck|draggable|tabindex)="[^"]*"/gi, '')
        // 清理空的标签属性
        .replace(/\s+>/gi, '>')
        // 移除多余的空白
        .replace(/\s+/g, ' ')
        // 移除空的段落
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        // 规范化换行
        .replace(/\n\s*\n/g, '\n');
      
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (textData) {
      // 如果只有纯文本，则直接插入
      document.execCommand('insertText', false, textData);
    }
    
    // 触发内容变化事件
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      setIsDirty(true);
      setWordCount(calculateWordCount(content));
    }
  }, [onChange, calculateWordCount]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 's':
          e.preventDefault();
          if (autoSave && onAutoSave && editorRef.current) {
            onAutoSave(editorRef.current.innerHTML);
            setLastSaved(new Date());
            setIsDirty(false);
          }
          break;
        case 'p':
          e.preventDefault();
          setShowPreview(!showPreview);
          break;
      }
    }
  }, [formatText, autoSave, onAutoSave, showPreview]);

  // 同步value到编辑器
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
      setWordCount(calculateWordCount(value));
    }
  }, [value, calculateWordCount]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`border border-gray-300 rounded-lg ${className}`}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="px-3 py-1 rounded hover:bg-gray-200 font-bold"
          title="粗体 (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="px-3 py-1 rounded hover:bg-gray-200 italic"
          title="斜体 (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="px-3 py-1 rounded hover:bg-gray-200 underline"
          title="下划线 (Ctrl+U)"
        >
          U
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          className="px-3 py-1 rounded hover:bg-gray-200 font-bold text-lg"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          className="px-3 py-1 rounded hover:bg-gray-200 font-bold"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          className="px-3 py-1 rounded hover:bg-gray-200 font-semibold text-sm"
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="无序列表"
        >
          • 列表
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="有序列表"
        >
          1. 列表
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={insertLink}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="插入链接"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="px-3 py-1 rounded hover:bg-gray-200"
          title="插入图片"
        >
          🖼️
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1"></div>
        
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          className="px-3 py-1 rounded hover:bg-gray-200 text-red-600"
          title="清除格式"
        >
          清除
        </button>
        
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1 rounded hover:bg-gray-200 text-blue-600"
            title="预览 (Ctrl+P)"
          >
            {showPreview ? '编辑' : '预览'}
          </button>
          
          {wordCount > 0 && (
            <span className="text-sm text-gray-500">
              {wordCount} 字
            </span>
          )}
          
          {autoSave && (
            <span className="text-xs text-gray-400">
              {isDirty ? '未保存' : lastSaved ? `已保存 ${lastSaved.toLocaleTimeString()}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="relative">
        {showPreview ? (
          <div 
            className="p-4 min-h-[300px] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="p-4 min-h-[300px] focus:outline-none"
            style={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
        
        {/* 占位符样式 */}
        <style jsx>{`
          div[contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
        `}</style>
      </div>
    </div>
  );
}