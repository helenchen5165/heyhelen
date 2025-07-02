import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, isPublished: true },
    include: { author: { select: { username: true, name: true } } },
  });
  if (!post) {
    return NextResponse.json({ error: '未找到该文章' }, { status: 404 });
  }
  return NextResponse.json({ post });
} 