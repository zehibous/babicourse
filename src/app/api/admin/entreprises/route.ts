// Administration du SaaS : liste des entreprises inscrites et de leurs réponses.
import { gerantCourant, oublierMembres } from "@/lib/auth";
import { admin } from "@/lib/supabase";

async function exigerAdmin() {
  const g = await gerantCourant();
  return g?.estAdmin ? g : null;
}

export async function GET() {
  if (!(await exigerAdmin())) return Response.json({ erreur: "Accès réservé." }, { status: 403 });
  const sb = admin();
  const [{ data: entreprises, error }, { data: membres }, { data: livreurs }, { data: livraisons }] = await Promise.all([
    sb.from("entreprises").select("*").order("cree_le", { ascending: false }),
    sb.from("membres").select("entreprise_id, nom"),
    sb.from("livreurs").select("entreprise_id"),
    sb.from("livraisons").select("entreprise_id, cree_le"),
  ]);
  if (error) return Response.json({ erreur: error.message }, { status: 500 });

  const compter = (liste: { entreprise_id: string }[] | null, id: string) =>
    (liste ?? []).filter((x) => x.entreprise_id === id).length;

  return Response.json(
    (entreprises ?? []).map((e) => {
      const sesLivraisons = (livraisons ?? []).filter((l) => l.entreprise_id === e.id);
      return {
        ...e,
        gerant: (membres ?? []).find((m) => m.entreprise_id === e.id)?.nom ?? null,
        nbLivreursEnregistres: compter(livreurs, e.id),
        nbLivraisons: sesLivraisons.length,
        derniereLivraison: sesLivraisons.map((l) => l.cree_le as string).sort().pop() ?? null,
      };
    }),
  );
}

// Suspendre ou réactiver une entreprise.
export async function PATCH(req: Request) {
  const g = await exigerAdmin();
  if (!g) return Response.json({ erreur: "Accès réservé." }, { status: 403 });
  const { id, statut } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || (statut !== "active" && statut !== "suspendue")) {
    return Response.json({ erreur: "Demande invalide." }, { status: 400 });
  }
  if (id === g.entreprise.id) {
    return Response.json({ erreur: "Vous ne pouvez pas suspendre votre propre entreprise." }, { status: 400 });
  }
  const { error } = await admin().from("entreprises").update({ statut }).eq("id", id);
  if (error) return Response.json({ erreur: error.message }, { status: 500 });
  oublierMembres();
  return Response.json({ ok: true });
}
