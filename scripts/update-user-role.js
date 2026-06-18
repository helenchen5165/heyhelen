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

    // 更新特定用户为管理员
    const targetUserId = 'cmcmaai560000le04jtxj9ii3'; // heyhelen用户ID
    const targetUser = users.find(u => u.id === targetUserId);
    
    if (targetUser) {
      if (targetUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { role: 'ADMIN' }
        });
        
        console.log(`\n✅ Updated ${targetUser.username} to ADMIN role`);
      } else {
        console.log(`\n✅ ${targetUser.username} is already an ADMIN`);
      }
    } else {
      console.log('\n❌ Target user not found');
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