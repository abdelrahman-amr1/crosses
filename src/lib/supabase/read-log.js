const fs = require("fs");
const path = require("path");

const logPath = "C:/Users/pc/.gemini/antigravity/brain/e134c11b-6795-4d74-85b8-66f8d81cada0/.system_generated/logs/transcript.jsonl";

if (!fs.existsSync(logPath)) {
  console.log("Log file does not exist.");
  process.exit(1);
}

const content = fs.readFileSync(logPath, "utf8");
const lines = content.split("\n");

console.log("Total steps:", lines.length);

lines.forEach((line, index) => {
  if (!line.trim()) return;
  try {
    const obj = JSON.parse(line);
    if (obj.type === "USER_INPUT") {
      console.log(`--- Step ${obj.step_index} (${obj.created_at}) ---`);
      console.log(obj.content);
    }
  } catch (e) {
    // ignore malformed lines
  }
});
