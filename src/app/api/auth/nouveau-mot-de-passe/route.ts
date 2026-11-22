import { clientSession } from "@/lib/supabase";

// Choix d'un nouveau mot de passe (après le lien reçu par e-mail).
export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}));
  const motDePasse = String(c.motDePasse ?? "");
  if (motDePasse.length < 8) {
    return Response.json({ erreur: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }
  const sb = await clientSession();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return Response.json({ erreur: "Lien expiré. Refaites une demande." }, { status: 401 });
  const { error } = await sb.auth.updateUser({ password: motDePasse });
  if (error) return Response.json({ erreur: "Changement impossible. Choisissez un autre mot de passe." }, { status: 400 });
  return Response.json({ ok: true });
}
