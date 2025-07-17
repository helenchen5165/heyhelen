// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  role: 'ADMIN' | 'USER';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
}

// 博客相关类型
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string;
  isPublished: boolean;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author?: {
    username: string;
    name?: string;
  };
}

export interface BlogSummary {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string;
  likeCount: number;
  createdAt: string;
  author?: {
    username: string;
    name?: string;
  };
}

// 评论相关类型
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    username: string;
    name?: string;
  };
}

// 模板相关类型
export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  imageUrl: string;
  downloadUrl: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string;
  imageUrl: string;
  downloadUrl: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
  authorId: string;
}

// 时间记录相关类型
export interface TimeLog {
  id: string;
  date: Date;
  hours: number;
  category: string;
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeLogSummary {
  date: string;
  hours: number;
  category: string;
  description?: string;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

// 认证相关类型
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
}

export interface JwtPayload {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  iat?: number;
  exp?: number;
}

// 组件 Props 类型
export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export interface TimeChartProps {
  data: TimeLogSummary[];
}

// 表单数据类型
export interface BlogFormData {
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  isPublished: boolean;
}

export interface TemplateFormData {
  title: string;
  description: string;
  category: string;
  tags: string[];
  imageUrl: string;
  downloadUrl: string;
  price: number;
  isFree: boolean;
  isPublished: boolean;
}

export interface CommentFormData {
  content: string;
  postId: string;
}

// 分页相关类型
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  tags?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}