import { redis } from "../../../lib/redis";
import { requireAuth } from "../../../lib/auth";

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === "GET") {
    const folders = (await redis.smembers("folders")) || [];
    return res.status(200).json({ folders: folders.sort() });
  }

  if (req.method === "POST") {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Nom requis" });
    await redis.sadd("folders", name.trim());
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { name } = req.body || {};
    await redis.srem("folders", name);
    // Retire ce dossier de tous les groupes qui l'utilisaient
    const ids = (await redis.smembers("groups")) || [];
    await Promise.all(
      ids.map(async (id) => {
        const data = await redis.hgetall(`group:${id}`);
        if (data?.folder === name) {
          await redis.hset(`group:${id}`, { folder: "" });
        }
      })
    );
    return res.status(200).json({ ok: true });
  }

  res.status(405).end();
}
