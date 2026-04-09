-- ============================================================
-- IDENTIDADE VISUAL — Tabelas
-- Execute no Supabase SQL Editor
-- ============================================================

create table public.identidade_visual (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clients(id) on delete cascade not null,
  arquivo_url text,
  nome_arquivo text,
  status text not null default 'em_producao'
    check (status in ('em_producao', 'entregue')),
  entregue_em timestamptz,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique(cliente_id)
);

alter table public.identidade_visual enable row level security;

create policy "Admin gerencia identidade visual"
  on public.identidade_visual for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê sua identidade visual"
  on public.identidade_visual for select
  using (
    cliente_id = (select client_id from public.profiles where id = auth.uid())
  );
