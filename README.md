# BabiCourse – suivi des livreurs en direct (SaaS multi-entreprises)

## Lancer l'application sur l'ordinateur

```bash
npm run dev -- -p 3200
```

Puis ouvrir http://localhost:3200

## Les pages

| Adresse | Pour qui | Rôle |
|---|---|---|
| `/` | tout le monde | Présentation de BabiCourse (sans prix) |
| `/essai` | nouvelle entreprise | Questionnaire en 3 étapes + création du compte, accès immédiat |
| `/connexion`, `/mot-de-passe-oublie` | gérants | Connexion par e-mail et mot de passe |
| `/espace` | gérant connecté | Carte en direct, livreurs, livraisons, historique — uniquement ceux de son entreprise |
| `/admin` | administrateurs (`ADMIN_EMAILS`) | Entreprises inscrites, réponses au questionnaire, utilisation, suspension |
| `/l/<code>` | livreur | Partage de sa position GPS (lien secret envoyé par WhatsApp) |

## Variables d'environnement (`.env.local` et Vercel)

| Nom | Contenu |
|---|---|
| `SUPABASE_URL` | `https://rwzvljddvglgfajysdzi.supabase.co` |
| `SUPABASE_SECRET_KEY` | clé secrète Supabase (`sb_secret_…`) — ne jamais la partager |
| `SUPABASE_PUBLISHABLE_KEY` | clé publique Supabase (`sb_publishable_…`) |
| `ADMIN_EMAILS` | e-mails administrateurs, séparés par des virgules |

## Base de données

Supabase, scripts dans `supabase/migrations/`. Toutes les tables ont la sécurité RLS activée sans règle
publique : seul le serveur (clé secrète) lit et écrit, et chaque requête du gérant est filtrée par son entreprise.

## Outils

- Next.js 16, Supabase (base + comptes), Vercel (hébergement)
- Carte : OpenStreetMap + Leaflet — trajets : OSRM — recherche d'adresse : Nominatim (gratuits)

## Limites connues

- Le livreur doit garder la page ouverte pendant la course (sinon sa position n'est plus envoyée).
- E-mails « mot de passe oublié » : service d'envoi gratuit de Supabase, limité à quelques e-mails par heure.
