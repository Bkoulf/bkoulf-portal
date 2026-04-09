-- ============================================================
-- APROVAÇÃO DE VÍDEOS PELO CLIENTE
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adiciona colunas de aprovação
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS observacao_reprovacao TEXT,
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reprovado_em TIMESTAMPTZ;

-- 2. Remove constraint de status anterior (se existir)
ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_status_check;

-- 3. Recria com os novos valores
ALTER TABLE public.videos
  ADD CONSTRAINT videos_status_check
  CHECK (status IN ('pendente', 'em_edicao', 'entregue', 'aprovado', 'reprovado'));

-- 4. Permite que o cliente atualize status dos seus próprios vídeos (aprovação)
DROP POLICY IF EXISTS "Cliente aprova seus vídeos" ON public.videos;
CREATE POLICY "Cliente aprova seus vídeos" ON public.videos
  FOR UPDATE
  USING (cliente_id = get_my_client_id())
  WITH CHECK (cliente_id = get_my_client_id());
