"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LIENS = [
  { href: "/", texte: "Carte en direct" },
  { href: "/livraisons/nouvelle", texte: "Nouvelle livraison" },
  { href: "/livreurs", texte: "Livreurs" },
  { href: "/historique", texte: "Historique" },
];

export default function Navigation() {
  const chemin = usePathname();
  return (
    <header className="sticky top-0 z-[1100] border-b border-bord bg-surface">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white">🛵</span>
          <span>
            Babi<span className="text-orange">Course</span>
          </span>
        </Link>
        <nav className="-mx-1 flex gap-1 overflow-x-auto text-sm">
          {LIENS.map((l) => {
            const actif = l.href === "/" ? chemin === "/" : chemin.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 font-medium ${
                  actif ? "bg-orange-doux text-orange-fonce" : "text-discret hover:bg-fond hover:text-texte"
                }`}
              >
                {l.texte}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={async () => {
            await fetch("/api/connexion", { method: "DELETE" });
            window.location.href = "/connexion";
          }}
          className="ml-auto text-sm text-discret hover:text-texte"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
}
