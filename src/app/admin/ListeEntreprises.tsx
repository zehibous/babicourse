"use client";
import { useEffect, useState } from "react";

type Entreprise = {
  id: string;
  nom: string;
  telephone: string;
  email: string;
  secteur: string | null;
  nb_livreurs: string | null;
  ville: string | null;
  communes: string | null;
  livraisons_jour: string | null;
  outil_actuel: string | null;
  source: string | null;
  statut: "active" | "suspendue";
  cree_le: string;
  gerant: string | null;
  nbLivreursEnregistres: number;
  nbLivraisons: number;
  derniereLivraison: string | null;
};

const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";

export default function ListeEntreprises({ monEntrepriseId }: { monEntrepriseId: string }) {
  const [liste, setListe] = useState<Entreprise[] | null>(null);
  const [erreur, setErreur] = useState("");

  async function charger() {
    const res = await fetch("/api/admin/entreprises", { cache: "no-store" });
    if (!res.ok) return setErreur((await res.json().catch(() => ({}))).erreur ?? "Erreur.");
    setListe(await res.json());
  }
  useEffect(() => {
    charger();
  }, []);

  async function changerStatut(e: Entreprise) {
    const statut = e.statut === "active" ? "suspendue" : "active";
    const msg = statut === "suspendue" ? `Suspendre ${e.nom} ? Ses gérants ne pourront plus se connecter.` : `Réactiver ${e.nom} ?`;
    if (!window.confirm(msg)) return;
    const res = await fetch("/api/admin/entreprises", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: e.id, statut }),
    });
    if (!res.ok) window.alert((await res.json().catch(() => ({}))).erreur ?? "Erreur.");
    charger();
  }

  const actives = liste?.filter((e) => e.nbLivraisons > 0).length ?? 0;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <h1 className="text-2xl font-bold">Administration</h1>
      <p className="mt-1 text-sm text-discret">Les entreprises inscrites à l&apos;essai et leurs réponses au questionnaire.</p>

      {liste && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="carte-bloc p-4">
            <div className="text-2xl font-bold">{liste.length}</div>
            <div className="text-xs text-discret">Entreprises inscrites</div>
          </div>
          <div className="carte-bloc p-4">
            <div className="text-2xl font-bold">{actives}</div>
            <div className="text-xs text-discret">Ont fait au moins une livraison</div>
          </div>
          <div className="carte-bloc p-4">
            <div className="text-2xl font-bold">{liste.reduce((s, e) => s + e.nbLivraisons, 0)}</div>
            <div className="text-xs text-discret">Livraisons au total</div>
          </div>
        </div>
      )}

      {erreur && <p className="mt-5 text-sm text-rouge">{erreur}</p>}
      {liste === null && !erreur && <p className="mt-5 text-sm text-discret">Chargement…</p>}

      <div className="mt-5 space-y-3">
        {liste?.map((e) => (
          <div key={e.id} className={`carte-bloc p-4 ${e.statut === "suspendue" ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">
                  {e.nom}
                  {e.id === monEntrepriseId && <span className="ml-2 rounded-full bg-orange-doux px-2 py-0.5 text-xs text-orange-fonce">vous</span>}
                  {e.statut === "suspendue" && <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-rouge">suspendue</span>}
                </div>
                <div className="text-sm text-discret">
                  {e.gerant ?? "—"} · <a href={`mailto:${e.email}`} className="hover:text-texte">{e.email || "—"}</a> ·{" "}
                  <a href={`tel:${e.telephone}`} className="hover:text-texte">{e.telephone || "—"}</a>
                </div>
              </div>
              <div className="text-right text-xs text-discret">Inscrite le {date(e.cree_le)}</div>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-fond p-3 text-sm sm:grid-cols-4">
              <Info titre="Secteur" valeur={e.secteur} />
              <Info titre="Ville" valeur={[e.ville, e.communes].filter(Boolean).join(" · ") || null} />
              <Info titre="Livreurs (déclarés)" valeur={e.nb_livreurs} />
              <Info titre="Livraisons / jour" valeur={e.livraisons_jour} />
              <Info titre="Suivi actuel" valeur={e.outil_actuel} />
              <Info titre="Nous a connus par" valeur={e.source} />
              <Info titre="Utilisation" valeur={`${e.nbLivreursEnregistres} livreur(s), ${e.nbLivraisons} livraison(s)`} />
              <Info titre="Dernière livraison" valeur={date(e.derniereLivraison)} />
            </dl>

            {e.id !== monEntrepriseId && (
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => changerStatut(e)} className="text-xs font-medium text-discret hover:text-rouge">
                  {e.statut === "active" ? "Suspendre" : "Réactiver"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Info({ titre, valeur }: { titre: string; valeur: string | null }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-discret">{titre}</dt>
      <dd className="font-medium">{valeur || "—"}</dd>
    </div>
  );
}
