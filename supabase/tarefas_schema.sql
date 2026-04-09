-- ============================================================
-- TAREFAS DO ADMIN (board de tarefas por cliente)
-- Execute no Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tarefas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'a_fazer'
              CHECK (status IN ('a_fazer', 'em_andamento', 'concluido')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice por cliente
CREATE INDEX IF NOT EXISTS idx_tarefas_client_id ON public.tarefas(client_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status     ON public.tarefas(client_id, status);

-- RLS
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia tarefas" ON public.tarefas
  FOR ALL USING (get_my_role() = 'admin');
