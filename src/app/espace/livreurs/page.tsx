"use client";
import { useEffect, useState } from "react";
import { couleurPour } from "@/lib/geo";
import type { Livreur } from "@/lib/types";

export default function PageLivreurs() {
  const [livreurs, setLivreurs] = useState<Livreur[] | null>(null);
  const [form, setForm] = useState({ nom: "", telephone: "", immatriculation: "" });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function charger() {
    const res = await fetch("/api/livreurs", { cache: "no-store" });
    setLivreurs(await res.json());
  }
  useEffect(() => {
    charger();
  }, []);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    setEnvoi(true);
    const res = await fetch("/api/livreurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEnvoi(false);
    if (!res.ok) {
      setErreur((await res.json()).erreur ?? "Erreur.");
      return;
    }
    // Le serveur renvoie le livreur créé : on l'ajoute à la liste sans tout recharger.
    const nouveau: Livreur = await res.json();
    setLivreurs((liste) => [...(liste ?? []), nouveau].sort((a, b) => a.nom.localeCompare(b.nom)));
    setForm({ nom: "", telephone: "", immatriculation: "" });
  }

  async function supprimer(l: Livreur) {
    if (!window.confirm(`Supprimer ${l.nom} (${l.immatriculation}) ?`)) return;
    const res = await fetch(`/api/livreurs/${l.id}`, { method: "DELETE" });
    if (!res.ok) return window.alert((await res.json()).erreur);
    setLivreurs((liste) => (liste ?? []).filter((x) => x.id !== l.id));
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4 md:p-8">
      <h1 className="text-2xl font-bold">Livreurs</h1>
      <p className="mt-1 text-sm text-discret">Enregistrez vos livreurs une seule fois, puis attribuez-leur des courses.</p>

      <form onSubmit={ajouter} className="carte-bloc mt-6 grid gap-4 p-4 md:grid-cols-4 md:items-end">
        <div>
          <label className="etiquette" htmlFor="nom">Nom complet *</label>
          <input id="nom" className="champ" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Konan Yao" />
        </div>
        <div>
          <label className="etiquette" htmlFor="tel">Téléphone (WhatsApp)</label>
          <input id="tel" className="champ" inputMode="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="07 07 12 34 56" />
        </div>
        <div>
          <label className="etiquette" htmlFor="immat">Immatriculation *</label>
          <input id="immat" className="champ uppercase" required value={form.immatriculation} onChange={(e) => setForm({ ...form, immatriculation: e.target.value })} placeholder="1234 AB 01" />
        </div>
        <button className="btn-orange" disabled={envoi}>{envoi ? "Ajout…" : "Ajouter le livreur"}</button>
        {erreur && <p className="text-sm text-rouge md:col-span-4">{erreur}</p>}
      </form>

      <div className="carte-bloc mt-6 divide-y divide-bord">
        {livreurs === null && <p className="p-4 text-sm text-discret">Chargement…</p>}
        {livreurs?.length === 0 && <p className="p-6 text-center text-sm text-discret">Aucun livreur pour l&apos;instant. Ajoutez le premier ci-dessus.</p>}
        {livreurs?.map((l) => (
          <div key={l.id} className="flex items-center gap-3 p-4">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: couleurPour(l.id) }} />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{l.nom}</div>
              <div className="text-sm text-discret">
                <span className="font-mono">{l.immatriculation}</span>
                {l.telephone && <> · {l.telephone}</>}
              </div>
            </div>
            <button type="button" onClick={() => supprimer(l)} className="text-sm text-discret hover:text-rouge">
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
