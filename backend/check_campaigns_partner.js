require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({ include: { partner: true } });
  console.log(JSON.stringify(campaigns.map(c => ({ id: c.id, title: c.title, partnerId: c.partnerId })), null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
