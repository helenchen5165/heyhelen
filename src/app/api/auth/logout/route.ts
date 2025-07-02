import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // 清除 token Cookie
  const response = NextResponse.json({ message: '登出成功' });
  response.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  return response;
} 