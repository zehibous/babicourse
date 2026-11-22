import { cookies } from "next/headers";
import { COOKIE_SESSION, DUREE_SESSION_S, egaux, jetonAttendu } from "@/lib/session";

// Connexion du gérant.
export async function POST(req: Request) {
  const { motDePasse } = await req.json().catch(() => ({}));
  const attendu = await jetonAttendu();
  if (!attendu) {
    return Response.json(
      { erreur: "Aucun mot de passe n'est configuré (variable GERANT_MOT_DE_PASSE)." },
      { status: 503 },
    );
  }
  const mdp = process.env.GERANT_MOT_DE_PASSE!;
  if (typeof motDePasse !== "string" || !egaux(motDePasse, mdp)) {
    await new Promise((r) => setTimeout(r, 800)); // ralentit les essais au hasard
    return Response.json({ erreur: "Mot de passe incorrect." }, { status: 401 });
  }
  (await cookies()).set(COOKIE_SESSION, attendu, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SESSION_S,
  });
  return Response.json({ ok: true });
}

// Déconnexion.
export async function DELETE() {
  (await cookies()).delete(COOKIE_SESSION);
  return Response.json({ ok: true });
}
