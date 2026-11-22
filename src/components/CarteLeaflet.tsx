"use client";
// La carte (OpenStreetMap + Leaflet). Chargée seulement dans le navigateur.
//
// On pilote Leaflet directement (sans react-leaflet) : Next.js garde en mémoire les pages
// qu'on quitte, puis les réaffiche. Ici, à chaque réaffichage, la carte est recréée
// proprement, ce qui évite l'erreur « reading 'appendChild' ».
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { ABIDJAN } from "@/lib/geo";

export type MarqueurCarte = {
  id: string;
  lat: number;
  lng: number;
  type: "livreur" | "destination" | "moi";
  couleur?: string;
  texte?: string; // texte dans la pastille du livreur
  infobulle?: string;
  perdu?: boolean;
};

export type LigneCarte = {
  id: string;
  points: [number, number][];
  couleur: string;
  pointillee?: boolean;
  epaisseur?: number;
  opacite?: number;
};

export type CarteProps = {
  marqueurs: MarqueurCarte[];
  lignes?: LigneCarte[];
  /** Changer cette valeur recadre la carte sur tous les points donnés. */
  cadrage?: { cle: string | number; points: [number, number][] };
  onClic?: (lat: number, lng: number) => void;
  className?: string;
};

function icone(m: MarqueurCarte) {
  if (m.type === "destination") {
    return L.divIcon({ className: "", html: `<div class="marqueur-dest">🏁</div>`, iconSize: [26, 26], iconAnchor: [5, 24] });
  }
  if (m.type === "moi") {
    return L.divIcon({ className: "", html: `<div class="marqueur-moi"></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
  }
  const t = (m.texte ?? "").replace(/[<>&"]/g, "");
  return L.divIcon({
    className: "",
    html: `<div class="marqueur-livreur${m.perdu ? " perdu" : ""}" style="background:${m.couleur};width:38px;height:38px">${t}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
}

export default function CarteLeaflet({ marqueurs, lignes = [], cadrage, onClic, className }: CarteProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const carteRef = useRef<L.Map | null>(null);
  const coucheRef = useRef<L.LayerGroup | null>(null);
  const onClicRef = useRef(onClic);
  // Augmente à chaque création de la carte, pour redessiner et recadrer.
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    onClicRef.current = onClic;
  }, [onClic]);

  // Création de la carte (et destruction quand la page est quittée).
  useEffect(() => {
    if (!divRef.current) return;
    const carte = L.map(divRef.current, { center: ABIDJAN, zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(carte);
    coucheRef.current = L.layerGroup().addTo(carte);
    carte.on("click", (e: L.LeafletMouseEvent) => onClicRef.current?.(e.latlng.lat, e.latlng.lng));
    carteRef.current = carte;
    setGeneration((g) => g + 1);
    return () => {
      carte.remove();
      carteRef.current = null;
      coucheRef.current = null;
    };
  }, []);

  // On ne redessine que si les données ont vraiment changé.
  const signature = useMemo(() => JSON.stringify([marqueurs, lignes]), [marqueurs, lignes]);

  useEffect(() => {
    const couche = coucheRef.current;
    if (!couche) return;
    const [ms, ls] = JSON.parse(signature) as [MarqueurCarte[], LigneCarte[]];
    couche.clearLayers();
    for (const l of ls) {
      L.polyline(l.points, {
        color: l.couleur,
        weight: l.epaisseur ?? 5,
        opacity: l.opacite ?? 0.8,
        dashArray: l.pointillee ? "8 10" : undefined,
      }).addTo(couche);
    }
    for (const m of ms) {
      const mk = L.marker([m.lat, m.lng], { icon: icone(m), zIndexOffset: m.type === "livreur" ? 1000 : 0 });
      if (m.infobulle) mk.bindTooltip(m.infobulle, { direction: "top", offset: [0, -18] });
      mk.addTo(couche);
    }
  }, [signature, generation]);

  // Recadrage quand la clé change (ou quand la carte vient d'être recréée).
  const cadrageCle = cadrage?.cle;
  const cadragePoints = useRef(cadrage?.points);
  cadragePoints.current = cadrage?.points;
  useEffect(() => {
    const carte = carteRef.current;
    const pts = cadragePoints.current;
    if (!carte || !pts || pts.length === 0) return;
    let t: ReturnType<typeof setTimeout>;
    // On attend que la carte connaisse sa vraie taille avant de recadrer.
    const essayer = (n: number) => {
      if (carteRef.current !== carte) return;
      carte.invalidateSize();
      const taille = carte.getSize();
      if ((taille.x < 50 || taille.y < 50) && n < 20) {
        t = setTimeout(() => essayer(n + 1), 150);
        return;
      }
      if (pts.length === 1) carte.setView(pts[0], 16);
      else carte.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 16 });
    };
    t = setTimeout(() => essayer(0), 100);
    return () => clearTimeout(t);
  }, [cadrageCle, generation]);

  return <div ref={divRef} className={className ?? "h-full w-full"} />;
}
