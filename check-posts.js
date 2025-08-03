// 检查博客文章状态的调试脚本
// 请在浏览器控制台运行以下代码：

console.log('=== 检查管理员博客API ===');
fetch('/api/admin/blog', {
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('管理员API响应:', data);
  if (data.success && data.data?.posts) {
    console.log(`找到 ${data.data.posts.length} 篇文章:`);
    data.data.posts.forEach((post, index) => {
      console.log(`${index + 1}. 标题: "${post.title}"`);
      console.log(`   发布状态: ${post.isPublished ? '✅ 已发布' : '❌ 未发布'}`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   创建时间: ${post.createdAt}`);
      console.log('---');
    });
  }
})
.catch(err => console.error('管理员API错误:', err));

console.log('=== 检查公开博客API ===');
fetch('/api/blog')
.then(res => res.json())
.then(data => {
  console.log('公开API响应:', data);
  if (data.success && data.data?.posts) {
    console.log(`找到 ${data.data.posts.length} 篇已发布文章:`);
    data.data.posts.forEach((post, index) => {
      console.log(`${index + 1}. 标题: "${post.title}"`);
      console.log(`   Slug: ${post.slug}`);
      console.log(`   创建时间: ${post.createdAt}`);
      console.log('---');
    });
  } else {
    console.log('❌ 公开API没有返回文章');
  }
})
.catch(err => console.error('公开API错误:', err));