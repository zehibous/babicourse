import { gerantCourant, reponseNonConnecte } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  return Response.json(await db.livreurs(g.entreprise.id));
}

export async function POST(req: Request) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const corps = await req.json().catch(() => ({}));
  const nom = String(corps.nom ?? "").trim().slice(0, 120);
  const telephone = String(corps.telephone ?? "").trim().slice(0, 30);
  const immatriculation = String(corps.immatriculation ?? "").trim().toUpperCase().slice(0, 30);
  if (!nom || !immatriculation) {
    return Response.json({ erreur: "Le nom et l'immatriculation sont obligatoires." }, { status: 400 });
  }
  const existants = await db.livreurs(g.entreprise.id);
  if (existants.some((l) => l.immatriculation === immatriculation)) {
    return Response.json({ erreur: "Un livreur a déjà cette immatriculation." }, { status: 409 });
  }
  return Response.json(await db.ajouterLivreur(g.entreprise.id, { nom, telephone, immatriculation }), { status: 201 });
}
