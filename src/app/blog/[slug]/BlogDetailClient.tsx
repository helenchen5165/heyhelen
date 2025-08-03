"use client";
import React, { useEffect, useState, FormEvent } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";

// 禅意圆环组件
const ZenCircle = ({ size = "sm", children }: { size?: "sm" | "md", children?: React.ReactNode }) => (
  <div className={`zen-circle zen-circle-${size}`}>
    {children}
  </div>
);

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string;
  isPublished: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: { username: string; name?: string };
};
type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { username: string; name?: string };
};

export default function BlogDetailClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchComments();
    // eslint-disable-next-line
  }, [slug]);

  const fetchPost = async () => {
    try {
      const encodedSlug = encodeURIComponent(slug);
      const res = await fetch(`/api/blog/${encodedSlug}`);
      if (!res.ok) {
        if (res.status === 404) return notFound();
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setPost(data.data?.post || data.post);
        setLikeCount(data.data?.post?.likeCount || data.post?.likeCount || 0);
      } else {
        notFound();
      }
    } catch (error) {
      console.error('获取文章失败:', error);
      notFound();
    }
  };

  const fetchComments = async () => {
    try {
      const encodedSlug = encodeURIComponent(slug);
      const res = await fetch(`/api/blog/${encodedSlug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.success ? (data.data?.comments || []) : (data.comments || []));
      }
    } catch (error) {
      console.error('获取评论失败:', error);
    }
  };

  const handleLike = async () => {
    setLoading(true);
    const res = await fetch("/api/blog/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post?.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setLiked(data.liked);
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
    } else {
      alert(data.error || "操作失败");
    }
  };

  const handleComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    const encodedSlug = encodeURIComponent(slug);
    const res = await fetch(`/api/blog/${encodedSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    setLoading(false);
    if (res.ok) {
      setNewComment("");
      fetchComments();
    } else {
      const data = await res.json();
      alert(data.error || "发表评论失败");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("确定要删除此评论吗？")) return;
    setLoading(true);
    const encodedSlug = encodeURIComponent(slug);
    const res = await fetch(`/api/blog/${encodedSlug}/comments/${commentId}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (res.ok) {
      fetchComments();
    } else {
      const data = await res.json();
      alert(data.error || "删除评论失败");
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <ZenCircle size="md">
          <div className="zen-subtitle ml-12">加载中...</div>
        </ZenCircle>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* 返回导航 */}
      <div className="py-8 px-8">
        <Link href="/blog" className="zen-subtitle flex items-center gap-2 hover:text-current transition-colors">
          <span>←</span>
          <span>返回思考记录</span>
        </Link>
      </div>

      {/* 文章内容 */}
      <div className="max-w-3xl mx-auto px-8 pb-20">
        {/* 标题区域 */}
        <div className="text-center mb-16">
          <h1 className="zen-title text-4xl mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="zen-subtitle flex items-center justify-center gap-4 mb-4">
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            {post.tags && JSON.parse(post.tags).length > 0 && (
              <>
                <span>·</span>
                <div className="flex gap-2">
                  {JSON.parse(post.tags).map((tag: string) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 封面图片 */}
        {post.coverImage && (
          <div className="mb-16 text-center">
            <img 
              src={post.coverImage} 
              alt={post.title} 
              className="w-full max-w-2xl mx-auto"
              style={{ filter: 'grayscale(100%)', maxHeight: '400px', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* 正文内容 */}
        <article className="zen-article mb-16">
          <div 
            dangerouslySetInnerHTML={{ __html: post.content }} 
            className="blog-content"
          />
        </article>

        {/* 互动区域 */}
        <div className="border-t border-current border-opacity-10 pt-16">
          {/* 点赞 */}
          <div className="text-center mb-16">
            <button
              onClick={handleLike}
              disabled={loading}
              className={`zen-button flex items-center gap-3 mx-auto ${
                liked ? 'bg-current text-white' : ''
              }`}
            >
              <span>{liked ? "●" : "○"}</span>
              <span>{liked ? "已赞同" : "赞同"}</span>
              <span>({likeCount})</span>
            </button>
          </div>

          {/* 评论区 */}
          <div>
            <div className="text-center mb-12">
              <h3 className="zen-title text-2xl">
                思考回响 ({comments.length})
              </h3>
            </div>
            
            {/* 发表评论 */}
            <form onSubmit={handleComment} className="mb-12">
              <textarea
                placeholder="留下你的思考..."
                className="w-full p-6 border border-current border-opacity-20 focus:border-opacity-60 bg-transparent resize-none transition-all zen-subtitle"
                style={{ minHeight: '120px', outline: 'none' }}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                disabled={loading}
              />
              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="zen-button"
                  disabled={loading || !newComment.trim()}
                >
                  {loading ? "发表中..." : "发表思考"}
                </button>
              </div>
            </form>
            
            {/* 评论列表 */}
            <div className="space-y-8">
              {comments.map((comment: Comment) => (
                <div key={comment.id} className="border-l border-current border-opacity-20 pl-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="zen-subtitle font-medium">
                      {comment.user?.name || comment.user?.username || "匿名"}
                    </div>
                    <div className="zen-subtitle text-sm opacity-60">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="zen-subtitle mb-3 whitespace-pre-line">
                    {comment.content}
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="zen-subtitle text-xs opacity-40 hover:opacity-100 transition-opacity"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 