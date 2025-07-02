import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/utils/auth'; // 需实现：从请求中获取当前登录用户

const prisma = new PrismaClient();

// 获取当前用户信息
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, username: true, email: true, name: true, avatar: true, bio: true }
  });
  return NextResponse.json({ user: dbUser });
}

// 更新当前用户信息
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const { avatar, name, bio } = await req.json();
  const dbUser = await prisma.user.update({
    where: { id: user.id },
    data: { avatar, name, bio },
    select: { id: true, username: true, email: true, name: true, avatar: true, bio: true }
  });
  return NextResponse.json({ user: dbUser, message: '更新成功' });
} 