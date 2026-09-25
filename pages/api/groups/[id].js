import { redis } from "../../../lib/redis";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const { id } = req.query;

  if (req.method === "PATCH") {
    const { folder } = req.body || {};
    await redis.hset(`group:${id}`, { folder: folder || "" });
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    await redis.srem("groups", id);
    await redis.del(`group:${id}`);
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
