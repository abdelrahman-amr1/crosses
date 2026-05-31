const tls = require("tls");
const originalConnect = tls.connect;

// Monkeypatch tls.connect to force rejectUnauthorized: false
tls.connect = function(options, callback) {
  if (options) {
    options.rejectUnauthorized = false;
  }
  return originalConnect.call(tls, options, callback);
};

const { Client } = require("pg");

const regions = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2",
  "eu-west-3", "eu-north-1", "ap-south-1", "ap-southeast-1",
  "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "sa-east-1"
];

const ports = [5432, 6543];

async function testAll() {
  console.log("Starting exhaustive check with connectionString + monkeypatch...");
  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const port of ports) {
      const connectionString = `postgres://postgres.vidahzporaivvfurnesx:ilVhbRS2vOEE1NTa@${host}:${port}/postgres?sslmode=require`;
      const client = new Client({
        connectionString: connectionString,
        connectionTimeoutMillis: 2500
      });
      try {
        await client.connect();
        console.log(`🎯🎯 SUCCESS! Connected to ${region}:${port}`);
        const res = await client.query("SELECT NOW();");
        console.log("Result:", res.rows[0]);
        await client.end();
        return;
      } catch (err) {
        console.log(`❌ ${region}:${port} -> ${err.message}`);
      }
    }
  }
  console.log("Finished check. None succeeded.");
}

testAll();
