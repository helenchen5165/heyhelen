import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler, createSuccessResponse } from '@/lib/error-handler';

export const GET = asyncHandler(async () => {
  const posts = await prisma.post.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true, name: true } } },
  });
  
  return createSuccessResponse({ posts });
}); 