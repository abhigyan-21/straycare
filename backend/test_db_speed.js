require('dotenv').config();
const prisma = require('./db/prisma');

async function test() {
  console.log('Testing DB lookup...');
  const start = Date.now();
  try {
    const user = await prisma.user.findFirst();
    console.log(`DB query took ${Date.now() - start}ms`);
  } catch (error) {
    console.error('DB query failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
