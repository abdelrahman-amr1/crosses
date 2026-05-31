const fs = require("fs");
const https = require("https");
const path = require("path");

const url = "https://supabase.com/downloads/prod-ca-2021.crt";
const dest = path.join(__dirname, "prod-ca-2021.crt");

console.log("Downloading CA certificate from:", url);

const file = fs.createWriteStream(dest);
https.get(url, function(response) {
  response.pipe(file);
  file.on("finish", function() {
    file.close();
    console.log("✅ CA certificate downloaded successfully to:", dest);
  });
}).on("error", function(err) {
  fs.unlink(dest, () => {});
  console.error("❌ Download failed:", err.message);
});
