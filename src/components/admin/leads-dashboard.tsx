'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Target, Send, MessageSquare, Ban, Settings2, X,
  Search, Filter, ChevronDown, Phone, Globe, MapPin,
  Star, TrendingUp, Eye, UserX, CheckCheck, Play, Pause, Loader2,
  ChartBar, ChevronUp,
} from 'lucide-react'

type Lead = {
  id: string
  empresa: string
  telefone: string | null
  whatsapp_valido: boolean | null
  cidade: string | null
  endereco: string | null
  segmento: string | null
  website: string | null
  google_place_id: string | null
  rating: number | null
  total_reviews: number | null
  status: string
  mensagem_enviada: string | null
  enviado_em: string | null
  created_at: string
}

type Config = {
  id: number
  raio_km: number
  limite_diario: number
  cidades: string[]
  ativo: boolean
}

type Props = {
  leads: Lead[]
  config: Config | null
}

const STATUS_LABEL: Record<string, string> = {
  capturado: 'Capturado',
  mensagem_enviada: 'Enviado',
  entregue: 'Entregue',
  lido: 'Lido',
  respondeu: 'Respondeu',
  bloqueou: 'Bloqueou',
  opt_out: 'Opt-out',
}

const STATUS_COLOR: Record<string, string> = {
  capturado: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  mensagem_enviada: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  entregue: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  lido: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  respondeu: 'text-green-400 bg-green-400/10 border-green-400/20',
  bloqueou: 'text-red-400 bg-red-400/10 border-red-400/20',
  opt_out: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
}

const STATUS_ICON: Record<string, React.ElementType> = {
  capturado: Target,
  mensagem_enviada: Send,
  entregue: CheckCheck,
  lido: Eye,
  respondeu: MessageSquare,
  bloqueou: Ban,
  opt_out: UserX,
}

const CIDADES_DISPONIVEIS = [
  'Cotia', 'Vargem Grande Paulista', 'Itapevi', 'Embu das Artes', 'Osasco',
  'Barueri', 'Carapicuíba', 'Santana de Parnaíba', 'Pirapora do Bom Jesus',
  'São Paulo', 'Guarulhos', 'Santo André', 'São Bernardo do Campo',
]

