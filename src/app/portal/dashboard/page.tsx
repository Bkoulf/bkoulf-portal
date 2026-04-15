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
    { data: videos },
    { data: identidade },
    { data: website },
  ] = await Promise.all([
    supabase.from('services').select('*').eq('client_id', clientId),
    supabase.from('deliverables').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('demands').select('*').eq('client_id', clientId),
    supabase.from('bk4_diagnostics').select('*').eq('client_id', clientId)
      .order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('messages').select('*').eq('client_id', clientId)
      .eq('is_from_agency', false).eq('read', false),
    supabase.from('videos').select('id, status, criado_em').eq('cliente_id', clientId),
    supabase.from('identidade_visual').select('id, status, atualizado_em').eq('cliente_id', clientId).maybeSingle(),
    supabase.from('websites').select('id, status, atualizado_em').eq('cliente_id', clientId).maybeSingle(),
  ])

  // Vídeos com status relevante
  const videoDeliverables = (videos ?? [])
    .filter(v => ['entregue', 'aprovado', 'reprovado'].includes(v.status))
    .map(v => ({
      id: `video-${v.id}`,
      title: 'Vídeo',
      status: v.status === 'aprovado' ? 'aprovado'
            : v.status === 'reprovado' ? 'ajuste_solicitado'
            : 'entregue',
      created_at: v.criado_em,
    }))

  // Identidade Visual entregue
  const identidadeDeliverables = identidade && identidade.status === 'entregue'
    ? [{
        id: `identidade-${identidade.id}`,
        title: 'Identidade Visual',
        status: 'aprovado',
        created_at: identidade.atualizado_em ?? new Date().toISOString(),
      }]
    : []

  // Website entregue ou em manutenção
  const websiteDeliverables = website && ['entregue', 'manutencao'].includes(website.status ?? '')
    ? [{
        id: `website-${website.id}`,
        title: 'Website',
        status: 'aprovado',
        created_at: website.atualizado_em ?? new Date().toISOString(),
      }]
    : []

  const allDeliverables = [
    ...(deliverables ?? []),
    ...videoDeliverables,
    ...identidadeDeliverables,
    ...websiteDeliverables,
  ]

  return (
    <DashboardClient
      firstName={profile?.full_name?.split(' ')[0] ?? 'Cliente'}
      services={services ?? []}
      deliverables={allDeliverables}
      demands={demands ?? []}
      diagnostic={diagnostic ?? null}
      unreadMessages={(messages ?? []).length}
    />
  )
}
