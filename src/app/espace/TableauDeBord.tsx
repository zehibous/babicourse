"use client";
// Carte en direct : tous les livreurs en course, leur trajet et leur heure d'arrivée.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Carte, { type LigneCarte, type MarqueurCarte } from "@/components/Carte";
import BadgeStatut from "@/components/BadgeStatut";
import LienLivreur from "@/components/LienLivreur";
import {
  couleurPour,
  distanceMetres,
  formatDistance,
  formatDuree,
  formatHeure,
  ilYa,
  itineraireRoute,
  type Itineraire,
} from "@/lib/geo";
import type { LivraisonAvecLivreur } from "@/lib/types";

const INTERVALLE_MAJ_MS = 4000;
const SIGNAL_PERDU_MS = 2 * 60 * 1000;

type Calcul = Itineraire & { calculeLe: number; depuis: { lat: number; lng: number } };

/** Petit son de notification. */
function bip() {
  try {
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {}
}

function initiales(nom?: string) {
  if (!nom) return "?";
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]!.toUpperCase())
    .join("");
}

export default function TableauDeBord() {
  const [livraisons, setLivraisons] = useState<LivraisonAvecLivreur[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [itineraires, setItineraires] = useState<Record<string, Calcul>>({});
  const [cadrage, setCadrage] = useState<{ cle: number; points: [number, number][] }>();
  const [selection, setSelection] = useState<string | null>(null);
  const [alertes, setAlertes] = useState<{ id: number; texte: string }[]>([]);
  const [, setTic] = useState(0);
  const statutsPrecedents = useRef<Record<string, string>>({});
  const premierCadrage = useRef(false);
  const calculEnCours = useRef(false);

  const charger = useCallback(async () => {
    try {
      const res = await fetch("/api/livraisons?vue=actives", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const liste: LivraisonAvecLivreur[] = await res.json();
      // Alertes quand un livreur arrive ou livre.
      const nouvelles: string[] = [];
      const vus = new Set(liste.map((l) => l.id));
      for (const l of liste) {
        const avant = statutsPrecedents.current[l.id];
        if (avant && avant !== l.statut) {
          if (l.statut === "arrivee") nouvelles.push(`📍 ${l.livreur?.nom} est arrivé à destination.`);
          if (l.statut === "en_route") nouvelles.push(`🛵 ${l.livreur?.nom} a démarré la course.`);
        }
        statutsPrecedents.current[l.id] = l.statut;
      }
      for (const id of Object.keys(statutsPrecedents.current)) {
        if (!vus.has(id)) {
          delete statutsPrecedents.current[id];
          nouvelles.push("✅ Une livraison vient d'être terminée.");
        }
      }
      if (nouvelles.length) {
        const t = Date.now();
        setAlertes((a) => [...a, ...nouvelles.map((texte, i) => ({ id: t + i, texte }))]);
        bip();
      }
      setLivraisons(liste);
      setErreur(false);
    } catch {
      setErreur(true);
    }
  }, []);

  useEffect(() => {
    charger();
    const t = setInterval(charger, INTERVALLE_MAJ_MS);
    const tic = setInterval(() => setTic((x) => x + 1), 1000);
    return () => {
      clearInterval(t);
      clearInterval(tic);
    };
  }, [charger]);

  // Les alertes disparaissent après 6 secondes.
  useEffect(() => {
    if (!alertes.length) return;
    const t = setTimeout(() => setAlertes((a) => a.slice(1)), 6000);
    return () => clearTimeout(t);
  }, [alertes]);

  // Calcul du trajet par la route (au plus toutes les 30 s par livreur).
  useEffect(() => {
    if (!livraisons || calculEnCours.current) return;
    const aCalculer = livraisons.filter((l) => {
      if (!l.dernierePosition || l.statut !== "en_route") return false;
      const c = itineraires[l.id];
      if (!c) return true;
      return Date.now() - c.calculeLe > 30000 && distanceMetres(c.depuis, l.dernierePosition) > 30;
    });
    if (!aCalculer.length) return;
    calculEnCours.current = true;
    (async () => {
      for (const l of aCalculer) {
        const pos = l.dernierePosition!;
        const r = await itineraireRoute(pos, l.destination);
        if (r) setItineraires((prev) => ({ ...prev, [l.id]: { ...r, calculeLe: Date.now(), depuis: pos } }));
      }
      calculEnCours.current = false;
    })();
  }, [livraisons, itineraires]);

  // Premier cadrage automatique sur tous les points.
  const tousLesPoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const l of livraisons ?? []) {
      pts.push([l.destination.lat, l.destination.lng]);
      if (l.dernierePosition) pts.push([l.dernierePosition.lat, l.dernierePosition.lng]);
    }
    return pts;
  }, [livraisons]);

  useEffect(() => {
    if (!premierCadrage.current && tousLesPoints.length) {
      premierCadrage.current = true;
      setCadrage({ cle: Date.now(), points: tousLesPoints });
    }
  }, [tousLesPoints]);

  function infosTrajet(l: LivraisonAvecLivreur) {
    if (!l.dernierePosition) return null;
    const c = itineraires[l.id];
    const restantDirect = distanceMetres(l.dernierePosition, l.destination);
    if (c) {
      // On retire la distance déjà faite depuis le dernier calcul (approximation).
      const fait = distanceMetres(c.depuis, l.dernierePosition);
      const ratio = c.distance > 0 ? Math.max(0, (c.distance - fait) / c.distance) : 0;
      const distance = Math.max(restantDirect, c.distance * ratio);
      const duree = c.duree * ratio;
      return { distance, duree, parRoute: true };
    }
    // Sans trajet calculé : vol d'oiseau, à 20 km/h en moyenne.
    return { distance: restantDirect, duree: restantDirect / (20 / 3.6), parRoute: false };
  }

  const marqueurs: MarqueurCarte[] = [];
  const lignes: LigneCarte[] = [];
  for (const l of livraisons ?? []) {
    const couleur = couleurPour(l.livreurId ?? l.id);
    marqueurs.push({
      id: `dest-${l.id}`,
      type: "destination",
      lat: l.destination.lat,
      lng: l.destination.lng,
      infobulle: `Destination de ${l.livreur?.nom ?? "?"} : ${l.destination.label}`,
    });
    if (l.trace.length > 1) {
      lignes.push({ id: `trace-${l.id}`, points: l.trace, couleur, epaisseur: 4, opacite: 0.35 });
    }
    if (l.dernierePosition) {
      const p = l.dernierePosition;
      const perdu = Date.now() - new Date(p.le).getTime() > SIGNAL_PERDU_MS;
      const it = itineraires[l.id];
      if (l.statut === "en_route") {
        lignes.push({
          id: `route-${l.id}`,
          points: it ? [[p.lat, p.lng], ...it.points] : [[p.lat, p.lng], [l.destination.lat, l.destination.lng]],
          couleur,
          pointillee: !it,
          opacite: selection && selection !== l.id ? 0.35 : 0.85,
        });
      }
      marqueurs.push({
        id: `livreur-${l.id}`,
        type: "livreur",
        lat: p.lat,
        lng: p.lng,
        couleur,
        perdu,
        texte: initiales(l.livreur?.nom),
        infobulle: `${l.livreur?.nom ?? "?"} · ${l.livreur?.immatriculation ?? ""}${perdu ? " · signal perdu" : ""}`,
      });
    }
  }

  async function action(id: string, act: "annuler" | "livree") {
    const msg = act === "annuler" ? "Annuler cette livraison ?" : "Marquer cette livraison comme livrée ?";
    if (!window.confirm(msg)) return;
    await fetch(`/api/livraisons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }),
    });
    charger();
  }

  function centrer(l: LivraisonAvecLivreur) {
    setSelection(l.id);
    const pts: [number, number][] = [[l.destination.lat, l.destination.lng]];
    if (l.dernierePosition) pts.push([l.dernierePosition.lat, l.dernierePosition.lng]);
    setCadrage({ cle: Date.now(), points: pts });
  }

  const enRoute = livraisons?.filter((l) => l.statut === "en_route").length ?? 0;
  const enAttente = livraisons?.filter((l) => l.statut === "en_attente").length ?? 0;
  const arrives = livraisons?.filter((l) => l.statut === "arrivee").length ?? 0;

  return (
    <div className="flex flex-1 flex-col lg:h-screen lg:flex-row">
      {/* Liste des courses */}
      <aside className="order-2 flex flex-col border-bord bg-surface lg:order-1 lg:w-[400px] lg:border-r">
        <div className="border-b border-bord p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold">Courses en cours</h1>
            <Link href="/espace/livraisons/nouvelle" className="btn-orange !py-1.5">
              + Nouvelle
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Compteur valeur={enRoute} texte="En route" />
            <Compteur valeur={enAttente} texte="En attente" />
            <Compteur valeur={arrives} texte="Arrivés" />
          </div>
          {erreur && <p className="mt-3 text-sm text-rouge">Connexion perdue avec le serveur, nouvelle tentative…</p>}
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {livraisons === null && <p className="text-sm text-discret">Chargement…</p>}
          {livraisons?.length === 0 && (
            <div className="rounded-xl border border-dashed border-bord p-6 text-center text-sm text-discret">
              Aucune course en cours.
              <br />
              <Link href="/espace/livraisons/nouvelle" className="mt-2 inline-block font-semibold text-orange">
                Créer une livraison →
              </Link>
            </div>
          )}
          {livraisons?.map((l) => {
            const infos = infosTrajet(l);
            const perdu =
              l.dernierePosition && Date.now() - new Date(l.dernierePosition.le).getTime() > SIGNAL_PERDU_MS;
            return (
              <div
                key={l.id}
                className={`carte-bloc p-3 ${selection === l.id ? "ring-2 ring-orange" : ""}`}
              >
                <button type="button" onClick={() => centrer(l)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: couleurPour(l.livreurId ?? l.id) }}
                    >
                      {initiales(l.livreur?.nom)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold">{l.livreur?.nom ?? "Livreur supprimé"}</span>
                        <BadgeStatut statut={l.statut} />
                      </div>
                      <div className="font-mono text-xs text-discret">{l.livreur?.immatriculation}</div>
                      <div className="mt-1 truncate text-sm">🏁 {l.destination.label}</div>
                    </div>
                  </div>
                </button>

                {infos && l.statut === "en_route" && (
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-fond p-2 text-center">
                    <Info titre="Reste" valeur={formatDistance(infos.distance)} />
                    <Info titre="Temps" valeur={formatDuree(infos.duree)} />
                    <Info titre="Arrivée" valeur={`~${formatHeure(new Date(Date.now() + infos.duree * 1000))}`} />
                  </div>
                )}

                <div className="mt-2 text-xs text-discret">
                  {l.statut === "en_attente" && "Le livreur n'a pas encore ouvert son lien."}
                  {l.dernierePosition && (
                    <span className={perdu ? "font-semibold text-rouge" : ""}>
                      {perdu ? "⚠ Signal perdu — " : ""}Position reçue {ilYa(l.dernierePosition.le)}
                    </span>
                  )}
                  {l.statut === "arrivee" && l.arriveLe && <> · arrivé à {formatHeure(new Date(l.arriveLe))}</>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-bord pt-3">
                  {l.statut === "en_attente" && <LienLivreur livraison={l} compact />}
                  {l.statut === "en_attente" && (
                    <a
                      href={`/l/${l.token}?simulation=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-clair !px-2.5 !py-1 !text-xs"
                      title="Ouvre la page du livreur avec un trajet simulé, pour tester"
                    >
                      Tester (simulation)
                    </a>
                  )}
                  <span className="flex-1" />
                  {l.statut !== "en_attente" && (
                    <button type="button" onClick={() => action(l.id, "livree")} className="text-xs font-semibold text-vert hover:underline">
                      Marquer livrée
                    </button>
                  )}
                  <button type="button" onClick={() => action(l.id, "annuler")} className="text-xs text-discret hover:text-rouge hover:underline">
                    Annuler
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Carte */}
      <section className="relative order-1 h-[55vh] lg:order-2 lg:h-auto lg:flex-1">
        <Carte marqueurs={marqueurs} lignes={lignes} cadrage={cadrage} />
        {tousLesPoints.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelection(null);
              setCadrage({ cle: Date.now(), points: tousLesPoints });
            }}
            className="btn-clair absolute right-3 top-3 z-[1000] shadow"
          >
            Voir tout
          </button>
        )}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-[1000] flex w-[90%] max-w-md -translate-x-1/2 flex-col gap-2">
          {alertes.map((a) => (
            <div key={a.id} className="rounded-lg bg-texte px-4 py-3 text-sm font-medium text-white shadow-lg">
              {a.texte}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Compteur({ valeur, texte }: { valeur: number; texte: string }) {
  return (
    <div className="rounded-lg bg-fond py-2">
      <div className="text-xl font-bold">{valeur}</div>
      <div className="text-xs text-discret">{texte}</div>
    </div>
  );
}

function Info({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-discret">{titre}</div>
      <div className="text-sm font-bold">{valeur}</div>
    </div>
  );
}
