"use client";
import dynamic from "next/dynamic";
export type { MarqueurCarte, LigneCarte, CarteProps } from "./CarteLeaflet";

// Leaflet a besoin du navigateur : on ne l'affiche jamais côté serveur.
const Carte = dynamic(() => import("./CarteLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-stone-100 text-sm text-discret">
      Chargement de la carte…
    </div>
  ),
});

export default Carte;
