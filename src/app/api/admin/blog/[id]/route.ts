import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 编辑博客
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const post = await prisma.post.update({ where: { id: params.id }, data });
    return NextResponse.json({ post });
  } catch (error: any) {
    return NextResponse.json({ error: '编辑博客失败', detail: error?.message || String(error) }, { status: 500 });
  }
}

// 删除博客
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.post.delete({ where: { id: params.id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json({ error: '删除博客失败', detail: error?.message || String(error) }, { status: 500 });
  }
} 