import { redis } from "../../../lib/redis";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const ids = (await redis.smembers("groups")) || [];
    const groups = await Promise.all(
      ids.map(async (id) => {
        const data = (await redis.hgetall(`group:${id}`)) || {};
        return { id, ...data };
      })
    );
    groups.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    return res.status(200).json({ groups });
  }

  res.status(405).end();
}
