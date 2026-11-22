"use client";
// Questionnaire d'essai en 3 étapes : entreprise → activité → compte.
import Link from "next/link";
import { useState } from "react";

const SECTEURS = ["Restaurant / fast-food", "Boutique / commerce", "Pharmacie", "Vente en ligne", "Service de coursiers", "Autre"];
const NB_LIVREURS = ["1 à 3", "4 à 10", "11 à 30", "Plus de 30"];
const LIVRAISONS_JOUR = ["Moins de 10", "10 à 50", "50 à 200", "Plus de 200"];
const OUTILS = ["Appels téléphoniques", "WhatsApp (position partagée)", "Un autre logiciel", "Aucun suivi"];
const SOURCES = ["Bouche-à-oreille", "Réseaux sociaux", "WhatsApp", "Recherche Google", "Autre"];

type Reponses = {
  entreprise: { nom: string; secteur: string; ville: string; communes: string };
  activite: { nbLivreurs: string; livraisonsJour: string; outilActuel: string; source: string };
  compte: { nom: string; email: string; telephone: string; motDePasse: string };
  site: string;
};

const ETAPES = ["Votre entreprise", "Vos livraisons", "Votre compte"];

function Choix({ options, valeur, onChange, nom }: { options: string[]; valeur: string; onChange: (v: string) => void; nom: string }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={nom}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={valeur === o}
          onClick={() => onChange(o)}
          className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
            valeur === o ? "border-orange bg-orange-doux font-semibold text-orange-fonce" : "border-bord bg-surface hover:bg-fond"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function Questionnaire() {
  const [etape, setEtape] = useState(0);
  const [r, setR] = useState<Reponses>({
    entreprise: { nom: "", secteur: "", ville: "Abidjan", communes: "" },
    activite: { nbLivreurs: "", livraisonsJour: "", outilActuel: "", source: "" },
    compte: { nom: "", email: "", telephone: "", motDePasse: "" },
    site: "",
  });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const majE = (p: Partial<Reponses["entreprise"]>) => setR((x) => ({ ...x, entreprise: { ...x.entreprise, ...p } }));
  const majA = (p: Partial<Reponses["activite"]>) => setR((x) => ({ ...x, activite: { ...x.activite, ...p } }));
  const majC = (p: Partial<Reponses["compte"]>) => setR((x) => ({ ...x, compte: { ...x.compte, ...p } }));

  function etapeValide(): string {
    if (etape === 0) {
      if (!r.entreprise.nom.trim()) return "Indiquez le nom de votre entreprise.";
      if (!r.entreprise.secteur) return "Choisissez votre secteur d'activité.";
      if (!r.entreprise.ville.trim()) return "Indiquez votre ville.";
    }
    if (etape === 1) {
      if (!r.activite.nbLivreurs) return "Indiquez combien de livreurs vous avez.";
      if (!r.activite.livraisonsJour) return "Indiquez combien de livraisons vous faites par jour.";
      if (!r.activite.outilActuel) return "Indiquez comment vous suivez vos livreurs aujourd'hui.";
    }
    return "";
  }

  function suivant(e: React.FormEvent) {
    e.preventDefault();
    const msg = etapeValide();
    setErreur(msg);
    if (!msg) setEtape((x) => x + 1);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (r.compte.motDePasse.length < 8) return setErreur("Le mot de passe doit faire au moins 8 caractères.");
    setEnvoi(true);
    const res = await fetch("/api/auth/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(r),
    });
    if (!res.ok) {
      setEnvoi(false);
      setErreur((await res.json().catch(() => ({}))).erreur ?? "Erreur. Réessayez.");
      return;
    }
    window.location.href = "/espace";
  }

  return (
    <>
      <div className="carte-bloc p-6">
        {/* Progression */}
        <div className="flex gap-1.5" aria-hidden>
          {ETAPES.map((_, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= etape ? "bg-orange" : "bg-stone-200"}`} />
          ))}
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-discret">
          Étape {etape + 1} sur 3
        </p>
        <h1 className="mt-1 text-xl font-bold">{ETAPES[etape]}</h1>

        {etape === 0 && (
          <form onSubmit={suivant} className="mt-5 space-y-4">
            <div>
              <label className="etiquette" htmlFor="nom-entreprise">Nom de l&apos;entreprise</label>
              <input id="nom-entreprise" className="champ" autoFocus value={r.entreprise.nom} onChange={(e) => majE({ nom: e.target.value })} placeholder="Ex : Chez Tantie Awa" />
            </div>
            <div>
              <span className="etiquette">Secteur d&apos;activité</span>
              <Choix nom="Secteur" options={SECTEURS} valeur={r.entreprise.secteur} onChange={(v) => majE({ secteur: v })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiquette" htmlFor="ville">Ville</label>
                <input id="ville" className="champ" value={r.entreprise.ville} onChange={(e) => majE({ ville: e.target.value })} />
              </div>
              <div>
                <label className="etiquette" htmlFor="communes">Communes livrées <span className="font-normal text-discret">(facultatif)</span></label>
                <input id="communes" className="champ" value={r.entreprise.communes} onChange={(e) => majE({ communes: e.target.value })} placeholder="Cocody, Marcory…" />
              </div>
            </div>
            {erreur && <p className="text-sm text-rouge">{erreur}</p>}
            <button className="btn-orange w-full !py-3">Continuer</button>
          </form>
        )}

        {etape === 1 && (
          <form onSubmit={suivant} className="mt-5 space-y-4">
            <div>
              <span className="etiquette">Combien de livreurs avez-vous ?</span>
              <Choix nom="Nombre de livreurs" options={NB_LIVREURS} valeur={r.activite.nbLivreurs} onChange={(v) => majA({ nbLivreurs: v })} />
            </div>
            <div>
              <span className="etiquette">Combien de livraisons par jour ?</span>
              <Choix nom="Livraisons par jour" options={LIVRAISONS_JOUR} valeur={r.activite.livraisonsJour} onChange={(v) => majA({ livraisonsJour: v })} />
            </div>
            <div>
              <span className="etiquette">Comment suivez-vous vos livreurs aujourd&apos;hui ?</span>
              <Choix nom="Outil actuel" options={OUTILS} valeur={r.activite.outilActuel} onChange={(v) => majA({ outilActuel: v })} />
            </div>
            <div>
              <label className="etiquette" htmlFor="source">Comment avez-vous connu BabiCourse ? <span className="font-normal text-discret">(facultatif)</span></label>
              <select id="source" className="champ" value={r.activite.source} onChange={(e) => majA({ source: e.target.value })}>
                <option value="">—</option>
                {SOURCES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {erreur && <p className="text-sm text-rouge">{erreur}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setErreur(""); setEtape(0); }} className="btn-clair !py-3">Retour</button>
              <button className="btn-orange flex-1 !py-3">Continuer</button>
            </div>
          </form>
        )}

        {etape === 2 && (
          <form onSubmit={envoyer} className="mt-5 space-y-4">
            <div>
              <label className="etiquette" htmlFor="nom">Votre nom</label>
              <input id="nom" className="champ" autoComplete="name" required autoFocus value={r.compte.nom} onChange={(e) => majC({ nom: e.target.value })} />
            </div>
            <div>
              <label className="etiquette" htmlFor="email">E-mail</label>
              <input id="email" type="email" className="champ" autoComplete="email" required value={r.compte.email} onChange={(e) => majC({ email: e.target.value })} />
            </div>
            <div>
              <label className="etiquette" htmlFor="tel">Téléphone (WhatsApp)</label>
              <input id="tel" className="champ" inputMode="tel" autoComplete="tel" required value={r.compte.telephone} onChange={(e) => majC({ telephone: e.target.value })} placeholder="07 07 12 34 56" />
            </div>
            <div>
              <label className="etiquette" htmlFor="mdp">Mot de passe</label>
              <input id="mdp" type="password" className="champ" autoComplete="new-password" required minLength={8} value={r.compte.motDePasse} onChange={(e) => majC({ motDePasse: e.target.value })} />
              <p className="mt-1 text-xs text-discret">8 caractères minimum.</p>
            </div>
            {/* Champ piège pour les robots, invisible pour les humains */}
            <input type="text" name="site" tabIndex={-1} autoComplete="off" value={r.site} onChange={(e) => setR((x) => ({ ...x, site: e.target.value }))} className="hidden" aria-hidden />
            {erreur && <p className="text-sm text-rouge">{erreur}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setErreur(""); setEtape(1); }} className="btn-clair !py-3" disabled={envoi}>Retour</button>
              <button className="btn-orange flex-1 !py-3" disabled={envoi}>{envoi ? "Création…" : "Créer mon espace"}</button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-5 text-center text-sm text-discret">
        Déjà un compte ? <Link href="/connexion" className="font-semibold text-orange">Se connecter</Link>
      </p>
    </>
  );
}
