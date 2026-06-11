const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const campaigns = await prisma.campaign.findMany();
    console.log(campaigns.length, 'campaigns found.');
    campaigns.forEach((c, i) => console.log(i, c.title, c.id));
}

main().catch(console.error).finally(() => prisma.$disconnect());
