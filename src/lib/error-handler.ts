import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError, ApiResponse } from '@/types';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = '输入数据验证失败') {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '身份验证失败') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
  }
}

export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Zod 验证错误
  if (error instanceof ZodError) {
    const validationErrors = error.issues.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return NextResponse.json({
      success: false,
      error: '输入数据验证失败',
      details: validationErrors,
    } as ApiResponse, { status: 400 });
  }

  // 自定义应用错误
  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: error.message,
    } as ApiResponse, { status: error.statusCode });
  }

  // Prisma 错误
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; message: string };
    
    switch (prismaError.code) {
      case 'P2002':
        return NextResponse.json({
          success: false,
          error: '数据已存在，请检查重复字段',
        } as ApiResponse, { status: 409 });
      case 'P2025':
        return NextResponse.json({
          success: false,
          error: '记录未找到',
        } as ApiResponse, { status: 404 });
      default:
        return NextResponse.json({
          success: false,
          error: '数据库操作失败',
        } as ApiResponse, { status: 500 });
    }
  }

  // 其他未知错误
  return NextResponse.json({
    success: false,
    error: '服务器内部错误',
    message: error instanceof Error ? error.message : '未知错误',
  } as ApiResponse, { status: 500 });
}

export function createSuccessResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message,
  } as ApiResponse<T>);
}

export function createErrorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error,
  } as ApiResponse, { status });
}

// 异步错误处理包装器
export function asyncHandler(
  fn: (req: any, params?: any) => Promise<NextResponse>
) {
  return async (req: any, params?: any): Promise<NextResponse> => {
    try {
      return await fn(req, params);
    } catch (error) {
      return handleError(error);
    }
  };
}

// 验证请求体的辅助函数
export async function validateRequest<T>(
  req: Request,
  schema: any
): Promise<T> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new ValidationError('请求体格式错误');
  }
}

// 验证 URL 参数的辅助函数
export function validateParams<T>(
  params: any,
  schema: any
): T {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new ValidationError('URL 参数格式错误');
  }
}

// 验证查询参数的辅助函数
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: any
): T {
  try {
    const query = Object.fromEntries(searchParams.entries());
    
    // 处理数组类型的查询参数
    Object.keys(query).forEach(key => {
      if (key === 'tags' && query[key]) {
        (query as any)[key] = (query[key] as string).split(',');
      }
      if (key === 'page' || key === 'limit') {
        (query as any)[key] = Number(query[key]);
      }
    });
    
    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      throw error;
    }
    throw new ValidationError('查询参数格式错误');
  }
}