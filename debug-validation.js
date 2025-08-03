// 调试脚本：测试博客数据验证
const { z } = require('zod');

// 复制验证schema
const blogSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
  slug: z.string().min(1, 'Slug不能为空').max(200, 'Slug不能超过200个字符').optional(),
  content: z.string().min(1, '内容不能为空').max(100000, '内容不能超过100000个字符'),
  excerpt: z.string().max(500, '摘要不能超过500个字符').optional(),
  coverImage: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  tags: z.union([
    z.array(z.string().max(50, '标签不能超过50个字符')).max(10, '最多10个标签'),
    z.string().max(500, '标签字符串不能超过500个字符')
  ]).optional(),
  isPublished: z.boolean(),
});

// 测试数据 - 你的博客内容的简化版本
const testData = {
  title: "2024年复盘：欢迎来到伊利里亚",
  content: `<p>一对兄妹遭遇风暴沉船，妹妹维奥拉幸存，被沖上伊利里亚（Illyria）的海岸。</p><p>维奥拉在沙滩上睁开眼睛，发现周围全都是碎片...</p>`,
  excerpt: "2024年复盘，记录在伊利里亚的成长与思考",
  tags: ["Yearly"],
  isPublished: true,
  coverImage: ""
};

console.log('开始验证测试数据...');
console.log('数据预览:', {
  title: testData.title,
  contentLength: testData.content.length,
  excerptLength: testData.excerpt?.length,
  tags: testData.tags,
  isPublished: testData.isPublished,
  coverImage: testData.coverImage
});

try {
  const result = blogSchema.parse(testData);
  console.log('✅ 验证成功!');
  console.log('验证结果:', result);
} catch (error) {
  console.log('❌ 验证失败!');
  console.log('错误详情:', error.errors || error.message);
  
  if (error.errors) {
    error.errors.forEach((err, index) => {
      console.log(`错误 ${index + 1}:`);
      console.log(`  路径: ${err.path.join('.')}`);
      console.log(`  消息: ${err.message}`);
      console.log(`  代码: ${err.code}`);
      if (err.received !== undefined) {
        console.log(`  接收到: ${err.received}`);
      }
    });
  }
}

// 测试各个字段的长度限制
console.log('\n=== 字段长度检查 ===');
console.log(`标题长度: ${testData.title.length}/200`);
console.log(`内容长度: ${testData.content.length}/100000`);
console.log(`摘要长度: ${testData.excerpt?.length || 0}/500`);
console.log(`标签数量: ${testData.tags?.length || 0}/10`);

if (testData.tags) {
  testData.tags.forEach((tag, index) => {
    console.log(`标签 ${index + 1} 长度: ${tag.length}/50 - "${tag}"`);
  });
}