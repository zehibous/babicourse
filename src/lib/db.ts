// Accès aux données dans Supabase. Côté serveur uniquement.
// Chaque fonction du gérant reçoit l'id de son entreprise : une entreprise ne voit jamais
// les livreurs ou livraisons d'une autre.
import "server-only";
import crypto from "crypto";
import { admin } from "./supabase";
import type { Livraison, LivraisonAvecLivreur, Livreur, Position, Statut } from "./types";

type LigneLivreur = { id: string; nom: string; telephone: string; immatriculation: string; cree_le: string };
type LigneLivraison = {
  id: string;
  token: string;
  entreprise_id: string;
  livreur_id: string | null;
  dest_label: string;
  dest_repere: string | null;
  dest_lat: number;
  dest_lng: number;
  client_nom: string | null;
  client_telephone: string | null;
  statut: Statut;
  cree_le: string;
  demarre_le: string | null;
  arrive_le: string | null;
  livre_le: string | null;
  annule_le: string | null;
  derniere_position: Position | null;
  trace: [number, number][];
  livreurs?: LigneLivreur | null;
};

function verifier<T>(r: { data: T; error: { message: string; code?: string } | null }): T {
  if (r.error) throw new Error(`Supabase : ${r.error.message}`);
  return r.data;
}

const versLivreur = (l: LigneLivreur): Livreur => ({
  id: l.id,
  nom: l.nom,
  telephone: l.telephone,
  immatriculation: l.immatriculation,
  creeLe: l.cree_le,
});

const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function versLivraison(l: LigneLivraison): LivraisonAvecLivreur {
  return {
    id: l.id,
    token: l.token,
    livreurId: l.livreur_id,
    destination: { label: l.dest_label, repere: u(l.dest_repere), lat: l.dest_lat, lng: l.dest_lng },
    client: { nom: u(l.client_nom), telephone: u(l.client_telephone) },
    statut: l.statut,
    creeLe: l.cree_le,
    demarreLe: u(l.demarre_le),
    arriveLe: u(l.arrive_le),
    livreLe: u(l.livre_le),
    annuleLe: u(l.annule_le),
    dernierePosition: u(l.derniere_position),
    trace: l.trace ?? [],
    livreur: l.livreurs ? versLivreur(l.livreurs) : null,
  };
}

const SELECT = "*, livreurs(*)";

export const db = {
  async livreurs(entrepriseId: string) {
    const data = verifier(await admin().from("livreurs").select("*").eq("entreprise_id", entrepriseId).order("nom"));
    return (data as LigneLivreur[]).map(versLivreur);
  },
  async ajouterLivreur(entrepriseId: string, l: Omit<Livreur, "id" | "creeLe">) {
    const data = verifier(
      await admin().from("livreurs").insert({ ...l, entreprise_id: entrepriseId }).select().single(),
    );
    return versLivreur(data as LigneLivreur);
  },
  async supprimerLivreur(entrepriseId: string, id: string) {
    verifier(await admin().from("livreurs").delete().eq("id", id).eq("entreprise_id", entrepriseId));
  },
  async livraisons(entrepriseId: string) {
    const data = verifier(
      await admin()
        .from("livraisons")
        .select(SELECT)
        .eq("entreprise_id", entrepriseId)
        .order("cree_le", { ascending: false })
        .limit(500),
    );
    return (data as LigneLivraison[]).map(versLivraison);
  },
  /** Pour la page du livreur : accès par le lien secret, sans connexion. */
  async parToken(token: string) {
    const data = verifier(await admin().from("livraisons").select(SELECT).eq("token", token).maybeSingle());
    return data ? versLivraison(data as LigneLivraison) : null;
  },
  async ajouterLivraison(entrepriseId: string, l: Pick<Livraison, "livreurId" | "destination" | "client">) {
    const data = verifier(
      await admin()
        .from("livraisons")
        .insert({
          entreprise_id: entrepriseId,
          token: crypto.randomBytes(12).toString("base64url"),
          livreur_id: l.livreurId,
          dest_label: l.destination.label,
          dest_repere: l.destination.repere ?? null,
          dest_lat: l.destination.lat,
          dest_lng: l.destination.lng,
          client_nom: l.client?.nom ?? null,
          client_telephone: l.client?.telephone ?? null,
        })
        .select(SELECT)
        .single(),
    );
    return versLivraison(data as LigneLivraison);
  },
  /**
   * Lit la livraison, applique la modification, puis enregistre.
   * Le gérant la désigne par { id, entrepriseId } ; le livreur par { token }.
   */
  async modifierLivraison(
    cle: { id: string; entrepriseId: string } | { token: string },
    fn: (l: Livraison) => void,
  ) {
    let requete = admin().from("livraisons").select(SELECT);
    requete = "token" in cle ? requete.eq("token", cle.token) : requete.eq("id", cle.id).eq("entreprise_id", cle.entrepriseId);
    const ligne = verifier(await requete.maybeSingle());
    if (!ligne) return null;
    const l = versLivraison(ligne as LigneLivraison);
    fn(l);
    const data = verifier(
      await admin()
        .from("livraisons")
        .update({
          statut: l.statut,
          demarre_le: l.demarreLe ?? null,
          arrive_le: l.arriveLe ?? null,
          livre_le: l.livreLe ?? null,
          annule_le: l.annuleLe ?? null,
          derniere_position: l.dernierePosition ?? null,
          trace: l.trace,
        })
        .eq("id", l.id)
        .select(SELECT)
        .single(),
    );
    return versLivraison(data as LigneLivraison);
  },
};
