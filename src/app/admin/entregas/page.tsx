import { createClient } from '@/lib/supabase/server'
import { EntregasManager } from '@/components/admin/entregas-manager'
import { Card, CardContent } from '@/components/ui/card'
import { Users, PackageCheck, Clock, MessageSquare } from 'lucide-react'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Entregas',
}


export default async function AdminEntregasPage() {
  const supabase = await createClient()

  const [
    { data: clients },
    { data: services },
    { data: deliverables },
    { count: totalClients },
    { count: pendingDeliverables },
    { count: openDemands },
    { count: unreadMessages },
  ] = await Promise.all([
    supabase.from('clients').select('id, name').eq('status', 'ativo').order('name'),
    supabase.from('services').select('id, client_id, type, status'),
    supabase.from('deliverables').select('*').order('created_at', { ascending: false }),
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('deliverables').select('*', { count: 'exact', head: true }).eq('status', 'aguardando_aprovacao'),
    supabase.from('demands').select('*', { count: 'exact', head: true }).in('status', ['aberta', 'em_andamento']),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('is_from_agency', false).eq('read', false),
  ])

  const cards = [
    { label: 'Clientes ativos', value: totalClients ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Aguardando aprovação', value: pendingDeliverables ?? 0, icon: PackageCheck, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { label: 'Demandas em aberto', value: openDemands ?? 0, icon: Clock, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Mensagens não lidas', value: unreadMessages ?? 0, icon: MessageSquare, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    <p className="text-sm text-zinc-400">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <EntregasManager
        clients={clients ?? []}
        services={services ?? []}
        deliverables={deliverables ?? []}
      />
    </div>
  )
}
