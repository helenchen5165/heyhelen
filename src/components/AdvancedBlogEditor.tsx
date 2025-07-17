"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ImageUploader from './ImageUploader';

interface AdvancedBlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoSave?: boolean;
  onAutoSave?: (content: string) => void;
}

export default function AdvancedBlogEditor({ 
  value, 
  onChange, 
  placeholder = "请输入内容...", 
  className = "",
  autoSave = false,
  onAutoSave
}: AdvancedBlogEditorProps) {
  const [localValue, setLocalValue] = useState(value);
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 计算字数
  const calculateWordCount = useCallback((text: string) => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }, []);

  // 处理内容变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    setIsDirty(true);
    setWordCount(calculateWordCount(newValue));
    
    // 自动保存
    if (autoSave && onAutoSave) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = setTimeout(() => {
        onAutoSave(newValue);
        setLastSaved(new Date());
        setIsDirty(false);
      }, 2000); // 2秒后自动保存
    }
  }, [onChange, calculateWordCount, autoSave, onAutoSave]);

  // 插入文本
  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = localValue.substring(start, end);
    
    const newValue = localValue.substring(0, start) + before + selectedText + after + localValue.substring(end);
    setLocalValue(newValue);
    onChange(newValue);
    setIsDirty(true);
    
    // 恢复光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [localValue, onChange]);

  // 插入图片
  const handleImageInsert = useCallback((url: string) => {
    const imageTag = `<img src="${url}" alt="插图" style="max-width: 100%; height: auto;" />`;
    insertText(imageTag);
  }, [insertText]);

  // 快捷键处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertText('<strong>', '</strong>');
          break;
        case 'i':
          e.preventDefault();
          insertText('<em>', '</em>');
          break;
        case 's':
          e.preventDefault();
          if (autoSave && onAutoSave) {
            onAutoSave(localValue);
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
  }, [insertText, autoSave, onAutoSave, localValue, showPreview]);

  // 同步外部值
  useEffect(() => {
    setLocalValue(value);
    setWordCount(calculateWordCount(value));
  }, [value, calculateWordCount]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const formatButtons = [
    { label: '粗体', shortcut: 'Cmd+B', action: () => insertText('<strong>', '</strong>'), icon: '𝐁' },
    { label: '斜体', shortcut: 'Cmd+I', action: () => insertText('<em>', '</em>'), icon: '𝐼' },
    { label: '标题', shortcut: 'H1', action: () => insertText('<h1>', '</h1>'), icon: 'H₁' },
    { label: '子标题', shortcut: 'H2', action: () => insertText('<h2>', '</h2>'), icon: 'H₂' },
    { label: '段落', shortcut: 'P', action: () => insertText('<p>', '</p>'), icon: '¶' },
    { label: '链接', shortcut: 'Link', action: () => insertText('<a href="URL">', '</a>'), icon: '🔗' },
    { label: '列表', shortcut: 'List', action: () => insertText('<ul><li>', '</li></ul>'), icon: '•' },
    { label: '引用', shortcut: 'Quote', action: () => insertText('<blockquote>', '</blockquote>'), icon: '❝' },
    { label: '代码', shortcut: 'Code', action: () => insertText('<code>', '</code>'), icon: '</>' },
    { label: '分割线', shortcut: 'HR', action: () => insertText('<hr />'), icon: '―' },
  ];

  return (
    <div className={`advanced-blog-editor ${className}`}>
      {/* 工具栏 */}
      <div className="border border-gray-300 rounded-t bg-gray-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded transition-colors ${
                !showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setShowPreview(false)}
            >
              编辑
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setShowPreview(true)}
            >
              预览
            </button>
            <div className="ml-4 text-sm text-gray-600">
              {wordCount} 词 | {localValue.length} 字符
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {autoSave && (
              <div className="text-xs text-gray-500">
                {isDirty ? '未保存' : lastSaved ? `已保存 ${lastSaved.toLocaleTimeString()}` : ''}
              </div>
            )}
            <ImageUploader onInsert={handleImageInsert} />
          </div>
        </div>
        
        {!showPreview && (
          <div className="flex items-center gap-1 flex-wrap">
            {formatButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={button.action}
                title={`${button.label} (${button.shortcut})`}
                className="px-2 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                {button.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 编辑/预览区域 */}
      <div className="border border-gray-300 rounded-b border-t-0 min-h-[400px]">
        {showPreview ? (
          <div className="p-4 prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: localValue || '<p class="text-gray-500">暂无内容...</p>' }} />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full min-h-[400px] p-4 border-none outline-none resize-none"
            style={{ 
              fontSize: '16px',
              lineHeight: '1.6',
              fontFamily: 'inherit'
            }}
          />
        )}
      </div>

      {/* 状态栏 */}
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <div>
          💡 快捷键：Cmd+B (粗体)、Cmd+I (斜体)、Cmd+S (保存)、Cmd+P (预览)
        </div>
        <div>
          {isDirty && <span className="text-yellow-600">● 未保存</span>}
        </div>
      </div>
    </div>
  );
}