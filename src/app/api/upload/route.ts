import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { asyncHandler, createSuccessResponse, createErrorResponse } from '@/lib/error-handler';
import { ValidationError } from '@/lib/error-handler';

// 上传图片到 Cloudinary
export const POST = asyncHandler(async (req: NextRequest) => {
  await requireAuth(req);
  
  const formData = await req.formData();
  const file = formData.get('file') as File;
  
  if (!file) {
    throw new ValidationError('请选择要上传的文件');
  }

  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('只支持 JPEG、PNG、GIF、WebP 格式的图片');
  }

  // 检查文件大小 (5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new ValidationError('图片大小不能超过 5MB');
  }

  try {
    // 上传到 Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', 'heyhelen');
    uploadFormData.append('folder', 'blog');
    
    const response = await fetch('https://api.cloudinary.com/v1_1/dgkoqykcn/image/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    const data = await response.json();
    
    if (!data.secure_url) {
      throw new Error('上传失败，未获取到图片URL');
    }

    return createSuccessResponse({
      url: data.secure_url,
      publicId: data.public_id,
      filename: file.name,
      size: file.size,
      format: data.format,
      width: data.width,
      height: data.height,
    }, '图片上传成功');

  } catch (error) {
    console.error('图片上传失败:', error);
    throw new Error('图片上传失败，请重试');
  }
});