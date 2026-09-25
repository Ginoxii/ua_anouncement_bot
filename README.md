# Broadcast Telegram — Guide d'installation

Interface web pour envoyer un message texte, une photo, une vidéo ou un vocal
vers plusieurs groupes Telegram en même temps (sélection manuelle ou par dossier).

## 1. Créer le bot Telegram

1. Ouvre Telegram, cherche **@BotFather** et démarre une conversation.
2. Envoie `/newbot`, choisis un nom, puis un identifiant se terminant par `bot` (ex : `MonBroadcastBot`).
3. BotFather te donne un **token** (ex : `123456:AAExxxxxxx`). Garde-le précieusement, ne le partage jamais publiquement.
4. Toujours avec BotFather : envoie `/setprivacy` → choisis ton bot → **Disable**.
   (Sans ça, le bot ne voit pas les messages dans les groupes — ce n'est pas obligatoire pour l'envoi, mais utile pour la détection fiable des groupes.)

## 2. Créer une base Upstash Redis (gratuite)

1. Va sur https://upstash.com, crée un compte gratuit.
2. Crée une base **Redis** (région proche de toi).
3. Dans l'onglet "REST API", récupère `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.

## 3. Déployer sur Vercel

1. Crée un dépôt GitHub avec ce projet (ou importe-le directement).
2. Sur https://vercel.com → **Add New Project** → sélectionne le dépôt.
3. Dans **Environment Variables**, ajoute :
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET` (invente une chaîne aléatoire, ex : générée sur https://randomkeygen.com)
   - `APP_PASSWORD` (le mot de passe pour accéder à ton interface)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Déploie. Tu obtiens une URL du type `https://ton-projet.vercel.app`.

## 4. Connecter le webhook Telegram

Une fois déployé, ouvre cette URL dans ton navigateur (remplace les valeurs) :

```
https://api.telegram.org/bot<TON_TOKEN>/setWebhook?url=https://ton-projet.vercel.app/api/telegram/webhook&secret_token=<TON_TELEGRAM_WEBHOOK_SECRET>
```

Tu dois voir `{"ok":true,"result":true,...}`.

## 5. Ajouter le bot dans tes groupes

Ajoute `@MonBroadcastBot` dans chaque groupe Telegram concerné, comme n'importe quel membre
(donne-lui de préférence les droits d'envoi de messages/médias). Il apparaîtra automatiquement
dans ton tableau de bord dans les quelques secondes qui suivent.

## 6. Utiliser l'interface

Va sur `https://ton-projet.vercel.app`, connecte-toi avec `APP_PASSWORD`.
- Crée des dossiers pour organiser tes groupes.
- Sélectionne un ou plusieurs groupes (ou "Tout sélectionner").
- Choisis Texte / Photo / Vidéo / Vocal, écris ta légende, envoie.

## Limites à connaître

- **Taille des fichiers** : le plan gratuit Vercel limite les requêtes à ~4,5 Mo.
  Les photos et vocaux passent généralement bien ; les vidéos plus lourdes échoueront
  (il faudra alors un plan payant Vercel, ou un hébergement type Railway/Render sans cette limite).
- **Vocaux** : Telegram attend un format OGG/Opus pour un vrai "message vocal" ; un fichier
  audio dans un autre format sera accepté mais pourrait s'afficher comme un fichier audio classique.
- **Sécurité** : l'authentification est un simple mot de passe partagé, pensée pour un usage
  personnel. Ne réutilise pas un mot de passe sensible.
- Le bot doit être ajouté manuellement à chaque groupe — l'API Telegram ne permet pas à un bot
  de rejoindre un groupe tout seul.

## Développement local

```bash
npm install
cp .env.example .env.local   # puis remplis les valeurs
npm run dev
```

Pour tester le webhook en local, utilise un tunnel (ex. `ngrok http 3000`) et pointe
`setWebhook` vers l'URL ngrok.
