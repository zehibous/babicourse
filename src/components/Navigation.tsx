"use client";
// Menu du gérant en barre latérale.
// - Téléphone (par défaut) : barre du haut avec un bouton ☰ qui ouvre le menu sur le côté.
// - Ordinateur (écran large) : menu toujours visible à gauche.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Icone = "carte" | "plus" | "livreurs" | "historique" | "sortie" | "menu" | "fermer";

function Pictogramme({ nom, className = "h-5 w-5" }: { nom: Icone; className?: string }) {
  const chemins: Record<Icone, React.ReactNode> = {
    carte: (
      <>
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    plus: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    livreurs: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6" />
      </>
    ),
    historique: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    sortie: (
      <>
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
        <path d="M10 8l-4 4 4 4M6 12h10" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    fermer: <path d="M6 6l12 12M18 6 6 18" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {chemins[nom]}
    </svg>
  );
}

const LIENS: { href: string; texte: string; icone: Icone }[] = [
  { href: "/espace", texte: "Carte en direct", icone: "carte" },
  { href: "/espace/livraisons/nouvelle", texte: "Nouvelle livraison", icone: "plus" },
  { href: "/espace/livreurs", texte: "Livreurs", icone: "livreurs" },
  { href: "/espace/historique", texte: "Historique", icone: "historique" },
];

function Logo() {
  return (
    <Link href="/espace" className="flex items-center gap-2 text-lg font-extrabold">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange text-white">🛵</span>
      <span>
        Babi<span className="text-orange">Course</span>
      </span>
    </Link>
  );
}

export type InfosGerant = { entreprise: string; email: string; estAdmin: boolean };

function Menu({ chemin, onChoix, infos }: { chemin: string; onChoix?: () => void; infos: InfosGerant }) {
  async function deconnecter() {
    await fetch("/api/auth/connexion", { method: "DELETE" });
    window.location.href = "/connexion";
  }
  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-3">
        {LIENS.map((l) => {
          const actif = l.href === "/espace" ? chemin === "/espace" : chemin.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onChoix}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition lg:py-2.5 lg:text-sm ${
                actif ? "bg-orange-doux text-orange-fonce" : "text-discret hover:bg-fond hover:text-texte"
              }`}
            >
              <Pictogramme nom={l.icone} />
              {l.texte}
            </Link>
          );
        })}
        {infos.estAdmin && (
          <Link
            href="/admin"
            onClick={onChoix}
            className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-bord px-3 py-3 text-[15px] font-medium text-discret hover:bg-fond hover:text-texte lg:py-2.5 lg:text-sm"
          >
            <span aria-hidden className="w-5 text-center">⚙️</span>
            Administration
          </Link>
        )}
      </nav>
      <div className="border-t border-bord px-6 pt-3 text-xs">
        <div className="truncate font-semibold text-texte">{infos.entreprise}</div>
        <div className="truncate text-discret">{infos.email}</div>
      </div>
      <div className="p-3">
        <button
          type="button"
          onClick={deconnecter}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium text-discret transition hover:bg-red-50 hover:text-rouge lg:py-2.5 lg:text-sm"
        >
          <Pictogramme nom="sortie" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export default function Navigation({ infos }: { infos: InfosGerant }) {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const titre = LIENS.find((l) => (l.href === "/espace" ? chemin === "/espace" : chemin.startsWith(l.href)))?.texte ?? "";

  // Touche Échap pour fermer, et pas de défilement de la page derrière le menu ouvert.
  useEffect(() => {
    if (!ouvert) return;
    const clavier = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("keydown", clavier);
    const avant = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", clavier);
      document.body.style.overflow = avant;
    };
  }, [ouvert]);

  return (
    <>
      {/* Téléphone : barre du haut */}
      <header className="sticky top-0 z-[1100] flex h-14 items-center gap-3 border-b border-bord bg-surface px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-texte hover:bg-fond"
          aria-label="Ouvrir le menu"
          aria-expanded={ouvert}
        >
          <Pictogramme nom="menu" className="h-6 w-6" />
        </button>
        <Logo />
        <span className="ml-auto truncate text-sm font-medium text-discret">{titre}</span>
      </header>

      {/* Téléphone : menu qui glisse depuis la gauche */}
      <div
        className={`fixed inset-0 z-[2000] bg-black/40 transition-opacity lg:hidden ${ouvert ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOuvert(false)}
        aria-hidden
      />
      <aside
        className={`fixed inset-y-0 left-0 z-[2001] flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl transition-transform duration-200 lg:hidden ${
          ouvert ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Menu"
        inert={!ouvert}
      >
        <div className="flex h-14 items-center justify-between border-b border-bord px-4">
          <Logo />
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-discret hover:bg-fond"
            aria-label="Fermer le menu"
          >
            <Pictogramme nom="fermer" className="h-6 w-6" />
          </button>
        </div>
        <Menu chemin={chemin} onChoix={() => setOuvert(false)} infos={infos} />
      </aside>

      {/* Ordinateur : barre latérale fixe */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-bord bg-surface lg:flex" aria-label="Menu">
        <div className="flex h-16 items-center border-b border-bord px-5">
          <Logo />
        </div>
        <Menu chemin={chemin} infos={infos} />
      </aside>
    </>
  );
}
