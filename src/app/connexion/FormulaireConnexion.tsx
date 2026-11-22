"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const MESSAGES: Record<string, string> = {
  compte: "Ce compte n'est rattaché à aucune entreprise active.",
  lien: "Ce lien a expiré ou a déjà servi. Refaites une demande.",
};

export default function FormulaireConnexion() {
  const params = useSearchParams();
  const suite = params.get("suite");
  const erreurUrl = MESSAGES[params.get("erreur") ?? ""];
  const [email, setEmail] = useState("");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const res = await fetch("/api/auth/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, motDePasse: mdp }),
    });
    setEnvoi(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => ({}))).erreur ?? "Erreur.");
      return;
    }
    // On ne suit que les chemins internes au site.
    const cible = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/espace";
    window.location.href = cible;
  }

  return (
    <>
      <form onSubmit={connecter} className="carte-bloc p-6">
        <h1 className="text-xl font-bold">Connexion</h1>
        <p className="mt-1 text-sm text-discret">Accédez au suivi de vos livreurs.</p>
        {erreurUrl && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-rouge">{erreurUrl}</p>}

        <label className="etiquette mt-5" htmlFor="email">E-mail</label>
        <input id="email" type="email" className="champ" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />

        <div className="mt-4 flex items-baseline justify-between">
          <label className="etiquette" htmlFor="mdp">Mot de passe</label>
          <Link href="/mot-de-passe-oublie" className="text-xs font-medium text-orange">Mot de passe oublié ?</Link>
        </div>
        <input id="mdp" type="password" className="champ" autoComplete="current-password" required value={mdp} onChange={(e) => setMdp(e.target.value)} />

        {erreur && <p className="mt-3 text-sm text-rouge">{erreur}</p>}
        <button className="btn-orange mt-5 w-full !py-3" disabled={envoi}>
          {envoi ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-discret">
        Pas encore de compte ?{" "}
        <Link href="/essai" className="font-semibold text-orange">Essayer BabiCourse</Link>
      </p>
    </>
  );
}
