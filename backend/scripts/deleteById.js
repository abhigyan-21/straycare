require('dotenv').config();
const prisma = require('../db/prisma');

const ID = '3a4e991b-4985-47e4-93e6-2846ef12f0da';

prisma.medicalRecord.deleteMany({ where: { reportId: ID } })
  .then(() => prisma.campaign.deleteMany({ where: { reportId: ID } }))
  .then(() => prisma.pet.updateMany({ where: { reportId: ID }, data: { reportId: null } }))
  .then(() => prisma.animalReport.delete({ where: { id: ID } }))
  .then(() => { process.stdout.write('Deleted ' + ID + '\n'); process.exit(0); })
  .catch(e => { process.stderr.write(e.message + '\n'); process.exit(1); });
