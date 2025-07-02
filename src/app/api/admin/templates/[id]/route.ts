import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 编辑模板
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const tpl = await prisma.template.update({ where: { id: params.id }, data });
    return NextResponse.json({ template: tpl });
  } catch (error: any) {
    return NextResponse.json({ error: '编辑模板失败', detail: error?.message || String(error) }, { status: 500 });
  }
}

// 删除模板
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.template.delete({ where: { id: params.id } });
    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    return NextResponse.json({ error: '删除模板失败', detail: error?.message || String(error) }, { status: 500 });
  }
} 