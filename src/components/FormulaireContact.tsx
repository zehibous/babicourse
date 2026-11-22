"use client";
// Formulaire de contact : le visiteur écrit son message, puis choisit de l'envoyer
// par WhatsApp ou par e-mail. Rien n'est stocké : son application WhatsApp ou e-mail s'ouvre avec le message prêt.
import { useState } from "react";
import { CONTACT } from "@/lib/contact";

export default function FormulaireContact() {
  const [nom, setNom] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  function texte() {
    const lignes = ["Bonjour, je vous contacte depuis le site BabiCourse.", `Nom : ${nom.trim()}`];
    if (entreprise.trim()) lignes.push(`Entreprise : ${entreprise.trim()}`);
    lignes.push("", message.trim());
    return lignes.join("\n");
  }

  function valide() {
    if (!nom.trim()) return "Indiquez votre nom.";
    if (message.trim().length < 5) return "Écrivez votre message.";
    return "";
  }

  function envoyer(canal: "whatsapp" | "email") {
    const msg = valide();
    setErreur(msg);
    if (msg) return;
    if (canal === "whatsapp") {
      window.open(`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(texte())}`, "_blank", "noopener");
    } else {
      const sujet = `Contact BabiCourse${entreprise.trim() ? ` – ${entreprise.trim()}` : ""}`;
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(texte())}`;
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-3" aria-label="Formulaire de contact">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="etiquette" htmlFor="contact-nom">Votre nom</label>
          <input id="contact-nom" className="champ" autoComplete="name" value={nom} onChange={(e) => setNom(e.target.value)} />
        </div>
        <div>
          <label className="etiquette" htmlFor="contact-entreprise">Entreprise <span className="font-normal text-discret">(facultatif)</span></label>
          <input id="contact-entreprise" className="champ" autoComplete="organization" value={entreprise} onChange={(e) => setEntreprise(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="etiquette" htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          className="champ min-h-28 resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Votre question, votre besoin…"
        />
      </div>
      {erreur && <p className="text-sm text-rouge">{erreur}</p>}
      <div className="flex flex-col gap-2 sm:flex-row">
        {CONTACT.whatsapp && (
          <button type="button" onClick={() => envoyer("whatsapp")} className="btn flex-1 bg-[#25D366] !py-3 text-white hover:bg-[#1ebe5b]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3Z" />
            </svg>
            Envoyer par WhatsApp
          </button>
        )}
        {CONTACT.email && (
          <button type="button" onClick={() => envoyer("email")} className="btn-clair flex-1 !py-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
            Envoyer par e-mail
          </button>
        )}
      </div>
    </form>
  );
}
