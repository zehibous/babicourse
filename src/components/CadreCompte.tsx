import Link from "next/link";

// Mise en page commune des pages connexion, essai, mot de passe.
export function Logo({ grand }: { grand?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-extrabold ${grand ? "text-xl" : "text-lg"}`}>
      <span className={`flex items-center justify-center rounded-lg bg-orange text-white ${grand ? "h-9 w-9" : "h-8 w-8"}`}>🛵</span>
      <span>
        Babi<span className="text-orange">Course</span>
      </span>
    </Link>
  );
}

export default function CadreCompte({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-fond px-4 py-8 sm:justify-center">
      <div className={`w-full ${large ? "max-w-lg" : "max-w-sm"}`}>
        <div className="mb-6 flex justify-center">
          <Logo grand />
        </div>
        {children}
      </div>
    </div>
  );
}
