import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { asyncHandler, createSuccessResponse } from '@/lib/error-handler';

// 获取评论
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const slug = decodeURIComponent(params.slug);
  
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) {
    return new Response(JSON.stringify({ error: '文章不存在' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const comments = await prisma.comment.findMany({
    where: { postId: post.id },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { username: true, name: true } } }
  });

  return createSuccessResponse({ comments });
});

// 发表评论
export const POST = asyncHandler(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const slug = decodeURIComponent(params.slug);
  const user = await getUserFromRequest(req);
  
  if (!user) {
    return new Response(JSON.stringify({ error: '请先登录' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { content } = await req.json();
  if (!content || content.trim().length === 0) {
    return new Response(JSON.stringify({ error: '评论内容不能为空' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) {
    return new Response(JSON.stringify({ error: '文章不存在' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const comment = await prisma.comment.create({
    data: { content: content.trim(), userId: user.id, postId: post.id },
    include: { user: { select: { username: true, name: true } } }
  });

  return createSuccessResponse({ comment });
}); 