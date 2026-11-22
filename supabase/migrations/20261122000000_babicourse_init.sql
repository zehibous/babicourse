-- BabiCourse : tables des livreurs et des livraisons.
-- Accès uniquement par le serveur de l'application (clé secrète) :
-- la sécurité (RLS) est activée sans aucune règle publique, donc personne
-- ne peut lire ou modifier ces tables directement depuis un navigateur.

create table if not exists public.livreurs (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(nom) between 1 and 120),
  telephone text not null default '',
  immatriculation text not null unique check (length(immatriculation) between 1 and 30),
  cree_le timestamptz not null default now()
);

create table if not exists public.livraisons (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  livreur_id uuid references public.livreurs (id) on delete set null,
  dest_label text not null,
  dest_repere text,
  dest_lat double precision not null check (dest_lat between -90 and 90),
  dest_lng double precision not null check (dest_lng between -180 and 180),
  client_nom text,
  client_telephone text,
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'en_route', 'arrivee', 'livree', 'annulee')),
  cree_le timestamptz not null default now(),
  demarre_le timestamptz,
  arrive_le timestamptz,
  livre_le timestamptz,
  annule_le timestamptz,
  derniere_position jsonb,
  trace jsonb not null default '[]'::jsonb
);

create index if not exists livraisons_statut_idx on public.livraisons (statut);
create index if not exists livraisons_livreur_idx on public.livraisons (livreur_id);
create index if not exists livraisons_cree_le_idx on public.livraisons (cree_le desc);

alter table public.livreurs enable row level security;
alter table public.livraisons enable row level security;

-- Droits : seul le serveur (clé secrète = rôle service_role) peut lire et écrire.
grant usage on schema public to service_role;
grant select, insert, update, delete on public.livreurs, public.livraisons to service_role;
revoke all on public.livreurs, public.livraisons from anon, authenticated;
