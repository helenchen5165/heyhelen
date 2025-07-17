"use client";
import React, { useState } from 'react';
import SimpleTextEditor from '@/components/SimpleTextEditor';

export default function TestEditorPage() {
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('测试提交内容:', content);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">编辑器测试页面</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-4">
              测试编辑器功能
            </label>
            
            <SimpleTextEditor
              value={content}
              onChange={setContent}
              placeholder="在此输入测试内容..."
              className="mb-4"
            />
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="font-semibold text-blue-800">实时内容预览:</div>
              <div className="text-sm text-blue-700 mt-2">
                字符数: {content.length}
              </div>
              <div className="text-sm text-blue-700 mt-1">
                内容: {content ? content.substring(0, 100) + (content.length > 100 ? '...' : '') : '(空)'}
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
            >
              测试提交
            </button>
          </div>
        </form>
        
        {submitted && (
          <div className="mt-8 bg-green-50 p-6 rounded-lg">
            <h2 className="text-green-800 font-semibold mb-2">提交成功！</h2>
            <div className="text-green-700">
              <div>提交的内容长度: {content.length}</div>
              <div className="mt-2">提交的内容:</div>
              <div className="bg-white p-4 rounded mt-2 text-sm">
                {content || '(空内容)'}
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-yellow-800 font-semibold mb-2">调试指南</h2>
          <div className="text-yellow-700 text-sm space-y-1">
            <div>1. 请打开浏览器开发者工具 (F12)</div>
            <div>2. 切换到 Console 标签</div>
            <div>3. 在编辑器中输入内容，查看控制台输出</div>
            <div>4. 点击提交按钮，检查是否有错误</div>
          </div>
        </div>
      </div>
    </div>
  );
}