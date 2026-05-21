create table if not exists informes (
  id uuid default gen_random_uuid() primary key,
  token text unique not null,
  perfil jsonb not null,
  ayudas jsonb not null,
  nombre_cliente text,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days')
);

-- RLS: lectura pública por token
alter table informes enable row level security;
create policy "informes_public_read" on informes for select using (true);
create policy "informes_insert" on informes for insert with check (true);
