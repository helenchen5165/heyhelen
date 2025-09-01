// 调试数据库连接的脚本
console.log('=== 数据库连接调试 ===');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
console.log('NODE_ENV:', process.env.NODE_ENV);

// 可以添加到 /api/debug 路由中测试生产环境
export default function handler(req, res) {
  res.json({
    database_url_exists: !!process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}