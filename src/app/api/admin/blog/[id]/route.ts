import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, validateRequest, NotFoundError } from '@/lib/error-handler';
import { blogUpdateSchema } from '@/lib/validations';
import { BlogUpdateInput } from '@/lib/validations';

// 强制动态渲染
export const dynamic = 'force-dynamic';

// 获取单个博客详情（管理员专用）
export const GET = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin(req);
  
  const post = await prisma.post.findUnique({ 
    where: { id: params.id },
    include: { author: { select: { username: true, name: true } } }
  });
  
  if (!post) {
    throw new NotFoundError('博客不存在');
  }
  
  return createSuccessResponse({ post });
});

// 编辑博客
export const PUT = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin(req);
  const data = await validateRequest<BlogUpdateInput>(req, blogUpdateSchema);
  
  // 检查博客是否存在
  const existingPost = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existingPost) {
    throw new NotFoundError('博客不存在');
  }
  
  // 如果更新了 slug，检查是否唯一
  if (data.slug && data.slug !== existingPost.slug) {
    const duplicatePost = await prisma.post.findUnique({ where: { slug: data.slug } });
    if (duplicatePost) {
      data.slug = `${data.slug}-${Date.now()}`;
    }
  }
  
  // 处理tags字段：可能是字符串或数组
  let tagsArray: string[] = [];
  if (data.tags) {
    if (typeof data.tags === 'string') {
      // 如果是字符串，按逗号分割
      tagsArray = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(data.tags)) {
      // 如果是数组，直接使用
      tagsArray = data.tags;
    }
  }
  
  const post = await prisma.post.update({ 
    where: { id: params.id }, 
    data: {
      ...data,
      tags: data.tags !== undefined ? (tagsArray.length > 0 ? JSON.stringify(tagsArray) : null) : undefined
    },
    include: { author: { select: { username: true, name: true } } }
  });
  
  return createSuccessResponse({ post }, '博客更新成功');
});

// 删除博客
export const DELETE = asyncHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await requireAdmin(req);
  
  // 检查博客是否存在
  const existingPost = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existingPost) {
    throw new NotFoundError('博客不存在');
  }
  
  // 删除相关评论
  await prisma.comment.deleteMany({ where: { postId: params.id } });
  
  // 删除博客
  await prisma.post.delete({ where: { id: params.id } });
  
  return createSuccessResponse(null, '博客删除成功');
}); 