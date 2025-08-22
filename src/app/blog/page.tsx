"use client";
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Pagination from "@/components/Pagination";

// 禅意圆环组件
const ZenCircle = ({ size = "sm", children }: { size?: "sm" | "md", children?: React.ReactNode }) => (
  <div className={`zen-circle zen-circle-${size}`}>
    {children}
  </div>
);

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 8;

  // 内容分类
  const categories = [
    { id: '', name: '全部', icon: '○' },
    { id: 'investment', name: '投资思考', icon: '◐' },
    { id: 'psychology', name: '心理学', icon: '◑' },
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/blog");
        const data = await res.json();
        if (data.success) {
          const posts = data.data?.posts || data.posts || [];
          setAllPosts(posts);
          applyFilters(posts);
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
  const applyFilters = useCallback((posts: any[]) => {
    let filtered = posts.filter((p: any) => {
      // 分类过滤 (使用专门的category字段)
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      // 标签过滤
      const matchTag = !selectedTag || (p.tags && JSON.parse(p.tags).includes(selectedTag));
      return matchCategory && matchTag;
    });
    
    // 按时间排序 (最新的在前)
    filtered.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // 计算分页
    const totalPages = Math.ceil(filtered.length / postsPerPage);
    setTotalPages(totalPages);
    
    // 分页数据
    const startIndex = (currentPage - 1) * postsPerPage;
    const paginatedPosts = filtered.slice(startIndex, startIndex + postsPerPage);
    
    setPosts(paginatedPosts);
  }, [currentPage, postsPerPage, selectedCategory, selectedTag]);
  
  // 过滤器变化时重新过滤
  useEffect(() => {
    setCurrentPage(1); // 重置到第一页
    applyFilters(allPosts);
  }, [selectedCategory, selectedTag, allPosts, applyFilters]);
  
  // 分页变化时重新过滤
  useEffect(() => {
    applyFilters(allPosts);
  }, [currentPage, allPosts, applyFilters]);
  
  // 处理分页
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 禅意标题区 */}
      <div className="py-12 sm:py-20 text-center">
        <ZenCircle size="md">
          <h1 className="zen-title text-2xl sm:text-4xl ml-8 sm:ml-12">思考记录</h1>
        </ZenCircle>
        <p className="zen-subtitle mt-6 sm:mt-8 max-w-2xl mx-auto px-4 sm:px-8 text-sm sm:text-base">
          投资与心理学的交汇点，记录思维的轨迹
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8">
        {/* 分类导航 */}
        <div className="flex justify-center mb-12 sm:mb-16">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`zen-subtitle flex items-center justify-center gap-3 transition-colors duration-300 py-2 sm:py-0 ${
                  selectedCategory === category.id 
                    ? 'text-current' 
                    : 'hover:text-current'
                }`}
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 标签筛选 */}
        {allTags.length > 0 && (
          <div className="text-center mb-16">
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedTag('')}
                className={`zen-button text-sm ${!selectedTag ? 'bg-current text-white' : ''}`}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`zen-button text-sm ${selectedTag === tag ? 'bg-current text-white' : ''}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 内容区域 */}
        {loading ? (
          <div className="text-center py-20">
            <ZenCircle size="md">
              <div className="zen-subtitle ml-12">加载中...</div>
            </ZenCircle>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <ZenCircle size="md">
              <div className="zen-subtitle ml-12">
                {allPosts.length === 0 ? '暂无文章' : '无匹配内容'}
              </div>
            </ZenCircle>
          </div>
        ) : (
          <>
            {/* 文章列表 */}
            <div className="space-y-8 mb-20">
              {posts.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="zen-card block group"
                >
                  <div className="flex gap-8 items-start">
                    {/* 左侧内容 */}
                    <div className="flex-1">
                      <h2 className="zen-title text-2xl mb-3 group-hover:text-current transition-colors">
                        {post.title}
                      </h2>
                      <p className="zen-subtitle mb-4 line-clamp-2">
                        {post.excerpt?.replace(/<[^>]*>/g, '') || ''}
                      </p>
                      <div className="flex items-center gap-4 text-sm zen-subtitle">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.category && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <span>{categories.find(c => c.id === post.category)?.icon || '○'}</span>
                              <span>{categories.find(c => c.id === post.category)?.name || post.category}</span>
                            </span>
                          </>
                        )}
                        {post.tags && JSON.parse(post.tags).length > 0 && (
                          <>
                            <span>·</span>
                            <div className="flex gap-2">
                              {JSON.parse(post.tags).slice(0, 2).map((tag: string) => (
                                <span key={tag}>#{tag}</span>
                              ))}
                            </div>
                          </>
                        )}
                        {post.likeCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{post.likeCount} 赞</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* 右侧图片 */}
                    {post.coverImage && (
                      <div className="w-32 h-24 flex-shrink-0">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          style={{ filter: 'grayscale(100%)' }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            {/* 分页 */}
            {totalPages > 1 && (
              <div className="text-center py-16">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={allPosts.length}
                  itemsPerPage={postsPerPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}