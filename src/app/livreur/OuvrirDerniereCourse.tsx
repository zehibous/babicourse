"use client";
import { useEffect, useState } from "react";
import { CLE_DERNIERE_COURSE } from "../l/[token]/CourseLivreur";

export default function OuvrirDerniereCourse() {
  const [aucune, setAucune] = useState(false);

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem(CLE_DERNIERE_COURSE);
    } catch {}
    if (token) window.location.replace(`/l/${token}`);
    else setAucune(true);
  }, []);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-fond p-6 text-center">
      <div className="text-5xl">🛵</div>
      <h1 className="mt-4 text-xl font-bold">BabiCourse Livreur</h1>
      <p className="mt-2 max-w-sm text-sm text-discret">
        {aucune
          ? "Aucune course sur ce téléphone pour l'instant. Ouvrez le lien de course que votre responsable vous a envoyé par WhatsApp."
          : "Ouverture de votre course…"}
      </p>
    </div>
  );
}
