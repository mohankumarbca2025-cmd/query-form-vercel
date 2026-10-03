const { Redis } = require("@upstash/redis");

// Vercel's Upstash integration sets KV_REST_API_*; a direct Upstash setup uses UPSTASH_REDIS_REST_*
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const KEY = "queries";

module.exports = async (req, res) => {
  try {
    // POST /api/queries -> save a new query
    if (req.method === "POST") {
      const { name, email, phone, subject, message } = req.body || {};

      if (!name || !email || !message) {
        return res.status(400).json({ error: "name, email and message are required" });
      }

      const entry = {
        id: Date.now().toString(),
        name: String(name).trim(),
        email: String(email).trim(),
        phone: phone ? String(phone).trim() : "",
        subject: subject ? String(subject).trim() : "",
        message: String(message).trim(),
        createdAt: new Date().toISOString(),
      };

      await redis.rpush(KEY, JSON.stringify(entry)); // atomic append, no race conditions
      return res.status(201).json({ message: "Saved", entry });
    }

    // GET /api/queries?key=YOUR_ADMIN_KEY -> list saved queries (protected)
    if (req.method === "GET") {
      if (!process.env.ADMIN_KEY || req.query.key !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const items = await redis.lrange(KEY, 0, -1);
      const data = items.map((i) => (typeof i === "string" ? JSON.parse(i) : i));
      return res.status(200).json(data);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
