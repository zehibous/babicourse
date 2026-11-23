"use client";
// Boutons pour envoyer au livreur son lien de suivi.
//
// Sur téléphone, WhatsApp s'ouvre par son lien d'application (whatsapp://) : la page BabiCourse
// reste ouverte derrière, et on la retrouve telle quelle en revenant (bouton retour ou appli récente).
// Avant, le lien wa.me ouvrait un nouvel onglet vide, et le retour tombait sur cet onglet.
import { useEffect, useState } from "react";
import { numeroWhatsApp } from "@/lib/geo";
import { URL_SITE } from "@/lib/site";
import type { LivraisonAvecLivreur } from "@/lib/types";

/** Lien envoyé au livreur : toujours l'adresse officielle (sauf pendant les essais sur l'ordinateur). */
export function lienCourse(token: string) {
  const essaiLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  return `${essaiLocal ? window.location.origin : URL_SITE}/l/${token}`;
}

type Props = { livraison: LivraisonAvecLivreur; compact?: boolean; onEnvoye?: () => void };

export default function LienLivreur({ livraison, compact, onEnvoye }: Props) {
  const [copie, setCopie] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [partageDispo, setPartageDispo] = useState(false);

  useEffect(() => {
    setMobile(window.matchMedia("(pointer: coarse)").matches);
    setPartageDispo(typeof navigator.share === "function");
  }, []);

  const lien = typeof window === "undefined" ? "" : lienCourse(livraison.token);
  const message =
    `Bonjour ${livraison.livreur?.nom ?? ""}, voici votre course BabiCourse.\n` +
    `Destination : ${livraison.destination.label}` +
    (livraison.destination.repere ? ` (${livraison.destination.repere})` : "") +
    `\nOuvrez ce lien et appuyez sur "Démarrer la course" :\n${lien}`;
  const tel = livraison.livreur?.telephone ? numeroWhatsApp(livraison.livreur.telephone) : "";

  function marquerEnvoye() {
    setEnvoye(true);
    onEnvoye?.();
  }

  function whatsapp() {
    const texte = encodeURIComponent(message);
    if (mobile) {
      // Ouvre l'application WhatsApp directement, sans quitter ni remplacer la page.
      const avant = Date.now();
      window.location.href = `whatsapp://send?${tel ? `phone=${tel}&` : ""}text=${texte}`;
      // Si WhatsApp n'est pas installé, rien ne s'ouvre : on bascule sur WhatsApp Web.
      setTimeout(() => {
        if (document.visibilityState === "visible" && Date.now() - avant < 2500) {
          window.location.href = `https://wa.me/${tel}?text=${texte}`;
        }
      }, 1500);
    } else {
      window.open(`https://wa.me/${tel}?text=${texte}`, "_blank", "noopener");
    }
    marquerEnvoye();
  }

  async function partager() {
    try {
      await navigator.share({ title: "Course BabiCourse", text: message });
      marquerEnvoye();
    } catch {
      // Partage annulé par l'utilisateur : rien à faire.
    }
  }

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
      <button type="button" onClick={whatsapp} className={`btn bg-[#25D366] text-white hover:bg-[#1ebe5b] ${taille}`}>
        {envoye ? "Renvoyer par WhatsApp" : "Envoyer par WhatsApp"}
      </button>
      {mobile && partageDispo && (
        <button type="button" onClick={partager} className={`btn-clair ${taille}`} title="SMS, Telegram, autres applications">
          Autre appli
        </button>
      )}
      <button type="button" onClick={copier} className={`btn-clair ${taille}`}>
        {copie ? "Lien copié ✓" : "Copier le lien"}
      </button>
    </div>
  );
}
