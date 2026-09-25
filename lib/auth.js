// Authentification volontairement simple : un seul mot de passe partagé,
// stocké côté serveur dans la variable d'environnement APP_PASSWORD.
// Convient pour un usage personnel, pas pour un usage multi-utilisateurs sensible.

export function isAuthorized(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/session=([^;]+)/);
  if (!match) return false;
  let value;
  try {
    value = decodeURIComponent(match[1]);
  } catch {
    value = match[1];
  }
  return value === process.env.APP_PASSWORD;
}

export function requireAuth(req, res) {
  if (!isAuthorized(req)) {
    res.status(401).json({ error: "Non authentifié" });
    return false;
  }
  return true;
}
