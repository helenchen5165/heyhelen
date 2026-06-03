import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    // 检查是否已点赞
    const existingLike = await prisma.like.findUnique({
      where: { userId_postId: { userId: user.id, postId } }
    });

    if (existingLike) {
      // 取消点赞
      await prisma.like.delete({ where: { id: existingLike.id } });
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { decrement: 1 } }
      });
      return NextResponse.json({ liked: false, message: '取消点赞成功' });
    } else {
      // 点赞
      await prisma.like.create({
        data: { userId: user.id, postId }
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } }
      });
      return NextResponse.json({ liked: true, message: '点赞成功' });
    }
  } catch (error: any) {
    return NextResponse.json({ error: '操作失败', detail: error?.message || String(error) }, { status: 500 });
  }
} 