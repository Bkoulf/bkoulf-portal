import { createClient } from '@/lib/supabase/server'
import { RelatoriosManager } from '@/components/admin/relatorios-manager'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Relatórios',
}


export default async function AdminRelatoriosPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: reports }] = await Promise.all([
    supabase.from('clients').select('id, name').eq('status', 'ativo').order('name'),
    supabase.from('reports').select('*').order('created_at', { ascending: false }),
  ])

  return <RelatoriosManager clients={clients ?? []} reports={reports ?? []} />
}
