const { Client } = require("pg");

const regions = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ap-northeast-2",
  "sa-east-1",
];

const ports = [6543, 5432];

async function testConnection() {
  for (const region of regions) {
    for (const port of ports) {
      const host = `aws-0-${region}.pooler.supabase.com`;
      const connectionString = `postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@${host}:${port}/postgres`;
      
      console.log(`🔌 Testing: ${region} on port ${port}...`);
      const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 2000
      });

      try {
        await client.connect();
        console.log(`🎯 TARGET FOUND! Connected to region: ${region} on port ${port}`);
        
        const res = await client.query("SELECT version();");
        console.log("Database version:", res.rows[0].version);
        
        await client.end();
        return { host, port };
      } catch (err) {
        // Log details if it's NOT a DNS error or generic "Tenant not found" to find promising leads
        const errMsg = err.message;
        if (!errMsg.includes("Tenant or user not found") && !errMsg.includes("postgres.vidahzporaivvfurnesx not found") && !errMsg.includes("ENOTFOUND")) {
          console.log(`⭐ promising response from ${region}:${port} - ${errMsg}`);
        } else {
          console.log(`❌ ${region}:${port} - ${errMsg}`);
        }
      }
    }
  }
  console.log("😢 Could not connect to any pooler region/port.");
  return null;
}

testConnection();
