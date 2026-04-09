'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  DollarSign, Users, MousePointerClick, TrendingUp,
  BarChart2, Percent, ChevronUp, ChevronDown,
  Image, Video, LayoutGrid, Megaphone, Sparkles,
} from 'lucide-react'
import { ContactServiceBanner } from './contact-service-banner'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface TrafegoPagoMetricas {
  investimento: number
  leads: number
  cliques: number
  impressoes: number
  roas: number
  cpl: number
  ctr: number
}

export interface TrafegoPagoCampanha {
  id: string
  nome: string
  status: 'ativo' | 'pausado' | 'encerrado'
  investimento: number
  leads: number
  cliques: number
  cpl: number
}

export interface TrafegoPagoCriativo {
  id: string
  nome: string
  tipo: 'imagem' | 'video' | 'carrossel'
  impressoes: number
  cliques: number
  leads: number
  ctr: number
  thumbnail_url?: string | null
}

export interface TrafegoPagoHistorico {
  periodo: string
  label: string
  investimento: number
  leads: number
}

type PeriodMode = 'current' | 'last' | 'last3'

interface Props {
  initialMetricas: TrafegoPagoMetricas | null
  initialMetricasAnterior: TrafegoPagoMetricas | null
  initialHistorico: TrafegoPagoHistorico[]
  initialCampanhas: TrafegoPagoCampanha[]
  initialCriativos: TrafegoPagoCriativo[]
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatNumber(v: number): string {
  return Math.round(v).toLocaleString('pt-BR')
}
function calcVariation(cur: number, prev: number | null): number | null {
  if (prev === null || prev === 0) return null
  return ((cur - prev) / prev) * 100
}

// ─── Counter animation ─────────────────────────────────────────────────────

function useCounter(target: number, duration = 1200): number {
  const [val, setVal] = useState(0)
  const rafRef = useRef<number>(0)
  useEffect(() => {
    cancelAnimationFrame(rafRef.current)
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - p) ** 3
      setVal(target * eased)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
      else setVal(target)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])
  return val
}

// ─── Metric Card ───────────────────────────────────────────────────────────

const cardAccents: Record<string, { bg: string; text: string; border: string }> = {
  green:  { bg: 'bg-[rgba(255,255,255,0.05)]', text: 'text-[#5BAFF5]', border: 'border-l-[#2D7DD2]' },
  blue:   { bg: 'bg-[rgba(255,255,255,0.05)]',    text: 'text-[#5BAFF5]',    border: 'border-l-[#2D7DD2]'    },
  amber:  { bg: 'bg-[rgba(255,255,255,0.05)]',   text: 'text-[#D4A843]', border: 'border-l-[#D4A843]'   },
  purple: { bg: 'bg-[rgba(255,255,255,0.05)]',  text: 'text-[#B0B8C4]',  border: 'border-l-[#2D7DD2]'  },
  cyan:   { bg: 'bg-[rgba(255,255,255,0.05)]',    text: 'text-[#5BAFF5]',    border: 'border-l-[#2D7DD2]'    },
  pink:   { bg: 'bg-[rgba(255,255,255,0.05)]',    text: 'text-[#B0B8C4]',    border: 'border-l-[#B0B8C4]'    },
}

interface MetricCardProps {
  title: string
  value: number
  previous: number | null
  format: 'currency' | 'number' | 'roas' | 'percent'
  icon: React.ElementType
  accent: keyof typeof cardAccents
  loading: boolean
  invertColors?: boolean
  delay?: number
  noData?: boolean
}

