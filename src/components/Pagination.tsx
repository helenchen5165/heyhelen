"use client";
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  totalItems,
  itemsPerPage = 10
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // 始终显示第一页
      visiblePages.push(1);
      
      if (currentPage > 4) {
        visiblePages.push('...');
      }
      
      // 显示当前页周围的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!visiblePages.includes(i)) {
          visiblePages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        visiblePages.push('...');
      }
      
      // 始终显示最后一页
      if (!visiblePages.includes(totalPages)) {
        visiblePages.push(totalPages);
      }
    }
    
    return visiblePages;
  };

  const visiblePages = getVisiblePages();

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4 py-4 sm:py-6">
      {/* 分页信息 */}
      {showInfo && totalItems && (
        <div className="text-xs sm:text-sm text-gray-700 text-center lg:text-left">
          显示第 <span className="font-medium">{startItem}</span> 到{' '}
          <span className="font-medium">{endItem}</span> 项，共{' '}
          <span className="font-medium">{totalItems}</span> 项
        </div>
      )}

      {/* 分页控件 */}
      <nav className="flex items-center space-x-1 overflow-x-auto">
        {/* 上一页 */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="ml-1 hidden md:inline">上一页</span>
        </button>

        {/* 页码 */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={`relative inline-flex items-center px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium border whitespace-nowrap ${
                  currentPage === page
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* 下一页 */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <span className="mr-1 hidden md:inline">下一页</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* 快速跳转 */}
      <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
        <span className="text-gray-700 whitespace-nowrap">跳转到</span>
        <select
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          className="border border-gray-300 rounded px-1 sm:px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[60px]"
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <option key={page} value={page}>
              {page}
            </option>
          ))}
        </select>
        <span className="text-gray-700 whitespace-nowrap">页</span>
      </div>
    </div>
  );
}