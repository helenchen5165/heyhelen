import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 获取所有博客
export async function GET() {
  const posts = await prisma.post.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true, name: true } } }
  });
  return NextResponse.json({ posts });
}

// 新增博客
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // tags 字段如为数组需转为JSON字符串
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const post = await prisma.post.create({ data });
    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: '新增博客失败', detail: error?.message || String(error) }, { status: 500 });
  }
} 