import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { generateToken, createAuthCookie } from '@/lib/auth';
import { asyncHandler, validateRequest, createSuccessResponse } from '@/lib/error-handler';
import { loginSchema } from '@/lib/validations';
import { AuthenticationError, NotFoundError } from '@/lib/error-handler';

export const POST = asyncHandler(async (req: NextRequest) => {
  const { username, password } = await validateRequest<{username: string; password: string}>(req, loginSchema);
  
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    throw new NotFoundError('用户不存在');
  }
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AuthenticationError('密码错误');
  }
  
  // 生成 JWT
  const token = generateToken({
    id: user.id,
    username: user.username,
    role: user.role
  });
  
  // 设置 Cookie
  const response = createSuccessResponse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role
    }
  }, '登录成功');
  
  const cookieOptions = createAuthCookie(token);
  response.cookies.set(cookieOptions);
  
  return response;
}); 