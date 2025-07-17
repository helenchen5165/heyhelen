const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateUserRole() {
  try {
    // 获取所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    console.log('Current users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}): ${user.role}`);
    });

    // 更新第一个用户为管理员（通常是注册的第一个用户）
    if (users.length > 0) {
      const firstUser = users[0];
      
      if (firstUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: firstUser.id },
          data: { role: 'ADMIN' }
        });
        
        console.log(`\n✅ Updated ${firstUser.username} to ADMIN role`);
      } else {
        console.log(`\n✅ ${firstUser.username} is already an ADMIN`);
      }
    }

    // 或者，如果你知道具体的用户名，可以直接更新
    // const targetUsername = 'your-username-here';
    // await prisma.user.update({
    //   where: { username: targetUsername },
    //   data: { role: 'ADMIN' }
    // });

  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserRole();