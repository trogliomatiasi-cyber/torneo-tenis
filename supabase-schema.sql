-- Ejecutar esto en el SQL Editor de Supabase

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_name text,
  created_at timestamp with time zone default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  stage text not null default 'group',
  group_name text,
  match_position int,
  player1_id uuid references players(id) on delete set null,
  player2_id uuid references players(id) on delete set null,
  set1_p1 int,
  set1_p2 int,
  set2_p1 int,
  set2_p2 int,
  supertb_p1 int,
  supertb_p2 int,
  winner_id uuid references players(id) on delete set null,
  played boolean default false,
  created_at timestamp with time zone default now()
);

-- Permitir lectura pública (para que todos puedan ver el torneo)
alter table players enable row level security;
alter table matches enable row level security;

create policy "Lectura pública de jugadores" on players for select using (true);
create policy "Lectura pública de partidos" on matches for select using (true);
create policy "Escritura desde servidor" on players for all using (true);
create policy "Escritura desde servidor" on matches for all using (true);
