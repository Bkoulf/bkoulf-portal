-- ============================================================
-- TRÁFEGO PAGO — Tabelas de Métricas
-- Execute no Supabase SQL Editor após o schema.sql principal
-- ============================================================

-- Métricas mensais de tráfego pago por cliente
create table public.trafego_pago_metricas (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  periodo text not null,        -- formato: 'YYYY-MM' ex: '2026-04'
  investimento numeric(12,2) not null default 0,
  leads integer not null default 0,
  cliques integer not null default 0,
  impressoes integer not null default 0,
  roas numeric(8,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, periodo)
);

alter table public.trafego_pago_metricas enable row level security;

create policy "Admin gerencia métricas de tráfego"
  on public.trafego_pago_metricas for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê suas métricas de tráfego"
  on public.trafego_pago_metricas for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Campanhas de tráfego pago por período
create table public.trafego_pago_campanhas (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  periodo text not null,
  nome text not null,
  status text not null default 'ativo'
    check (status in ('ativo', 'pausado', 'encerrado')),
  investimento numeric(12,2) not null default 0,
  leads integer not null default 0,
  cliques integer not null default 0,
  created_at timestamptz default now()
);

alter table public.trafego_pago_campanhas enable row level security;

create policy "Admin gerencia campanhas de tráfego"
  on public.trafego_pago_campanhas for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê suas campanhas de tráfego"
  on public.trafego_pago_campanhas for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Criativos de tráfego pago (top performers por período)
create table public.trafego_pago_criativos (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  periodo text not null,
  nome text not null,
  tipo text not null default 'imagem'
    check (tipo in ('imagem', 'video', 'carrossel')),
  impressoes integer not null default 0,
  cliques integer not null default 0,
  leads integer not null default 0,
  ctr numeric(5,2) not null default 0,
  thumbnail_url text,
  created_at timestamptz default now()
);

alter table public.trafego_pago_criativos enable row level security;

create policy "Admin gerencia criativos de tráfego"
  on public.trafego_pago_criativos for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus criativos de tráfego"
  on public.trafego_pago_criativos for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );
