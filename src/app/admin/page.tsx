import { redirect } from "next/navigation";
import { Suspense } from "react";
import Navigation from "@/components/Navigation";
import { gerantCourant } from "@/lib/auth";
import ListeEntreprises from "./ListeEntreprises";

// Administration du SaaS : réservée aux e-mails listés dans ADMIN_EMAILS.
async function Contenu() {
  const g = await gerantCourant();
  if (!g) redirect("/connexion?erreur=compte");
  if (!g.estAdmin) redirect("/espace");
  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      <Navigation infos={{ entreprise: g.entreprise.nom, email: g.email, estAdmin: true }} />
      <main className="min-w-0 flex-1">
        <ListeEntreprises monEntrepriseId={g.entreprise.id} />
      </main>
    </div>
  );
}

export default function PageAdmin() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-discret">Chargement…</div>}>
      <Contenu />
    </Suspense>
  );
}
