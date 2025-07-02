import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 编辑博客
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    const data = await req.json();
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const post = await prisma.post.update({ where: { id }, data });
    return NextResponse.json({ post });
  } catch (error: unknown) {
    return NextResponse.json({ error: '编辑博客失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 删除博客
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: unknown) {
    return NextResponse.json({ error: '删除博客失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 