export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { password } = req.body || {};
  if (!password || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: "Mot de passe incorrect" });
  }
  res.setHeader(
    "Set-Cookie",
    `session=${encodeURIComponent(password)}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax; Secure`
  );
  res.status(200).json({ ok: true });
}
