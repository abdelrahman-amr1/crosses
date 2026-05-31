const { Client } = require("pg");

const host = "aws-0-eu-north-1.pooler.supabase.com";
const port = 5432;

async function test() {
  const client = new Client({
    host: host,
    port: port,
    user: "postgres.vidahzporaivvfurnesx",
    password: "ilVhbRS2vOEE1NTa",
    database: "postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    
    // Access the TLS socket to inspect the certificate
    const stream = client.connection.stream;
    if (stream && typeof stream.getPeerCertificate === "function") {
      const cert = stream.getPeerCertificate(true);
      console.log("Certificate subject:", cert.subject);
      console.log("Certificate issuer:", cert.issuer);
      if (cert.issuerCertificate) {
        console.log("Issuer cert subject:", cert.issuerCertificate.subject);
        console.log("Issuer cert issuer:", cert.issuerCertificate.issuer);
      }
    }
    await client.end();
  } catch (err) {
    console.error("❌ Connection failed inside pg client:", err);
  }
}

test();
