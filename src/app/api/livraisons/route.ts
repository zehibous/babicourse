import { connection } from "next/server";
import { db } from "@/lib/db";
import { STATUTS_ACTIFS } from "@/lib/types";

// GET /api/livraisons?vue=actives | terminees
export async function GET(req: Request) {
  await connection();
  const vue = new URL(req.url).searchParams.get("vue");
  let liste = await db.livraisons();
  if (vue === "actives") liste = liste.filter((l) => STATUTS_ACTIFS.includes(l.statut));
  if (vue === "terminees") liste = liste.filter((l) => !STATUTS_ACTIFS.includes(l.statut));
  return Response.json(liste);
}

export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}));
  const livreurId = String(c.livreurId ?? "");
  const lat = Number(c.destination?.lat);
  const lng = Number(c.destination?.lng);
  const label = String(c.destination?.label ?? "").trim();
  if (!livreurId || !Number.isFinite(lat) || !Number.isFinite(lng) || !label) {
    return Response.json({ erreur: "Choisissez un livreur et une destination." }, { status: 400 });
  }
  const livreurs = await db.livreurs();
  if (!livreurs.some((l) => l.id === livreurId)) {
    return Response.json({ erreur: "Livreur introuvable." }, { status: 404 });
  }
  const occupe = (await db.livraisons()).some(
    (l) => l.livreurId === livreurId && STATUTS_ACTIFS.includes(l.statut),
  );
  if (occupe) {
    return Response.json(
      { erreur: "Ce livreur a déjà une livraison en cours." },
      { status: 409 },
    );
  }
  const livraison = await db.ajouterLivraison({
    livreurId,
    destination: { label, repere: String(c.destination?.repere ?? "").trim() || undefined, lat, lng },
    client: {
      nom: String(c.client?.nom ?? "").trim() || undefined,
      telephone: String(c.client?.telephone ?? "").trim() || undefined,
    },
  });
  return Response.json(livraison, { status: 201 });
}
