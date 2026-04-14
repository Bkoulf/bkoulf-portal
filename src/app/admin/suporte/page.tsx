import { createClient } from '@/lib/supabase/server'
import { AdminSuporteClient } from '@/components/admin/suporte-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Suporte',
}


export default async function AdminSuportePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('status', 'ativo')
    .order('name')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  return (
    <AdminSuporteClient
      clients={clients ?? []}
      adminId={user!.id}
      adminName={profile?.full_name ?? 'Bkoulf'}
    />
  )
}
