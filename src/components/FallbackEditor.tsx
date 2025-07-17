"use client";
import React, { useState, useRef } from 'react';
import ImageUploader from './ImageUploader';

interface FallbackEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function FallbackEditor({ value, onChange, placeholder, className = '' }: FallbackEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'html' | 'text'>('html');

  const handleImageInsert = (url: string) => {
    const imageTag = `<img src="${url}" alt="插图" style="max-width: 100%; height: auto;" />`;
    onChange(value + imageTag);
  };

  const insertAtCursor = (before: string, after: string = '') => {
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
  };

  const formatButtons = [
    { 
      label: '粗体', 
      action: () => insertAtCursor('<strong>', '</strong>'),
      shortcut: 'Ctrl+B'
    },
    { 
      label: '斜体', 
      action: () => insertAtCursor('<em>', '</em>'),
      shortcut: 'Ctrl+I'
    },
    { 
      label: '标题', 
      action: () => insertAtCursor('<h2>', '</h2>'),
      shortcut: 'Ctrl+H'
    },
    { 
      label: '链接', 
      action: () => insertAtCursor('<a href="URL">', '</a>'),
      shortcut: 'Ctrl+L'
    },
    { 
      label: '换行', 
      action: () => insertAtCursor('<br />'),
      shortcut: 'Ctrl+Enter'
    },
    { 
      label: '段落', 
      action: () => insertAtCursor('<p>', '</p>'),
      shortcut: 'Ctrl+P'
    },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          insertAtCursor('<strong>', '</strong>');
          break;
        case 'i':
          e.preventDefault();
          insertAtCursor('<em>', '</em>');
          break;
        case 'h':
          e.preventDefault();
          insertAtCursor('<h2>', '</h2>');
          break;
        case 'l':
          e.preventDefault();
          insertAtCursor('<a href="URL">', '</a>');
          break;
        case 'Enter':
          e.preventDefault();
          insertAtCursor('<br />');
          break;
        case 'p':
          e.preventDefault();
          insertAtCursor('<p>', '</p>');
          break;
      }
    }
  };

  return (
    <div className={`fallback-editor ${className}`}>
      {/* 工具栏 */}
      <div className="border border-gray-300 rounded-t bg-gray-50 p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded ${
                mode === 'html' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setMode('html')}
            >
              HTML
            </button>
            <button
              type="button"
              className={`px-3 py-1 text-sm rounded ${
                mode === 'text' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setMode('text')}
            >
              纯文本
            </button>
          </div>
          <ImageUploader onInsert={handleImageInsert} />
        </div>
        
        {mode === 'html' && (
          <div className="flex items-center gap-2 flex-wrap">
            {formatButtons.map((button, index) => (
              <button
                key={index}
                type="button"
                onClick={button.action}
                title={`${button.label} (${button.shortcut})`}
                className="px-2 py-1 text-xs bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
              >
                {button.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 编辑区域 */}
      <div className="border border-gray-300 rounded-b border-t-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '请输入内容...'}
          className="w-full min-h-[400px] p-4 border-none outline-none resize-none"
          style={{ 
            fontFamily: mode === 'html' ? 'monospace' : 'inherit',
            fontSize: mode === 'html' ? '14px' : '16px',
            lineHeight: '1.5'
          }}
        />
      </div>

      {/* 预览区域 */}
      {mode === 'html' && value && (
        <div className="mt-4 border border-gray-300 rounded p-4 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">预览:</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        </div>
      )}

      {/* 帮助信息 */}
      <div className="mt-2 text-xs text-gray-500">
        {mode === 'html' ? (
          <div>
            <div>支持HTML标签，使用快捷键快速格式化：</div>
            <div className="mt-1">
              Ctrl+B (粗体), Ctrl+I (斜体), Ctrl+H (标题), Ctrl+L (链接), Ctrl+Enter (换行), Ctrl+P (段落)
            </div>
          </div>
        ) : (
          <span>纯文本模式，所有HTML标签将被显示为文本</span>
        )}
      </div>
    </div>
  );
}