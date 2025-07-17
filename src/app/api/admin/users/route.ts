import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, validateRequest } from '@/lib/error-handler';
import { z } from 'zod';

// 获取所有用户（管理员专用）
export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          templates: true,
          timeRecords: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  return createSuccessResponse({ users });
});

// 更新用户角色
const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['ADMIN', 'USER'])
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  await requireAdmin(req);
  const data = await validateRequest(req, updateRoleSchema);
  
  const user = await prisma.user.update({
    where: { id: data.userId },
    data: { role: data.role },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true
    }
  });
  
  return createSuccessResponse({ user }, '用户角色更新成功');
});