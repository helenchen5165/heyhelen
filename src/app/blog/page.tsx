"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BlogSearch, { BlogFilters } from "@/components/BlogSearch";
import Pagination from "@/components/Pagination";

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<BlogFilters>({
    search: '',
    tag: '',
    sortBy: 'newest'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 6;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        if (data.success) {
          const posts = data.data?.posts || [];
          setAllPosts(posts);
          applyFilters(posts, filters);
        } else {
          console.error('获取博客列表失败:', data.error);
        }
      } catch (error) {
        console.error('获取博客列表失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // 提取所有标签
  const allTags = Array.from(new Set<string>(allPosts.flatMap((p: any) => p.tags ? JSON.parse(p.tags) : [])));
  
  // 应用过滤器
  const applyFilters = useCallback((posts: any[], filters: BlogFilters) => {
    let filtered = posts.filter((p: any) => {
      const matchSearch = !filters.search || 
        p.title.toLowerCase().includes(filters.search.toLowerCase()) || 
        (p.excerpt || "").toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.content || "").toLowerCase().includes(filters.search.toLowerCase());
      const matchTag = !filters.tag || (p.tags && JSON.parse(p.tags).includes(filters.tag));
      return matchSearch && matchTag;
    });
    
    // 排序
    filtered.sort((a: any, b: any) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'popular':
          return (b.likeCount || 0) - (a.likeCount || 0);
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    
    // 计算分页
    const totalPages = Math.ceil(filtered.length / postsPerPage);
    setTotalPages(totalPages);
    
    // 分页数据
    const startIndex = (currentPage - 1) * postsPerPage;
    const paginatedPosts = filtered.slice(startIndex, startIndex + postsPerPage);
    
    setPosts(paginatedPosts);
  }, [currentPage, postsPerPage]);
  
  // 过滤器变化时重新过滤
  useEffect(() => {
    setCurrentPage(1); // 重置到第一页
    applyFilters(allPosts, filters);
  }, [filters, allPosts, applyFilters]);
  
  // 分页变化时重新过滤
  useEffect(() => {
    applyFilters(allPosts, filters);
  }, [currentPage, allPosts, filters, applyFilters]);
  
  // 处理搜索
  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);
  
  // 处理过滤器变化
  const handleFilterChange = useCallback((newFilters: BlogFilters) => {
    setFilters(newFilters);
  }, []);
  
  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-black">博客</h1>
        
        {/* 搜索和过滤 */}
        <BlogSearch
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          tags={allTags}
          totalResults={allPosts.length}
        />

        {/* 加载状态 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">加载中...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <p className="text-gray-600 text-lg">
              {allPosts.length === 0 ? '暂无博客文章' : '没有找到匹配的文章'}
            </p>
            {allPosts.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">等待管理员发布第一篇文章...</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-200 flex flex-col overflow-hidden hover:-translate-y-1"
                >
                  {post.coverImage && (
                    <div className="w-full h-32 sm:h-40 lg:h-48 bg-gray-100 relative">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="object-cover w-full h-full transition group-hover:scale-105 duration-200"
                      />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col p-3 sm:p-4 lg:p-5">
                    <h2 className="text-base sm:text-lg font-bold mb-2 text-black group-hover:text-blue-600 transition line-clamp-2">{post.title}</h2>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-xs mb-2">
                      <span className="inline-block w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm">{post.author?.name?.[0] || post.author?.username?.[0]}</span>
                      <span className="truncate max-w-[80px] sm:max-w-none">{post.author?.name || post.author?.username}</span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="mb-2 text-sm sm:text-base text-gray-700 line-clamp-2 min-h-[32px] sm:min-h-[40px]">{post.excerpt || '暂无摘要'}</div>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                      {post.tags && JSON.parse(post.tags).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 sm:py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100 font-medium">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-auto">
                      <span className="text-pink-500 text-base">❤️</span>
                      <span className="text-gray-600 text-sm">{post.likeCount || 0}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            {/* 分页 */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={allPosts.length}
              itemsPerPage={postsPerPage}
            />
          </>
        )}
      </div>
    </div>
  );
}