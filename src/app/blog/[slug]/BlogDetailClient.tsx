"use client";
import React, { useEffect, useState, FormEvent } from "react";
import { notFound } from "next/navigation";

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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-12 px-4 sm:px-8 lg:px-12 max-w-4xl mx-auto">
      {post.coverImage && (
        <div className="w-full h-48 sm:h-64 lg:h-80 rounded-xl sm:rounded-2xl overflow-hidden mb-6 sm:mb-8 shadow border border-gray-100">
          <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 text-black leading-tight tracking-tight drop-shadow-sm">{post.title}</h1>
        <div className="flex items-center gap-2 sm:gap-3 text-gray-500 text-xs sm:text-sm mb-2">
          <span className="inline-block w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm sm:text-lg">{post.author?.name?.[0] || post.author?.username?.[0]}</span>
          <span className="truncate">{post.author?.name || post.author?.username}</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
          {post.tags && JSON.parse(post.tags).map((tag: string) => (
            <span key={tag} className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100 font-medium">#{tag}</span>
          ))}
        </div>
      </div>
      <article className="prose prose-sm sm:prose-base lg:prose-lg max-w-none text-gray-800 mb-8 sm:mb-10">
        <div 
          dangerouslySetInnerHTML={{ __html: post.content }} 
          className="blog-content"
        />
      </article>
      
      {/* 文章信息 */}
      <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-center text-xs sm:text-sm">
          <div>
            <div className="font-semibold text-gray-800">发布时间</div>
            <div className="text-gray-600">{new Date(post.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">更新时间</div>
            <div className="text-gray-600">{new Date(post.updatedAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">阅读量</div>
            <div className="text-gray-600">👁️ {Math.floor(Math.random() * 1000) + 100}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-800">点赞数</div>
            <div className="text-gray-600">❤️ {likeCount}</div>
          </div>
        </div>
      </div>
      {/* 点赞按钮 */}
      <div className="border-t border-gray-100 pt-6 sm:pt-8 mb-6 sm:mb-8 flex items-center justify-center sm:justify-start">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`px-4 sm:px-7 py-2 rounded-full font-semibold transition flex items-center gap-2 shadow-sm border border-pink-100 text-sm sm:text-lg focus:outline-none focus:ring-2 focus:ring-pink-200/50
            ${liked ? "bg-pink-500 text-white hover:bg-pink-600 scale-105" : "bg-white text-pink-500 hover:bg-pink-50"}
            active:scale-95 duration-150`}
        >
          <span className="text-lg sm:text-xl">{liked ? "❤️" : "🤍"}</span>
          <span>{liked ? "已点赞" : "点赞"}</span>
          <span className="ml-1 text-sm sm:text-base">({likeCount})</span>
        </button>
      </div>
      {/* 评论区 */}
      <div className="border-t border-gray-100 pt-6 sm:pt-8">
        <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-black">评论 ({comments.length})</h3>
        {/* 发表评论 */}
        <form onSubmit={handleComment} className="mb-6 sm:mb-8">
          <textarea
            placeholder="写下你的评论..."
            className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[80px] sm:min-h-[100px] resize-none transition-all text-sm sm:text-base"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="mt-2 px-4 sm:px-7 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow text-sm sm:text-base"
            disabled={loading || !newComment.trim()}
          >
            {loading ? "发表中..." : "发表评论"}
          </button>
        </form>
        {/* 评论列表 */}
        <div className="space-y-3 sm:space-y-4">
          {comments.map((comment: Comment) => (
            <div key={comment.id} className="bg-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-100 shadow-sm">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="font-semibold text-black text-sm sm:text-base truncate">{comment.user?.name || comment.user?.username}</div>
                <div className="text-gray-500 text-xs flex-shrink-0">{new Date(comment.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-gray-700 mb-2 whitespace-pre-line text-sm sm:text-base">{comment.content}</div>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-500 text-xs hover:underline"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 