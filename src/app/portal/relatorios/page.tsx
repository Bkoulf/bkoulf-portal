import { createClient } from '@/lib/supabase/server'
import { BarChart2, FileText, ExternalLink, Download, TrendingUp, Video, Palette, Globe, CheckCircle2, Clock, Zap } from 'lucide-react'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Relatórios',
}


// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportDoc {
  id: string
  title: string
  period: string
  file_url: string | null
  created_at: string
  service_type: string
}

// ─── Service type labels ──────────────────────────────────────────────────────

const serviceInfo: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  trafego_pago:      { label: 'Tráfego Pago',     icon: TrendingUp, color: 'text-blue-400'   },
  edicao_videos:     { label: 'Edição de Vídeos',  icon: Video,      color: 'text-purple-400' },
  identidade_visual: { label: 'Identidade Visual', icon: Palette,    color: 'text-pink-400'   },
  website:           { label: 'Website',           icon: Globe,      color: 'text-emerald-400'},
}

function formatPeriod(period: string) {
  if (!period) return period
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-')
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    return `${months[parseInt(month) - 1]} ${year}`
  }
  return period
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('client_id').eq('id', user!.id).single()
  const clienteId = profile?.client_id ?? ''

  // Busca reports, serviços, métricas e todas as entregas em paralelo
  const [
    { data: reports },
    { data: services },
    { data: metricas },
    { data: contrato },
    { data: videosAll },
    { data: identidade },
    { data: website },
    { data: deliverables },
  ] = await Promise.all([
    supabase.from('reports').select('*').eq('client_id', clienteId).order('created_at', { ascending: false }),
    supabase.from('services').select('*').eq('client_id', clienteId),
    supabase.from('trafego_pago_metricas').select('investimento, leads, periodo').eq('client_id', clienteId).order('periodo', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('contratos_video').select('total_combinado').eq('cliente_id', clienteId).maybeSingle(),
    supabase.from('videos').select('id, titulo, status, criado_em').eq('cliente_id', clienteId).in('status', ['entregue', 'aprovado', 'reprovado']).order('criado_em', { ascending: false }),
    supabase.from('identidade_visual').select('id, status, atualizado_em').eq('cliente_id', clienteId).maybeSingle(),
    supabase.from('websites').select('id, status, url, atualizado_em').eq('cliente_id', clienteId).maybeSingle(),
    supabase.from('deliverables').select('id, title, status, due_date, created_at').eq('client_id', clienteId).order('created_at', { ascending: false }),
  ])

  const videosEntreguesCount = (videosAll ?? []).filter(v => v.status === 'entregue').length

  // Monta lista unificada de todas as entregas
  type EntregaUnificada = {
    id: string
    titulo: string
    tipo: string
    status: string
    data: string
  }

  const todasEntregas: EntregaUnificada[] = [
    ...(deliverables ?? []).map(d => ({
      id: d.id,
      titulo: d.title,
      tipo: 'Entrega',
      status: d.status,
      data: d.created_at,
    })),
    ...(videosAll ?? []).map(v => ({
      id: `video-${v.id}`,
      titulo: v.titulo,
      tipo: 'Vídeo',
      status: v.status,
      data: v.criado_em,
    })),
    ...(identidade && identidade.status === 'entregue' ? [{
      id: `identidade-${identidade.id}`,
      titulo: 'Identidade Visual',
      tipo: 'Identidade Visual',
      status: 'entregue',
      data: identidade.atualizado_em ?? '',
    }] : []),
    ...(website && ['entregue', 'manutencao', 'em_revisao'].includes(website.status ?? '') ? [{
      id: `website-${website.id}`,
      titulo: 'Website',
      tipo: 'Website',
      status: website.status ?? '',
      data: website.atualizado_em ?? '',
    }] : []),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  const activeServices = (services ?? []).filter(s => s.status !== 'pausado')

  const serviceMetrics: Record<string, React.ReactNode> = {
    trafego_pago: metricas ? (
      <div className="flex items-center gap-4 mt-2">
        <div>
          <p className="text-white font-bold text-lg">R$ {Number(metricas.investimento ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
          <p className="text-zinc-500 text-xs">Investimento — {formatPeriod(metricas.periodo)}</p>
        </div>
        <div>
          <p className="text-white font-bold text-lg">{metricas.leads ?? 0}</p>
          <p className="text-zinc-500 text-xs">Leads gerados</p>
        </div>
      </div>
    ) : <p className="text-zinc-600 text-xs mt-2">Sem métricas disponíveis</p>,

    edicao_videos: (
      <div className="flex items-center gap-4 mt-2">
        <div>
          <p className="text-white font-bold text-lg">{videosEntreguesCount ?? 0} / {contrato?.total_combinado ?? '—'}</p>
          <p className="text-zinc-500 text-xs">Vídeos entregues</p>
        </div>
      </div>
    ),

    identidade_visual: (
      <div className="mt-2">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          identidade?.status === 'entregue'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        }`}>
          {identidade?.status === 'entregue' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          {identidade?.status === 'entregue' ? 'Brandbook entregue' : 'Em produção'}
        </span>
      </div>
    ),

    website: (
      <div className="mt-2 space-y-1">
        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
          website?.status === 'entregue' || website?.status === 'manutencao'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
            : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
        }`}>
          {(website?.status === 'entregue' || website?.status === 'manutencao')
            ? <CheckCircle2 className="w-3 h-3" />
            : <Clock className="w-3 h-3" />
          }
          {website?.status === 'entregue' ? 'Entregue'
            : website?.status === 'manutencao' ? 'Em manutenção'
            : website?.status === 'em_revisao' ? 'Em revisão'
            : 'Em desenvolvimento'}
        </span>
        {website?.url && (
          <p className="text-zinc-500 text-xs font-mono truncate">{website.url}</p>
        )}
      </div>
    ),
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
          <BarChart2 className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Relatórios</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Visão consolidada dos seus resultados</p>
        </div>
      </div>

      {/* Visão geral dos serviços */}
      {activeServices.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-500" />
            <h2 className="text-white font-semibold text-sm">Seus serviços ativos</h2>
            <span className="text-zinc-600 text-xs">— resumo geral</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeServices.map(service => {
              const info = serviceInfo[service.type]
              if (!info) return null
              const Icon = info.icon
              return (
                <div key={service.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${info.color}`} />
                    <span className="text-zinc-300 text-sm font-medium">{info.label}</span>
                  </div>
                  {serviceMetrics[service.type] ?? (
                    <p className="text-zinc-600 text-xs mt-2">Sem dados disponíveis</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Documentos de relatório */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          <h2 className="text-white font-semibold text-sm">Relatórios mensais</h2>
          <span className="text-zinc-600 text-xs">— documentos enviados pela Bkoulf</span>
        </div>

        {!reports || reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <FileText className="w-7 h-7 text-zinc-600" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">Nenhum relatório disponível ainda</p>
              <p className="text-zinc-500 text-xs mt-1 max-w-xs">
                Os relatórios mensais da Bkoulf aparecerão aqui assim que forem publicados.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {(reports as ReportDoc[]).map(report => {
              const info = serviceInfo[report.service_type]
              const Icon = info?.icon ?? FileText
              return (
                <div key={report.id} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${info?.color ?? 'text-zinc-400'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-zinc-500 text-xs">{formatPeriod(report.period)}</span>
                      {info && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 ${info.color}`}>
                          {info.label}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-zinc-600 text-xs shrink-0 hidden sm:block">
                    {new Date(report.created_at).toLocaleDateString('pt-BR')}
                  </p>

                  {report.file_url && (
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Abrir"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <a
                        href={report.file_url}
                        download
                        className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Histórico unificado de entregas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-zinc-500" />
          <h2 className="text-white font-semibold text-sm">Histórico de entregas</h2>
          <span className="text-zinc-600 text-xs">— todos os tipos</span>
        </div>

        {todasEntregas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Clock className="w-7 h-7 text-zinc-600" />
            <p className="text-zinc-500 text-sm">Nenhuma entrega registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todasEntregas.map(e => {
              const statusMap: Record<string, { label: string; color: string }> = {
                entregue:             { label: 'Entregue',            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                aguardando_aprovacao: { label: 'Aguard. aprovação',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                aprovado:             { label: 'Aprovado',            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                ajuste_solicitado:    { label: 'Ajuste solicitado',   color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
                reprovado:            { label: 'Reprovado',           color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                manutencao:           { label: 'Em manutenção',       color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                em_revisao:           { label: 'Em revisão',          color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
              }
              const tipoInfo = serviceInfo[
                e.tipo === 'Vídeo' ? 'edicao_videos'
                : e.tipo === 'Identidade Visual' ? 'identidade_visual'
                : e.tipo === 'Website' ? 'website'
                : 'trafego_pago'
              ]
              const Icon = tipoInfo?.icon ?? FileText
              const badge = statusMap[e.status]

              return (
                <div key={e.id} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                    <Icon className={`w-5 h-5 ${tipoInfo?.color ?? 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{e.titulo}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 ${tipoInfo?.color ?? 'text-zinc-400'}`}>
                      {e.tipo}
                    </span>
                  </div>
                  {badge && (
                    <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  {e.data && (
                    <p className="text-zinc-600 text-xs shrink-0 hidden sm:block">
                      {new Date(e.data).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
