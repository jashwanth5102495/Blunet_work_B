import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🔄 Updating Punith employee joining date to 21/09/2026...');
  
  const targetDate = new Date('2026-09-21T00:00:00.000Z');

  const updatedUsers = await db.user.updateMany({
    where: {
      OR: [
        { employeeId: { equals: 'EMP1022' } },
        { email: { equals: 'punith@blunet.com' } },
        { name: { contains: 'Punith' } },
      ],
    },
    data: {
      joiningDate: targetDate,
    },
  });

  console.log(`✅ Updated ${updatedUsers.count} record(s) for Punith with joining date 21/09/2026.`);
}

main()
  .catch((e) => {
    console.error('❌ Update failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
