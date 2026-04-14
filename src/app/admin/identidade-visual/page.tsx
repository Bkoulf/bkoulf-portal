import { createClient } from '@/lib/supabase/server'
import { IdentidadeVisualManager } from '@/components/admin/identidade-visual-manager'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Identidade Visual',
}


export default async function AdminIdentidadeVisualPage() {
  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('client_id, clients(id, name, company)')
    .eq('type', 'identidade_visual')

  const raw = (services ?? []).map(s => {
    const c = s.clients as unknown as { id: string; name: string; company?: string } | null
    return c ? { id: c.id, name: c.name, company: c.company ?? undefined } : null
  }).filter(Boolean) as { id: string; name: string; company?: string }[]

  const clients = raw.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)

  return <IdentidadeVisualManager clients={clients} />
}
