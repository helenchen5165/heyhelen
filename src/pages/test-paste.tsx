"use client";
import React, { useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';

export default function TestPastePage() {
  const [content, setContent] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    addDebugInfo(`内容已更新，长度: ${newContent.length}`);
  };

  // 监听剪贴板事件
  React.useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') || '';
      const html = e.clipboardData?.getData('text/html') || '';
      addDebugInfo(`全局粘贴事件 - 文本: ${text.length} 字符, HTML: ${html.length} 字符`);
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">富文本编辑器粘贴功能测试</h1>
      
      <div className="space-y-6">
        {/* 测试说明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">测试步骤：</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>复制一些文本（可以是纯文本或富文本）</li>
            <li>点击下方编辑器获得焦点</li>
            <li>使用 Ctrl+V 或 Cmd+V 粘贴内容</li>
            <li>观察编辑器内容和调试信息</li>
          </ol>
        </div>

        {/* 富文本编辑器 */}
        <div>
          <h3 className="font-semibold mb-2">富文本编辑器：</h3>
          <RichTextEditor
            value={content}
            onChange={handleContentChange}
            placeholder="请在这里测试粘贴功能..."
            className="min-h-[200px]"
          />
        </div>

        {/* 内容预览 */}
        <div>
          <h3 className="font-semibold mb-2">内容预览：</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        </div>

        {/* 原始HTML */}
        <div>
          <h3 className="font-semibold mb-2">原始HTML：</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {content || '(空内容)'}
          </pre>
        </div>

        {/* 调试信息 */}
        <div>
          <h3 className="font-semibold mb-2">调试信息：</h3>
          <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
            {debugInfo.length === 0 ? '暂无调试信息' : debugInfo.map((info, index) => (
              <div key={index}>{info}</div>
            ))}
          </div>
        </div>

        {/* 手动测试按钮 */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setContent('<p>测试内容</p>');
              addDebugInfo('手动设置测试内容');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            设置测试内容
          </button>
          
          <button
            onClick={() => {
              setContent('');
              setDebugInfo([]);
              addDebugInfo('已清空所有内容');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            清空内容
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.readText().then(text => {
                addDebugInfo(`系统剪贴板内容: ${text.substring(0, 50)}...`);
              }).catch(err => {
                addDebugInfo(`读取剪贴板失败: ${err.message}`);
              });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            检查剪贴板
          </button>
        </div>
      </div>
    </div>
  );
}