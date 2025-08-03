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
    const editor = editorRef.current;
    if (!editor) {
      console.warn('编辑器引用不存在');
      return;
    }
    
    // 检查剪贴板API是否可用
    if (!e.clipboardData) {
      console.warn('剪贴板API不可用，使用默认粘贴行为');
      return;
    }
    
    try {
      // 获取当前选择区域
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        // 如果没有选择区域，先聚焦到编辑器末尾
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        
        console.log('已设置焦点到编辑器末尾');
      }
      
      // 阻止默认行为
      e.preventDefault();
      
      // 获取选择范围
      const range = selection?.getRangeAt(0);
      
      // 立即处理粘贴内容
      processPasteContent(e, range);
    } catch (error) {
      console.error('粘贴处理失败:', error);
      // 发生错误时，尝试简单的文本粘贴
      try {
        const textData = e.clipboardData.getData('text/plain');
        if (textData) {
          document.execCommand('insertText', false, textData);
          if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            onChange(content);
            setIsDirty(true);
            setWordCount(calculateWordCount(content));
          }
        }
      } catch (fallbackError) {
        console.error('回退粘贴也失败:', fallbackError);
      }
    }
  }, [onChange, calculateWordCount]);

  const processPasteContent = useCallback((e: React.ClipboardEvent, range?: Range) => {
    try {
      // 获取剪贴板数据
      const htmlData = e.clipboardData.getData('text/html');
      const textData = e.clipboardData.getData('text/plain');
      
      if (!htmlData && !textData) {
        console.warn('剪贴板中没有可用的内容');
        return;
      }
      
      let contentToInsert = '';
      
      if (htmlData) {
        // 简化HTML清理逻辑，专注于安全和实用性
        contentToInsert = htmlData
          // 移除危险的标签和属性
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/on\w+="[^"]*"/gi, '')
          .replace(/javascript:/gi, '')
          // 移除HTML文档结构标签
          .replace(/<html[^>]*>|<\/html>|<head[^>]*>[\s\S]*?<\/head>|<body[^>]*>|<\/body>/gi, '')
          // 保留基本格式标签
          .replace(/<(\/?)(?:div|span|article|section|header|footer|nav|main)[^>]*>/gi, '<$1p>')
          // 移除不必要的属性，保留基本格式
          .replace(/\s(id|class|style|data-[^=]*|aria-[^=]*)="[^"]*"/gi, '')
          // 清理空白和空元素
          .replace(/\s+>/gi, '>')
          .replace(/<p[^>]*>\s*<\/p>/gi, '')
          .replace(/\n\s*\n/g, '\n')
          .trim();
      }
      
      // 如果HTML处理后为空或没有HTML，使用纯文本
      if (!contentToInsert && textData) {
        // 简单格式化纯文本
        contentToInsert = textData
          .replace(/\n{3,}/g, '\n\n') // 限制最多两个换行
          .replace(/\n\n/g, '</p><p>') // 段落分隔
          .replace(/\n/g, '<br>'); // 单换行转为<br>
        
        if (contentToInsert.includes('<p>') || contentToInsert.includes('<br>')) {
          contentToInsert = `<p>${contentToInsert}</p>`;
        }
      }
      
      if (contentToInsert) {
        // 使用现代API或回退到execCommand
        if (range) {
          // 使用提供的range
          range.deleteContents();
          range.insertNode(document.createTextNode(''));
          document.execCommand('insertHTML', false, contentToInsert);
        } else {
          // 回退到execCommand
          document.execCommand('insertHTML', false, contentToInsert);
        }
        
        // 触发内容变化事件
        if (editorRef.current) {
          const content = editorRef.current.innerHTML;
          onChange(content);
          setIsDirty(true);
          setWordCount(calculateWordCount(content));
        }
      }
    } catch (error) {
      console.error('粘贴内容处理失败:', error);
      // 尝试使用纯文本作为回退
      const textData = e.clipboardData.getData('text/plain');
      if (textData) {
        try {
          document.execCommand('insertText', false, textData);
          if (editorRef.current) {
            const content = editorRef.current.innerHTML;
            onChange(content);
            setIsDirty(true);
            setWordCount(calculateWordCount(content));
          }
        } catch (fallbackError) {
          console.error('纯文本粘贴也失败:', fallbackError);
        }
      }
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
    <div className={`zen-card ${className}`}>
      {/* 禅意工具栏 */}
      <div className="flex flex-wrap items-center gap-2 p-4 border-b" style={{ borderColor: 'var(--zen-border)' }}>
        {/* 基础格式 */}
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="zen-button text-sm font-bold"
          title="粗体 (Ctrl+B)"
        >
          粗体
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="zen-button text-sm italic"
          title="斜体 (Ctrl+I)"
        >
          斜体
        </button>
        
        <span className="text-xs zen-subtitle">|</span>
        
        {/* 标题层级 */}
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          className="zen-button text-sm"
          title="一级标题"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          className="zen-button text-sm"
          title="二级标题"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          className="zen-button text-sm"
          title="三级标题"
        >
          H3
        </button>
        
        <span className="text-xs zen-subtitle">|</span>
        
        {/* 列表 */}
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="zen-button text-sm"
          title="无序列表"
        >
          • 列表
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="zen-button text-sm"
          title="有序列表"
        >
          1. 列表
        </button>
        
        <span className="text-xs zen-subtitle">|</span>
        
        {/* 插入元素 */}
        <button
          type="button"
          onClick={insertLink}
          className="zen-button text-sm"
          title="插入链接"
        >
          链接
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="zen-button text-sm"
          title="插入图片"
        >
          图片
        </button>
        
        <span className="text-xs zen-subtitle">|</span>
        
        <button
          type="button"
          onClick={() => formatText('removeFormat')}
          className="zen-button text-sm zen-subtitle"
          title="清除格式"
        >
          清除
        </button>
        
        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="zen-button text-sm"
            title="预览 (Ctrl+P)"
          >
            {showPreview ? '编辑' : '预览'}
          </button>
          
          {wordCount > 0 && (
            <span className="text-sm zen-subtitle">
              {wordCount} 字
            </span>
          )}
          
          {autoSave && (
            <span className="text-xs zen-subtitle">
              {isDirty ? '○ 未保存' : lastSaved ? `● 已保存 ${lastSaved.toLocaleTimeString().slice(0, 5)}` : ''}
            </span>
          )}
        </div>
      </div>

      {/* 编辑区域 */}
      <div className="relative">
        {showPreview ? (
          <div className="zen-article p-8 min-h-[400px]">
            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            className="zen-article p-8 min-h-[400px] focus:outline-none"
            style={{ 
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.8'
            }}
            data-placeholder={placeholder}
            suppressContentEditableWarning={true}
          />
        )}
        
        {/* 禅意占位符样式 */}
        <style jsx>{`
          div[contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: var(--zen-gray);
            pointer-events: none;
            font-style: italic;
          }
          
          div[contenteditable]:focus {
            background: var(--zen-light);
          }
        `}</style>
      </div>
    </div>
  );
}