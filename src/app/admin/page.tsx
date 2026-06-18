import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function getUserFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; username: string };
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const user = await getUserFromToken();
  if (!user) {
    redirect('/login');
  }
  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">后台管理</h2>
        <nav className="flex flex-col gap-4">
          <Link href="/admin/templates" className="hover:underline">Notion模板管理</Link>
          <Link href="/admin/blog" className="hover:underline">博客管理</Link>
          <Link href="/admin/timelog" className="hover:underline">时间记录管理</Link>
          <Link href="/" className="hover:underline text-gray-400 mt-8">返回主页</Link>
        </nav>
      </aside>
      <main className="flex-1 p-12">
        <h1 className="text-3xl font-bold mb-4">欢迎，{user.username}！</h1>
        <p className="text-gray-600 mb-8">你可以在左侧管理你的 Notion 模板、博客和时间记录。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/templates" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2 text-black">模板管理</h3>
            <p className="text-gray-600">管理 Notion 模板，包括添加、编辑、删除模板</p>
          </Link>
          <Link href="/admin/blog" className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition">
            <h3 className="text-xl font-bold mb-2 text-black">博客管理</h3>
            <p className="text-gray-600">管理博客文章，包括发布、编辑、删除文章</p>
          </Link>
        </div>
      </main>
    </div>
  );
} 