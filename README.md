# BabiCourse – suivi des livreurs en direct

## Lancer l'application sur l'ordinateur

```bash
npm run dev -- -p 3200
```

Puis ouvrir http://localhost:3200

## Comment ça marche

1. **Livreurs** : enregistrer chaque livreur (nom, téléphone, immatriculation).
2. **Nouvelle livraison** : choisir un livreur et la destination (recherche d'adresse ou clic sur la carte).
3. Envoyer le lien au livreur par WhatsApp. Il l'ouvre sur son téléphone et appuie sur « Démarrer la course ».
4. **Carte en direct** : position de chaque livreur toutes les 4 secondes, trajet par la route, distance restante, heure d'arrivée estimée. Alerte quand il arrive (moins de 80 m).
5. Le livreur appuie sur « Colis livré » : la course passe dans l'**Historique**.

Pour tester sans téléphone : bouton « Tester (simulation) » sur une course en attente.

## Outils utilisés

- Next.js 16 (site + API)
- Carte : OpenStreetMap + Leaflet (gratuit)
- Trajets : OSRM (gratuit) — recherche d'adresse : Nominatim (gratuit)
- Données : Supabase (projet BabiCourse) dès que `SUPABASE_URL` et `SUPABASE_SECRET_KEY` sont dans `.env.local`.
  Sans ces clés, l'application utilise le fichier `data/db.json`.
  Tables : `supabase/migrations/20261122000000_babicourse_init.sql` (accès réservé au serveur).

## Limites de cette première version

- Pas encore en ligne : le lien du livreur ne marche que sur cet ordinateur.
  Le GPS d'un téléphone exige un site en **https** → mise en ligne sur Vercel nécessaire.
- Pas de connexion par mot de passe pour le gérant.
- Le livreur doit garder la page ouverte : si elle est fermée, sa position n'est plus envoyée.
