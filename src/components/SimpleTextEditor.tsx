"use client";
import React, { useState } from 'react';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SimpleTextEditor({ 
  value, 
  onChange, 
  placeholder = "请输入内容...", 
  className = "" 
}: SimpleTextEditorProps) {
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    console.log('编辑器内容改变:', newValue); // 调试日志
  };

  // 当外部值改变时同步本地值
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={`simple-text-editor ${className}`}>
      <div className="mb-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>📝 简单文本编辑器</span>
          <span className="text-xs">({localValue.length} 字符)</span>
        </div>
      </div>
      
      <textarea
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full min-h-[400px] p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        style={{
          fontSize: '16px', // 防止iOS缩放
          lineHeight: '1.5',
          fontFamily: 'inherit'
        }}
      />
      
      <div className="mt-2 text-xs text-gray-500">
        <div>💡 提示：支持HTML标签，如 &lt;p&gt;、&lt;strong&gt;、&lt;em&gt;、&lt;h1&gt;-&lt;h6&gt; 等</div>
        <div>📋 常用格式：</div>
        <div className="ml-2 mt-1 space-y-1">
          <div>• 粗体: &lt;strong&gt;文本&lt;/strong&gt;</div>
          <div>• 斜体: &lt;em&gt;文本&lt;/em&gt;</div>
          <div>• 标题: &lt;h2&gt;标题&lt;/h2&gt;</div>
          <div>• 段落: &lt;p&gt;段落内容&lt;/p&gt;</div>
          <div>• 链接: &lt;a href="网址"&gt;链接文本&lt;/a&gt;</div>
        </div>
      </div>
    </div>
  );
}