export function LeadsDashboard({ leads, config: initialConfig }: Props) {
  const supabase = createClient()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterCidade, setFilterCidade] = useState('todas')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [config, setConfig] = useState<Config>(initialConfig ?? {
    id: 1, raio_km: 30, limite_diario: 30,
    cidades: ['Cotia', 'Vargem Grande Paulista', 'Itapevi', 'Embu das Artes', 'Osasco'],
    ativo: false,
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [togglingAtivo, setTogglingAtivo] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const [executando, setExecutando] = useState(false)
  const [executarMensagem, setExecutarMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  async function toggleAtivo() {
    setTogglingAtivo(true)
    const novoStatus = !config.ativo
    await supabase.from('leads_config').update({
      ativo: novoStatus,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setConfig(c => ({ ...c, ativo: novoStatus }))
    setTogglingAtivo(false)
  }

  // Stats
  const stats = useMemo(() => {
    const total = leads.length
    const enviados = leads.filter(l => l.status !== 'capturado').length
    const responderam = leads.filter(l => l.status === 'respondeu').length
    const bloquearam = leads.filter(l => l.status === 'bloqueou').length
    const hoje = leads.filter(l => {
      if (!l.enviado_em) return false
      return new Date(l.enviado_em).toDateString() === new Date().toDateString()
    }).length
    return { total, enviados, responderam, bloquearam, hoje }
  }, [leads])

  // Filtros
  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search ||
        l.empresa.toLowerCase().includes(search.toLowerCase()) ||
        (l.cidade ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.segmento ?? '').toLowerCase().includes(search.toLowerCase())
      const matchStatus = filterStatus === 'todos' || l.status === filterStatus
      const matchCidade = filterCidade === 'todas' || l.cidade === filterCidade
      return matchSearch && matchStatus && matchCidade
    })
  }, [leads, search, filterStatus, filterCidade])

  const cidades = useMemo(() => {
    const set = new Set(leads.map(l => l.cidade).filter(Boolean))
    return Array.from(set) as string[]
  }, [leads])

  const analytics = useMemo(() => {
    const total = leads.length
    const comTelefone = leads.filter(l => l.telefone).length
    const comWhatsApp = leads.filter(l => l.whatsapp_valido === true).length
    const comWebsite = leads.filter(l => l.website).length
    const enviados = leads.filter(l => l.status !== 'capturado').length
    const entregues = leads.filter(l => ['entregue','lido','respondeu'].includes(l.status)).length
    const lidos = leads.filter(l => ['lido','respondeu'].includes(l.status)).length
    const responderam = leads.filter(l => l.status === 'respondeu').length
    const bloquearam = leads.filter(l => l.status === 'bloqueou').length
    const optOut = leads.filter(l => l.status === 'opt_out').length

    // Funil
    const funil = [
      { label: 'Capturados', value: total, color: '#71717a', pct: 100 },
      { label: 'Com telefone', value: comTelefone, color: '#94a3b8', pct: total > 0 ? (comTelefone/total)*100 : 0 },
      { label: 'Mensagem enviada', value: enviados, color: '#60a5fa', pct: total > 0 ? (enviados/total)*100 : 0 },
      { label: 'Entregue', value: entregues, color: '#22d3ee', pct: total > 0 ? (entregues/total)*100 : 0 },
      { label: 'Lido', value: lidos, color: '#a78bfa', pct: total > 0 ? (lidos/total)*100 : 0 },
      { label: 'Respondeu', value: responderam, color: '#4ade80', pct: total > 0 ? (responderam/total)*100 : 0 },
    ]

    // Taxas
    const taxaResposta = enviados > 0 ? (responderam / enviados) * 100 : 0
    const taxaEntrega = enviados > 0 ? (entregues / enviados) * 100 : 0
    const taxaLeitura = entregues > 0 ? (lidos / entregues) * 100 : 0
    const taxaBloqueio = enviados > 0 ? (bloquearam / enviados) * 100 : 0
    const taxaOptOut = enviados > 0 ? (optOut / enviados) * 100 : 0

    // Saúde
    const saudeStatus = taxaBloqueio < 3 ? 'Ótima' : taxaBloqueio < 7 ? 'Atenção' : 'Crítica'
    const saudeColor = taxaBloqueio < 3 ? '#4ade80' : taxaBloqueio < 7 ? '#facc15' : '#f87171'
    const saudeDica = taxaBloqueio < 3
      ? 'Continue no ritmo atual'
      : taxaBloqueio < 7
        ? 'Reduza o limite diário'
        : 'Pause imediatamente — risco de ban'

    // Custo e ROI
    const custoGooglePorLead = 0.17
    const custoWhatsAppMensal = 100
    const custoTotal = (total * custoGooglePorLead) + custoWhatsAppMensal
    const custoPorLead = total > 0 ? custoTotal / total : 0
    const custoPorResposta = responderam > 0 ? custoTotal / responderam : 0
    const ticketMedioEstimado = 5000
    const receitaPotencial = responderam * ticketMedioEstimado
    const roi = custoTotal > 0 ? ((receitaPotencial - custoTotal) / custoTotal) * 100 : 0

    // Qualidade dos leads
    const pctComTelefone = total > 0 ? (comTelefone / total) * 100 : 0
    const pctComWhatsApp = total > 0 ? (comWhatsApp / total) * 100 : 0
    const pctComWebsite = total > 0 ? (comWebsite / total) * 100 : 0
    const avgRating = leads.filter(l => l.rating).length > 0
      ? leads.filter(l => l.rating).reduce((a, l) => a + (l.rating ?? 0), 0) / leads.filter(l => l.rating).length
      : 0

    // Últimos 30 dias (agrupado por dia)
    const hoje = new Date()
    const ultimos30 = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(hoje)
      d.setDate(d.getDate() - (29 - i))
      const key = d.toISOString().slice(0, 10)
      const capturados = leads.filter(l => l.created_at?.slice(0, 10) === key).length
      const enviados30 = leads.filter(l => l.enviado_em?.slice(0, 10) === key).length
      const label = i % 5 === 0 ? d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }) : ''
      return { label, capturados, enviados: enviados30, key }
    })
    const max30 = Math.max(...ultimos30.map(d => d.capturados), 1)

    // Últimos 7 dias (detalhado)
    const ultimos7 = ultimos30.slice(-7).map(d => ({
      ...d,
      label: new Date(d.key).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
    }))
    const max7 = Math.max(...ultimos7.map(d => d.capturados), 1)

    // Por dia da semana (desempenho médio)
    const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    const porDiaSemana = diasSemana.map((label, idx) => {
      const count = leads.filter(l => new Date(l.created_at).getDay() === idx).length
      return { label, count }
    })
    const maxDiaSemana = Math.max(...porDiaSemana.map(d => d.count), 1)

    // Por cidade (top 8) com taxa de resposta
    const cidadeMap: Record<string, { total: number; responderam: number }> = {}
    leads.forEach(l => {
      if (!l.cidade) return
      if (!cidadeMap[l.cidade]) cidadeMap[l.cidade] = { total: 0, responderam: 0 }
      cidadeMap[l.cidade].total++
      if (l.status === 'respondeu') cidadeMap[l.cidade].responderam++
    })
    const porCidade = Object.entries(cidadeMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([cidade, d]) => ({
        cidade,
        total: d.total,
        responderam: d.responderam,
        taxa: d.total > 0 ? (d.responderam / d.total) * 100 : 0,
      }))
    const maxCidade = Math.max(...porCidade.map(c => c.total), 1)

    // Por segmento (top 8) com taxa de resposta
    const segMap: Record<string, { total: number; responderam: number }> = {}
    leads.forEach(l => {
      if (!l.segmento) return
      if (!segMap[l.segmento]) segMap[l.segmento] = { total: 0, responderam: 0 }
      segMap[l.segmento].total++
      if (l.status === 'respondeu') segMap[l.segmento].responderam++
    })
    const porSegmento = Object.entries(segMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
      .map(([seg, d]) => ({
        seg,
        total: d.total,
        responderam: d.responderam,
        taxa: d.total > 0 ? (d.responderam / d.total) * 100 : 0,
      }))
    const maxSeg = Math.max(...porSegmento.map(s => s.total), 1)

    // Envios de hoje vs limite
    const enviosHoje = leads.filter(l => {
      if (!l.enviado_em) return false
      return new Date(l.enviado_em).toDateString() === new Date().toDateString()
    }).length

    return {
      total, comTelefone, comWhatsApp, comWebsite, enviados, entregues,
      lidos, responderam, bloquearam, optOut,
      funil,
      taxaResposta, taxaEntrega, taxaLeitura, taxaBloqueio, taxaOptOut,
      saudeStatus, saudeColor, saudeDica,
      custoTotal, custoPorLead, custoPorResposta, receitaPotencial, roi,
      pctComTelefone, pctComWhatsApp, pctComWebsite, avgRating,
      ultimos30, max30, ultimos7, max7,
      porDiaSemana, maxDiaSemana,
      porCidade, maxCidade,
      porSegmento, maxSeg,
      enviosHoje,
    }
  }, [leads])

  async function executarAgora(cidade?: string) {
    setExecutando(true)
    setExecutarMensagem(null)
    try {
      const res = await fetch('/api/leads/executar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cidade ? { cidade } : {}),
      })
      const data = await res.json()
      if (!res.ok) {
        setExecutarMensagem({ tipo: 'erro', texto: data.error ?? 'Erro ao disparar workflow' })
      } else {
        setExecutarMensagem({ tipo: 'ok', texto: 'Workflow disparado com sucesso! Aguarde novos leads.' })
        setTimeout(() => setExecutarMensagem(null), 6000)
      }
    } catch {
      setExecutarMensagem({ tipo: 'erro', texto: 'Não foi possível conectar ao servidor' })
    } finally {
      setExecutando(false)
    }
  }

  async function saveConfig() {
    setSavingConfig(true)
    await supabase.from('leads_config').upsert({
      id: 1,
      raio_km: config.raio_km,
      limite_diario: config.limite_diario,
      cidades: config.cidades,
      ativo: config.ativo,
      updated_at: new Date().toISOString(),
    })
    setSavingConfig(false)
    setConfigOpen(false)
  }

  function toggleCidade(cidade: string) {
    setConfig(c => ({
      ...c,
      cidades: c.cidades.includes(cidade)
        ? c.cidades.filter(x => x !== cidade)
        : [...c.cidades, cidade],
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Leads de Prospecção</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Empresas capturadas automaticamente pelo sistema BK</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 border border-zinc-700 hover:text-white hover:border-zinc-500 transition-all"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Configurar</span>
          </button>

          <button
            onClick={() => executarAgora()}
            disabled={executando}
            title="Dispara o workflow n8n manualmente para buscar novos leads agora"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.25)', color: '#D4A843' }}
          >
            {executando
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4" />
            }
            <span className="hidden sm:inline">{executando ? 'Buscando...' : 'Executar agora'}</span>
          </button>

          <button
            onClick={toggleAtivo}
            disabled={togglingAtivo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            style={config.ativo
              ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }
              : { background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }
            }
          >
            {togglingAtivo
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : config.ativo
                ? <Pause className="w-4 h-4" />
                : <Play className="w-4 h-4" />
            }
            {config.ativo ? 'Pausar' : 'Iniciar'}
          </button>
        </div>
      </div>

      {/* Feedback execução manual */}
      {executarMensagem && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
          style={executarMensagem.tipo === 'ok'
            ? { background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)', color: '#4ade80' }
            : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }
          }
        >
          {executarMensagem.texto}
          <button onClick={() => setExecutarMensagem(null)} className="ml-auto opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total capturados', value: stats.total, icon: Target, color: 'text-zinc-400' },
          { label: 'Enviados hoje', value: stats.hoje, icon: Send, color: 'text-blue-400' },
          { label: 'Total enviados', value: stats.enviados, icon: TrendingUp, color: 'text-cyan-400' },
          { label: 'Responderam', value: stats.responderam, icon: MessageSquare, color: 'text-green-400' },
          { label: 'Bloquearam', value: stats.bloquearam, icon: Ban, color: 'text-red-400' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-xl p-4 border border-[rgba(255,255,255,0.06)]"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-zinc-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          )
        })}
      </div>

      {/* Status automação */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl border"
        style={{
          background: config.ativo ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.04)',
          borderColor: config.ativo ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
        }}
      >
        <div className={`w-2 h-2 rounded-full ${config.ativo ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
        <span className="text-sm font-medium" style={{ color: config.ativo ? '#4ade80' : '#71717a' }}>
          {config.ativo ? 'Automação ativa' : 'Automação pausada'}
        </span>
        <span className="text-zinc-600 text-xs ml-auto">
          Limite: {config.limite_diario}/dia · Raio: {config.raio_km}km · {config.cidades.length} cidade(s)
        </span>
      </div>

      {/* Analytics — seção colapsável */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <button
          onClick={() => setAnalyticsOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-white hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2">
            <ChartBar className="w-4 h-4 text-[#D4A843]" />
            Análises completas
          </div>
          {analyticsOpen
            ? <ChevronUp className="w-4 h-4 text-zinc-500" />
            : <ChevronDown className="w-4 h-4 text-zinc-500" />
          }
        </button>

        {analyticsOpen && (
          <div className="px-4 pb-6 space-y-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

            {/* ── 1. TAXAS DE PERFORMANCE ── */}
            <div className="pt-5">
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Taxas de performance</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Taxa de entrega', value: analytics.taxaEntrega, color: '#22d3ee', sub: 'enviados entregues' },
                  { label: 'Taxa de leitura', value: analytics.taxaLeitura, color: '#a78bfa', sub: 'entregues lidos' },
                  { label: 'Taxa de resposta', value: analytics.taxaResposta, color: '#4ade80', sub: 'enviados que responderam' },
                  { label: 'Taxa de bloqueio', value: analytics.taxaBloqueio, color: analytics.saudeColor, sub: 'enviados que bloquearam' },
                  { label: 'Taxa de opt-out', value: analytics.taxaOptOut, color: '#f97316', sub: 'pediram para parar' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 border border-[rgba(255,255,255,0.06)]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] text-zinc-500 mb-2">{m.label}</p>
                    <p className="text-2xl font-bold" style={{ color: m.color }}>{m.value.toFixed(1)}%</p>
                    <div className="mt-2 h-1 rounded-full overflow-hidden bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(m.value, 100)}%`, background: m.color, opacity: 0.7 }} />
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-1.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. FUNIL DE CONVERSÃO ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Funil de conversão</p>
              <div className="space-y-2.5">
                {analytics.funil.map(f => (
                  <div key={f.label} className="flex items-center gap-3">
                    <span className="text-xs text-zinc-500 w-36 shrink-0">{f.label}</span>
                    <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div
                        className="h-full rounded-md transition-all duration-700"
                        style={{ width: `${Math.max(f.pct, 1.5)}%`, background: f.color, opacity: 0.8 }}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-24 shrink-0 justify-end">
                      <span className="text-sm font-bold text-white">{f.value}</span>
                      <span className="text-[10px] text-zinc-600 w-10 text-right">{f.pct.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 3. CUSTO E ROI ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Custo e ROI estimado</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Custo total',
                    value: `R$ ${analytics.custoTotal.toFixed(2)}`,
                    sub: `Google API + WhatsApp`,
                    color: '#D4A843',
                  },
                  {
                    label: 'Custo por lead',
                    value: `R$ ${analytics.custoPorLead.toFixed(2)}`,
                    sub: 'custo ÷ total capturados',
                    color: '#fb923c',
                  },
                  {
                    label: 'Custo por resposta',
                    value: analytics.custoPorResposta > 0 ? `R$ ${analytics.custoPorResposta.toFixed(2)}` : '—',
                    sub: 'custo ÷ quem respondeu',
                    color: '#f472b6',
                  },
                  {
                    label: 'ROI potencial',
                    value: analytics.roi > 0 ? `${analytics.roi.toFixed(0)}%` : '—',
                    sub: `Receita potencial R$ ${analytics.receitaPotencial.toLocaleString('pt-BR')}`,
                    color: '#4ade80',
                  },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 border border-[rgba(255,255,255,0.06)]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] text-zinc-500 mb-1">{m.label}</p>
                    <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{m.sub}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-700 mt-2">* ROI calculado com ticket médio estimado de R$5.000. Ajuste conforme seu ticket real.</p>
            </div>

            {/* ── 4. LIMITE DIÁRIO ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Uso do limite diário</p>
              <div className="rounded-xl p-4 border border-[rgba(255,255,255,0.06)]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white font-medium">Enviados hoje</span>
                  <span className="text-sm font-bold" style={{
                    color: analytics.enviosHoje >= config.limite_diario ? '#f87171'
                      : analytics.enviosHoje >= config.limite_diario * 0.8 ? '#facc15' : '#4ade80'
                  }}>
                    {analytics.enviosHoje} / {config.limite_diario}
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((analytics.enviosHoje / config.limite_diario) * 100, 100)}%`,
                      background: analytics.enviosHoje >= config.limite_diario ? '#ef4444'
                        : analytics.enviosHoje >= config.limite_diario * 0.8 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">
                  {analytics.enviosHoje >= config.limite_diario
                    ? 'Limite atingido — automação pausada até amanhã'
                    : `${config.limite_diario - analytics.enviosHoje} envios restantes hoje`}
                </p>
              </div>
            </div>

            {/* ── 5. SAÚDE DO NÚMERO ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Saúde do número WhatsApp</p>
              <div className="rounded-xl p-4 border flex items-center gap-4" style={{
                background: `${analytics.saudeColor}0d`,
                borderColor: `${analytics.saudeColor}33`,
              }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${analytics.saudeColor}22` }}>
                  <span className="text-2xl font-black" style={{ color: analytics.saudeColor }}>
                    {analytics.taxaBloqueio < 3 ? '✓' : analytics.taxaBloqueio < 7 ? '!' : '✕'}
                  </span>
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: analytics.saudeColor }}>{analytics.saudeStatus}</p>
                  <p className="text-sm text-zinc-400">{analytics.saudeDica}</p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    {analytics.bloquearam} bloqueio(s) · {analytics.taxaBloqueio.toFixed(1)}% dos enviados · {analytics.optOut} opt-out(s)
                  </p>
                </div>
              </div>
            </div>

            {/* ── 6. EVOLUÇÃO TEMPORAL ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Últimos 7 dias */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Capturados — últimos 7 dias</p>
                <div className="flex items-end gap-1.5 h-28">
                  {analytics.ultimos7.map(d => {
                    const pct = (d.capturados / analytics.max7) * 100
                    return (
                      <div key={d.key} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-white">{d.capturados > 0 ? d.capturados : ''}</span>
                        <div className="w-full rounded-t-md" style={{
                          height: `${Math.max(pct, 4)}%`,
                          background: d.capturados > 0 ? 'rgba(212,168,67,0.65)' : 'rgba(255,255,255,0.04)',
                          minHeight: '4px',
                        }} />
                        <span className="text-[9px] text-zinc-600 text-center leading-tight">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Por dia da semana */}
              <div>
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Melhor dia da semana</p>
                <div className="flex items-end gap-1.5 h-28">
                  {analytics.porDiaSemana.map(d => {
                    const pct = (d.count / analytics.maxDiaSemana) * 100
                    const melhor = d.count === analytics.maxDiaSemana && d.count > 0
                    return (
                      <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold" style={{ color: melhor ? '#D4A843' : 'transparent' }}>{d.count > 0 ? d.count : ''}</span>
                        <div className="w-full rounded-t-md" style={{
                          height: `${Math.max(pct, 4)}%`,
                          background: melhor ? 'rgba(212,168,67,0.8)' : d.count > 0 ? 'rgba(212,168,67,0.5)' : 'rgba(255,255,255,0.04)',
                          minHeight: '4px',
                        }} />
                        <span className="text-[9px] text-zinc-500 text-center">{d.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── 7. QUALIDADE DOS LEADS ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Qualidade dos leads capturados</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Com telefone', pct: analytics.pctComTelefone, value: analytics.comTelefone, color: '#60a5fa' },
                  { label: 'WhatsApp válido', pct: analytics.pctComWhatsApp, value: analytics.comWhatsApp, color: '#4ade80' },
                  { label: 'Com website', pct: analytics.pctComWebsite, value: analytics.comWebsite, color: '#a78bfa' },
                  { label: 'Avaliação média', pct: analytics.avgRating > 0 ? (analytics.avgRating / 5) * 100 : 0, value: analytics.avgRating > 0 ? `${analytics.avgRating.toFixed(1)} ★` : '—', color: '#facc15', isRating: true },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 border border-[rgba(255,255,255,0.06)]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[10px] text-zinc-500 mb-2">{m.label}</p>
                    <p className="text-xl font-bold" style={{ color: m.color }}>
                      {m.isRating ? m.value : `${m.pct.toFixed(0)}%`}
                    </p>
                    {!m.isRating && <p className="text-[10px] text-zinc-600">{m.value} leads</p>}
                    <div className="mt-2 h-1 rounded-full overflow-hidden bg-white/5">
                      <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 8. POR CIDADE ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Leads por cidade</p>
              {analytics.porCidade.length === 0 ? (
                <p className="text-xs text-zinc-700">Sem dados ainda</p>
              ) : (
                <div className="space-y-2">
                  {analytics.porCidade.map(c => (
                    <div key={c.cidade} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-36 truncate shrink-0">{c.cidade}</span>
                      <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded" style={{ width: `${(c.total / analytics.maxCidade) * 100}%`, background: 'rgba(212,168,67,0.55)' }} />
                      </div>
                      <span className="text-xs font-bold text-white w-7 text-right shrink-0">{c.total}</span>
                      {c.responderam > 0 && (
                        <span className="text-[10px] text-green-400 w-14 text-right shrink-0">{c.taxa.toFixed(1)}% resp.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 9. POR SEGMENTO ── */}
            <div>
              <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Leads por segmento</p>
              {analytics.porSegmento.length === 0 ? (
                <p className="text-xs text-zinc-700">Sem dados ainda</p>
              ) : (
                <div className="space-y-2">
                  {analytics.porSegmento.map(s => (
                    <div key={s.seg} className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 w-36 truncate shrink-0">{s.seg}</span>
                      <div className="flex-1 h-5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded" style={{ width: `${(s.total / analytics.maxSeg) * 100}%`, background: 'rgba(168,85,247,0.55)' }} />
                      </div>
                      <span className="text-xs font-bold text-white w-7 text-right shrink-0">{s.total}</span>
                      {s.responderam > 0 && (
                        <span className="text-[10px] text-green-400 w-14 text-right shrink-0">{s.taxa.toFixed(1)}% resp.</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa, cidade, segmento..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white placeholder-zinc-600 outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </div>

        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg text-sm text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={filterCidade}
            onChange={e => setFilterCidade(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 rounded-lg text-sm text-white outline-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <option value="todas">Todas as cidades</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        {/* Header tabela */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}
        >
          <span>Empresa</span>
          <span className="hidden sm:block">Cidade</span>
          <span className="hidden md:block">Segmento</span>
          <span>Status</span>
          <span></span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Target className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum lead encontrado</p>
            <p className="text-zinc-700 text-xs mt-1">
              {leads.length === 0
                ? 'Configure e ative a automação para começar a capturar leads'
                : 'Tente ajustar os filtros'}
            </p>
          </div>
        ) : (
          <ul>
            {filtered.map((lead, i) => {
              const StatusIcon = STATUS_ICON[lead.status] ?? Target
              return (
                <li
                  key={lead.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3.5 items-center hover:bg-[rgba(255,255,255,0.03)] transition-colors cursor-pointer"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.empresa}</p>
                    {lead.telefone && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {lead.telefone}
                      </p>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3 h-3 text-zinc-600 shrink-0" />
                    <span className="text-xs text-zinc-400 truncate">{lead.cidade ?? '—'}</span>
                  </div>

                  <div className="hidden md:block min-w-0">
                    <span className="text-xs text-zinc-400 truncate block">{lead.segmento ?? '—'}</span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border ${STATUS_COLOR[lead.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {STATUS_LABEL[lead.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {lead.rating && (
                      <span className="hidden lg:flex items-center gap-1 text-xs text-zinc-500">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {lead.rating}
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-zinc-600 text-right">
        {filtered.length} de {leads.length} leads
      </p>

      {/* Modal detalhe do lead */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ background: 'rgba(14,14,18,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <button
              onClick={() => setSelectedLead(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">{selectedLead.empresa}</h2>
              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border mt-2 ${STATUS_COLOR[selectedLead.status]}`}>
                {STATUS_LABEL[selectedLead.status]}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {[
                { icon: Phone, label: 'Telefone', value: selectedLead.telefone },
                { icon: MapPin, label: 'Cidade', value: selectedLead.cidade },
                { icon: MapPin, label: 'Endereço', value: selectedLead.endereco },
                { icon: Filter, label: 'Segmento', value: selectedLead.segmento },
                { icon: Globe, label: 'Website', value: selectedLead.website },
                { icon: Star, label: 'Avaliação', value: selectedLead.rating ? `${selectedLead.rating} ★ (${selectedLead.total_reviews} avaliações)` : null },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-zinc-500 text-xs">{label}</p>
                    <p className="text-white">{value}</p>
                  </div>
                </div>
              ) : null)}
            </div>

            {selectedLead.mensagem_enviada && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(212,168,67,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-xs text-zinc-500 mb-1">Mensagem enviada</p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedLead.mensagem_enviada}</p>
                {selectedLead.enviado_em && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Enviado em {new Date(selectedLead.enviado_em).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal configuração */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setConfigOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
            style={{ background: 'rgba(14,14,18,0.98)', border: '1px solid rgba(212,168,67,0.2)' }}
          >
            <button
              onClick={() => setConfigOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Configurar Automação</h2>
            <p className="text-sm text-zinc-500 mb-6">Ajuste os parâmetros da busca de leads</p>

            <div className="space-y-5">
              {/* Raio */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Raio de busca</label>
                  <span className="text-sm font-bold text-[#D4A843]">{config.raio_km} km</span>
                </div>
                <input
                  type="range" min="5" max="100" step="5"
                  value={config.raio_km}
                  onChange={e => setConfig(c => ({ ...c, raio_km: Number(e.target.value) }))}
                  className="w-full accent-[#D4A843]"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>5km</span><span>100km</span>
                </div>
              </div>

              {/* Limite diário */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Limite diário</label>
                  <span className="text-sm font-bold text-[#D4A843]">{config.limite_diario} msgs/dia</span>
                </div>
                <input
                  type="range" min="5" max="80" step="5"
                  value={config.limite_diario}
                  onChange={e => setConfig(c => ({ ...c, limite_diario: Number(e.target.value) }))}
                  className="w-full accent-[#D4A843]"
                />
                <div className="flex justify-between text-xs text-zinc-600 mt-1">
                  <span>5/dia (seguro)</span><span>80/dia (máximo)</span>
                </div>
              </div>

              {/* Cidades */}
              <div>
                <p className="text-sm font-medium text-white mb-2">Cidades ativas</p>
                <div className="flex flex-wrap gap-2">
                  {CIDADES_DISPONIVEIS.map(cidade => {
                    const active = config.cidades.includes(cidade)
                    return (
                      <button
                        key={cidade}
                        onClick={() => toggleCidade(cidade)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          active
                            ? 'text-[#D4A843] border-[rgba(212,168,67,0.4)] bg-[rgba(212,168,67,0.08)]'
                            : 'text-zinc-500 border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        {cidade}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="w-full mt-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all"
              style={{
                background: savingConfig ? 'rgba(212,168,67,0.4)' : '#D4A843',
                color: '#050A14',
              }}
            >
              {savingConfig ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
