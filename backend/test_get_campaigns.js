require('dotenv').config();
const prisma = require('./db/prisma');

async function test() {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      include: {
        partner: true,
        creator: { select: { name: true } },
        volunteers: {
          include: {
            user: { select: { name: true } }
          }
        },
        donations: {
          where: {
            status: { in: ['SELF_REPORTED', 'WEBHOOK_VERIFIED'] }
          },
          select: {
            id: true,
            status: true,
            createdAt: true,
            user: { select: { name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    console.log("Success! Campaigns found:", campaigns.length);
  } catch (err) {
    console.error("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
