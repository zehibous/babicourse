// Types partagés entre le serveur et les pages.

export type Livreur = {
  id: string;
  nom: string;
  telephone: string;
  immatriculation: string;
  creeLe: string;
};

export type Statut = "en_attente" | "en_route" | "arrivee" | "livree" | "annulee";

export type Position = {
  lat: number;
  lng: number;
  precision?: number | null; // en mètres
  vitesse?: number | null; // en m/s
  le: string; // date ISO
};

export type Livraison = {
  id: string;
  token: string; // code secret du lien envoyé au livreur
  livreurId: string | null; // null si le livreur a été supprimé depuis
  destination: { label: string; repere?: string; lat: number; lng: number };
  client?: { nom?: string; telephone?: string };
  statut: Statut;
  creeLe: string;
  demarreLe?: string;
  arriveLe?: string;
  livreLe?: string;
  annuleLe?: string;
  dernierePosition?: Position;
  trace: [number, number][]; // chemin parcouru
};

export type LivraisonAvecLivreur = Livraison & { livreur: Livreur | null };

export const LIBELLES_STATUT: Record<Statut, string> = {
  en_attente: "En attente du livreur",
  en_route: "En route",
  arrivee: "Arrivé à destination",
  livree: "Livrée",
  annulee: "Annulée",
};

export const STATUTS_ACTIFS: Statut[] = ["en_attente", "en_route", "arrivee"];
