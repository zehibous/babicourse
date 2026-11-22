import { redirect } from "next/navigation";
import { Suspense } from "react";
import Navigation from "@/components/Navigation";
import { gerantCourant } from "@/lib/auth";

// Espace du gérant : réservé aux comptes rattachés à une entreprise active.
async function NavigationGerant() {
  const g = await gerantCourant();
  if (!g) redirect("/connexion?erreur=compte");
  return <Navigation infos={{ entreprise: g.entreprise.nom, email: g.email, estAdmin: g.estAdmin }} />;
}

export default function LayoutGerant({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      <Suspense
        fallback={<div className="h-14 border-b border-bord bg-surface lg:h-screen lg:w-60 lg:border-b-0 lg:border-r" />}
      >
        <NavigationGerant />
      </Suspense>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
