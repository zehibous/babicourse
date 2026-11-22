import { clientSession } from "@/lib/supabase";

// Mot de passe oublié : Supabase envoie un e-mail avec un lien de réinitialisation.
export async function POST(req: Request) {
  const c = await req.json().catch(() => ({}));
  const email = String(c.email ?? "").trim().toLowerCase();
  if (!email) return Response.json({ erreur: "Indiquez votre e-mail." }, { status: 400 });
  const origine = new URL(req.url).origin;
  const sb = await clientSession();
  await sb.auth.resetPasswordForEmail(email, { redirectTo: `${origine}/auth/callback?suite=/reinitialiser` });
  // Même réponse que l'e-mail existe ou non : on ne révèle pas qui a un compte.
  return Response.json({ ok: true });
}
