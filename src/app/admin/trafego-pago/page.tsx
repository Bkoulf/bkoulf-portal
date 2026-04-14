import { createClient } from '@/lib/supabase/server'
import { TrafegoPagoManager } from '@/components/admin/trafego-pago-manager'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tráfego Pago',
}


export default async function AdminTrafegoPagoPage() {
  const supabase = await createClient()

  // Busca clientes que têm serviço de tráfego pago ativo
  const { data: services } = await supabase
    .from('services')
    .select('client_id, clients(id, name, company)')
    .eq('type', 'trafego_pago')
    .order('created_at', { ascending: false })

  const clients = (services ?? [])
    .map((s) => {
      const c = s.clients as unknown as { id: string; name: string; company?: string } | null
      return c ? { id: c.id, name: c.name, company: c.company ?? undefined } : null
    })
    .filter(Boolean) as { id: string; name: string; company?: string }[]

  // Remove duplicatas (caso um cliente tenha múltiplos registros)
  const uniqueClients = clients.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)

  return <TrafegoPagoManager clients={uniqueClients} />
}
