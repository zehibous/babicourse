import Link from "next/link";
import { Logo } from "@/components/CadreCompte";
import FormulaireContact from "@/components/FormulaireContact";
import MaquetteHero from "@/components/MaquetteHero";
import { CONTACT } from "@/lib/contact";

// Page d'accueil publique : on présente l'outil, sans mettre en avant la vente.
const ETAPES = [
  { n: "1", titre: "Enregistrez vos livreurs", texte: "Nom, téléphone et immatriculation. Une seule fois." },
  { n: "2", titre: "Créez une livraison", texte: "Choisissez le livreur et la destination, puis envoyez-lui le lien par WhatsApp." },
  { n: "3", titre: "Suivez-le sur la carte", texte: "Il ouvre le lien sur son téléphone : vous voyez où il est jusqu'à l'arrivée." },
];

const POINTS = [
  { icone: "🗺️", titre: "Tous vos livreurs sur une carte", texte: "Chaque livreur a sa couleur, son trajet et la distance qui reste." },
  { icone: "⏱️", titre: "Heure d'arrivée estimée", texte: "Calculée par la route, mise à jour pendant la course." },
  { icone: "📍", titre: "Alerte à l'arrivée", texte: "Vous êtes prévenu quand le livreur atteint la destination." },
  { icone: "📱", titre: "Rien à installer pour le livreur", texte: "Un lien WhatsApp suffit, il marche sur tous les smartphones." },
  { icone: "📋", titre: "Historique des livraisons", texte: "Qui a livré quoi, quand, et en combien de temps." },
  { icone: "🔒", titre: "Vos données restent les vôtres", texte: "Chaque entreprise a son espace, invisible pour les autres." },
];

export default function Accueil() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-fond">
      <header className="border-b border-bord bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <nav className="flex items-center gap-5 text-sm font-semibold">
            <a href="#contact" className="text-discret hover:text-texte">Contact</a>
            <Link href="/connexion" className="text-texte hover:text-orange">Se connecter</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pb-14 pt-10 sm:pt-16 lg:grid-cols-[1fr_340px] lg:gap-16">
          <div>
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Sachez où sont vos livreurs, <span className="text-orange">en direct.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-discret sm:text-lg">
            BabiCourse affiche la position de vos livreurs sur une carte, de leur départ jusqu&apos;à la destination.
            Fini les appels pour demander « tu es où ? ».
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/essai" className="btn-orange !px-6 !py-3.5 !text-base">
              Essayer BabiCourse
            </Link>
            <span className="text-sm text-discret">Gratuit pendant la phase de lancement.</span>
          </div>
          </div>
          <MaquetteHero />
        </section>

        <section className="border-y border-bord bg-surface">
          <div className="mx-auto max-w-5xl px-4 py-12">
            <h2 className="text-xl font-bold sm:text-2xl">Comment ça marche</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-3">
              {ETAPES.map((e) => (
                <li key={e.n} className="rounded-xl bg-fond p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange text-sm font-bold text-white">{e.n}</span>
                  <h3 className="mt-3 font-semibold">{e.titre}</h3>
                  <p className="mt-1 text-sm text-discret">{e.texte}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-xl font-bold sm:text-2xl">Ce que vous avez</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POINTS.map((p) => (
              <div key={p.titre} className="carte-bloc p-5">
                <div className="text-2xl" aria-hidden>{p.icone}</div>
                <h3 className="mt-2 font-semibold">{p.titre}</h3>
                <p className="mt-1 text-sm text-discret">{p.texte}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="rounded-2xl bg-texte p-8 text-white sm:p-10">
            <h2 className="text-2xl font-bold">Prêt à essayer ?</h2>
            <p className="mt-2 max-w-lg text-sm text-white/75">
              Répondez à quelques questions sur votre activité, et votre espace est prêt tout de suite.
            </p>
            <Link href="/essai" className="btn-orange mt-6 !px-6 !py-3.5 !text-base">
              Essayer BabiCourse
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-bord bg-surface">
        <div id="contact" className="mx-auto grid max-w-5xl scroll-mt-4 gap-8 px-4 py-12 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Une question ?</h2>
            <p className="mt-2 text-sm text-discret">
              {CONTACT.email
                ? "Écrivez-nous : choisissez de nous envoyer votre message par WhatsApp ou par e-mail, nous vous répondons au plus vite."
                : "Écrivez-nous sur WhatsApp, nous vous répondons au plus vite."}
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              {CONTACT.whatsapp && (
                <li>
                  <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noreferrer" className="font-medium hover:text-orange">
                    WhatsApp : +{CONTACT.whatsapp.replace(/^(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5 $6")}
                  </a>
                </li>
              )}
              {CONTACT.email && (
                <li>
                  <a href={`mailto:${CONTACT.email}`} className="font-medium hover:text-orange">
                    E-mail : {CONTACT.email}
                  </a>
                </li>
              )}
            </ul>
          </div>
          <FormulaireContact />
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 border-t border-bord px-4 py-5 text-xs text-discret">
          <span>© BabiCourse · Abidjan</span>
          <Link href="/connexion" className="hover:text-texte">Espace gérant</Link>
        </div>
      </footer>
    </div>
  );
}
