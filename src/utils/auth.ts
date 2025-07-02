import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// 从请求中解析 JWT 并返回当前用户对象
export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    return user;
  } catch {
    return null;
  }
} 