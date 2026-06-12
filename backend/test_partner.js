require('dotenv').config();
const prisma = require('./db/prisma');

async function test() {
  const partners = await prisma.partner.findMany();
  console.log(partners.map(p => ({
    id: p.id,
    name: p.name,
    upiId: p.upiId,
    razorpayAccountId: p.razorpayAccountId,
    qrCodeLength: p.upiQrCode ? p.upiQrCode.length : 0
  })));
}
test();
