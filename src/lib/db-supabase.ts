// Base de données Supabase (utilisée dès que les clés sont dans .env.local).
// Ce fichier tourne uniquement sur le serveur : la clé secrète n'arrive jamais dans le navigateur.
import "server-only";
import crypto from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Livraison, LivraisonAvecLivreur, Livreur, Position, Statut } from "./types";

type LigneLivreur = { id: string; nom: string; telephone: string; immatriculation: string; cree_le: string };
type LigneLivraison = {
  id: string;
  token: string;
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

let client: SupabaseClient | null = null;
function sb() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function verifier<T>(r: { data: T; error: { message: string } | null }): T {
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

export const dbSupabase = {
  async livreurs() {
    const data = verifier(await sb().from("livreurs").select("*").order("nom"));
    return (data as LigneLivreur[]).map(versLivreur);
  },
  async ajouterLivreur(l: Omit<Livreur, "id" | "creeLe">) {
    const data = verifier(await sb().from("livreurs").insert(l).select().single());
    return versLivreur(data as LigneLivreur);
  },
  async supprimerLivreur(id: string) {
    verifier(await sb().from("livreurs").delete().eq("id", id));
  },
  async livraisons() {
    const data = verifier(await sb().from("livraisons").select(SELECT).order("cree_le", { ascending: false }).limit(500));
    return (data as LigneLivraison[]).map(versLivraison);
  },
  async parToken(token: string) {
    const data = verifier(await sb().from("livraisons").select(SELECT).eq("token", token).maybeSingle());
    return data ? versLivraison(data as LigneLivraison) : null;
  },
  async ajouterLivraison(l: Pick<Livraison, "livreurId" | "destination" | "client">) {
    const data = verifier(
      await sb()
        .from("livraisons")
        .insert({
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
  /** Lit la livraison, applique la modification, puis enregistre les champs qui changent. */
  async modifierLivraison(cle: { id?: string; token?: string }, fn: (l: Livraison) => void) {
    const colonne = cle.id ? "id" : "token";
    const valeur = (cle.id ?? cle.token)!;
    const ligne = verifier(await sb().from("livraisons").select(SELECT).eq(colonne, valeur).maybeSingle());
    if (!ligne) return null;
    const l = versLivraison(ligne as LigneLivraison);
    fn(l);
    const data = verifier(
      await sb()
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
