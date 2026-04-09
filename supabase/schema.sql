-- ============================================================
-- BKOULF PORTAL - Schema do Banco de Dados
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Habilita UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'client' check (role in ('admin', 'client')),
  avatar_url text,
  client_id uuid,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Admin vê todos os perfis, cliente vê apenas o próprio
create policy "Admin pode ver todos os perfis"
  on public.profiles for select
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê apenas o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admin atualiza qualquer perfil"
  on public.profiles for update
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Permite inserção via trigger"
  on public.profiles for insert
  with check (true);

-- Trigger para criar perfil automaticamente ao cadastrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'client')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TABELA: clients
-- ============================================================
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  phone text,
  company text,
  plan text,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

create policy "Admin gerencia clientes"
  on public.clients for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê apenas seus dados"
  on public.clients for select
  using (
    id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: services
-- ============================================================
create table public.services (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  type text not null check (type in ('trafego_pago', 'edicao_videos', 'identidade_visual', 'website')),
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'concluido', 'pendente')),
  description text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

create policy "Admin gerencia serviços"
  on public.services for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus serviços"
  on public.services for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: deliverables
-- ============================================================
create table public.deliverables (
  id uuid default uuid_generate_v4() primary key,
  service_id uuid references public.services(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'aguardando_aprovacao'
    check (status in ('aguardando_aprovacao', 'aprovado', 'ajuste_solicitado', 'entregue')),
  file_url text,
  feedback text,
  due_date date,
  created_at timestamptz default now()
);

alter table public.deliverables enable row level security;

create policy "Admin gerencia entregas"
  on public.deliverables for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê suas entregas"
  on public.deliverables for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

create policy "Cliente atualiza status das suas entregas"
  on public.deliverables for update
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  )
  with check (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: demands
-- ============================================================
create table public.demands (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  description text not null,
  status text not null default 'aberta'
    check (status in ('aberta', 'em_andamento', 'concluida', 'cancelada')),
  priority text not null default 'media'
    check (priority in ('baixa', 'media', 'alta', 'urgente')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.demands enable row level security;

create policy "Admin gerencia demandas"
  on public.demands for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê e cria suas demandas"
  on public.demands for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

create policy "Cliente cria demanda"
  on public.demands for insert
  with check (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: messages
-- ============================================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  sender_id uuid references auth.users(id) not null,
  sender_name text not null,
  content text not null,
  is_from_agency boolean not null default false,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.messages enable row level security;

create policy "Admin gerencia mensagens"
  on public.messages for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê suas mensagens"
  on public.messages for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

create policy "Cliente envia mensagens"
  on public.messages for insert
  with check (
    client_id = (select client_id from public.profiles where id = auth.uid())
    and sender_id = auth.uid()
    and is_from_agency = false
  );

create policy "Cliente marca mensagens como lidas"
  on public.messages for update
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: calendar_events
-- ============================================================
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  title text not null,
  description text,
  event_date timestamptz not null,
  type text not null default 'outro'
    check (type in ('entrega', 'reuniao', 'publicacao', 'outro')),
  created_at timestamptz default now()
);

alter table public.calendar_events enable row level security;

create policy "Admin gerencia eventos"
  on public.calendar_events for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus eventos"
  on public.calendar_events for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: bk4_diagnostics
-- ============================================================
create table public.bk4_diagnostics (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  score integer not null check (score >= 0 and score <= 100),
  identity_score integer not null check (identity_score >= 0 and identity_score <= 100),
  audiovisual_score integer not null check (audiovisual_score >= 0 and audiovisual_score <= 100),
  digital_score integer not null check (digital_score >= 0 and digital_score <= 100),
  conversion_score integer not null check (conversion_score >= 0 and conversion_score <= 100),
  problems text[] default '{}',
  opportunities text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

alter table public.bk4_diagnostics enable row level security;

create policy "Admin gerencia diagnósticos"
  on public.bk4_diagnostics for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus diagnósticos"
  on public.bk4_diagnostics for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: reports
-- ============================================================
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  service_type text not null
    check (service_type in ('trafego_pago', 'edicao_videos', 'identidade_visual', 'website')),
  period text not null,
  title text not null,
  data jsonb default '{}',
  file_url text,
  created_at timestamptz default now()
);

alter table public.reports enable row level security;

create policy "Admin gerencia relatórios"
  on public.reports for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus relatórios"
  on public.reports for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

-- ============================================================
-- TABELA: files
-- ============================================================
create table public.files (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  url text not null,
  size bigint,
  type text,
  category text not null default 'outro'
    check (category in ('entrega', 'material_cliente', 'relatorio', 'outro')),
  uploaded_by uuid references auth.users(id) not null,
  created_at timestamptz default now()
);

alter table public.files enable row level security;

create policy "Admin gerencia arquivos"
  on public.files for all
  using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Cliente vê seus arquivos"
  on public.files for select
  using (
    client_id = (select client_id from public.profiles where id = auth.uid())
  );

create policy "Cliente faz upload de arquivos"
  on public.files for insert
  with check (
    client_id = (select client_id from public.profiles where id = auth.uid())
    and uploaded_by = auth.uid()
  );

-- ============================================================
-- STORAGE BUCKET para arquivos
-- ============================================================
insert into storage.buckets (id, name, public) values ('portal-files', 'portal-files', false);

create policy "Autenticados fazem upload"
  on storage.objects for insert
  with check (bucket_id = 'portal-files' and auth.role() = 'authenticated');

create policy "Autenticados lêem seus arquivos"
  on storage.objects for select
  using (bucket_id = 'portal-files' and auth.role() = 'authenticated');
