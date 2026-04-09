-- ============================================================
-- EDIÇÃO DE VÍDEOS — Tabelas
-- Execute no Supabase SQL Editor
-- ============================================================

-- Contrato de vídeos por cliente (1 por cliente)
create table public.contratos_video (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clients(id) on delete cascade not null,
  total_combinado integer not null default 0,
  data_entrega date,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique(cliente_id)
);

alter table public.contratos_video enable row level security;

create policy "Admin gerencia contratos de vídeo"
  on public.contratos_video for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seu contrato de vídeo"
  on public.contratos_video for select
  using (
    cliente_id = (select client_id from public.profiles where id = auth.uid())
  );

-- Vídeos por cliente
create table public.videos (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clients(id) on delete cascade not null,
  titulo text not null,
  descricao text,
  status text not null default 'pendente'
    check (status in ('pendente', 'em_edicao', 'entregue')),
  arquivo_url text,
  tamanho_arquivo numeric(10,2),
  resolucao text not null default '1080p'
    check (resolucao in ('4K', '1080p', '720p')),
  thumbnail_url text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

alter table public.videos enable row level security;

create policy "Admin gerencia vídeos"
  on public.videos for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus vídeos"
  on public.videos for select
  using (
    cliente_id = (select client_id from public.profiles where id = auth.uid())
  );
