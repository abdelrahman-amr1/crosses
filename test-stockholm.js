process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { Client } = require("pg");

const host = "aws-0-eu-north-1.pooler.supabase.com";
const connectionString = "postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require";

async function test() {
  console.log("Connecting to Stockholm pooler on port 5432 with TLS override...");
  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log("✅ SUCCESS! Connected successfully on port 5432 with TLS override!");
    const res = await client.query("SELECT version();");
    console.log("DB version:", res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

test();
