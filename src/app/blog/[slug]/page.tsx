"use client";
import React, { useEffect, useState } from "react";
import { notFound } from "next/navigation";

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [params.slug]);

  const fetchPost = async () => {
    const res = await fetch(`/api/blog/${params.slug}`);
    if (!res.ok) return notFound();
    const data = await res.json();
    setPost(data.post);
    setLikeCount(data.post.likeCount || 0);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/blog/${params.slug}/comments`);
    const data = await res.json();
    setComments(data.comments || []);
  };

  const handleLike = async () => {
    setLoading(true);
    const res = await fetch("/api/blog/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
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

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/blog/${params.slug}/comments`, {
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
    const res = await fetch(`/api/blog/${params.slug}/comments/${commentId}`, {
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

  if (!post) return <div className="min-h-screen bg-white flex items-center justify-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-12 max-w-3xl mx-auto">
      {post.coverImage && (
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-8 shadow border border-gray-100">
          <img src={post.coverImage} alt={post.title} className="object-cover w-full h-full" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold mb-3 text-black leading-tight tracking-tight drop-shadow-sm">{post.title}</h1>
        <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
          <span className="inline-block w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">{post.author?.name?.[0] || post.author?.username?.[0]}</span>
          <span>{post.author?.name || post.author?.username}</span>
          <span>·</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {post.tags && JSON.parse(post.tags).map((tag: string) => (
            <span key={tag} className="px-3 py-1 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100 font-medium">#{tag}</span>
          ))}
        </div>
      </div>
      <article className="prose max-w-none text-gray-800 mb-10">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      {/* 点赞按钮 */}
      <div className="border-t border-gray-100 pt-8 mb-8 flex items-center">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`px-7 py-2 rounded-full font-semibold transition flex items-center gap-2 shadow-sm border border-pink-100 text-lg focus:outline-none focus:ring-2 focus:ring-pink-200/50
            ${liked ? "bg-pink-500 text-white hover:bg-pink-600 scale-105" : "bg-white text-pink-500 hover:bg-pink-50"}
            active:scale-95 duration-150`}
        >
          <span className="text-xl">{liked ? "❤️" : "🤍"}</span>
          <span>{liked ? "已点赞" : "点赞"}</span>
          <span className="ml-1 text-base">({likeCount})</span>
        </button>
      </div>
      {/* 评论区 */}
      <div className="border-t border-gray-100 pt-8">
        <h3 className="text-2xl font-bold mb-6 text-black">评论 ({comments.length})</h3>
        {/* 发表评论 */}
        <form onSubmit={handleComment} className="mb-8">
          <textarea
            placeholder="写下你的评论..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 min-h-[100px] resize-none transition-all"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            className="mt-2 px-7 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 shadow"
            disabled={loading || !newComment.trim()}
          >
            {loading ? "发表中..." : "发表评论"}
          </button>
        </form>
        {/* 评论列表 */}
        <div className="space-y-4">
          {comments.map((comment: any) => (
            <div key={comment.id} className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="font-semibold text-black">{comment.user?.name || comment.user?.username}</div>
                <div className="text-gray-500 text-xs">{new Date(comment.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="text-gray-700 mb-2 whitespace-pre-line">{comment.content}</div>
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