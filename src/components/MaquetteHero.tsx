// Maquette d'illustration pour la page d'accueil : un téléphone qui montre la carte en direct,
// avec un livreur qui avance vers sa destination. Entièrement dessinée en SVG (aucune image à charger).

const ROUTE = "M58 262 C 70 228, 96 214, 120 200 S 150 160, 168 142 S 200 104, 226 78";
const ROUTE_B = "M240 250 C 226 236, 214 230, 200 226";

export default function MaquetteHero() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] select-none" aria-hidden>
      {/* Halo derrière le téléphone */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-orange/10 blur-2xl" />

      {/* Téléphone */}
      <div className="relative overflow-hidden rounded-[2.4rem] border-[10px] border-texte bg-surface shadow-2xl">
        {/* Barre du haut de l'appli */}
        <div className="flex items-center gap-2 border-b border-bord px-4 pb-2.5 pt-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-orange text-[11px] text-white">🛵</span>
          <span className="text-sm font-extrabold">
            Babi<span className="text-orange">Course</span>
          </span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-vert">
            <span className="h-1.5 w-1.5 rounded-full bg-vert" /> En direct
          </span>
        </div>

        {/* Carte */}
        <svg viewBox="0 0 280 300" className="block w-full bg-[#eef0e6]">
          {/* Lagune */}
          <path d="M0 210 C 40 196, 70 230, 110 238 S 190 214, 280 236 L 280 300 L 0 300 Z" fill="#bfdcef" />
          {/* Parc */}
          <path d="M18 30 C 46 18, 86 26, 92 52 S 70 96, 40 92 S 6 50, 18 30 Z" fill="#cfe5c0" />
          {/* Routes */}
          <g stroke="#ffffff" strokeLinecap="round" fill="none">
            <path d="M0 140 L 280 120" strokeWidth="9" />
            <path d="M150 0 L 160 300" strokeWidth="9" />
            <path d="M0 70 C 80 80, 180 50, 280 60" strokeWidth="6" />
            <path d="M40 300 C 60 240, 110 190, 280 180" strokeWidth="6" />
            <path d="M230 0 L 210 300" strokeWidth="5" />
            <path d="M90 0 L 100 200" strokeWidth="5" />
          </g>
          <g stroke="#e4e0d6" strokeLinecap="round" fill="none" strokeWidth="1">
            <path d="M0 140 L 280 120" />
            <path d="M150 0 L 160 300" />
          </g>

          {/* Livreur B (bleu), arrivé */}
          <path d={ROUTE_B} stroke="#2563eb" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" />
          <text x="192" y="232" fontSize="15">🏁</text>
          <g transform="translate(200 226)">
            <circle r="11" fill="#2563eb" stroke="#fff" strokeWidth="3" />
            <text textAnchor="middle" dy="3.5" fontSize="8" fontWeight="700" fill="#fff">AT</text>
          </g>

          {/* Livreur A (orange) : trajet par la route */}
          <path d={ROUTE} stroke="#ea580c" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
          <text x="222" y="78" fontSize="17">🏁</text>

          {/* Pastille qui avance (version animée) */}
          <g className="maquette-anime">
            <circle r="14" fill="#ea580c" opacity="0.25">
              <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
              <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} keyPoints="0;0.85;0.85" keyTimes="0;0.8;1" calcMode="linear" />
            </circle>
            <g>
              <circle r="12" fill="#ea580c" stroke="#fff" strokeWidth="3" />
              <text textAnchor="middle" dy="3.5" fontSize="8.5" fontWeight="700" fill="#fff">KY</text>
              <animateMotion dur="9s" repeatCount="indefinite" path={ROUTE} keyPoints="0;0.85;0.85" keyTimes="0;0.8;1" calcMode="linear" />
            </g>
          </g>
          {/* Pastille immobile (si l'utilisateur a demandé moins d'animations) */}
          <g className="maquette-fixe" transform="translate(150 166)">
            <circle r="12" fill="#ea580c" stroke="#fff" strokeWidth="3" />
            <text textAnchor="middle" dy="3.5" fontSize="8.5" fontWeight="700" fill="#fff">KY</text>
          </g>
        </svg>

        {/* Fiche de la course */}
        <div className="space-y-2.5 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-[11px] font-bold text-white">KY</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold leading-tight">Konan Yao</div>
              <div className="font-mono text-[10px] text-discret">1234 AB 01</div>
            </div>
            <span className="rounded-full bg-orange-doux px-2 py-0.5 text-[10px] font-semibold text-orange-fonce">En route</span>
          </div>
          <div className="truncate text-[12px]">🏁 Riviera Palmeraie, Cocody</div>
          <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-fond p-2 text-center">
            {[
              ["Reste", "2,4 km"],
              ["Temps", "6 min"],
              ["Arrivée", "~14:32"],
            ].map(([t, v]) => (
              <div key={t}>
                <div className="text-[9px] uppercase tracking-wide text-discret">{t}</div>
                <div className="text-[12px] font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification flottante */}
      <div className="absolute -left-4 top-[40%] flex max-w-[210px] items-center gap-2 rounded-xl bg-texte px-3 py-2.5 text-[12px] font-medium text-white shadow-xl sm:-left-12">
        <span className="text-base">📍</span>
        Awa est arrivée à destination
      </div>
    </div>
  );
}
