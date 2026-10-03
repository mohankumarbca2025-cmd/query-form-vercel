// Usage: UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/import.js ./queries.json
const { Redis } = require("@upstash/redis");
const fs = require("fs");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

(async () => {
  const file = process.argv[2];
  if (!file) return console.log("Pass the path to your JSON file");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!data.length) return console.log("Nothing to import");
  await redis.rpush("queries", ...data.map((d) => JSON.stringify(d)));
  console.log(`Imported ${data.length} queries`);
})();
