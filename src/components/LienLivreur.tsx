"use client";
// Boutons pour envoyer au livreur son lien de suivi.
import { useState } from "react";
import { numeroWhatsApp } from "@/lib/geo";
import type { LivraisonAvecLivreur } from "@/lib/types";

export function lienCourse(token: string) {
  return `${window.location.origin}/l/${token}`;
}

export default function LienLivreur({ livraison, compact }: { livraison: LivraisonAvecLivreur; compact?: boolean }) {
  const [copie, setCopie] = useState(false);
  const lien = typeof window === "undefined" ? "" : lienCourse(livraison.token);
  const message =
    `Bonjour ${livraison.livreur?.nom ?? ""}, voici votre course BabiCourse.\n` +
    `Destination : ${livraison.destination.label}` +
    (livraison.destination.repere ? ` (${livraison.destination.repere})` : "") +
    `\nOuvrez ce lien et appuyez sur "Démarrer la course" :\n${lien}`;
  const tel = livraison.livreur?.telephone ? numeroWhatsApp(livraison.livreur.telephone) : "";
  const wa = `https://wa.me/${tel}?text=${encodeURIComponent(message)}`;

  async function copier() {
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", lien);
    }
  }

  const taille = compact ? "!px-2.5 !py-1 !text-xs" : "";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={wa} target="_blank" rel="noreferrer" className={`btn bg-[#25D366] text-white hover:bg-[#1ebe5b] ${taille}`}>
        Envoyer par WhatsApp
      </a>
      <button type="button" onClick={copier} className={`btn-clair ${taille}`}>
        {copie ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}
