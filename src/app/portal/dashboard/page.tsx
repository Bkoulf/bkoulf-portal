import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/portal/dashboard-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
}


export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, client_id')
    .eq('id', user!.id)
    .single()

  const clientId = profile?.client_id ?? ''

  const [
    { data: services },
    { data: deliverables },
    { data: demands },
    { data: diagnostic },
    { data: messages },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('client_id', clientId),
    supabase.from('deliverables').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('demands').select('*').eq('client_id', clientId),
    supabase.from('bk4_diagnostics').select('*').eq('client_id', clientId)
      .order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('messages').select('*').eq('client_id', clientId)
      .eq('is_from_agency', false).eq('read', false),
  ])

  return (
    <DashboardClient
      firstName={profile?.full_name?.split(' ')[0] ?? 'Cliente'}
      services={services ?? []}
      deliverables={deliverables ?? []}
      demands={demands ?? []}
      diagnostic={diagnostic ?? null}
      unreadMessages={(messages ?? []).length}
    />
  )
}
