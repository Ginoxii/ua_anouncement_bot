const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE = `https://api.telegram.org/bot${TOKEN}`;
const FILE_BASE = `https://api.telegram.org/file/bot${TOKEN}`;

async function callApi(method, body, isForm = false) {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: isForm ? undefined : { "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description || `Erreur Telegram (${method})`);
  }
  return data.result;
}

export async function sendMessage(chatId, text) {
  return callApi("sendMessage", { chat_id: chatId, text });
}

// Envoie un média. Si `fileOrId` est une string, on suppose que c'est déjà
// un file_id Telegram (réutilisation rapide, pas de ré-upload).
// Sinon c'est un objet { buffer, filename, mimeType } à uploader.
export async function sendMedia(chatId, kind, fileOrId, caption) {
  const methodMap = {
    photo: "sendPhoto",
    video: "sendVideo",
    voice: "sendVoice",
    audio: "sendAudio",
    document: "sendDocument",
  };
  const fieldMap = {
    photo: "photo",
    video: "video",
    voice: "voice",
    audio: "audio",
    document: "document",
  };
  const method = methodMap[kind];
  const field = fieldMap[kind];

  if (typeof fileOrId === "string") {
    const result = await callApi(method, {
      chat_id: chatId,
      [field]: fileOrId,
      caption: caption || undefined,
    });
    return result;
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) form.append("caption", caption);
  const blob = new Blob([fileOrId.buffer], { type: fileOrId.mimeType });
  form.append(field, blob, fileOrId.filename);

  const result = await callApi(method, form, true);
  return result;
}

// Extrait le file_id renvoyé par Telegram dans une réponse sendPhoto/sendVideo/sendVoice
export function extractFileId(kind, result) {
  if (kind === "photo") {
    const sizes = result.photo || [];
    return sizes[sizes.length - 1]?.file_id;
  }
  if (kind === "video") return result.video?.file_id;
  if (kind === "voice") return result.voice?.file_id;
  if (kind === "audio") return result.audio?.file_id;
  if (kind === "document") return result.document?.file_id;
  return null;
}

export async function setWebhook(url) {
  return callApi("setWebhook", { url });
}

export async function getMe() {
  return callApi("getMe", {});
}
