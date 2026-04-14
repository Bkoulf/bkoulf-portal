import { createClient } from '@/lib/supabase/server'
import { TrafegoPagoClient } from '@/components/portal/trafego-pago-client'
import { ContactServiceBanner } from '@/components/portal/contact-service-banner'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import type {
  TrafegoPagoMetricas,
  TrafegoPagoCampanha,
  TrafegoPagoCriativo,
  TrafegoPagoHistorico,
} from '@/components/portal/trafego-pago-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tráfego Pago',
}

function getPeriod(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatPeriodLabel(periodo: string): string {
  const [year, month] = periodo.split('-')
  return `${MONTHS[parseInt(month) - 1]}/${year.slice(2)}`
}

interface MetricaRow {
  investimento: number | string
  leads: number
  cliques: number
  impressoes: number
  roas: number | string
}

function aggregateMetricas(rows: MetricaRow[] | null): TrafegoPagoMetricas | null {
  if (!rows || rows.length === 0) return null
  const inv = rows.reduce((s, r) => s + Number(r.investimento), 0)
  const leads = rows.reduce((s, r) => s + r.leads, 0)
  const cliques = rows.reduce((s, r) => s + r.cliques, 0)
  const impressoes = rows.reduce((s, r) => s + r.impressoes, 0)
  const roas = rows.reduce((s, r) => s + Number(r.roas), 0) / rows.length
  return {
    investimento: inv,
    leads,
    cliques,
    impressoes,
    roas,
    cpl: leads > 0 ? inv / leads : 0,
    ctr: impressoes > 0 ? (cliques / impressoes) * 100 : 0,
  }
}

export default async function TrafegoPagoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single()
  const clientId = profile?.client_id ?? ''

  const { data: service } = await supabase
    .from('services').select('*').eq('client_id', clientId).eq('type', 'trafego_pago').single()

  if (!service) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-white">Tráfego Pago</h1>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-sm">Este serviço não está ativo no seu plano.</p>
          </CardContent>
        </Card>
        <ContactServiceBanner service="Tráfego Pago" contracted={false} />
      </div>
    )
  }

  const currentPeriod = getPeriod(0)
  const previousPeriod = getPeriod(1)

  const [
    { data: currentMetricas },
    { data: previousMetricas },
    { data: historicoRows },
    { data: campanhas },
    { data: criativos },
  ] = await Promise.all([
    supabase.from('trafego_pago_metricas').select('*')
      .eq('client_id', clientId).eq('periodo', currentPeriod),
    supabase.from('trafego_pago_metricas').select('*')
      .eq('client_id', clientId).eq('periodo', previousPeriod),
    supabase.from('trafego_pago_metricas')
      .select('periodo,investimento,leads')
      .eq('client_id', clientId)
      .order('periodo', { ascending: true })
      .limit(6),
    supabase.from('trafego_pago_campanhas').select('*')
      .eq('client_id', clientId).eq('periodo', currentPeriod)
      .order('investimento', { ascending: false }),
    supabase.from('trafego_pago_criativos').select('*')
      .eq('client_id', clientId).eq('periodo', currentPeriod)
      .order('leads', { ascending: false }).limit(3),
  ])

  const historico: TrafegoPagoHistorico[] = (historicoRows ?? []).map(r => ({
    periodo: r.periodo,
    label: formatPeriodLabel(r.periodo),
    investimento: Number(r.investimento),
    leads: r.leads,
  }))

  const campanhasFormatted: TrafegoPagoCampanha[] = (campanhas ?? []).map(c => ({
    id: c.id,
    nome: c.nome,
    status: c.status as 'ativo' | 'pausado' | 'encerrado',
    investimento: Number(c.investimento),
    leads: c.leads,
    cliques: c.cliques,
    cpl: c.leads > 0 ? Number(c.investimento) / c.leads : 0,
  }))

  const criativosFormatted: TrafegoPagoCriativo[] = (criativos ?? []).map(c => ({
    id: c.id,
    nome: c.nome,
    tipo: c.tipo as 'imagem' | 'video' | 'carrossel',
    impressoes: c.impressoes,
    cliques: c.cliques,
    leads: c.leads,
    ctr: Number(c.ctr),
    thumbnail_url: c.thumbnail_url,
  }))

  return (
    <TrafegoPagoClient
      initialMetricas={aggregateMetricas(currentMetricas)}
      initialMetricasAnterior={aggregateMetricas(previousMetricas)}
      initialHistorico={historico}
      initialCampanhas={campanhasFormatted}
      initialCriativos={criativosFormatted}
    />
  )
}
