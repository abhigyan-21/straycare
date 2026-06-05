require('dotenv').config();
const prisma = require('./db/prisma');

async function deleteUser() {
  try {
    const deleted = await prisma.user.deleteMany({
      where: { email: 'raishreyansh4579@gmail.com' }
    });
    console.log('Deleted user(s):', deleted);
  } catch (error) {
    console.error('Delete failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
