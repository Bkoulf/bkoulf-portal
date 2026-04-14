'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { TrendingUp, Video, Palette, Globe, Clock, CheckCircle, AlertCircle, Zap, Package } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service { id: string; type: string; status: string; start_date?: string }
interface Deliverable { id: string; title: string; status: string; due_date?: string; created_at: string }
interface Demand { id: string; status: string }
interface Diagnostic {
  score: number
  identity_score: number
  audiovisual_score: number
  digital_score: number
  conversion_score: number
}

interface Props {
  firstName: string
  services: Service[]
  deliverables: Deliverable[]
  demands: Demand[]
  diagnostic: Diagnostic | null
  unreadMessages: number
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const BLUE   = '#2D7DD2'
const SKY    = '#4A9FE8'
const DEEP   = '#1B4F8A'
const BRIGHT = '#7DC4FF'
const SILVER = '#7AAAC8'
const G_BG   = 'rgba(45,125,210,0.06)'
const G_BR   = 'rgba(45,125,210,0.18)'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const serviceLabels: Record<string, { label: string; icon: React.ElementType }> = {
  trafego_pago:     { label: 'Tráfego Pago',     icon: TrendingUp },
  edicao_videos:    { label: 'Edição de Vídeos',  icon: Video      },
  identidade_visual:{ label: 'Identidade Visual', icon: Palette    },
  website:          { label: 'Website',            icon: Globe      },
}

const statusLabels: Record<string, string> = {
  ativo: 'Ativo', pausado: 'Pausado', concluido: 'Concluído', pendente: 'Pendente',
}

const bk4Stages = [
  { key: 'identity_score',    label: 'Identidade Visual', color: BRIGHT },
  { key: 'audiovisual_score', label: 'Audiovisual',        color: SKY   },
  { key: 'digital_score',     label: 'Presença Digital',   color: BLUE  },
  { key: 'conversion_score',  label: 'Conversão e Tráfego',color: DEEP  },
]

const deliverableStatusMap: Record<string, { label: string; color: string }> = {
  aguardando_aprovacao: { label: 'Aguardando aprovação', color: SKY    },
  aprovado:             { label: 'Aprovado',              color: BRIGHT },
  ajuste_solicitado:    { label: 'Ajuste solicitado',     color: SILVER },
  entregue:             { label: 'Entregue',              color: BLUE   },
}

function generateTrend(deliverables: Deliverable[]) {
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
  return weeks.map((week, i) => ({
    name: week,
    entregas: deliverables.filter(d => {
      const daysAgo = (Date.now() - new Date(d.created_at).getTime()) / 86400000
      return daysAgo >= (3 - i) * 7 && daysAgo < (4 - i) * 7
    }).length,
  }))
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType
}) {
  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{ background: G_BG, border: `1px solid ${G_BR}` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${BLUE}, transparent 70%)`, opacity: 0.04 }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#B0B8C4] text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-[rgba(176,184,196,0.5)] text-xs mt-0.5">{sub}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `rgba(45,125,210,0.1)`, border: `1px solid rgba(45,125,210,0.2)` }}
        >
          <Icon className="w-5 h-5 text-[#5BAFF5]" />
        </div>
      </div>
    </div>
  )
}

function BK4Ring({ score }: { score: number }) {
  const data = [{ value: score }, { value: 100 - score }]
  return (
    <div className="relative w-32 h-32 mx-auto">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={56}
            startAngle={90} endAngle={-270} dataKey="value" strokeWidth={0}>
            <Cell fill={BLUE} />
            <Cell fill="rgba(255,255,255,0.06)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[rgba(176,184,196,0.5)] text-xs">/ 100</span>
      </div>
    </div>
  )
}

const tooltipStyle = {
  backgroundColor: '#0A1628',
  border: `1px solid ${G_BR}`,
  borderRadius: '8px',
  color: '#fff',
  fontSize: '12px',
}

// ─── Dashboard principal ──────────────────────────────────────────────────────

export function DashboardClient({ firstName, services, deliverables, demands, diagnostic }: Props) {
  const activeServices      = services.filter(s => s.status === 'ativo').length
  const pendingApproval     = deliverables.filter(d => d.status === 'aguardando_aprovacao').length
  const completedDeliverables = deliverables.filter(d => d.status === 'aprovado' || d.status === 'entregue').length
  const openDemands         = demands.filter(d => d.status === 'aberta' || d.status === 'em_andamento').length
  const trendData           = generateTrend(deliverables)

  const deliverableDistribution = [
    { name: 'Aprovadas',   value: deliverables.filter(d => d.status === 'aprovado').length,              color: BRIGHT },
    { name: 'Aguardando',  value: deliverables.filter(d => d.status === 'aguardando_aprovacao').length,  color: SKY    },
    { name: 'Ajuste',      value: deliverables.filter(d => d.status === 'ajuste_solicitado').length,     color: SILVER },
    { name: 'Entregues',   value: deliverables.filter(d => d.status === 'entregue').length,              color: BLUE   },
  ].filter(d => d.value > 0)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {firstName}</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Aqui está o resumo do seu projeto</p>
        </div>
        <p className="text-[rgba(176,184,196,0.4)] text-xs">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </p>
      </div>

      {/* Alerta de aprovações pendentes */}
      {pendingApproval > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(45,125,210,0.08)', border: '1px solid rgba(45,125,210,0.2)' }}
        >
          <Clock className="w-4 h-4 text-[#5BAFF5] shrink-0" />
          <p className="text-[#5BAFF5] text-sm">
            Você tem <strong>{pendingApproval} {pendingApproval === 1 ? 'entrega aguardando' : 'entregas aguardando'}</strong> sua aprovação.
          </p>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard label="Serviços ativos"      value={activeServices}        icon={TrendingUp}  />
        <KpiCard label="Entregas concluídas"  value={completedDeliverables} icon={CheckCircle} />
        <KpiCard label="Aguard. aprovação"    value={pendingApproval} sub="Ação necessária" icon={Clock} />
        <KpiCard label="Demandas abertas"     value={openDemands}           icon={AlertCircle} />
      </div>

      {/* Linha 2: Gráfico + BK4 Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div
          className="md:col-span-2 rounded-xl p-4"
          style={{ background: G_BG, border: `1px solid ${G_BR}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white font-semibold text-sm">Entregas por semana</p>
              <p className="text-[rgba(176,184,196,0.5)] text-xs">Últimas 4 semanas</p>
            </div>
            <Package className="w-4 h-4 text-[rgba(176,184,196,0.4)]" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="entregasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={BLUE} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={BLUE} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: SILVER, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: SILVER, fontSize: 11 }} axisLine={false} tickLine={false} width={20} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: BLUE, strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="entregas" stroke={BLUE} strokeWidth={2}
                fill="url(#entregasGrad)" dot={{ fill: BLUE, r: 3 }} name="Entregas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: G_BG, border: `1px solid ${G_BR}` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[#2D7DD2]" />
            <p className="text-white font-semibold text-sm">Score BK4</p>
          </div>
          {diagnostic ? (
            <>
              <BK4Ring score={diagnostic.score} />
              <div className="space-y-2 mt-4">
                {bk4Stages.map(stage => {
                  const val = diagnostic[stage.key as keyof Diagnostic] as number
                  return (
                    <div key={stage.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#B0B8C4]">{stage.label}</span>
                        <span className="text-white font-medium">{val}</span>
                      </div>
                      <div className="w-full rounded-full h-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-1 rounded-full transition-all duration-700"
                          style={{ width: `${val}%`, backgroundColor: stage.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Zap className="w-8 h-8 text-[rgba(176,184,196,0.2)] mb-2" />
              <p className="text-[rgba(176,184,196,0.5)] text-sm">Diagnóstico ainda não disponível</p>
            </div>
          )}
        </div>
      </div>

      {/* Linha 3: Serviços + Distribuição */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div
          className="rounded-xl p-4"
          style={{ background: G_BG, border: `1px solid ${G_BR}` }}
        >
          <p className="text-white font-semibold text-sm mb-3">Seus Serviços</p>
          {services.length === 0 ? (
            <p className="text-[rgba(176,184,196,0.5)] text-sm">Nenhum serviço ativo.</p>
          ) : (
            <div className="space-y-2">
              {services.map(service => {
                const cfg = serviceLabels[service.type]
                const Icon = cfg?.icon ?? TrendingUp
                return (
                  <div key={service.id}
                    className="flex items-center justify-between p-2.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${G_BR}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={{ background: 'rgba(45,125,210,0.1)', border: '1px solid rgba(45,125,210,0.2)' }}
                      >
                        <Icon className="w-3.5 h-3.5 text-[#5BAFF5]" />
                      </div>
                      <span className="text-sm text-white font-medium">{cfg?.label ?? service.type}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        service.status === 'ativo'
                          ? { background: 'rgba(45,125,210,0.15)', color: BRIGHT, border: '1px solid rgba(45,125,210,0.35)' }
                          : { background: 'rgba(45,125,210,0.05)', color: SILVER, border: `1px solid ${G_BR}` }
                      }
                    >
                      {statusLabels[service.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: G_BG, border: `1px solid ${G_BR}` }}
        >
          <p className="text-white font-semibold text-sm mb-3">Status das Entregas</p>
          {deliverables.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <CheckCircle className="w-8 h-8 text-[rgba(176,184,196,0.2)] mb-2" />
              <p className="text-[rgba(176,184,196,0.5)] text-sm">Nenhuma entrega ainda</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={deliverableDistribution} cx="50%" cy="50%"
                    innerRadius={35} outerRadius={50} dataKey="value" strokeWidth={0}>
                    {deliverableDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {deliverableDistribution.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#B0B8C4] truncate">
                      {item.name}: <span className="text-white font-medium">{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Últimas entregas */}
      {deliverables.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: G_BG, border: `1px solid ${G_BR}` }}
        >
          <p className="text-white font-semibold text-sm mb-3">Últimas Entregas</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${G_BR}` }}>
                  <th className="text-left text-[rgba(176,184,196,0.5)] font-medium pb-2 text-xs uppercase tracking-wider">Entrega</th>
                  <th className="text-left text-[rgba(176,184,196,0.5)] font-medium pb-2 text-xs uppercase tracking-wider">Prazo</th>
                  <th className="text-left text-[rgba(176,184,196,0.5)] font-medium pb-2 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {deliverables.slice(0, 5).map(d => {
                  const st = deliverableStatusMap[d.status]
                  return (
                    <tr key={d.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                      <td className="py-2.5 pr-4 text-white font-medium">{d.title}</td>
                      <td className="py-2.5 pr-4 text-[rgba(176,184,196,0.5)] text-xs">
                        {d.due_date ? new Date(d.due_date).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="py-2.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${st?.color}18`, color: st?.color }}
                        >
                          {st?.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
