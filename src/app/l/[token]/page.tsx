import type { Metadata } from "next";
import { Suspense } from "react";
import CourseLivreur from "./CourseLivreur";

// Page ouverte par le livreur sur son téléphone.
// Son propre fichier d'installation : l'icône installée s'appelle « BabiCourse Livreur »
// et rouvre la dernière course, au lieu de l'espace gérant.
export const metadata: Metadata = {
  title: "Ma course – BabiCourse",
  manifest: "/manifeste-livreur.webmanifest",
};

export default function PageLivreur() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-discret">Chargement…</div>}>
      <CourseLivreur />
    </Suspense>
  );
}
