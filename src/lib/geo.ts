// Petits outils de calcul et d'affichage, utilisables partout.

export const ABIDJAN: [number, number] = [5.336, -4.027];

/** Rayon (en mètres) sous lequel on considère que le livreur est arrivé. */
export const RAYON_ARRIVEE_M = 80;

/** Distance à vol d'oiseau en mètres entre deux points GPS. */
export function distanceMetres(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(m < 10000 ? 1 : 0).replace(".", ",")} km`;
}

export function formatDuree(secondes: number) {
  const min = Math.max(1, Math.round(secondes / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${String(min % 60).padStart(2, "0")}`;
}

export function formatHeure(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function ilYa(iso?: string) {
  if (!iso) return "jamais";
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  return `il y a ${Math.round(m / 60)} h`;
}

/** Transforme "07 07 12 34 56" en "2250707123456" pour WhatsApp. */
export function numeroWhatsApp(tel: string) {
  const chiffres = tel.replace(/\D/g, "");
  if (chiffres.length === 10) return `225${chiffres}`;
  return chiffres;
}

const COULEURS = ["#ea580c", "#2563eb", "#16a34a", "#9333ea", "#db2777", "#0891b2", "#ca8a04", "#dc2626"];

/** Une couleur stable par livreur. */
export function couleurPour(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COULEURS[h % COULEURS.length];
}

export type Itineraire = { distance: number; duree: number; points: [number, number][] };

/** Calcule le trajet par la route avec le service gratuit OSRM (OpenStreetMap). */
export async function itineraireRoute(
  depart: { lat: number; lng: number },
  arrivee: { lat: number; lng: number },
): Promise<Itineraire | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${arrivee.lng},${arrivee.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data.routes?.[0];
    if (!r) return null;
    return {
      distance: r.distance,
      duree: r.duration,
      points: r.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
    };
  } catch {
    return null;
  }
}
