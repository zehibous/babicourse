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
  // Un seul passage par la base : c'est elle qui refuse les doublons d'immatriculation.
  const livreur = await db.ajouterLivreur(g.entreprise.id, { nom, telephone, immatriculation });
  if (!livreur) return Response.json({ erreur: "Un livreur a déjà cette immatriculation." }, { status: 409 });
  return Response.json(livreur, { status: 201 });
}
