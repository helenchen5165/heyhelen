import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { AuthenticationError, AuthorizationError } from './error-handler';
import { JwtPayload, User } from '@/types';

function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return JWT_SECRET;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, getJWTSecret()) as JwtPayload;
  } catch (error) {
    throw new AuthenticationError('无效的认证令牌');
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = req.cookies.get('token')?.value || 
    req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.id }
    });
    
    if (!user) {
      throw new AuthenticationError('用户不存在');
    }
    
    return {
      ...user,
      name: user.name || undefined,
      bio: user.bio || undefined,
      avatar: user.avatar || undefined,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('认证失败');
  }
}

export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  
  if (!user) {
    throw new AuthenticationError('请先登录');
  }
  
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<User> {
  const user = await requireAuth(req);
  
  if (user.role !== 'ADMIN') {
    throw new AuthorizationError('需要管理员权限');
  }
  
  return user;
}

export function createAuthCookie(token: string) {
  return {
    name: 'token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  };
}

export function createLogoutCookie() {
  return {
    name: 'token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}