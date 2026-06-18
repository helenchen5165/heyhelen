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
    <div className="flex flex-col items-center gap-4 py-4 sm:py-6">
      {/* 分页信息 */}
      {showInfo && totalItems && (
        <div className="text-xs sm:text-sm zen-subtitle text-center">
          显示第 <span className="font-medium">{startItem}</span> 到{' '}
          <span className="font-medium">{endItem}</span> 项，共{' '}
          <span className="font-medium">{totalItems}</span> 项
        </div>
      )}

      {/* 分页控件 */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <nav className="flex items-center space-x-1">
          {/* 上一页 */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="zen-button px-3 py-2 text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">上一页</span>
          </button>

          {/* 页码 */}
          <div className="flex items-center space-x-1 mx-2">
            {visiblePages.map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-2 sm:px-3 py-2 text-xs sm:text-sm zen-subtitle">
                    ...
                  </span>
                ) : (
                  <button
                    onClick={() => onPageChange(page as number)}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'zen-button bg-current text-white'
                        : 'zen-button'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 下一页 */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="zen-button px-3 py-2 text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span className="hidden sm:inline">下一页</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>

        {/* 快速跳转 */}
        <div className="flex items-center space-x-2 text-xs sm:text-sm">
          <span className="zen-subtitle whitespace-nowrap">跳转到</span>
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="zen-button px-2 py-1 text-xs sm:text-sm min-w-[60px] cursor-pointer"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <option key={page} value={page}>
                {page}
              </option>
            ))}
          </select>
          <span className="zen-subtitle whitespace-nowrap">页</span>
        </div>
      </div>
    </div>
  );
}