-- ============================================================
-- BKOULF - Leads de Prospecção Automática
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela principal de leads
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  empresa text not null,
  telefone text,
  whatsapp_valido boolean,
  cidade text,
  endereco text,
  segmento text,
  website text,
  google_place_id text unique,
  rating numeric(2,1),
  total_reviews int,
  status text not null default 'capturado'
    check (status in ('capturado', 'mensagem_enviada', 'entregue', 'lido', 'respondeu', 'bloqueou', 'opt_out')),
  mensagem_enviada text,
  enviado_em timestamptz,
  created_at timestamptz default now()
);

-- RLS: apenas admin acessa
alter table public.leads enable row level security;

create policy "Admin gerencia leads"
  on public.leads for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Índices para performance
create index leads_status_idx on public.leads(status);
create index leads_cidade_idx on public.leads(cidade);
create index leads_enviado_em_idx on public.leads(enviado_em);
create index leads_created_at_idx on public.leads(created_at desc);

-- ============================================================
-- Tabela de configuração da automação
-- ============================================================
create table public.leads_config (
  id int primary key default 1,
  raio_km int not null default 30,
  limite_diario int not null default 30,
  cidades text[] not null default array['Cotia', 'Vargem Grande Paulista', 'Itapevi', 'Embu das Artes', 'Osasco'],
  ativo boolean not null default false,
  updated_at timestamptz default now()
);

-- RLS: apenas admin
alter table public.leads_config enable row level security;

create policy "Admin gerencia config de leads"
  on public.leads_config for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Registro padrão
insert into public.leads_config (id, raio_km, limite_diario, cidades, ativo)
values (1, 30, 30, array['Cotia', 'Vargem Grande Paulista', 'Itapevi', 'Embu das Artes', 'Osasco'], false)
on conflict (id) do nothing;

-- ============================================================
-- View: resumo diário de envios (usada pelo n8n para checar limite)
-- ============================================================
create or replace view public.leads_enviados_hoje as
select count(*) as total
from public.leads
where enviado_em >= current_date
  and enviado_em < current_date + interval '1 day'
  and status != 'capturado';
