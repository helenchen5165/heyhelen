import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler, createSuccessResponse } from '@/lib/error-handler';

export const GET = asyncHandler(async (req: NextRequest) => {
  try {
    // 1. 获取所有文章（不过滤）
    const allPosts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true, name: true } } },
    });

    // 2. 获取已发布文章
    const publishedPosts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { username: true, name: true } } },
    });

    // 3. 统计信息
    const stats = await prisma.post.groupBy({
      by: ['isPublished'],
      _count: {
        id: true
      }
    });

    // 4. 最新文章详情（用于调试）
    const latestPost = allPosts[0];
    let postDetails = null;
    if (latestPost) {
      postDetails = {
        id: latestPost.id,
        title: latestPost.title,
        slug: latestPost.slug,
        isPublished: latestPost.isPublished,
        createdAt: latestPost.createdAt,
        authorId: latestPost.authorId,
        hasAuthor: !!latestPost.author,
        contentLength: latestPost.content?.length || 0
      };
    }

    return createSuccessResponse({
      totalPosts: allPosts.length,
      publishedPosts: publishedPosts.length,
      unpublishedPosts: allPosts.length - publishedPosts.length,
      stats,
      allPosts: allPosts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        isPublished: p.isPublished,
        createdAt: p.createdAt
      })),
      publishedPostsData: publishedPosts.map(p => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        isPublished: p.isPublished,
        createdAt: p.createdAt
      })),
      latestPostDetails: postDetails,
      dbConnection: 'OK'
    });
  } catch (error) {
    console.error('数据库查询错误:', error);
    return createSuccessResponse({
      error: error instanceof Error ? error.message : String(error),
      dbConnection: 'ERROR'
    });
  }
});