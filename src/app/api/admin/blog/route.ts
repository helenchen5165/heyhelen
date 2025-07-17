import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, validateRequest } from '@/lib/error-handler';
import { blogSchema } from '@/lib/validations';
import { BlogInput } from '@/lib/validations';

// 获取所有博客（管理员专用）
export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  
  const posts = await prisma.post.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true, name: true } } }
  });
  
  return createSuccessResponse({ posts });
});

// 新增博客
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireAdmin(req);
  const data = await validateRequest<BlogInput>(req, blogSchema);
  
  // 如果没有提供 slug，则从 title 生成
  let slug = data.slug;
  if (!slug) {
    slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  
  // 检查 slug 是否唯一
  const existingPost = await prisma.post.findUnique({ where: { slug } });
  if (existingPost) {
    slug = `${slug}-${Date.now()}`;
  }
  
  const post = await prisma.post.create({ 
    data: {
      ...data,
      slug,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      authorId: user.id
    },
    include: { author: { select: { username: true, name: true } } }
  });
  
  return createSuccessResponse({ post }, '博客创建成功');
}); 