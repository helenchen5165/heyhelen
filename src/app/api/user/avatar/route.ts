import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { asyncHandler, createSuccessResponse, createErrorResponse } from '@/lib/error-handler';
import { ValidationError } from '@/lib/error-handler';

// 上传用户头像
export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new ValidationError('请选择要上传的头像');
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('只支持 JPEG、PNG、GIF、WebP 格式的图片');
  }

  // 检查文件大小 (2MB for avatar)
  if (file.size > 2 * 1024 * 1024) {
    throw new ValidationError('头像大小不能超过 2MB');
  }

  try {
    // 上传到 Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', 'heyhelen');
    uploadFormData.append('folder', 'avatars');
    // 头像裁剪为正方形
    uploadFormData.append('transformation', 'c_fill,w_400,h_400,g_face');
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('头像上传失败');
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('上传失败，未获取到头像URL');
    }

    // 更新用户头像
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: data.secure_url },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        bio: true
      }
    });

    return createSuccessResponse({
      url: data.secure_url,
      user: updatedUser
    }, '头像上传成功');

  } catch (error) {
    console.error('头像上传失败:', error);
    throw new Error('头像上传失败，请重试');
  }
});

// 获取用户信息（包括头像）
export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireAuth(req);
  
  const userInfo = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      role: true,
      createdAt: true
    }
  });

  if (!userInfo) {
    throw new ValidationError('用户不存在');
  }

  return createSuccessResponse({ user: userInfo });
});