const prisma = require("./db/prisma");
async function run() {
  try {
    const expiredCampaigns = await prisma.campaign.updateMany({
      where: {
        status: { in: ["ACTIVE", "ENDING_SOON"] },
        deadline: { lt: new Date() }
      },
      data: {
        status: "EXPIRED"
      }
    });
    console.log("Updated count:", expiredCampaigns.count);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
