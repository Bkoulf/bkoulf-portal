-- ============================================================
-- TAREFAS V2 — 4 colunas por serviço, etiqueta de status
-- Execute no Supabase SQL Editor
-- ============================================================

DROP TABLE IF EXISTS public.tarefas;

CREATE TABLE public.tarefas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  category    TEXT NOT NULL
              CHECK (category IN ('identidade_visual', 'edicao_videos', 'website', 'trafego_pago')),
  title       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'em_andamento'
              CHECK (status IN ('em_andamento', 'finalizado')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_client_id ON public.tarefas(client_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_category  ON public.tarefas(category);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin gerencia tarefas" ON public.tarefas
  FOR ALL USING (get_my_role() = 'admin');
