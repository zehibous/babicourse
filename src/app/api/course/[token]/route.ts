// API utilisée par le téléphone du livreur (accès par le lien secret).
import { connection } from "next/server";
import { db } from "@/lib/db";
import { distanceMetres, RAYON_ARRIVEE_M } from "@/lib/geo";

export async function GET(_req: Request, ctx: RouteContext<"/api/course/[token]">) {
  await connection();
  const { token } = await ctx.params;
  const l = await db.parToken(token);
  if (!l) return Response.json({ erreur: "Lien invalide." }, { status: 404 });
  return Response.json(l);
}

// Le téléphone envoie sa position.
export async function POST(req: Request, ctx: RouteContext<"/api/course/[token]">) {
  const { token } = await ctx.params;
  const c = await req.json().catch(() => ({}));
  const lat = Number(c.lat);
  const lng = Number(c.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ erreur: "Position invalide." }, { status: 400 });
  }
  let refus = false;
  const r = await db.modifierLivraison({ token }, (l) => {
    if (l.statut === "livree" || l.statut === "annulee") {
      refus = true;
      return;
    }
    const maintenant = new Date().toISOString();
    l.dernierePosition = {
      lat,
      lng,
      precision: Number.isFinite(c.precision) ? c.precision : null,
      vitesse: Number.isFinite(c.vitesse) ? c.vitesse : null,
      le: maintenant,
    };
    const dernier = l.trace[l.trace.length - 1];
    if (!dernier || distanceMetres({ lat: dernier[0], lng: dernier[1] }, { lat, lng }) > 10) {
      l.trace.push([lat, lng]);
      if (l.trace.length > 3000) l.trace.splice(0, l.trace.length - 3000);
    }
    if (l.statut === "en_attente") {
      l.statut = "en_route";
      l.demarreLe = maintenant;
    }
    if (l.statut === "en_route" && distanceMetres({ lat, lng }, l.destination) <= RAYON_ARRIVEE_M) {
      l.statut = "arrivee";
      l.arriveLe = maintenant;
    }
  });
  if (!r) return Response.json({ erreur: "Lien invalide." }, { status: 404 });
  if (refus) return Response.json({ erreur: "Cette livraison est terminée.", livraison: r }, { status: 409 });
  return Response.json(r);
}

// Le livreur appuie sur "Livré".
export async function PATCH(req: Request, ctx: RouteContext<"/api/course/[token]">) {
  const { token } = await ctx.params;
  const { action } = await req.json().catch(() => ({}));
  if (action !== "livree") return Response.json({ erreur: "Action inconnue." }, { status: 400 });
  const r = await db.modifierLivraison({ token }, (l) => {
    if (l.statut === "livree" || l.statut === "annulee") return;
    l.statut = "livree";
    l.livreLe = new Date().toISOString();
  });
  if (!r) return Response.json({ erreur: "Lien invalide." }, { status: 404 });
  return Response.json(r);
}
