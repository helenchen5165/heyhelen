import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { createSuccessResponse } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return Response.json({
        success: false,
        error: '用户未登录',
        token: req.cookies.get('token')?.value ? '有token' : '无token',
        authHeader: req.headers.get('Authorization') ? '有Authorization头' : '无Authorization头'
      });
    }
    
    return createSuccessResponse({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      },
      token: req.cookies.get('token')?.value ? '有token' : '无token',
      authHeader: req.headers.get('Authorization') ? '有Authorization头' : '无Authorization头'
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      token: req.cookies.get('token')?.value ? '有token' : '无token',
      authHeader: req.headers.get('Authorization') ? '有Authorization头' : '无Authorization头'
    });
  }
}