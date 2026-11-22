// Protège les pages du gérant par mot de passe.
// Restent publiques : la page du livreur (/l/...) et son API (/api/course/...), protégées par leur lien secret.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSION, egaux, jetonAttendu } from "@/lib/session";

const PUBLIC = [/^\/connexion$/, /^\/api\/connexion$/, /^\/l\//, /^\/api\/course\//];

export async function proxy(req: NextRequest) {
  const chemin = req.nextUrl.pathname;
  if (PUBLIC.some((r) => r.test(chemin))) return NextResponse.next();

  const attendu = await jetonAttendu();
  if (!attendu) {
    // Pas de mot de passe : accès libre sur l'ordinateur, mais jamais en ligne.
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
  } else {
    const cookie = req.cookies.get(COOKIE_SESSION)?.value ?? "";
    if (egaux(cookie, attendu)) return NextResponse.next();
  }

  if (chemin.startsWith("/api/")) {
    return NextResponse.json({ erreur: "Connexion requise." }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/connexion";
  url.search = chemin !== "/" ? `?suite=${encodeURIComponent(chemin)}` : "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webmanifest)$).*)"],
};
