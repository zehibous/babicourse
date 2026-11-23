// Avant chaque page : on rafraîchit la session Supabase et on protège l'espace gérant et l'administration.
// Le reste est public : accueil, essai, connexion, page du livreur (/l/...) protégée par son lien secret.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ANCIENNES_ADRESSES, URL_SITE } from "@/lib/site";

const PROTEGE = [/^\/espace(\/|$)/, /^\/admin(\/|$)/];

export async function proxy(req: NextRequest) {
  // Ancienne adresse (babicourse.vercel.app) → adresse officielle, en gardant la page demandée.
  // Les anciens liens déjà envoyés aux livreurs continuent donc de marcher.
  if (ANCIENNES_ADRESSES.includes(req.nextUrl.hostname)) {
    return NextResponse.redirect(`${URL_SITE}${req.nextUrl.pathname}${req.nextUrl.search}`, 308);
  }

  let reponse = NextResponse.next({ request: req });

  const sb = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (liste) => {
        for (const { name, value } of liste) req.cookies.set(name, value);
        reponse = NextResponse.next({ request: req });
        for (const { name, value, options } of liste) reponse.cookies.set(name, value, options);
      },
    },
  });
  // Vérification sur place de la signature du jeton (rafraîchi automatiquement s'il a expiré).
  const { data } = await sb.auth.getClaims();
  const user = data?.claims?.sub ? data.claims : null;

  const chemin = req.nextUrl.pathname;
  if (!user && PROTEGE.some((r) => r.test(chemin))) {
    const url = req.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = `?suite=${encodeURIComponent(chemin)}`;
    return NextResponse.redirect(url);
  }
  // Déjà connecté : pas besoin de revoir la page de connexion ou d'essai.
  // (Sauf si on arrive avec une erreur, par exemple un compte sans entreprise : sinon on tournerait en rond.)
  if (user && (chemin === "/connexion" || chemin === "/essai") && !req.nextUrl.searchParams.has("erreur")) {
    const url = req.nextUrl.clone();
    url.pathname = "/espace";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return reponse;
}

export const config = {
  // Seulement pour les pages : les API vérifient elles-mêmes la connexion (un passage de moins).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|ico|webmanifest)$).*)"],
};
