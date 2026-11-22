import { NextResponse } from "next/server";
import { clientSession } from "@/lib/supabase";

// Retour depuis un lien envoyé par Supabase (ex. mot de passe oublié).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const suite = url.searchParams.get("suite") ?? "/espace";
  const cible = suite.startsWith("/") && !suite.startsWith("//") ? suite : "/espace";
  if (code) {
    const sb = await clientSession();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(cible, url.origin));
  }
  return NextResponse.redirect(new URL("/connexion?erreur=lien", url.origin));
}
