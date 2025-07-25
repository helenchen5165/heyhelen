import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 编辑模板
export async function PUT(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    const data = await req.json();
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const template = await prisma.template.update({ where: { id }, data });
    return NextResponse.json({ template });
  } catch (error: unknown) {
    return NextResponse.json({ error: '编辑模板失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 删除模板
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split('/').pop()!;
    await prisma.template.delete({ where: { id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: unknown) {
    return NextResponse.json({ error: '删除模板失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 