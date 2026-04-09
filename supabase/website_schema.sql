-- ============================================================
-- WEBSITE — Tabela
-- Execute no Supabase SQL Editor
-- ============================================================

create table public.websites (
  id uuid default uuid_generate_v4() primary key,
  cliente_id uuid references public.clients(id) on delete cascade not null,
  status text not null default 'em_desenvolvimento'
    check (status in ('em_desenvolvimento', 'em_revisao', 'entregue', 'manutencao')),
  url text,
  plataforma text,
  hospedagem text,
  dominio text,
  painel_url text,
  painel_usuario text,
  painel_senha text,
  data_lancamento date,
  data_expiracao_dominio date,
  data_expiracao_hospedagem date,
  notas text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique(cliente_id)
);

alter table public.websites enable row level security;

create policy "Admin gerencia websites"
  on public.websites for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seu website"
  on public.websites for select
  using (
    cliente_id = (select client_id from public.profiles where id = auth.uid())
  );
