import { db } from "@/lib/db";
import { STATUTS_ACTIFS } from "@/lib/types";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/livreurs/[id]">) {
  const { id } = await ctx.params;
  const enCours = (await db.livraisons()).some(
    (l) => l.livreurId === id && STATUTS_ACTIFS.includes(l.statut),
  );
  if (enCours) {
    return Response.json(
      { erreur: "Ce livreur a une livraison en cours. Terminez-la ou annulez-la d'abord." },
      { status: 409 },
    );
  }
  await db.supprimerLivreur(id);
  return Response.json({ ok: true });
}
