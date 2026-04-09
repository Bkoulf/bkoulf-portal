import { createClient } from '@/lib/supabase/server'
import { BarChart2, FileText, ExternalLink, Download, TrendingUp, Video, Palette, Globe, CheckCircle2, Clock, Zap } from 'lucide-react'

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

  // Busca reports, serviços e métricas de cada serviço em paralelo
  const [
    { data: reports },
    { data: services },
    { data: metricas },
    { data: contrato },
    { count: videosEntreguesCount },
    { data: identidade },
    { data: website },
  ] = await Promise.all([
    supabase.from('reports').select('*').eq('client_id', clienteId).order('created_at', { ascending: false }),
    supabase.from('services').select('*').eq('client_id', clienteId),
    supabase.from('trafego_pago_metricas').select('investimento, leads, periodo').eq('client_id', clienteId).order('periodo', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('contratos_video').select('total_combinado').eq('cliente_id', clienteId).maybeSingle(),
    supabase.from('videos').select('id', { count: 'exact', head: true }).eq('cliente_id', clienteId).eq('status', 'entregue'),
    supabase.from('identidade_visual').select('status').eq('cliente_id', clienteId).maybeSingle(),
    supabase.from('websites').select('status, url').eq('cliente_id', clienteId).maybeSingle(),
  ])

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
    </div>
  )
}
