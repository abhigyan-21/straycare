require('dotenv').config();
const prisma = require('../db/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    const email = 'furzo.app@gmail.com';
    const password = 'furzo_app@211';
    const phone = '9999999999';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
        isEmailVerified: true,
        isPhoneVerified: true,
        status: 'Active'
      },
      create: {
        name: 'System Administrator',
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        isPhoneVerified: true,
        status: 'Active'
      }
    });

    console.log('Seeded Admin User successfully:', user);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
