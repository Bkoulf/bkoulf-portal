-- ============================================================
-- OTIMIZAÇÕES DE PERFORMANCE
-- Execute no Supabase SQL Editor
-- ============================================================

-- ── 1. FUNÇÕES AUXILIARES PARA RLS ───────────────────────────────────────────
-- O problema: cada política RLS faz uma subquery por LINHA retornada.
-- Com 100 linhas, a subquery roda 100x. Com funções STABLE + SECURITY DEFINER,
-- o PostgreSQL cacheia o resultado dentro da mesma query → roda 1x.

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.get_my_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid()
$$;

-- ── 2. ÍNDICES ────────────────────────────────────────────────────────────────
-- Sem índices, o Postgres faz full table scan em cada query com WHERE.

create index if not exists idx_profiles_client_id
  on public.profiles(client_id);

create index if not exists idx_profiles_role
  on public.profiles(role);

create index if not exists idx_services_client_id
  on public.services(client_id);

create index if not exists idx_services_client_type
  on public.services(client_id, type);

create index if not exists idx_deliverables_client_id
  on public.deliverables(client_id);

create index if not exists idx_deliverables_service_id
  on public.deliverables(service_id);

create index if not exists idx_demands_client_id
  on public.demands(client_id);

create index if not exists idx_messages_client_id
  on public.messages(client_id);

create index if not exists idx_calendar_events_client_id
  on public.calendar_events(client_id);

create index if not exists idx_bk4_diagnostics_client_id
  on public.bk4_diagnostics(client_id);

create index if not exists idx_reports_client_id
  on public.reports(client_id);

create index if not exists idx_files_client_id
  on public.files(client_id);

create index if not exists idx_trafego_metricas_client_periodo
  on public.trafego_pago_metricas(client_id, periodo desc);

create index if not exists idx_trafego_campanhas_client_periodo
  on public.trafego_pago_campanhas(client_id, periodo);

create index if not exists idx_trafego_criativos_client_periodo
  on public.trafego_pago_criativos(client_id, periodo);

create index if not exists idx_contratos_video_cliente_id
  on public.contratos_video(cliente_id);

create index if not exists idx_videos_cliente_id
  on public.videos(cliente_id);

create index if not exists idx_videos_cliente_status
  on public.videos(cliente_id, status);

create index if not exists idx_identidade_visual_cliente_id
  on public.identidade_visual(cliente_id);

create index if not exists idx_websites_cliente_id
  on public.websites(cliente_id);

-- ── 3. POLÍTICAS RLS OTIMIZADAS ───────────────────────────────────────────────
-- Substitui subqueries inline pelas funções cacheadas acima.

-- profiles
drop policy if exists "Admin vê todos os perfis" on public.profiles;
drop policy if exists "Usuário vê próprio perfil" on public.profiles;
drop policy if exists "Admin atualiza perfis" on public.profiles;
create policy "Admin vê todos os perfis" on public.profiles
  for select using (get_my_role() = 'admin');
create policy "Usuário vê próprio perfil" on public.profiles
  for select using (id = auth.uid());
create policy "Usuário atualiza próprio perfil" on public.profiles
  for update using (id = auth.uid());

-- clients
drop policy if exists "Admin gerencia clientes" on public.clients;
drop policy if exists "Cliente vê seus dados" on public.clients;
create policy "Admin gerencia clientes" on public.clients
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus dados" on public.clients
  for select using (id = get_my_client_id());

-- services
drop policy if exists "Admin gerencia serviços" on public.services;
drop policy if exists "Cliente vê seus serviços" on public.services;
create policy "Admin gerencia serviços" on public.services
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus serviços" on public.services
  for select using (client_id = get_my_client_id());

-- deliverables
drop policy if exists "Admin gerencia entregas" on public.deliverables;
drop policy if exists "Cliente vê e atualiza seus deliverables" on public.deliverables;
drop policy if exists "Cliente vê seus deliverables" on public.deliverables;
create policy "Admin gerencia entregas" on public.deliverables
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus deliverables" on public.deliverables
  for select using (client_id = get_my_client_id());

-- demands
drop policy if exists "Admin gerencia demandas" on public.demands;
drop policy if exists "Cliente vê suas demandas" on public.demands;
create policy "Admin gerencia demandas" on public.demands
  for all using (get_my_role() = 'admin');
create policy "Cliente vê suas demandas" on public.demands
  for select using (client_id = get_my_client_id());

