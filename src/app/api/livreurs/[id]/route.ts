import { gerantCourant, reponseNonConnecte } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUTS_ACTIFS } from "@/lib/types";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/livreurs/[id]">) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const { id } = await ctx.params;
  const enCours = (await db.livraisons(g.entreprise.id)).some(
    (l) => l.livreurId === id && STATUTS_ACTIFS.includes(l.statut),
  );
  if (enCours) {
    return Response.json(
      { erreur: "Ce livreur a une livraison en cours. Terminez-la ou annulez-la d'abord." },
      { status: 409 },
    );
  }
  await db.supprimerLivreur(g.entreprise.id, id);
  return Response.json({ ok: true });
}
