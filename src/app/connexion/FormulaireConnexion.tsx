"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function FormulaireConnexion() {
  const suite = useSearchParams().get("suite");
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function connecter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const res = await fetch("/api/connexion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motDePasse: mdp }),
    });
    setEnvoi(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => ({}))).erreur ?? "Erreur.");
      return;
    }
    // On ne suit que les chemins internes au site.
    const cible = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/";
    window.location.href = cible;
  }

  return (
    <form onSubmit={connecter} className="carte-bloc w-full max-w-sm p-6">
      <div className="flex items-center gap-2 text-xl font-extrabold">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange text-white">🛵</span>
        Babi<span className="-ml-2 text-orange">Course</span>
      </div>
      <p className="mt-2 text-sm text-discret">Espace gérant. Entrez le mot de passe pour voir vos livreurs.</p>
      <label className="etiquette mt-5" htmlFor="mdp">Mot de passe</label>
      <input
        id="mdp"
        type="password"
        className="champ"
        autoComplete="current-password"
        autoFocus
        value={mdp}
        onChange={(e) => setMdp(e.target.value)}
      />
      {erreur && <p className="mt-2 text-sm text-rouge">{erreur}</p>}
      <button className="btn-orange mt-5 w-full !py-3" disabled={envoi || !mdp}>
        {envoi ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
