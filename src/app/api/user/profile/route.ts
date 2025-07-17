import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

// 获取当前用户信息
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        name: true, 
        avatar: true, 
        bio: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!dbUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }
    
    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}

// 更新当前用户信息
export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 });
    }
    
    const { avatar, name, bio } = await req.json();
    
    const dbUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        avatar: avatar || null, 
        name: name || null, 
        bio: bio || null 
      },
      select: { 
        id: true, 
        username: true, 
        email: true, 
        name: true, 
        avatar: true, 
        bio: true,
        role: true,
        createdAt: true
      }
    });
    
    return NextResponse.json({ user: dbUser, message: '更新成功' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: '更新用户信息失败' }, { status: 500 });
  }
} 