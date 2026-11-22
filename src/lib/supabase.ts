// Connexions à Supabase, côté serveur uniquement.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL_SUPABASE = process.env.SUPABASE_URL!;

let clientAdmin: SupabaseClient | null = null;

/** Accès complet à la base (clé secrète). À n'utiliser qu'après avoir vérifié qui fait la demande. */
export function admin() {
  if (!clientAdmin) {
    clientAdmin = createClient(URL_SUPABASE, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return clientAdmin;
}

/** Client lié à la session du visiteur (cookies) : connexion, déconnexion, mot de passe. */
export async function clientSession() {
  const store = await cookies();
  return createServerClient(URL_SUPABASE, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste) => {
        try {
          for (const { name, value, options } of liste) store.set(name, value, options);
        } catch {
          // Appelé depuis un endroit où l'on ne peut pas écrire de cookie : sans conséquence.
        }
      },
    },
  });
}
