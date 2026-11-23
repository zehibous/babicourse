"use client";
// Bouton « Installer l'appli » : apparaît seulement quand le navigateur le permet
// (Chrome sur Android, Chrome/Edge sur ordinateur) et que l'appli n'est pas déjà installée.
import { useEffect, useState } from "react";

type EvenementInstallation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function BoutonInstaller() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);

  useEffect(() => {
    const retenir = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
    };
    const installee = () => setEvenement(null);
    window.addEventListener("beforeinstallprompt", retenir);
    window.addEventListener("appinstalled", installee);
    return () => {
      window.removeEventListener("beforeinstallprompt", retenir);
      window.removeEventListener("appinstalled", installee);
    };
  }, []);

  if (!evenement) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        await evenement.prompt();
        await evenement.userChoice;
        setEvenement(null);
      }}
      className="mb-1 flex w-full items-center gap-3 rounded-lg bg-orange-doux px-3 py-3 text-[15px] font-semibold text-orange-fonce transition hover:bg-orange hover:text-white lg:py-2.5 lg:text-sm"
    >
      <span aria-hidden className="w-5 text-center">📲</span>
      Installer l&apos;appli
    </button>
  );
}
