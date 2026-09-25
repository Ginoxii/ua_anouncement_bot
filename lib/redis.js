import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Structure de données :
// SET "groups"                 -> liste des chat_id (string)
// HASH "group:<chatId>"        -> { title, folder, addedAt }
// SET "folders"                -> liste des noms de dossiers
