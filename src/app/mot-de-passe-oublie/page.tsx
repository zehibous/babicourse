"use client";
import Link from "next/link";
import { useState } from "react";
import CadreCompte from "@/components/CadreCompte";

export default function MotDePasseOublie() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    await fetch("/api/auth/oubli", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setEnvoi(false);
    setEnvoye(true);
  }

  return (
    <CadreCompte>
      <div className="carte-bloc p-6">
        <h1 className="text-xl font-bold">Mot de passe oublié</h1>
        {envoye ? (
          <p className="mt-3 text-sm text-discret">
            Si un compte existe pour <strong className="text-texte">{email}</strong>, un e-mail avec un lien vient d&apos;être envoyé.
            Pensez à regarder dans les courriers indésirables.
          </p>
        ) : (
          <form onSubmit={envoyer}>
            <p className="mt-1 text-sm text-discret">Recevez un lien par e-mail pour choisir un nouveau mot de passe.</p>
            <label className="etiquette mt-5" htmlFor="email">E-mail</label>
            <input id="email" type="email" className="champ" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-orange mt-5 w-full !py-3" disabled={envoi}>{envoi ? "Envoi…" : "Recevoir le lien"}</button>
          </form>
        )}
      </div>
      <p className="mt-5 text-center text-sm">
        <Link href="/connexion" className="font-semibold text-orange">← Retour à la connexion</Link>
      </p>
    </CadreCompte>
  );
}
