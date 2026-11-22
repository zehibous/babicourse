import { gerantCourant, reponseNonConnecte } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/livreurs/[id]">) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const { id } = await ctx.params;
  if (await db.livreurOccupe(g.entreprise.id, id)) {
    return Response.json(
      { erreur: "Ce livreur a une livraison en cours. Terminez-la ou annulez-la d'abord." },
      { status: 409 },
    );
  }
  await db.supprimerLivreur(g.entreprise.id, id);
  return Response.json({ ok: true });
}
