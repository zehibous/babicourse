// Choix de la base de données :
// - si SUPABASE_URL et SUPABASE_SECRET_KEY sont dans .env.local → Supabase (en ligne)
// - sinon → fichier data/db.json (pour essayer sur l'ordinateur)
import "server-only";
import { dbFichier } from "./db-fichier";
import { dbSupabase } from "./db-supabase";

export const utiliseSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

export const db = utiliseSupabase ? dbSupabase : dbFichier;
