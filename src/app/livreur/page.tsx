import type { Metadata } from "next";
import OuvrirDerniereCourse from "./OuvrirDerniereCourse";

// Page d'ouverture de l'icône « BabiCourse Livreur » : renvoie vers la dernière course ouverte sur ce téléphone.
export const metadata: Metadata = {
  title: "BabiCourse Livreur",
  manifest: "/manifeste-livreur.webmanifest",
};

export default function PageLivreur() {
  return <OuvrirDerniereCourse />;
}
