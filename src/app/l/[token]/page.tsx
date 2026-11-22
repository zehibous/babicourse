import { Suspense } from "react";
import CourseLivreur from "./CourseLivreur";

// Page ouverte par le livreur sur son téléphone.
export default function PageLivreur() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-discret">Chargement…</div>}>
      <CourseLivreur />
    </Suspense>
  );
}
