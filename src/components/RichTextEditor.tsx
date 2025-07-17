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
    
    // 显示粘贴处理状态
    const editor = editorRef.current;
    if (editor) {
      const selection = window.getSelection();
      const range = selection?.getRangeAt(0);
      const tempSpan = document.createElement('span');
      tempSpan.textContent = '粘贴处理中...';
      tempSpan.style.color = '#6b7280';
      tempSpan.style.fontStyle = 'italic';
      range?.insertNode(tempSpan);
      
      // 异步处理粘贴内容
      setTimeout(() => {
        try {
          tempSpan.remove();
          processPasteContent(e);
        } catch (error) {
          console.error('粘贴处理失败:', error);
          tempSpan.textContent = '粘贴失败，请重试';
          setTimeout(() => tempSpan.remove(), 2000);
        }
      }, 100);
    }
  }, []);

  const processPasteContent = useCallback((e: React.ClipboardEvent) => {
    // 优先使用HTML格式，然后是纯文本
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');
    
    if (htmlData) {
      // 智能清理HTML，保留有用的格式和样式
      let cleanHtml = htmlData
        // 移除危险的标签和属性
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
        // 移除HTML文档结构标签，保留内容
        .replace(/<html[^>]*>/gi, '')
        .replace(/<\/html>/gi, '')
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
        .replace(/<body[^>]*>/gi, '')
        .replace(/<\/body>/gi, '')
        .replace(/<article[^>]*>/gi, '')
        .replace(/<\/article>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        // 移除meta和其他非内容标签
        .replace(/<meta[^>]*>/gi, '')
        .replace(/<link[^>]*>/gi, '')
        .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
        // 保留有用的class属性，移除其他不必要的属性
        .replace(/\s(id|contenteditable|spellcheck|draggable|tabindex|data-[^=]*|aria-[^=]*)="[^"]*"/gi, '')
        // 保留颜色和格式相关的class
        .replace(/\sclass="([^"]*)"/gi, (match, className) => {
          const usefulClasses = className.split(' ').filter((cls: string) => 
            cls.includes('highlight-') || 
            cls.includes('block-color-') ||
            cls.includes('select-value-color-') ||
            cls.includes('bulleted-list') ||
            cls.includes('numbered-list') ||
            cls.includes('page-title') ||
            cls.includes('page-description') ||
            cls === 'callout' ||
            cls === 'indented' ||
            cls === 'sans' ||
            cls === 'serif' ||
            cls === 'mono' ||
            // 保留基本格式类
            cls === 'bold' ||
            cls === 'italic' ||
            cls === 'underline'
          ).join(' ');
          return usefulClasses ? ` class="${usefulClasses}"` : '';
        })
        // 移除空的class属性
        .replace(/\sclass=""\s*/gi, ' ')
        // 保留安全的内联样式
        .replace(/\sstyle="([^"]*)"/gi, (match, styleValue) => {
          const safeStyles = styleValue.split(';').filter((style: string) => {
            const prop = style.trim().split(':')[0].toLowerCase();
            return prop && (
              prop.includes('color') ||
              prop.includes('background') ||
              prop.includes('font-weight') ||
              prop.includes('font-style') ||
              prop.includes('font-size') ||
              prop.includes('text-decoration') ||
              prop.includes('text-align') ||
              prop.includes('list-style') ||
              prop.includes('margin') ||
              prop.includes('padding')
            );
          }).join(';');
          return safeStyles ? ` style="${safeStyles}"` : '';
        })
        // 清理空的style属性
        .replace(/\sstyle=""\s*/gi, ' ')
        // 智能提取主要内容区域
        .replace(/<div[^>]*class="[^"]*page-body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
        .replace(/<div[^>]*class="[^"]*notion-page-content[^"]*"[^>]*>([\s\S]*?)<\/div>/gi, '$1')
        .replace(/<main[^>]*>([\s\S]*?)<\/main>/gi, '$1')
        // 清理多余的空白和空元素
        .replace(/\s+>/gi, '>')
        .replace(/<p[^>]*>\s*<\/p>/gi, '')
        .replace(/<div[^>]*>\s*<\/div>/gi, '')
        .replace(/\n\s*\n/g, '\n')
        // 简化复杂的表格结构
        .replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
          // 如果表格包含有用内容，尝试提取文本
          const textContent = match.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          return textContent ? `<p>${textContent}</p>` : '';
        });

      // 最终内容清理
      cleanHtml = cleanHtml
        .replace(/\s{2,}/g, ' ')
        .replace(/(<\/[^>]+>)\s+(<[^>]+>)/g, '$1$2')
        .trim();
      
      if (cleanHtml) {
        document.execCommand('insertHTML', false, cleanHtml);
      } else if (textData) {
        // 如果HTML处理后为空，回退到纯文本
        document.execCommand('insertText', false, textData);
      }
    } else if (textData) {
      // 如果只有纯文本，智能格式化
      const formattedText = textData
        .replace(/\n{3,}/g, '\n\n') // 限制最多两个换行
        .replace(/\n\n/g, '</p><p>') // 段落分隔
        .replace(/\n/g, '<br>'); // 单换行转为<br>
      
      if (formattedText.includes('<p>') || formattedText.includes('<br>')) {
        document.execCommand('insertHTML', false, `<p>${formattedText}</p>`);
      } else {
        document.execCommand('insertText', false, textData);
      }
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
          <div className="p-4 min-h-[300px] max-w-none">
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