function MetricCard({ title, value, previous, format, icon: Icon, accent, loading, invertColors, delay = 0, noData }: MetricCardProps) {
  const count = useCounter(loading ? 0 : value)
  const colors = cardAccents[accent]

  const formatted =
    format === 'currency' ? formatCurrency(count) :
    format === 'roas'     ? `${count.toFixed(2)}×` :
    format === 'percent'  ? `${count.toFixed(2)}%` :
    formatNumber(count)

  const variation = calcVariation(value, previous)
  const isPositive = variation !== null ? variation > 0 : null
  const isGood = isPositive === null ? null : (invertColors ? !isPositive : isPositive)
  const colorClass = isGood === null ? '' : isGood ? 'text-[#5BAFF5]' : 'text-[rgba(176,184,196,0.7)]'
  const VarIcon = isPositive === null ? null : isPositive ? ChevronUp : ChevronDown

  if (loading) {
    return (
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 border-l-4 border-l-zinc-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-[#1C2333] rounded-xl" />
          <div className="w-16 h-5 bg-[#1C2333] rounded-full" />
        </div>
        <div className="w-28 h-8 bg-[#1C2333] rounded mb-1" />
        <div className="w-20 h-4 bg-[#1C2333] rounded" />
      </div>
    )
  }

  return (
    <div
      className={`bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] border-l-4 ${colors.border} rounded-xl p-5 hover:bg-[#1C2333]/50 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-xl hover:shadow-black/20`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {variation !== null && VarIcon && !noData && (
          <div className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-xs font-semibold ${
            isGood ? 'bg-[rgba(255,255,255,0.05)] text-[#5BAFF5]' : 'bg-[rgba(255,255,255,0.04)] text-[rgba(176,184,196,0.7)]'
          }`}>
            <VarIcon className="w-3 h-3" />
            {Math.abs(variation).toFixed(1)}%
          </div>
        )}
        {noData && (
          <span className="text-xs text-[rgba(176,184,196,0.4)] bg-[#1C2333] px-2 py-1 rounded-full">Em breve</span>
        )}
      </div>

      <p className={`text-2xl font-bold tabular-nums ${noData ? 'text-[rgba(176,184,196,0.4)]' : 'text-white'}`}>
        {formatted}
      </p>
      <p className="text-[rgba(176,184,196,0.6)] text-sm mt-1">{title}</p>

      {!noData && variation === null && previous !== null && (
        <p className="text-xs text-zinc-700 mt-1">sem comparativo</p>
      )}
    </div>
  )
}

// ─── Status badge ───────────────────────────────────────────────────────────

const statusConfig = {
  ativo:    { label: 'Ativo',     dot: 'bg-[#D4A843]', cls: 'text-[#5BAFF5] bg-[rgba(255,255,255,0.05)] border-emerald-500/20' },
  pausado:  { label: 'Pausado',   dot: 'bg-[#2D7DD2]',   cls: 'text-[#2D7DD2]   bg-[rgba(255,255,255,0.05)]   border-[rgba(255,255,255,0.08)]'   },
  encerrado:{ label: 'Encerrado', dot: 'bg-zinc-500',    cls: 'text-[#B0B8C4]   bg-[rgba(255,255,255,0.1)]/50    border-[rgba(255,255,255,0.15)]'        },
}

// ─── Creative type icon ─────────────────────────────────────────────────────

function CreativeTypeIcon({ tipo }: { tipo: string }) {
  if (tipo === 'video')    return <Video      className="w-10 h-10 text-[rgba(176,184,196,0.4)]" />
  if (tipo === 'carrossel') return <LayoutGrid className="w-10 h-10 text-[rgba(176,184,196,0.4)]" />
  return <Image className="w-10 h-10 text-[rgba(176,184,196,0.4)]" />
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptySection({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#1C2333] flex items-center justify-center">
        <Icon className="w-7 h-7 text-[rgba(176,184,196,0.4)]" />
      </div>
      <p className="text-white font-medium text-sm">{title}</p>
      <p className="text-[rgba(176,184,196,0.6)] text-xs text-center max-w-xs">{description}</p>
    </div>
  )
}

// ─── Chart tooltip style ───────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: { background: 'rgba(255,255,255,0.03)', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff', fontSize: '12px' },
  labelStyle: { color: '#a1a1aa', marginBottom: '4px' },
}

// ─── Main Component ────────────────────────────────────────────────────────

export function TrafegoPagoClient({
  initialMetricas,
  initialMetricasAnterior,
  initialHistorico,
  initialCampanhas,
  initialCriativos,
}: Props) {
  const [period, setPeriod] = useState<PeriodMode>('current')
  const [loading, setLoading] = useState(false)
  const [metricas, setMetricas] = useState(initialMetricas)
  const [metricasAnterior, setMetricasAnterior] = useState(initialMetricasAnterior)
  const [historico, setHistorico] = useState(initialHistorico)
  const [campanhas, setCampanhas] = useState(initialCampanhas)
  const [criativos, setCriativos] = useState(initialCriativos)

  const noData = metricas === null && !loading

  async function fetchPeriod(mode: PeriodMode) {
    if (mode === period) return
    setPeriod(mode)
    setLoading(true)
    try {
      const res = await fetch(`/api/trafego-pago?mode=${mode}`)
      if (res.ok) {
        const data = await res.json()
        setMetricas(data.metricas)
        setMetricasAnterior(data.metricasAnterior)
        setHistorico(data.historico)
        setCampanhas(data.campanhas)
        setCriativos(data.criativos)
      }
    } finally {
      setLoading(false)
    }
  }

  const periodLabel: Record<PeriodMode, string> = {
    current: 'Este mês',
    last: 'Mês passado',
    last3: 'Últimos 3 meses',
  }

  // values always displayed (zeros when no data)
  const m = metricas ?? { investimento: 0, leads: 0, cliques: 0, impressoes: 0, roas: 0, cpl: 0, ctr: 0 }
  const mp = metricasAnterior

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#5BAFF5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Tráfego Pago</h1>
            <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Resultados das suas campanhas</p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-1 self-start sm:self-auto">
          {(['current', 'last', 'last3'] as PeriodMode[]).map((m) => (
            <button
              key={m}
              onClick={() => fetchPeriod(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                period === m
                  ? 'bg-white text-[#050A14] shadow-sm'
                  : 'text-[#B0B8C4] hover:text-white'
              }`}
            >
              {periodLabel[m]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Notice when no data ──────────────────────────────────────────── */}
      {noData && (
        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-[rgba(255,255,255,0.08)] rounded-xl">
          <Sparkles className="w-4 h-4 text-[#5BAFF5] shrink-0" />
          <p className="text-[#5BAFF5] text-xs">
            Os dados serão exibidos aqui após a equipe Bkoulf concluir a análise das suas campanhas.
          </p>
        </div>
      )}

      {/* ── Metric cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <MetricCard title="Investimento"  value={m.investimento} previous={mp?.investimento ?? null} format="currency" icon={DollarSign}       accent="pink"  loading={loading} noData={noData} delay={0}   />
        <MetricCard title="Leads gerados" value={m.leads}        previous={mp?.leads        ?? null} format="number"   icon={Users}            accent="pink"   loading={loading} noData={noData} delay={60}  />
        <MetricCard title="Custo por Lead" value={m.cpl}         previous={mp?.cpl          ?? null} format="currency" icon={BarChart2}         accent="pink"  loading={loading} noData={noData} delay={120} invertColors />
        <MetricCard title="ROAS"           value={m.roas}        previous={mp?.roas         ?? null} format="roas"     icon={TrendingUp}        accent="pink" loading={loading} noData={noData} delay={180} />
        <MetricCard title="Cliques totais" value={m.cliques}     previous={mp?.cliques      ?? null} format="number"   icon={MousePointerClick} accent="pink"   loading={loading} noData={noData} delay={240} />
        <MetricCard title="CTR"            value={m.ctr}         previous={mp?.ctr          ?? null} format="percent"  icon={Percent}           accent="pink"   loading={loading} noData={noData} delay={300} />
      </div>

      {/* ── Section tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="visao-geral">
        <TabsList className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] p-1 h-auto rounded-xl w-full sm:w-auto">
          {[
            { value: 'visao-geral', label: 'Visão Geral' },
            { value: 'campanhas',   label: 'Campanhas'   },
            { value: 'criativos',   label: 'Criativos'   },
          ].map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 sm:flex-none text-sm data-active:bg-white data-active:text-[#050A14] data-active:shadow text-[#B0B8C4] rounded-lg px-4 py-2 transition-all"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Visão Geral ── */}
        <TabsContent value="visao-geral" className="mt-4">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Evolução de Resultados</CardTitle>
              <p className="text-[rgba(176,184,196,0.6)] text-xs">Histórico dos últimos meses</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 bg-[#1C2333] rounded-xl animate-pulse" />
              ) : historico.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#1C2333] flex items-center justify-center">
                    <BarChart2 className="w-6 h-6 text-[rgba(176,184,196,0.4)]" />
                  </div>
                  <p className="text-[rgba(176,184,196,0.6)] text-sm">O gráfico será exibido quando houver dados disponíveis</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={historico} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5BAFF5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#5BAFF5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvestimento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.08)" tick={{ fill: '#B0B8C4', fontSize: 11 }} tickLine={false} />
                    <YAxis yAxisId="left" stroke="rgba(255,255,255,0.08)" tick={{ fill: '#B0B8C4', fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                    <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.08)" tick={{ fill: '#B0B8C4', fontSize: 11 }} tickLine={false} axisLine={false} width={60} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={tooltipStyle.contentStyle} labelStyle={tooltipStyle.labelStyle}
                      formatter={(value, name) => {
                        const num = Number(value) || 0
                        if (name === 'Investimento (R$)') return [formatCurrency(num), String(name)]
                        return [formatNumber(num), String(name)]
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px', color: '#a1a1aa' }} />
                    <Area yAxisId="left"  type="monotone" dataKey="leads"        stroke="#5BAFF5" fill="url(#colorLeads)"        strokeWidth={2} dot={{ fill: '#5BAFF5', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Leads"            isAnimationActive animationDuration={1200} animationEasing="ease-out" />
                    <Area yAxisId="right" type="monotone" dataKey="investimento" stroke="#34d399" fill="url(#colorInvestimento)" strokeWidth={2} dot={{ fill: '#D4A843', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} name="Investimento (R$)" isAnimationActive animationDuration={1400} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Campanhas ── */}
        <TabsContent value="campanhas" className="mt-4">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-base">Campanhas Ativas</CardTitle>
                  <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">{campanhas.length} campanha{campanhas.length !== 1 ? 's' : ''} no período</p>
                </div>
                {campanhas.length > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-emerald-500/20 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-[#D4A843] rounded-full" />
                    <span className="text-[#5BAFF5] text-xs font-medium">
                      {campanhas.filter(c => c.status === 'ativo').length} ativas
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-[#1C2333] rounded-xl animate-pulse" />)}
                </div>
              ) : campanhas.length === 0 ? (
                <EmptySection
                  icon={Megaphone}
                  title="Nenhuma campanha neste período"
                  description="As campanhas ativas aparecerão aqui após a equipe Bkoulf fazer a configuração."
                />
              ) : (
                <div className="space-y-2">
                  {campanhas.map((c) => {
                    const cfg = statusConfig[c.status] ?? statusConfig.encerrado
                    return (
                      <div key={c.id} className="flex items-center gap-4 p-4 bg-[#1C2333]/50 hover:bg-[#1C2333] rounded-xl transition-colors border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white text-sm truncate">{c.nome}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            <span className={`text-xs font-medium ${cfg.cls.split(' ')[0]}`}>{cfg.label}</span>
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-6 text-right shrink-0">
                          <div>
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">Investimento</p>
                            <p className="text-sm font-semibold text-white">{formatCurrency(c.investimento)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">Leads</p>
                            <p className="text-sm font-semibold text-white">{formatNumber(c.leads)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">CPL</p>
                            <p className="text-sm font-semibold text-white">{formatCurrency(c.cpl)}</p>
                          </div>
                        </div>
                        {/* Mobile: compact */}
                        <div className="sm:hidden text-right shrink-0">
                          <p className="text-sm font-semibold text-white">{formatNumber(c.leads)} leads</p>
                          <p className="text-xs text-[rgba(176,184,196,0.6)]">{formatCurrency(c.cpl)} CPL</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Criativos ── */}
        <TabsContent value="criativos" className="mt-4">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">Top Criativos</CardTitle>
              <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Melhores performances do período</p>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1,2,3].map(i => <div key={i} className="h-48 bg-[#1C2333] rounded-xl animate-pulse" />)}
                </div>
              ) : criativos.length === 0 ? (
                <EmptySection
                  icon={Sparkles}
                  title="Nenhum criativo neste período"
                  description="Os top criativos com melhor performance aparecerão aqui em breve."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {criativos.slice(0, 3).map((c, i) => {
                    const rankColors = ['text-[#2D7DD2] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]', 'text-[#D0D8E4] bg-[rgba(255,255,255,0.1)]/50 border-[rgba(255,255,255,0.15)]', 'text-[#B0B8C4] bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.1)]']
                    const rankLabels = ['1º', '2º', '3º']
                    return (
                      <div key={c.id} className="bg-[#1C2333]/50 border border-[rgba(255,255,255,0.12)]/50 hover:border-[rgba(255,255,255,0.15)] rounded-xl p-4 transition-all hover:bg-[#1C2333] group">
                        {/* Rank + type */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${rankColors[i]}`}>
                            {rankLabels[i]}
                          </span>
                          <span className="text-xs text-[rgba(176,184,196,0.6)] capitalize bg-[rgba(255,255,255,0.1)]/50 px-2 py-0.5 rounded-full">{c.tipo}</span>
                        </div>

                        {/* Thumbnail */}
                        <div className="w-full aspect-video bg-[rgba(255,255,255,0.1)] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                          {c.thumbnail_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.thumbnail_url} alt={c.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <CreativeTypeIcon tipo={c.tipo} />
                          )}
                        </div>

                        <p className="text-sm font-semibold text-white line-clamp-2 mb-3">{c.nome}</p>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[rgba(255,255,255,0.12)]">
                          <div className="text-center">
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">Leads</p>
                            <p className="text-sm font-bold text-white">{formatNumber(c.leads)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">CTR</p>
                            <p className="text-sm font-bold text-white">{c.ctr.toFixed(1)}%</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-[rgba(176,184,196,0.6)]">Cliques</p>
                            <p className="text-sm font-bold text-white">{formatNumber(c.cliques)}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ContactServiceBanner service="Tráfego Pago" />
    </div>
  )
}
