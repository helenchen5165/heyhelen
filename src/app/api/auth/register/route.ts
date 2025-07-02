import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, name } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }
    // 检查用户名或邮箱是否已存在
    const exist = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });
    if (exist) {
      return NextResponse.json({ error: '用户名或邮箱已存在' }, { status: 409 });
    }
    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
      },
    });
    return NextResponse.json({ message: '注册成功', user: { id: user.id, username: user.username, email: user.email } });
  } catch (error: any) {
    return NextResponse.json({ error: '注册失败', detail: error?.message || String(error) }, { status: 500 });
  }
} 