import { createClient } from '@/lib/supabase/server'
import { WebsiteManager } from '@/components/admin/website-manager'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website',
}


export default async function AdminWebsitePage() {
  const supabase = await createClient()

  const { data: services } = await supabase
    .from('services')
    .select('client_id, clients(id, name, company)')
    .eq('type', 'website')

  const raw = (services ?? []).map(s => {
    const c = s.clients as unknown as { id: string; name: string; company?: string } | null
    return c ? { id: c.id, name: c.name, company: c.company ?? undefined } : null
  }).filter(Boolean) as { id: string; name: string; company?: string }[]

  const clients = raw.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)

  return <WebsiteManager clients={clients} />
}
