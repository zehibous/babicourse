// Connexion du gérant : un mot de passe unique (variable GERANT_MOT_DE_PASSE).
// Le cookie contient une signature dérivée du mot de passe : changer le mot de passe
// déconnecte tout le monde.

export const COOKIE_SESSION = "babicourse_session";
export const DUREE_SESSION_S = 60 * 60 * 24 * 30; // 30 jours

export function motDePasseConfigure() {
  return Boolean(process.env.GERANT_MOT_DE_PASSE);
}

/** Signature attendue dans le cookie (HMAC-SHA256). */
export async function jetonAttendu(): Promise<string | null> {
  const mdp = process.env.GERANT_MOT_DE_PASSE;
  if (!mdp) return null;
  const cle = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(mdp),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode("babicourse-gerant-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Comparaison sans fuite de temps. */
export function egaux(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
