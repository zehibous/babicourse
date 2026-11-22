"use client";
import { useEffect, useState } from "react";
import BadgeStatut from "@/components/BadgeStatut";
import { formatDuree } from "@/lib/geo";
import type { LivraisonAvecLivreur } from "@/lib/types";

function date(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function Historique() {
  const [liste, setListe] = useState<LivraisonAvecLivreur[] | null>(null);

  useEffect(() => {
    fetch("/api/livraisons?vue=terminees", { cache: "no-store" })
      .then((r) => r.json())
      .then(setListe);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-8">
      <h1 className="text-2xl font-bold">Historique</h1>
      <p className="mt-1 text-sm text-discret">Les livraisons terminées ou annulées.</p>

      <div className="carte-bloc mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-bord text-xs uppercase tracking-wide text-discret">
            <tr>
              <th className="p-3">Livreur</th>
              <th className="p-3">Destination</th>
              <th className="p-3">Créée</th>
              <th className="p-3">Terminée</th>
              <th className="p-3">Durée du trajet</th>
              <th className="p-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bord">
            {liste === null && (
              <tr><td colSpan={6} className="p-4 text-discret">Chargement…</td></tr>
            )}
            {liste?.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-discret">Aucune livraison terminée pour l&apos;instant.</td></tr>
            )}
            {liste?.map((l) => {
              const fin = l.livreLe ?? l.annuleLe;
              const duree =
                l.demarreLe && (l.arriveLe ?? l.livreLe)
                  ? (new Date((l.arriveLe ?? l.livreLe)!).getTime() - new Date(l.demarreLe).getTime()) / 1000
                  : null;
              return (
                <tr key={l.id}>
                  <td className="p-3">
                    <div className="font-medium">{l.livreur?.nom ?? "Livreur supprimé"}</div>
                    <div className="font-mono text-xs text-discret">{l.livreur?.immatriculation}</div>
                  </td>
                  <td className="p-3">{l.destination.label}</td>
                  <td className="p-3 whitespace-nowrap">{date(l.creeLe)}</td>
                  <td className="p-3 whitespace-nowrap">{date(fin)}</td>
                  <td className="p-3">{duree !== null ? formatDuree(duree) : "—"}</td>
                  <td className="p-3"><BadgeStatut statut={l.statut} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
