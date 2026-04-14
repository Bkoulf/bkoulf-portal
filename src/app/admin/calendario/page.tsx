import { createClient } from '@/lib/supabase/server'
import { CalendarioManager } from '@/components/admin/calendario-manager'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendário',
}


export default async function AdminCalendarioPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: events }] = await Promise.all([
    supabase.from('clients').select('id, name').eq('status', 'ativo').order('name'),
    supabase.from('calendar_events').select('*').order('event_date', { ascending: true }),
  ])

  return <CalendarioManager clients={clients ?? []} events={events ?? []} />
}
