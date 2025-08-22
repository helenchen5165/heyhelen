"use client";
import { useEffect, useState } from 'react';

export default function DebugPostsPage() {
  const [adminPosts, setAdminPosts] = useState<any[]>([]);
  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      const debug: any = {};
      
      try {
        // 获取管理员博客
        console.log('🔍 正在获取管理员博客...');
        const adminRes = await fetch('/api/admin/blog', {
          credentials: 'include'
        });
        const adminData = await adminRes.json();
        
        debug.adminResponse = {
          status: adminRes.status,
          ok: adminRes.ok,
          data: adminData
        };
        
        console.log('管理员API响应:', debug.adminResponse);
        
        if (adminData.success) {
          setAdminPosts(adminData.data?.posts || []);
        }

        // 获取公开博客
        console.log('🔍 正在获取公开博客...');
        const publicRes = await fetch('/api/blog');
        const publicData = await publicRes.json();
        
        debug.publicResponse = {
          status: publicRes.status,
          ok: publicRes.ok,
          data: publicData
        };
        
        console.log('公开API响应:', debug.publicResponse);
        
        if (publicData.success) {
          setPublicPosts(publicData.data?.posts || []);
        }
        
        // 数据库直接查询测试
        console.log('🔍 测试数据库查询...');
        const dbTestRes = await fetch('/api/debug/posts');
        if (dbTestRes.ok) {
          const dbTestData = await dbTestRes.json();
          debug.dbTest = dbTestData;
          console.log('数据库测试结果:', debug.dbTest);
        }
        
        setDebugInfo(debug);
      } catch (error) {
        console.error('获取数据失败:', error);
        debug.error = error instanceof Error ? error.message : String(error);
        setDebugInfo(debug);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">博客文章状态调试</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 管理员视图 */}
        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-blue-800">
            管理员视图 ({adminPosts.length} 篇文章)
          </h2>
          <div className="space-y-3">
            {adminPosts.map((post, index) => (
              <div key={post.id} className="bg-white p-4 rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm">{post.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      post.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {post.isPublished ? '已发布' : '未发布'}
                    </span>
                    {!post.isPublished && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/admin/blog/${post.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isPublished: true }),
                              credentials: 'include'
                            });
                            if (res.ok) {
                              window.location.reload();
                            }
                          } catch (error) {
                            alert('发布失败');
                          }
                        }}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        快速发布
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <div>Slug: {post.slug}</div>
                  <div>创建: {new Date(post.createdAt).toLocaleString()}</div>
                  <div>作者: {post.author?.name || post.author?.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 公开视图 */}
        <div className="bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-green-800">
            公开视图 ({publicPosts.length} 篇文章)
          </h2>
          <div className="space-y-3">
            {publicPosts.length === 0 ? (
              <div className="bg-yellow-100 p-4 rounded border text-yellow-800">
                ❌ 没有找到已发布的文章
              </div>
            ) : (
              publicPosts.map((post, index) => (
                <div key={post.id} className="bg-white p-4 rounded border">
                  <h3 className="font-semibold text-sm mb-2">{post.title}</h3>
                  <div className="text-xs text-gray-600">
                    <div>Slug: {post.slug}</div>
                    <div>创建: {new Date(post.createdAt).toLocaleString()}</div>
                    <div>作者: {post.author?.name || post.author?.username}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 问题诊断 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">问题诊断</h2>
        <div className="space-y-2 text-sm">
          <div>管理员能看到的文章数：{adminPosts.length}</div>
          <div>公开能看到的文章数：{publicPosts.length}</div>
          <div>已发布文章数：{adminPosts.filter(p => p.isPublished).length}</div>
          <div>未发布文章数：{adminPosts.filter(p => !p.isPublished).length}</div>
          
          {adminPosts.length > 0 && publicPosts.length === 0 && (
            <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
              ⚠️ 检测到问题：管理员有文章但公开页面看不到
              <br />
              可能原因：
              <ul className="list-disc list-inside mt-2">
                <li>API响应格式不一致</li>
                <li>数据库查询条件问题</li>
                <li>缓存问题</li>
                <li>前端数据处理问题</li>
              </ul>
            </div>
          )}

          {/* 详细调试信息 */}
          {debugInfo.adminResponse && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <h3 className="font-bold text-blue-800">管理员API调试信息：</h3>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify(debugInfo.adminResponse, null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.publicResponse && (
            <div className="mt-4 p-3 bg-green-50 rounded">
              <h3 className="font-bold text-green-800">公开API调试信息：</h3>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify(debugInfo.publicResponse, null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.dbTest && (
            <div className="mt-4 p-3 bg-purple-50 rounded">
              <h3 className="font-bold text-purple-800">数据库直接查询结果：</h3>
              <div className="text-xs mt-2">
                <div>数据库连接：{debugInfo.dbTest.data?.dbConnection}</div>
                <div>总文章数：{debugInfo.dbTest.data?.totalPosts}</div>
                <div>已发布文章数：{debugInfo.dbTest.data?.publishedPosts}</div>
                <div>未发布文章数：{debugInfo.dbTest.data?.unpublishedPosts}</div>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer font-medium">查看详细数据</summary>
                <pre className="text-xs mt-2 overflow-x-auto bg-white p-2 rounded">
                  {JSON.stringify(debugInfo.dbTest, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* 手动刷新按钮 */}
      <div className="mt-4 text-center">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新数据
        </button>
      </div>
    </div>
  );
}