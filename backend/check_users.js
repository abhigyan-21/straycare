require('dotenv').config();
const prisma = require('./db/prisma');
async function run() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        partnerId: true,
        partner: true
      }
    });
    console.log('USERS:', JSON.stringify(users, null, 2));

    const partners = await prisma.partner.findMany();
    console.log('PARTNERS:', JSON.stringify(partners, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
