import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type PeriodMode = 'current' | 'last' | 'last3'

function getPeriod(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - monthsAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

interface MetricaRow {
  investimento: number | string
  leads: number
  cliques: number
  impressoes: number
  roas: number | string
}

function aggregateMetricas(rows: MetricaRow[]) {
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

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function formatPeriodLabel(periodo: string): string {
  const [year, month] = periodo.split('-')
  return `${MONTHS[parseInt(month) - 1]}/${year.slice(2)}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = (searchParams.get('mode') ?? 'current') as PeriodMode

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('client_id').eq('id', user.id).single()
  if (!profile?.client_id) return NextResponse.json({ error: 'No client' }, { status: 400 })

  const clientId = profile.client_id

  let currentPeriods: string[]
  let previousPeriods: string[]

  if (mode === 'last3') {
    currentPeriods = [getPeriod(0), getPeriod(1), getPeriod(2)]
    previousPeriods = [getPeriod(3), getPeriod(4), getPeriod(5)]
  } else if (mode === 'last') {
    currentPeriods = [getPeriod(1)]
    previousPeriods = [getPeriod(2)]
  } else {
    currentPeriods = [getPeriod(0)]
    previousPeriods = [getPeriod(1)]
  }

  const [
    { data: currentRows },
    { data: previousRows },
    { data: historicoRows },
    { data: campanhas },
    { data: criativos },
  ] = await Promise.all([
    supabase.from('trafego_pago_metricas').select('*')
      .eq('client_id', clientId).in('periodo', currentPeriods),
    supabase.from('trafego_pago_metricas').select('*')
      .eq('client_id', clientId).in('periodo', previousPeriods),
    supabase.from('trafego_pago_metricas')
      .select('periodo,investimento,leads')
      .eq('client_id', clientId)
      .order('periodo', { ascending: true })
      .limit(6),
    supabase.from('trafego_pago_campanhas').select('*')
      .eq('client_id', clientId).in('periodo', currentPeriods)
      .order('investimento', { ascending: false }),
    supabase.from('trafego_pago_criativos').select('*')
      .eq('client_id', clientId).in('periodo', currentPeriods)
      .order('leads', { ascending: false }).limit(3),
  ])

  const metricas = aggregateMetricas(currentRows ?? [])
  const metricasAnterior = aggregateMetricas(previousRows ?? [])

  const historico = (historicoRows ?? []).map(r => ({
    periodo: r.periodo,
    label: formatPeriodLabel(r.periodo),
    investimento: Number(r.investimento),
    leads: r.leads,
  }))

  const campanhasFormatted = (campanhas ?? []).map(c => ({
    ...c,
    investimento: Number(c.investimento),
    cpl: c.leads > 0 ? Number(c.investimento) / c.leads : 0,
  }))

  const criativosFormatted = (criativos ?? []).map(c => ({
    ...c,
    ctr: Number(c.ctr),
  }))

  return NextResponse.json({
    metricas,
    metricasAnterior,
    historico,
    campanhas: campanhasFormatted,
    criativos: criativosFormatted,
  })
}
