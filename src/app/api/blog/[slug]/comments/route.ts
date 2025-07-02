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

// 获取评论
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/')[4]; // /api/blog/[slug]/comments
    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, name: true } } }
    });

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    return NextResponse.json({ error: '获取评论失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 发表评论
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = url.pathname.split('/')[4];
    const user = await getUserFromToken();
    if (!user) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { slug } });
    if (!post) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: { content: content.trim(), userId: user.id, postId: post.id },
      include: { user: { select: { username: true, name: true } } }
    });

    return NextResponse.json({ comment });
  } catch (error: unknown) {
    return NextResponse.json({ error: '发表评论失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 