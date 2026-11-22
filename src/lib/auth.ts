// Qui est connecté, et pour quelle entreprise ?
import "server-only";
import { connection } from "next/server";
import { admin, clientSession } from "./supabase";

export type Gerant = {
  userId: string;
  email: string;
  nom: string;
  role: "proprietaire" | "gerant";
  entreprise: { id: string; nom: string };
  estAdmin: boolean;
};

/** Les administrateurs du SaaS (toi) : variable ADMIN_EMAILS, e-mails séparés par des virgules. */
export function estEmailAdmin(email: string | undefined | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

type LigneMembre = {
  nom: string;
  role: "proprietaire" | "gerant";
  entreprises: { id: string; nom: string; statut: string } | null;
};

// Petite mémoire : le lien gérant → entreprise est gardé 30 secondes,
// pour ne pas interroger la base à chaque action. (Une suspension prend effet en 30 s au plus.)
const DUREE_MEMOIRE_MS = 30_000;
const memoire = new Map<string, { membre: LigneMembre | null; jusqua: number }>();

async function membreDe(userId: string): Promise<LigneMembre | null> {
  const enMemoire = memoire.get(userId);
  if (enMemoire && enMemoire.jusqua > Date.now()) return enMemoire.membre;
  const { data } = await admin()
    .from("membres")
    .select("nom, role, entreprises(id, nom, statut)")
    .eq("user_id", userId)
    .maybeSingle();
  const membre = data as LigneMembre | null;
  memoire.set(userId, { membre, jusqua: Date.now() + DUREE_MEMOIRE_MS });
  if (memoire.size > 5000) memoire.clear();
  return membre;
}

/** À appeler quand une entreprise change (suspension, renommage) pour l'appliquer tout de suite. */
export function oublierMembres() {
  memoire.clear();
}

/** Le gérant connecté, ou null (pas connecté, sans entreprise, ou entreprise suspendue). */
export async function gerantCourant(): Promise<Gerant | null> {
  await connection(); // toujours calculé au moment de la visite (jamais mis en cache)
  const sb = await clientSession();
  // Vérification de la signature du jeton sur place (clés ES256), sans appeler Supabase à chaque fois.
  const { data, error } = await sb.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const m = await membreDe(claims.sub);
  if (!m?.entreprises || m.entreprises.statut !== "active") return null;
  const email = typeof claims.email === "string" ? claims.email : "";
  return {
    userId: claims.sub,
    email,
    nom: m.nom,
    role: m.role,
    entreprise: { id: m.entreprises.id, nom: m.entreprises.nom },
    estAdmin: estEmailAdmin(email),
  };
}

export function reponseNonConnecte() {
  return Response.json({ erreur: "Connexion requise." }, { status: 401 });
}
