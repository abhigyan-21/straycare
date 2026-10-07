const { Client } = require("pg");
const client = new Client({ connectionString: "postgresql://neondb_owner:npg_vQ3ZWxC8VJri@ep-summer-lake-amtv3des.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require" });
async function run() {
  await client.connect();
  const res = await client.query("SELECT * FROM \"Campaign\" WHERE title = 'Feeding Drive'");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
run();
