import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.pathname.split('/')[4]; // /api/blog/[slug]
  const post = await prisma.post.findUnique({
    where: { slug, isPublished: true },
    include: { author: { select: { username: true, name: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: '未找到该文章' }, { status: 404 });
  }
  return NextResponse.json({ post });
} 