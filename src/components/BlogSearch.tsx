"use client";
import React, { useState, useEffect } from 'react';

interface BlogSearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: BlogFilters) => void;
  tags: string[];
  totalResults?: number;
}

export interface BlogFilters {
  search: string;
  tag: string;
  sortBy: 'newest' | 'oldest' | 'popular';
}

export default function BlogSearch({ onSearch, onFilterChange, tags, totalResults }: BlogSearchProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, onSearch]);

  // 过滤器变化
  useEffect(() => {
    onFilterChange({ search, tag: selectedTag, sortBy });
  }, [search, selectedTag, sortBy, onFilterChange]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedTag('');
    setSortBy('newest');
  };

  const hasActiveFilters = search || selectedTag || sortBy !== 'newest';

  return (
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
      {/* 搜索框 */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="搜索文章标题、内容..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 过滤器切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2 sm:gap-0">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center text-sm text-gray-600 hover:text-gray-800"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          {showFilters ? '隐藏筛选' : '显示筛选'}
        </button>
        
        <div className="flex items-center gap-2 sm:gap-4 text-sm text-gray-600">
          {totalResults !== undefined && (
            <span>找到 {totalResults} 篇文章</span>
          )}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-700"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 过滤器 */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签筛选
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部标签</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* 排序方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方式
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
                className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">最新发布</option>
                <option value="oldest">最早发布</option>
                <option value="popular">最受欢迎</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 活跃筛选器显示 */}
      {hasActiveFilters && (
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
          {search && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              搜索: {search}
              <button
                onClick={() => setSearch('')}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {selectedTag && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              标签: {selectedTag}
              <button
                onClick={() => setSelectedTag('')}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {sortBy !== 'newest' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              排序: {sortBy === 'oldest' ? '最早发布' : '最受欢迎'}
              <button
                onClick={() => setSortBy('newest')}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}