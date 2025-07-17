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
    // 生成更好的slug：移除中文字符，保留英文和数字
    slug = data.title
      .toLowerCase()
      .replace(/[\u4e00-\u9fff]/g, '') // 移除中文字符
      .replace(/[^a-z0-9]+/g, '-') // 替换非字母数字为连字符
      .replace(/^-+|-+$/g, '') // 移除首尾连字符
      .substring(0, 50); // 限制长度
    
    // 如果slug为空（全是中文），则使用时间戳
    if (!slug) {
      slug = `post-${Date.now()}`;
    }
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