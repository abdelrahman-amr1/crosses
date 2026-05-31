const { Client } = require("pg");

const connectionString = "postgres://postgres:ilVhbRS2vOEE1NTa@[2a05:d016:2b6:b301:b5d6:f46b:a4cc:f967]:5432/postgres";

async function test() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log("Connecting directly via IPv6 address...");
    await client.connect();
    console.log("✅ Success! Connected directly to Supabase via IPv6.");
    const res = await client.query("SELECT version();");
    console.log(res.rows[0].version);
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

test();
