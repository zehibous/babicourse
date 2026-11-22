-- BabiCourse devient multi-entreprises.
-- Chaque entreprise a ses gérants (comptes Supabase Auth), ses livreurs et ses livraisons.
-- Accès uniquement par le serveur (clé secrète) : RLS activée sans règle publique.

create table if not exists public.entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null check (length(nom) between 1 and 120),
  telephone text not null default '',
  email text not null default '',
  secteur text,
  nb_livreurs text,
  ville text,
  communes text,
  livraisons_jour text,
  outil_actuel text,
  source text,
  statut text not null default 'active' check (statut in ('active', 'suspendue')),
  cree_le timestamptz not null default now()
);

create table if not exists public.membres (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entreprise_id uuid not null references public.entreprises (id) on delete cascade,
  nom text not null default '',
  role text not null default 'proprietaire' check (role in ('proprietaire', 'gerant')),
  cree_le timestamptz not null default now()
);
create index if not exists membres_entreprise_idx on public.membres (entreprise_id);

-- Les données existantes deviennent la première entreprise (sans propriétaire pour l'instant :
-- elle sera rattachée au premier administrateur qui crée son compte).
insert into public.entreprises (id, nom)
select '00000000-0000-0000-0000-000000000001', 'Mon entreprise'
where exists (select 1 from public.livreurs) or exists (select 1 from public.livraisons)
on conflict (id) do nothing;

alter table public.livreurs add column if not exists entreprise_id uuid references public.entreprises (id) on delete cascade;
alter table public.livraisons add column if not exists entreprise_id uuid references public.entreprises (id) on delete cascade;
update public.livreurs set entreprise_id = '00000000-0000-0000-0000-000000000001' where entreprise_id is null;
update public.livraisons set entreprise_id = '00000000-0000-0000-0000-000000000001' where entreprise_id is null;
alter table public.livreurs alter column entreprise_id set not null;
alter table public.livraisons alter column entreprise_id set not null;

-- Une immatriculation est unique par entreprise (plus pour tout le site).
alter table public.livreurs drop constraint if exists livreurs_immatriculation_key;
create unique index if not exists livreurs_entreprise_immat_idx on public.livreurs (entreprise_id, immatriculation);
create index if not exists livraisons_entreprise_idx on public.livraisons (entreprise_id, cree_le desc);

alter table public.entreprises enable row level security;
alter table public.membres enable row level security;

grant select, insert, update, delete on public.entreprises, public.membres to service_role;
revoke all on public.entreprises, public.membres from anon, authenticated;
