import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler, createSuccessResponse } from '@/lib/error-handler';

export const GET = asyncHandler(async () => {
  console.log('📍 公开博客API被调用');
  
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true, name: true } } },
  });
  
  console.log(`📍 查询到 ${posts.length} 篇已发布文章`);
  console.log('📍 文章列表:', posts.map(p => ({ 
    id: p.id, 
    title: p.title, 
    isPublished: p.isPublished 
  })));
  
  const response = createSuccessResponse({ posts });
  console.log('📍 返回响应:', { 
    success: true, 
    postsCount: posts.length,
    structure: 'data.posts' 
  });
  
  return response;
}); 