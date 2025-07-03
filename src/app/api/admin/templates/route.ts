import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/utils/auth';

const prisma = new PrismaClient();

// 获取所有模板
export async function GET() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ templates });
}

// 新增模板
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '未登录，无法新增模板' }, { status: 401 });
    }
    const data = await req.json();
    // tags 字段如为数组需转为JSON字符串
    if (Array.isArray(data.tags)) data.tags = JSON.stringify(data.tags);
    const tpl = await prisma.template.create({
      data: {
        ...data,
        author: { connect: { id: user.id } },
      },
    });
    return NextResponse.json({ template: tpl });
  } catch (error: unknown) {
    return NextResponse.json({ error: '新增模板失败', detail: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 