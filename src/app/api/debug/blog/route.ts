import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 获取所有文章（包括未发布的）
    const allPosts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    // 获取已发布文章
    const publishedPosts = await prisma.post.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isPublished: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total_posts: allPosts.length,
        published_posts: publishedPosts.length,
        all_posts: allPosts,
        published_posts_list: publishedPosts,
        database_url_exists: !!process.env.DATABASE_URL,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}