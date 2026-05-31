const { Client } = require("pg");

const host = "aws-1-eu-north-1.pooler.supabase.com";
const port = 5432;
// Connection string WITHOUT sslmode=require
const connectionString = `postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@${host}:${port}/postgres`;

async function test() {
  console.log("Connecting without sslmode in URL but with ssl: { rejectUnauthorized: false } object...");
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log("✅ SUCCESS! Connected successfully!");
    const res = await client.query("SELECT NOW();");
    console.log("Result:", res.rows[0]);
    await client.end();
  } catch (err) {
    console.error("❌ Failed:", err.message);
  }
}

test();
