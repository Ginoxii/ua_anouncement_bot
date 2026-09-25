import formidable from "formidable";
import fs from "fs";
import { requireAuth } from "../../lib/auth";
import { sendMessage, sendMedia, extractFileId } from "../../lib/telegram";

export const config = {
  api: { bodyParser: false },
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: 45 * 1024 * 1024 });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { fields, files } = await parseForm(req);
    const type = fields.type?.[0] || fields.type; // "text" | "photo" | "video" | "voice"
    const caption = fields.caption?.[0] || fields.caption || "";
    const targetsRaw = fields.targets?.[0] || fields.targets || "[]";
    const targets = JSON.parse(targetsRaw);
    const file = files.file?.[0] || files.file;

    if (!targets.length) {
      return res.status(400).json({ error: "Aucun groupe sélectionné" });
    }

    const results = [];
    let sharedFileId = null;

    for (const chatId of targets) {
      try {
        if (type === "text") {
          await sendMessage(chatId, caption);
        } else if (sharedFileId) {
          // On réutilise le file_id déjà uploadé sur Telegram : rapide, pas de ré-upload
          await sendMedia(chatId, type, sharedFileId, caption);
        } else {
          const buffer = fs.readFileSync(file.filepath);
          const result = await sendMedia(
            chatId,
            type,
            { buffer, filename: file.originalFilename, mimeType: file.mimetype },
            caption
          );
          sharedFileId = extractFileId(type, result);
        }
        results.push({ chatId, ok: true });
      } catch (e) {
        results.push({ chatId, ok: false, error: e.message });
      }
    }

    res.status(200).json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
