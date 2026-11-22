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

/** Le gérant connecté, ou null (pas connecté, sans entreprise, ou entreprise suspendue). */
export async function gerantCourant(): Promise<Gerant | null> {
  await connection(); // toujours calculé au moment de la visite (jamais mis en cache)
  const sb = await clientSession();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await admin()
    .from("membres")
    .select("nom, role, entreprises(id, nom, statut)")
    .eq("user_id", user.id)
    .maybeSingle();
  const m = data as LigneMembre | null;
  if (!m?.entreprises || m.entreprises.statut !== "active") return null;
  return {
    userId: user.id,
    email: user.email ?? "",
    nom: m.nom,
    role: m.role,
    entreprise: { id: m.entreprises.id, nom: m.entreprises.nom },
    estAdmin: estEmailAdmin(user.email),
  };
}

export function reponseNonConnecte() {
  return Response.json({ erreur: "Connexion requise." }, { status: 401 });
}
