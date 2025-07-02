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
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
  } catch {
    return null;
  }
}

// 删除评论
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!comment) {
      return NextResponse.json({ error: '评论不存在' }, { status: 404 });
    }

    // 只有评论作者或管理员可以删除
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无权限删除此评论' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: unknown) {
    return NextResponse.json({ error: '删除评论失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 