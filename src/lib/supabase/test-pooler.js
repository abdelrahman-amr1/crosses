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

async function testConnection() {
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@${host}:5432/postgres`;
    
    console.log(`🔌 Testing region: ${region} (${host})...`);
    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`🎯 SUCCESS! Connected to region: ${region}`);
      
      const res = await client.query("SELECT version();");
      console.log("SQL Output:", res.rows[0].version);
      
      await client.end();
      return host; 
    } catch (err) {
      console.log(`❌ ${region}: ${err.message}`);
    }
  }
  console.log("😢 Could not connect to any pooler region.");
  return null;
}

testConnection();
