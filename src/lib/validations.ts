import { z } from 'zod';

// 认证相关验证
export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50, '用户名不能超过50个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100, '密码不能超过100个字符'),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名不能超过50个字符')
    .regex(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线'),
  email: z.string().email('请输入有效的邮箱地址').max(100, '邮箱地址不能超过100个字符'),
  password: z.string()
    .min(6, '密码至少6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, '密码必须包含至少一个字母和一个数字'),
  name: z.string().max(100, '姓名不能超过100个字符').optional(),
});

// 博客相关验证
export const blogSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  slug: z.string().min(1, 'Slug不能为空').max(200, 'Slug不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').max(100000, '内容不能超过100000个字符'),
  excerpt: z.string().max(500, '摘要不能超过500个字符').optional(),
  coverImage: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  category: z.string().max(50, '分类不能超过50个字符').optional(),
  tags: z.union([
    z.array(z.string().max(50, '标签不能超过50个字符')).max(10, '最多10个标签'),
    z.string().max(500, '标签字符串不能超过500个字符')
  ]).optional(),
  isPublished: z.boolean(),
});

export const blogUpdateSchema = blogSchema.partial();

export const blogSlugSchema = z.object({
  slug: z.string().min(1, 'Slug不能为空').max(200, 'Slug不能超过200个字符'),
});

// 评论相关验证
export const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论不能超过1000个字符'),
  postId: z.string().uuid('无效的文章ID'),
});

export const commentUpdateSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000, '评论不能超过1000个字符'),
});

// 模板相关验证
export const templateSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  description: z.string().min(10, '描述至少10个字符').max(1000, '描述不能超过1000个字符'),
  category: z.string().min(1, '分类不能为空').max(50, '分类不能超过50个字符'),
  tags: z.array(z.string().max(50, '标签不能超过50个字符')).max(10, '最多10个标签'),
  imageUrl: z.string().url('请输入有效的图片URL'),
  downloadUrl: z.string().url('请输入有效的下载URL'),
  price: z.number().min(0, '价格不能为负数').max(9999.99, '价格不能超过9999.99'),
  isFree: z.boolean(),
  isPublished: z.boolean(),
});

export const templateUpdateSchema = templateSchema.partial();

// 用户资料相关验证
export const userProfileSchema = z.object({
  name: z.string().max(100, '姓名不能超过100个字符').optional(),
  bio: z.string().max(500, '简介不能超过500个字符').optional(),
  avatar: z.string().url('请输入有效的头像URL').optional().or(z.literal('')),
});

// 时间记录相关验证
export const timeLogSchema = z.object({
  date: z.string().datetime('请输入有效的日期时间'),
  hours: z.number().min(0.1, '时间不能少于0.1小时').max(24, '时间不能超过24小时'),
  category: z.string().min(1, '分类不能为空').max(50, '分类不能超过50个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
});

// 分页相关验证
export const paginationSchema = z.object({
  page: z.number().int().min(1, '页码必须大于0').optional().default(1),
  limit: z.number().int().min(1, '每页数量必须大于0').max(100, '每页数量不能超过100').optional().default(10),
  search: z.string().max(100, '搜索关键词不能超过100个字符').optional(),
  category: z.string().max(50, '分类不能超过50个字符').optional(),
  tags: z.array(z.string().max(50, '标签不能超过50个字符')).optional(),
});

// ID 验证
export const idSchema = z.object({
  id: z.string().uuid('无效的ID格式'),
});

// 博客点赞验证
export const blogLikeSchema = z.object({
  postId: z.string().uuid('无效的文章ID'),
});

// 类型推断
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type BlogUpdateInput = z.infer<typeof blogUpdateSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type CommentUpdateInput = z.infer<typeof commentUpdateSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type TimeLogInput = z.infer<typeof timeLogSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdInput = z.infer<typeof idSchema>;
export type BlogLikeInput = z.infer<typeof blogLikeSchema>;