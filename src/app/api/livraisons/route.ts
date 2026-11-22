import { gerantCourant, reponseNonConnecte } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUTS_ACTIFS } from "@/lib/types";

// GET /api/livraisons?vue=actives | terminees
export async function GET(req: Request) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const vue = new URL(req.url).searchParams.get("vue");
  let liste = await db.livraisons(g.entreprise.id);
  if (vue === "actives") liste = liste.filter((l) => STATUTS_ACTIFS.includes(l.statut));
  if (vue === "terminees") liste = liste.filter((l) => !STATUTS_ACTIFS.includes(l.statut));
  return Response.json(liste);
}

export async function POST(req: Request) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const c = await req.json().catch(() => ({}));
  const livreurId = String(c.livreurId ?? "");
  const lat = Number(c.destination?.lat);
  const lng = Number(c.destination?.lng);
  const label = String(c.destination?.label ?? "").trim().slice(0, 200);
  if (!livreurId || !Number.isFinite(lat) || !Number.isFinite(lng) || !label) {
    return Response.json({ erreur: "Choisissez un livreur et une destination." }, { status: 400 });
  }
  // Le livreur doit appartenir à l'entreprise du gérant.
  const livreurs = await db.livreurs(g.entreprise.id);
  if (!livreurs.some((l) => l.id === livreurId)) {
    return Response.json({ erreur: "Livreur introuvable." }, { status: 404 });
  }
  const occupe = (await db.livraisons(g.entreprise.id)).some(
    (l) => l.livreurId === livreurId && STATUTS_ACTIFS.includes(l.statut),
  );
  if (occupe) {
    return Response.json({ erreur: "Ce livreur a déjà une livraison en cours." }, { status: 409 });
  }
  const texte = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max) || undefined;
  const livraison = await db.ajouterLivraison(g.entreprise.id, {
    livreurId,
    destination: { label, repere: texte(c.destination?.repere, 200), lat, lng },
    client: { nom: texte(c.client?.nom, 120), telephone: texte(c.client?.telephone, 30) },
  });
  return Response.json(livraison, { status: 201 });
}
