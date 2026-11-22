// Base de données simple : un fichier data/db.json.
// Suffisant pour essayer l'application sur un ordinateur.
// Pour la mise en ligne, ce fichier sera remplacé par Supabase.
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { Livraison, LivraisonAvecLivreur, Livreur } from "./types";

type Donnees = { livreurs: Livreur[]; livraisons: Livraison[] };

const DOSSIER = path.join(process.cwd(), "data");
const FICHIER = path.join(DOSSIER, "db.json");

async function lire(): Promise<Donnees> {
  try {
    const brut = await fs.readFile(FICHIER, "utf8");
    return JSON.parse(brut) as Donnees;
  } catch {
    return { livreurs: [], livraisons: [] };
  }
}

async function ecrire(d: Donnees) {
  await fs.mkdir(DOSSIER, { recursive: true });
  const tmp = `${FICHIER}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(d, null, 2), "utf8");
  await fs.rename(tmp, FICHIER);
}

// Les écritures passent une par une, pour ne rien perdre si deux livreurs envoient en même temps.
let file: Promise<unknown> = Promise.resolve();
function modifier<T>(fn: (d: Donnees) => T): Promise<T> {
  const suite = file.then(async () => {
    const d = await lire();
    const r = fn(d);
    await ecrire(d);
    return r;
  });
  file = suite.catch(() => {});
  return suite;
}

export const nouvelId = () => crypto.randomUUID();
export const nouveauToken = () => crypto.randomBytes(12).toString("base64url");

function joindre(d: Donnees, l: Livraison): LivraisonAvecLivreur {
  return { ...l, livreur: d.livreurs.find((x) => x.id === l.livreurId) ?? null };
}

export const dbFichier = {
  async livreurs() {
    const d = await lire();
    return d.livreurs.sort((a, b) => a.nom.localeCompare(b.nom));
  },
  ajouterLivreur(l: Omit<Livreur, "id" | "creeLe">) {
    return modifier((d) => {
      const nouveau: Livreur = { ...l, id: nouvelId(), creeLe: new Date().toISOString() };
      d.livreurs.push(nouveau);
      return nouveau;
    });
  },
  supprimerLivreur(id: string) {
    return modifier((d) => {
      d.livreurs = d.livreurs.filter((l) => l.id !== id);
    });
  },
  async livraisons() {
    const d = await lire();
    return d.livraisons
      .map((l) => joindre(d, l))
      .sort((a, b) => b.creeLe.localeCompare(a.creeLe));
  },
  async parToken(token: string) {
    const d = await lire();
    const l = d.livraisons.find((x) => x.token === token);
    return l ? joindre(d, l) : null;
  },
  ajouterLivraison(l: Pick<Livraison, "livreurId" | "destination" | "client">) {
    return modifier((d) => {
      const nouvelle: Livraison = {
        ...l,
        id: nouvelId(),
        token: nouveauToken(),
        statut: "en_attente",
        creeLe: new Date().toISOString(),
        trace: [],
      };
      d.livraisons.push(nouvelle);
      return joindre(d, nouvelle);
    });
  },
  /** Modifie une livraison trouvée par son id ou son token. Renvoie null si elle n'existe pas. */
  modifierLivraison(cle: { id?: string; token?: string }, fn: (l: Livraison) => void) {
    return modifier((d) => {
      const l = d.livraisons.find((x) => (cle.id ? x.id === cle.id : x.token === cle.token));
      if (!l) return null;
      fn(l);
      return joindre(d, l);
    });
  },
};
