import { connection } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  await connection();
  return Response.json(await db.livreurs());
}

export async function POST(req: Request) {
  const corps = await req.json().catch(() => ({}));
  const nom = String(corps.nom ?? "").trim();
  const telephone = String(corps.telephone ?? "").trim();
  const immatriculation = String(corps.immatriculation ?? "").trim().toUpperCase();
  if (!nom || !immatriculation) {
    return Response.json({ erreur: "Le nom et l'immatriculation sont obligatoires." }, { status: 400 });
  }
  const existants = await db.livreurs();
  if (existants.some((l) => l.immatriculation === immatriculation)) {
    return Response.json({ erreur: "Un livreur a déjà cette immatriculation." }, { status: 409 });
  }
  return Response.json(await db.ajouterLivreur({ nom, telephone, immatriculation }), { status: 201 });
}
