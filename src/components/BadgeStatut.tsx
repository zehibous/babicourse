import { LIBELLES_STATUT, type Statut } from "@/lib/types";

const STYLES: Record<Statut, string> = {
  en_attente: "bg-stone-100 text-stone-700",
  en_route: "bg-orange-doux text-orange-fonce",
  arrivee: "bg-vert-doux text-vert",
  livree: "bg-vert text-white",
  annulee: "bg-red-50 text-rouge",
};

export default function BadgeStatut({ statut }: { statut: Statut }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STYLES[statut]}`}>
      {LIBELLES_STATUT[statut]}
    </span>
  );
}
