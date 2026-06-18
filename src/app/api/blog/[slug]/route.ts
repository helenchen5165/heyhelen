import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler, createSuccessResponse } from '@/lib/error-handler';

export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { slug: string } }) => {
  const slug = decodeURIComponent(params.slug);
  
  const post = await prisma.post.findUnique({
    where: { slug, isPublished: true },
    include: { author: { select: { username: true, name: true } } },
  });
  
  if (!post) {
    return new Response(JSON.stringify({ error: '未找到该文章' }), { 
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return createSuccessResponse({ post });
}); 