-- messages
drop policy if exists "Admin gerencia mensagens" on public.messages;
drop policy if exists "Cliente vê suas mensagens" on public.messages;
create policy "Admin gerencia mensagens" on public.messages
  for all using (get_my_role() = 'admin');
create policy "Cliente gerencia suas mensagens" on public.messages
  for all using (client_id = get_my_client_id());

-- calendar_events
drop policy if exists "Admin gerencia eventos" on public.calendar_events;
drop policy if exists "Cliente vê seus eventos" on public.calendar_events;
create policy "Admin gerencia eventos" on public.calendar_events
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus eventos" on public.calendar_events
  for select using (client_id = get_my_client_id());

-- bk4_diagnostics
drop policy if exists "Admin gerencia diagnósticos" on public.bk4_diagnostics;
drop policy if exists "Cliente vê seus diagnósticos" on public.bk4_diagnostics;
create policy "Admin gerencia diagnósticos" on public.bk4_diagnostics
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus diagnósticos" on public.bk4_diagnostics
  for select using (client_id = get_my_client_id());

-- reports
drop policy if exists "Admin gerencia relatórios" on public.reports;
drop policy if exists "Cliente vê seus relatórios" on public.reports;
create policy "Admin gerencia relatórios" on public.reports
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus relatórios" on public.reports
  for select using (client_id = get_my_client_id());

-- files
drop policy if exists "Admin gerencia arquivos" on public.files;
drop policy if exists "Cliente gerencia seus arquivos" on public.files;
drop policy if exists "Cliente vê seus arquivos" on public.files;
create policy "Admin gerencia arquivos" on public.files
  for all using (get_my_role() = 'admin');
create policy "Cliente gerencia seus arquivos" on public.files
  for all using (client_id = get_my_client_id());

-- trafego_pago_metricas
drop policy if exists "Admin gerencia métricas" on public.trafego_pago_metricas;
drop policy if exists "Cliente vê suas métricas" on public.trafego_pago_metricas;
create policy "Admin gerencia métricas" on public.trafego_pago_metricas
  for all using (get_my_role() = 'admin');
create policy "Cliente vê suas métricas" on public.trafego_pago_metricas
  for select using (client_id = get_my_client_id());

-- trafego_pago_campanhas
drop policy if exists "Admin gerencia campanhas" on public.trafego_pago_campanhas;
drop policy if exists "Cliente vê suas campanhas" on public.trafego_pago_campanhas;
create policy "Admin gerencia campanhas" on public.trafego_pago_campanhas
  for all using (get_my_role() = 'admin');
create policy "Cliente vê suas campanhas" on public.trafego_pago_campanhas
  for select using (client_id = get_my_client_id());

-- trafego_pago_criativos
drop policy if exists "Admin gerencia criativos" on public.trafego_pago_criativos;
drop policy if exists "Cliente vê seus criativos" on public.trafego_pago_criativos;
create policy "Admin gerencia criativos" on public.trafego_pago_criativos
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus criativos" on public.trafego_pago_criativos
  for select using (client_id = get_my_client_id());

-- contratos_video
drop policy if exists "Admin gerencia contratos de vídeo" on public.contratos_video;
drop policy if exists "Cliente vê seu contrato de vídeo" on public.contratos_video;
create policy "Admin gerencia contratos de vídeo" on public.contratos_video
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seu contrato de vídeo" on public.contratos_video
  for select using (cliente_id = get_my_client_id());

-- videos
drop policy if exists "Admin gerencia vídeos" on public.videos;
drop policy if exists "Cliente vê seus vídeos" on public.videos;
create policy "Admin gerencia vídeos" on public.videos
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seus vídeos" on public.videos
  for select using (cliente_id = get_my_client_id());

-- identidade_visual
drop policy if exists "Admin gerencia identidade visual" on public.identidade_visual;
drop policy if exists "Cliente vê sua identidade visual" on public.identidade_visual;
create policy "Admin gerencia identidade visual" on public.identidade_visual
  for all using (get_my_role() = 'admin');
create policy "Cliente vê sua identidade visual" on public.identidade_visual
  for select using (cliente_id = get_my_client_id());

-- websites
drop policy if exists "Admin gerencia websites" on public.websites;
drop policy if exists "Cliente vê seu website" on public.websites;
create policy "Admin gerencia websites" on public.websites
  for all using (get_my_role() = 'admin');
create policy "Cliente vê seu website" on public.websites
  for select using (cliente_id = get_my_client_id());
