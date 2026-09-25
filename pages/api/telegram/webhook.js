import { redis } from "../../../lib/redis";

export const config = {
  api: { bodyParser: true },
};

async function registerGroup(chat) {
  const id = String(chat.id);
  await redis.sadd("groups", id);
  const existing = (await redis.hgetall(`group:${id}`)) || {};
  await redis.hset(`group:${id}`, {
    title: chat.title || existing.title || "Groupe sans nom",
    type: chat.type,
    folder: existing.folder || "",
    addedAt: existing.addedAt || Date.now(),
  });
}

async function removeGroup(chatId) {
  const id = String(chatId);
  await redis.srem("groups", id);
  await redis.del(`group:${id}`);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).end();

  // Optionnel : vérification du secret de webhook Telegram
  const secret = req.headers["x-telegram-bot-api-secret-token"];
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return res.status(401).end();
  }

  const update = req.body;

  try {
    // Cas 1 : le statut du bot change dans un chat (ajouté, promu, retiré...)
    if (update.my_chat_member) {
      const { chat, new_chat_member } = update.my_chat_member;
      const status = new_chat_member?.status;
      if (["member", "administrator"].includes(status)) {
        await registerGroup(chat);
      } else if (["left", "kicked"].includes(status)) {
        await removeGroup(chat.id);
      }
    }

    // Cas 2 (filet de sécurité) : un message arrive d'un groupe/supergroupe
    // dans lequel le bot est déjà présent mais qu'on n'aurait pas encore enregistré
    if (update.message && ["group", "supergroup"].includes(update.message.chat.type)) {
      await registerGroup(update.message.chat);
    }
  } catch (e) {
    console.error("Erreur webhook:", e);
  }

  res.status(200).json({ ok: true });
}
