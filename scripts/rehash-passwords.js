const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function rehashPasswords() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  const users = await prisma.users.findMany({
    select: { id: true, email: true },
  });

  console.log(`Updating password hash for ${users.length} users...`);

  for (const user of users) {
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword, updated_at: new Date() },
    });
    console.log(`  Updated: ${user.email}`);
  }

  console.log(`\nDone! All ${users.length} users now have password: ${password}`);
}

rehashPasswords()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
