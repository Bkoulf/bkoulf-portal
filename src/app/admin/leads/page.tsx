import { createClient } from '@/lib/supabase/server'
import { LeadsDashboard } from '@/components/admin/leads-dashboard'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leads',
}


export default async function AdminLeadsPage() {
  const supabase = await createClient()

  const [{ data: leads }, { data: config }] = await Promise.all([
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('leads_config')
      .select('*')
      .eq('id', 1)
      .single(),
  ])

  return <LeadsDashboard leads={leads ?? []} config={config} />
}
