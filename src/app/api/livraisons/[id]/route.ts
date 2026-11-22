import { gerantCourant, reponseNonConnecte } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUTS_ACTIFS } from "@/lib/types";

// Le gérant peut annuler une livraison ou la marquer livrée lui-même.
export async function PATCH(req: Request, ctx: RouteContext<"/api/livraisons/[id]">) {
  const g = await gerantCourant();
  if (!g) return reponseNonConnecte();
  const { id } = await ctx.params;
  const { action } = await req.json().catch(() => ({}));
  if (action !== "annuler" && action !== "livree") {
    return Response.json({ erreur: "Action inconnue." }, { status: 400 });
  }
  const r = await db.modifierLivraison({ id, entrepriseId: g.entreprise.id }, (l) => {
    if (!STATUTS_ACTIFS.includes(l.statut)) return;
    const maintenant = new Date().toISOString();
    if (action === "annuler") {
      l.statut = "annulee";
      l.annuleLe = maintenant;
    } else {
      l.statut = "livree";
      l.livreLe = maintenant;
    }
  });
  if (!r) return Response.json({ erreur: "Livraison introuvable." }, { status: 404 });
  return Response.json(r);
}
