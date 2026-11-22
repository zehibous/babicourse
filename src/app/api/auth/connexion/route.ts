import { clientSession } from "@/lib/supabase";

// Connexion d'un gérant.
export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}));
  const email = String(c.email ?? "").trim().toLowerCase();
  const motDePasse = String(c.motDePasse ?? "");
  if (!email || !motDePasse) return Response.json({ erreur: "E-mail et mot de passe requis." }, { status: 400 });
  const sb = await clientSession();
  const { error } = await sb.auth.signInWithPassword({ email, password: motDePasse });
  if (error) {
    await new Promise((r) => setTimeout(r, 600)); // ralentit les essais au hasard
    return Response.json({ erreur: "E-mail ou mot de passe incorrect." }, { status: 401 });
  }
  return Response.json({ ok: true });
}

// Déconnexion.
export async function DELETE() {
  const sb = await clientSession();
  await sb.auth.signOut();
  return Response.json({ ok: true });
}
