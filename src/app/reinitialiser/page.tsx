"use client";
import { useState } from "react";
import CadreCompte from "@/components/CadreCompte";

export default function Reinitialiser() {
  const [mdp, setMdp] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const res = await fetch("/api/auth/nouveau-mot-de-passe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motDePasse: mdp }),
    });
    setEnvoi(false);
    if (!res.ok) return setErreur((await res.json().catch(() => ({}))).erreur ?? "Erreur.");
    window.location.href = "/espace";
  }

  return (
    <CadreCompte>
      <form onSubmit={envoyer} className="carte-bloc p-6">
        <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
        <label className="etiquette mt-5" htmlFor="mdp">Mot de passe</label>
        <input id="mdp" type="password" className="champ" autoComplete="new-password" required minLength={8} value={mdp} onChange={(e) => setMdp(e.target.value)} />
        <p className="mt-1 text-xs text-discret">8 caractères minimum.</p>
        {erreur && <p className="mt-3 text-sm text-rouge">{erreur}</p>}
        <button className="btn-orange mt-5 w-full !py-3" disabled={envoi}>{envoi ? "Enregistrement…" : "Enregistrer"}</button>
      </form>
    </CadreCompte>
  );
}
