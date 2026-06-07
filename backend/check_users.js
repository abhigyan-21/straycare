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
        clinicId: true,
        clinic: true
      }
    });
    console.log('USERS:', JSON.stringify(users, null, 2));

    const clinics = await prisma.clinic.findMany();
    console.log('CLINICS:', JSON.stringify(clinics, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
run();
