"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Carte from "@/components/Carte";
import LienLivreur from "@/components/LienLivreur";
import { STATUTS_ACTIFS, type LivraisonAvecLivreur, type Livreur } from "@/lib/types";

type Resultat = { label: string; lat: number; lng: number };

export default function NouvelleLivraison() {
  const [livreurs, setLivreurs] = useState<Livreur[] | null>(null);
  const [occupes, setOccupes] = useState<Set<string>>(new Set());
  const [livreurId, setLivreurId] = useState("");
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState<Resultat[] | null>(null);
  const [cherche, setCherche] = useState(false);
  const [dest, setDest] = useState<Resultat | null>(null);
  const [repere, setRepere] = useState("");
  const [client, setClient] = useState({ nom: "", telephone: "" });
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [creee, setCreee] = useState<LivraisonAvecLivreur | null>(null);
  const [cadrageCle, setCadrageCle] = useState(0);

  useEffect(() => {
    (async () => {
      const [lv, la] = await Promise.all([
        fetch("/api/livreurs", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/livraisons?vue=actives", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setLivreurs(lv);
      setOccupes(
        new Set((la as LivraisonAvecLivreur[]).filter((l) => STATUTS_ACTIFS.includes(l.statut)).map((l) => l.livreurId ?? "")),
      );
    })();
  }, []);

  async function chercher(e?: React.FormEvent) {
    e?.preventDefault();
    if (recherche.trim().length < 3) return;
    setCherche(true);
    setResultats(null);
    try {
      // Recherche d'adresse gratuite OpenStreetMap (Nominatim), limitée à la Côte d'Ivoire.
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=ci&accept-language=fr&q=${encodeURIComponent(recherche)}`;
      const res = await fetch(url);
      const data: { display_name: string; lat: string; lon: string }[] = await res.json();
      setResultats(data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })));
    } catch {
      setResultats([]);
    }
    setCherche(false);
  }

  function choisir(r: Resultat) {
    setDest({ ...r, label: r.label.split(",").slice(0, 3).join(",").trim() });
    setResultats(null);
    setCadrageCle(Date.now());
  }

  async function creer() {
    setErreur("");
    if (!livreurId) return setErreur("Choisissez un livreur.");
    if (!dest) return setErreur("Choisissez la destination (recherche ou clic sur la carte).");
    if (!dest.label.trim()) return setErreur("Donnez un nom à la destination.");
    setEnvoi(true);
    const res = await fetch("/api/livraisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livreurId, destination: { ...dest, repere }, client }),
    });
    setEnvoi(false);
    const data = await res.json();
    if (!res.ok) return setErreur(data.erreur ?? "Erreur.");
    setCreee(data);
  }

  if (creee) {
    return (
      <div className="mx-auto w-full max-w-xl p-4 md:p-8">
        <div className="carte-bloc p-6">
          <div className="text-3xl">✅</div>
          <h1 className="mt-2 text-xl font-bold">Livraison créée</h1>
          <p className="mt-2 text-sm text-discret">
            Envoyez maintenant le lien à <strong className="text-texte">{creee.livreur?.nom}</strong>. Quand il l&apos;ouvre et
            appuie sur « Démarrer la course », sa position apparaît sur la carte.
          </p>
          <div className="mt-3 rounded-lg bg-fond p-3 text-sm">🏁 {creee.destination.label}</div>
          <div className="mt-5">
            <LienLivreur livraison={creee} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2 border-t border-bord pt-5">
            <Link href="/" className="btn-orange">Voir sur la carte</Link>
            <a href={`/l/${creee.token}?simulation=1`} target="_blank" rel="noreferrer" className="btn-clair">
              Tester avec un trajet simulé
            </a>
            <button
              type="button"
              className="btn-clair"
              onClick={() => {
                setCreee(null);
                setDest(null);
                setLivreurId("");
                setRepere("");
                setClient({ nom: "", telephone: "" });
                setRecherche("");
              }}
            >
              Créer une autre
            </button>
          </div>
        </div>
      </div>
    );
  }

  const libres = livreurs?.filter((l) => !occupes.has(l.id)) ?? [];

  return (
    <div className="flex flex-1 flex-col lg:h-screen lg:flex-row">
      <div className="space-y-5 overflow-y-auto bg-surface p-4 md:p-6 lg:w-[440px] lg:border-r lg:border-bord">
        <h1 className="text-xl font-bold">Nouvelle livraison</h1>

        {/* 1. Livreur */}
        <section>
          <label className="etiquette" htmlFor="livreur">1. Livreur</label>
          {livreurs?.length === 0 ? (
            <p className="text-sm text-discret">
              Aucun livreur enregistré. <Link href="/livreurs" className="font-semibold text-orange">Ajouter un livreur →</Link>
            </p>
          ) : (
            <select id="livreur" className="champ" value={livreurId} onChange={(e) => setLivreurId(e.target.value)}>
              <option value="">— Choisir un livreur —</option>
              {libres.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nom} · {l.immatriculation}
                </option>
              ))}
            </select>
          )}
          {livreurs && livreurs.length > 0 && libres.length < livreurs.length && (
            <p className="mt-1 text-xs text-discret">Les livreurs déjà en course ne sont pas proposés.</p>
          )}
        </section>

        {/* 2. Destination */}
        <section>
          <span className="etiquette">2. Destination</span>
          <form onSubmit={chercher} className="flex gap-2">
            <input
              className="champ"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Ex : Riviera Palmeraie, Cocody"
            />
            <button className="btn-clair" disabled={cherche}>{cherche ? "…" : "Chercher"}</button>
          </form>
          {resultats && (
            <div className="mt-2 divide-y divide-bord rounded-lg border border-bord">
              {resultats.length === 0 && <p className="p-3 text-sm text-discret">Rien trouvé. Cliquez directement sur la carte.</p>}
              {resultats.map((r, i) => (
                <button key={i} type="button" onClick={() => choisir(r)} className="block w-full p-3 text-left text-sm hover:bg-fond">
                  {r.label}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-discret">💡 Vous pouvez aussi cliquer sur la carte pour placer le point exact.</p>

          {dest && (
            <div className="mt-3 space-y-3 rounded-lg bg-orange-doux p-3">
              <div>
                <label className="etiquette" htmlFor="label">Nom de la destination</label>
                <input id="label" className="champ" value={dest.label} onChange={(e) => setDest({ ...dest, label: e.target.value })} />
              </div>
              <div>
                <label className="etiquette" htmlFor="repere">Repère (facultatif)</label>
                <input id="repere" className="champ" value={repere} onChange={(e) => setRepere(e.target.value)} placeholder="Ex : derrière la pharmacie, portail bleu" />
              </div>
            </div>
          )}
        </section>

        {/* 3. Client */}
        <section>
          <span className="etiquette">3. Client (facultatif)</span>
          <div className="grid grid-cols-2 gap-2">
            <input className="champ" value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} placeholder="Nom" />
            <input className="champ" inputMode="tel" value={client.telephone} onChange={(e) => setClient({ ...client, telephone: e.target.value })} placeholder="Téléphone" />
          </div>
        </section>

        {erreur && <p className="text-sm text-rouge">{erreur}</p>}
        <button type="button" onClick={creer} disabled={envoi} className="btn-orange w-full !py-3">
          {envoi ? "Création…" : "Créer la livraison"}
        </button>
      </div>

      <div className="h-[50vh] lg:h-auto lg:flex-1">
        <Carte
          marqueurs={dest ? [{ id: "dest", type: "destination", lat: dest.lat, lng: dest.lng, infobulle: dest.label }] : []}
          cadrage={dest ? { cle: cadrageCle, points: [[dest.lat, dest.lng]] } : undefined}
          onClic={(lat, lng) =>
            setDest((d) => ({ lat, lng, label: d?.label && d.label !== "Point choisi sur la carte" ? d.label : "Point choisi sur la carte" }))
          }
        />
      </div>
    </div>
  );
}
