import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 创建一个测试用户
  const user = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'testuser@example.com',
      password: '$2a$10$testtesttesttesttesttesttesttesttesttesttesttesttesttest', // 伪加密
      name: '测试用户',
    },
  });

  // 批量创建模板
  await prisma.template.createMany({
    data: [
      {
        title: '高效学习计划',
        description: '适合学生和自学者的 Notion 学习计划模板',
        category: '学习',
        tags: JSON.stringify(['学习', '计划', '自律']),
        imageUrl: 'https://notion.so/images/study-template.jpg',
        downloadUrl: 'https://notion.so/template1',
        price: 0,
        isFree: true,
        isPublished: true,
        authorId: user.id,
      },
      {
        title: '工作任务管理',
        description: '帮助你高效管理每日工作任务',
        category: '工作',
        tags: JSON.stringify(['工作', '任务', '效率']),
        imageUrl: 'https://notion.so/images/work-template.jpg',
        downloadUrl: 'https://notion.so/template2',
        price: 9.9,
        isFree: false,
        isPublished: true,
        authorId: user.id,
      },
      {
        title: '生活习惯打卡',
        description: '养成好习惯的 Notion 打卡模板',
        category: '生活',
        tags: JSON.stringify(['生活', '习惯', '健康']),
        imageUrl: 'https://notion.so/images/habit-template.jpg',
        downloadUrl: 'https://notion.so/template3',
        price: 0,
        isFree: true,
        isPublished: true,
        authorId: user.id,
      },
    ],
  });

  // 创建测试博客
  const blog1 = await prisma.post.create({
    data: {
      title: '我的 Notion 使用心得',
      slug: 'my-notion-experience',
      content: '<h2>引言</h2><p>Notion 是我最喜欢的生产力工具之一...</p><h2>核心功能</h2><p>1. 数据库功能强大<br>2. 模板系统完善<br>3. 协作体验优秀</p>',
      excerpt: '分享我使用 Notion 的心得体会，包括核心功能、使用技巧和最佳实践。',
      coverImage: 'https://notion.so/images/blog1.jpg',
      tags: JSON.stringify(['Notion', '生产力', '工具']),
      isPublished: true,
      likeCount: 15,
      authorId: user.id,
    },
  });

  const blog2 = await prisma.post.create({
    data: {
      title: '如何建立个人知识管理系统',
      slug: 'personal-knowledge-management',
      content: '<h2>什么是 PKM</h2><p>个人知识管理（Personal Knowledge Management）...</p><h2>实施步骤</h2><p>1. 收集信息<br>2. 整理分类<br>3. 定期回顾</p>',
      excerpt: '详细介绍如何建立有效的个人知识管理系统，提升学习和工作效率。',
      coverImage: 'https://notion.so/images/blog2.jpg',
      tags: JSON.stringify(['知识管理', '学习', '效率']),
      isPublished: true,
      likeCount: 8,
      authorId: user.id,
    },
  });

  // 创建测试评论
  await prisma.comment.createMany({
    data: [
      {
        content: '非常实用的分享，感谢！',
        userId: user.id,
        postId: blog1.id,
      },
      {
        content: '我也在使用 Notion，确实很好用',
        userId: user.id,
        postId: blog1.id,
      },
      {
        content: 'PKM 系统确实很重要，学到了很多',
        userId: user.id,
        postId: blog2.id,
      },
    ],
  });
}

main().then(() => {
  console.log('🌱 测试模板数据已导入');
  prisma.$disconnect();
}); 