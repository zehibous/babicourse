"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Carte, { type MarqueurCarte } from "@/components/Carte";
import { distanceMetres, formatDistance, itineraireRoute } from "@/lib/geo";
import type { LivraisonAvecLivreur } from "@/lib/types";

type Etat = "pret" | "suivi" | "refuse" | "indisponible";

const ENVOI_MIN_MS = 4000; // au plus une position toutes les 4 secondes
const ENVOI_MIN_M = 15; // ... sauf si le livreur a bougé de plus de 15 m

export default function CourseLivreur() {
  const { token } = useParams<{ token: string }>();
  const simulation = useSearchParams().get("simulation") === "1";
  const [livraison, setLivraison] = useState<LivraisonAvecLivreur | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [etat, setEtat] = useState<Etat>("pret");
  const [moi, setMoi] = useState<{ lat: number; lng: number; precision?: number } | null>(null);
  const [envoiOk, setEnvoiOk] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [cadrageCle, setCadrageCle] = useState(0);
  const dernierEnvoi = useRef<{ t: number; lat: number; lng: number } | null>(null);
  const watchId = useRef<number | null>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  useEffect(() => {
    fetch(`/api/course/${token}`, { cache: "no-store" }).then(async (r) => {
      if (!r.ok) return setIntrouvable(true);
      setLivraison(await r.json());
    });
  }, [token]);

  const envoyer = useCallback(
    async (lat: number, lng: number, precision?: number | null, vitesse?: number | null, forcer = false) => {
      setMoi({ lat, lng, precision: precision ?? undefined });
      const d = dernierEnvoi.current;
      if (!forcer && d && Date.now() - d.t < ENVOI_MIN_MS && distanceMetres(d, { lat, lng }) < ENVOI_MIN_M) return;
      dernierEnvoi.current = { t: Date.now(), lat, lng };
      try {
        const r = await fetch(`/api/course/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, precision, vitesse }),
        });
        const data = await r.json();
        setLivraison(r.status === 409 ? data.livraison : data);
        setEnvoiOk(new Date().toLocaleTimeString("fr-FR"));
        setHorsLigne(false);
      } catch {
        setHorsLigne(true);
      }
    },
    [token],
  );

  const arreter = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    if (simTimer.current) clearInterval(simTimer.current);
    simTimer.current = null;
    wakeLock.current?.release().catch(() => {});
    wakeLock.current = null;
  }, []);

  useEffect(() => arreter, [arreter]);

  // La course est finie : on coupe le GPS.
  useEffect(() => {
    if (livraison && (livraison.statut === "livree" || livraison.statut === "annulee")) arreter();
  }, [livraison, arreter]);

  async function garderEcranAllume() {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
      wakeLock.current = (await nav.wakeLock?.request("screen")) ?? null;
    } catch {}
  }

  async function demarrer() {
    if (!livraison) return;
    await garderEcranAllume();
    setCadrageCle(Date.now());

    if (simulation) {
      setEtat("suivi");
      await demarrerSimulation(livraison);
      return;
    }

    if (!("geolocation" in navigator)) return setEtat("indisponible");
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setEtat("suivi");
        envoyer(p.coords.latitude, p.coords.longitude, p.coords.accuracy, p.coords.speed);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setEtat("refuse");
          arreter();
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }

  /** Mode test : le livreur « roule » tout seul vers la destination. */
  async function demarrerSimulation(l: LivraisonAvecLivreur) {
    const depart = { lat: l.destination.lat + 0.022, lng: l.destination.lng + 0.018 };
    const it = await itineraireRoute(depart, l.destination);
    const brut: [number, number][] = it?.points ?? [
      [depart.lat, depart.lng],
      [l.destination.lat, l.destination.lng],
    ];
    // Un point tous les ~70 m.
    const points: [number, number][] = [];
    for (let i = 0; i < brut.length - 1; i++) {
      const [a, b] = [brut[i], brut[i + 1]];
      const n = Math.max(1, Math.ceil(distanceMetres({ lat: a[0], lng: a[1] }, { lat: b[0], lng: b[1] }) / 70));
      for (let k = 0; k < n; k++) points.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
    }
    points.push(brut[brut.length - 1]);
    let i = 0;
    simTimer.current = setInterval(() => {
      const [lat, lng] = points[Math.min(i, points.length - 1)];
      envoyer(lat, lng, 10, 12, true);
      i++;
      if (i >= points.length && simTimer.current) {
        clearInterval(simTimer.current);
        simTimer.current = null;
      }
    }, 1500);
  }

  async function livrer() {
    if (!window.confirm("Confirmer que le colis a été livré ?")) return;
    const r = await fetch(`/api/course/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "livree" }),
    });
    if (r.ok) setLivraison(await r.json());
  }

  if (introuvable) {
    return <Ecran emoji="❓" titre="Lien invalide" texte="Ce lien de course n'existe pas. Demandez un nouveau lien à votre responsable." />;
  }
  if (!livraison) return <div className="p-6 text-center text-sm text-discret">Chargement…</div>;
  if (livraison.statut === "livree") {
    return <Ecran emoji="✅" titre="Course terminée" texte="Merci ! La livraison est enregistrée. Vous pouvez fermer cette page." />;
  }
  if (livraison.statut === "annulee") {
    return <Ecran emoji="🚫" titre="Course annulée" texte="Cette course a été annulée par votre responsable." />;
  }

  const dest = livraison.destination;
  const reste = moi ? distanceMetres(moi, dest) : null;
  const marqueurs: MarqueurCarte[] = [{ id: "dest", type: "destination", lat: dest.lat, lng: dest.lng, infobulle: dest.label }];
  if (moi) marqueurs.push({ id: "moi", type: "moi", lat: moi.lat, lng: moi.lng, infobulle: "Vous" });
  const itineraireGoogle = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-fond">
      <header className="flex items-center justify-between bg-orange px-4 py-3 text-white">
        <span className="font-extrabold">🛵 BabiCourse</span>
        <span className="text-sm opacity-90">{livraison.livreur?.nom}</span>
      </header>

      {simulation && (
        <div className="bg-yellow-100 px-4 py-2 text-center text-xs font-medium text-yellow-900">
          Mode test : le trajet est simulé (accéléré), le GPS n&apos;est pas utilisé.
        </div>
      )}

      <div className="h-[42dvh]">
        <Carte
          marqueurs={marqueurs}
          cadrage={{
            cle: `${cadrageCle}-${moi ? 1 : 0}`,
            points: moi ? [[moi.lat, moi.lng], [dest.lat, dest.lng]] : [[dest.lat, dest.lng]],
          }}
        />
      </div>

      <div className="flex-1 space-y-4 p-4">
        <div className="carte-bloc p-4">
          <div className="text-xs uppercase tracking-wide text-discret">Destination</div>
          <div className="mt-1 text-lg font-bold">{dest.label}</div>
          {dest.repere && <div className="text-sm text-discret">Repère : {dest.repere}</div>}
          {livraison.client?.nom && (
            <div className="mt-2 text-sm">
              Client : {livraison.client.nom}
              {livraison.client.telephone && (
                <>
                  {" · "}
                  <a href={`tel:${livraison.client.telephone}`} className="font-semibold text-orange">
                    {livraison.client.telephone}
                  </a>
                </>
              )}
            </div>
          )}
          <a href={itineraireGoogle} target="_blank" rel="noreferrer" className="btn-clair mt-3 w-full">
            Ouvrir l&apos;itinéraire dans Google Maps
          </a>
        </div>

        {etat === "pret" && (
          <button type="button" onClick={demarrer} className="btn-orange w-full !py-4 !text-base">
            ▶ Démarrer la course
          </button>
        )}

        {etat === "suivi" && (
          <div className="carte-bloc p-4">
            <div className="flex items-center gap-2 font-semibold text-vert">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vert opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-vert" />
              </span>
              Position partagée en direct
            </div>
            {reste !== null && (
              <p className="mt-2 text-2xl font-bold">
                {livraison.statut === "arrivee" ? "Vous êtes arrivé 📍" : `Encore ${formatDistance(reste)}`}
              </p>
            )}
            <p className="mt-1 text-xs text-discret">
              {horsLigne ? "⚠ Pas de connexion internet, nouvel essai automatique…" : envoiOk ? `Dernier envoi à ${envoiOk}` : "Recherche du signal GPS…"}
            </p>
            <p className="mt-3 rounded-lg bg-orange-doux p-3 text-xs text-orange-fonce">
              Gardez cette page ouverte pendant la course. Si vous la fermez, votre responsable ne vous voit plus.
            </p>
          </div>
        )}

        {etat === "refuse" && (
          <div className="carte-bloc border-rouge/30 bg-red-50 p-4 text-sm text-rouge">
            <strong>Le partage de position est bloqué.</strong>
            <br />
            Autorisez la localisation pour ce site dans les réglages du navigateur, puis rechargez la page.
          </div>
        )}
        {etat === "indisponible" && (
          <div className="carte-bloc bg-red-50 p-4 text-sm text-rouge">Ce téléphone ne permet pas la localisation.</div>
        )}

        {livraison.statut !== "en_attente" && (
          <button type="button" onClick={livrer} className="btn w-full bg-vert !py-4 !text-base text-white hover:bg-green-700">
            ✓ Colis livré
          </button>
        )}
      </div>
    </div>
  );
}

function Ecran({ emoji, titre, texte }: { emoji: string; titre: string; texte: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-fond p-6 text-center">
      <div className="text-5xl">{emoji}</div>
      <h1 className="mt-4 text-xl font-bold">{titre}</h1>
      <p className="mt-2 max-w-sm text-sm text-discret">{texte}</p>
    </div>
  );
}
