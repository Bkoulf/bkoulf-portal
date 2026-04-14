'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ContactServiceBanner } from './contact-service-banner'
import {
  Video, Calendar, Film, Download, Clock,
  CheckCircle2, Loader2, Sparkles, ThumbsUp, ThumbsDown, X,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface Contrato {
  id: string
  cliente_id: string
  total_combinado: number
  data_entrega: string | null
}

interface VideoItem {
  id: string
  titulo: string
  descricao: string | null
  status: 'pendente' | 'em_edicao' | 'entregue' | 'aprovado' | 'reprovado'
  arquivo_url: string | null
  tamanho_arquivo: number | null
  resolucao: string
  thumbnail_url: string | null
  criado_em: string
  observacao_reprovacao: string | null
}

interface Props {
  contrato: Contrato | null
  videos: VideoItem[]
}

// ─── Counter hook ────────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1000): number {
  const [val, setVal] = useState(0)
  const raf = useRef<number>(0)
  useEffect(() => {
    cancelAnimationFrame(raf.current)
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(target * (1 - (1 - p) ** 3))
      if (p < 1) raf.current = requestAnimationFrame(step)
      else setVal(target)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])
  return val
}

// ─── Countdown ──────────────────────────────────────────────────────────────

function useCountdown(dateStr: string | null): { text: string; isUrgent: boolean } {
  const [result, setResult] = useState({ text: '—', isUrgent: false })

  useEffect(() => {
    if (!dateStr) { setResult({ text: 'Sem prazo definido', isUrgent: false }); return }

    function calc() {
      const target = new Date(dateStr!)
      target.setHours(23, 59, 59)
      const diff = target.getTime() - Date.now()
      const days = Math.ceil(diff / 86400000)
      if (days < 0) return { text: 'Prazo encerrado', isUrgent: true }
      if (days === 0) return { text: 'Vence hoje', isUrgent: true }
      if (days === 1) return { text: 'Vence amanhã', isUrgent: true }
      return { text: `Entrega em ${days} dias`, isUrgent: days <= 3 }
    }

    setResult(calc())
    const interval = setInterval(() => setResult(calc()), 60000)
    return () => clearInterval(interval)
  }, [dateStr])

  return result
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 300)
    return () => clearTimeout(t)
  }, [percent])

  return (
    <div className="w-full bg-[#1C2333] rounded-full h-2 mt-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-[#2D7DD2] to-[#5BAFF5] transition-all duration-1000 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

// ─── Status config ───────────────────────────────────────────────────────────

const statusCfg = {
  pendente:  { label: 'Pendente',   cls: 'text-[#B0B8C4]  bg-[rgba(255,255,255,0.1)]/60    border-[rgba(255,255,255,0.15)]',        dot: 'bg-zinc-500',    pulse: false },
  em_edicao: { label: 'Em edição',  cls: 'text-[#2D7DD2] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]',    dot: 'bg-[#2D7DD2]',   pulse: true  },
  entregue:  { label: 'Aguardando aprovação', cls: 'text-[#B0B8C4] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]', dot: 'bg-[#B0B8C4]', pulse: false },
  aprovado:  { label: 'Aprovado',   cls: 'text-[#D4A843] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]', dot: 'bg-[#D4A843]', pulse: false },
  reprovado: { label: 'Reprovado',  cls: 'text-[rgba(176,184,196,0.7)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]',            dot: 'bg-[rgba(255,255,255,0.08)]',    pulse: false },
}

// ─── Video Card ──────────────────────────────────────────────────────────────

function VideoCard({ video, onStatusChange }: { video: VideoItem; onStatusChange: (id: string, status: VideoItem['status'], obs?: string) => void }) {
  const [downloading, setDownloading] = useState(false)
  const [showReprovar, setShowReprovar] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const cfg = statusCfg[video.status]

  async function handleDownload() {
    if (!video.arquivo_url) return
    setDownloading(true)
    await new Promise(r => setTimeout(r, 600))
    window.open(video.arquivo_url, '_blank')
    setDownloading(false)
  }

  async function handleAprovar() {
    setSaving(true)
    const { error } = await supabase
      .from('videos')
      .update({ status: 'aprovado', aprovado_em: new Date().toISOString() })
      .eq('id', video.id)
    if (error) { toast.error('Erro ao aprovar vídeo'); setSaving(false); return }
    toast.success('Vídeo aprovado!')
    onStatusChange(video.id, 'aprovado')
    setSaving(false)
  }

  async function handleReprovar() {
    if (!observacao.trim()) { toast.error('Descreva o motivo da reprovação'); return }
    setSaving(true)
    const { error } = await supabase
      .from('videos')
      .update({ status: 'reprovado', reprovado_em: new Date().toISOString(), observacao_reprovacao: observacao.trim() })
      .eq('id', video.id)
    if (error) { toast.error('Erro ao reprovar vídeo'); setSaving(false); return }
    toast.success('Vídeo reprovado. A equipe será notificada.')
    onStatusChange(video.id, 'reprovado', observacao.trim())
    setShowReprovar(false)
    setObservacao('')
    setSaving(false)
  }

  return (
    <div className={`bg-[rgba(255,255,255,0.04)] border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-black/20 group ${
      video.status === 'reprovado' ? 'border-[rgba(255,255,255,0.08)]' :
      video.status === 'aprovado'  ? 'border-[rgba(255,255,255,0.08)]' :
      'border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'
    }`}>
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[#1C2333] flex items-center justify-center overflow-hidden">
        {video.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={video.thumbnail_url} alt={video.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Film className="w-10 h-10 text-[rgba(176,184,196,0.4)]" />
        )}

        <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 bg-black/60 text-white rounded-md backdrop-blur-sm">
          {video.resolucao}
        </span>

        <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium backdrop-blur-sm ${cfg.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-semibold text-sm line-clamp-2">{video.titulo}</h3>
          {video.descricao && <p className="text-[rgba(176,184,196,0.6)] text-xs line-clamp-2 mt-1">{video.descricao}</p>}
        </div>

        {/* Observação de reprovação */}
        {video.status === 'reprovado' && video.observacao_reprovacao && (
          <div className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3">
            <p className="text-xs text-[rgba(176,184,196,0.7)] font-semibold mb-1">Motivo da reprovação:</p>
            <p className="text-xs text-[#D0D8E4] leading-relaxed">{video.observacao_reprovacao}</p>
          </div>
        )}

        {/* Aprovado: feedback visual */}
        {video.status === 'aprovado' && (
          <div className="flex items-center gap-2 text-[#5BAFF5] text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovado por você
          </div>
        )}

        {/* Ações para vídeo entregue */}
        {video.status === 'entregue' && (
          <div className="space-y-2">
            {/* Download */}
            {video.arquivo_url && (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
                className="w-full h-8 text-xs bg-[#1C2333] hover:bg-[rgba(255,255,255,0.1)] text-[#D0D8E4] border border-[rgba(255,255,255,0.12)]"
              >
                {downloading
                  ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Baixando...</>
                  : <><Download className="w-3.5 h-3.5 mr-1.5" />Baixar em alta resolução</>
                }
              </Button>
            )}

            {/* Botões de aprovação */}
            {!showReprovar ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={handleAprovar}
                  disabled={saving}
                  className="h-8 text-xs bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#5BAFF5] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)]"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><ThumbsUp className="w-3.5 h-3.5 mr-1.5" />Aprovar</>}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowReprovar(true)}
                  className="h-8 text-xs bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] text-[rgba(176,184,196,0.7)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.1)]"
                >
                  <ThumbsDown className="w-3.5 h-3.5 mr-1.5" />Reprovar
                </Button>
              </div>
            ) : (
              /* Formulário de reprovação */
              <div className="space-y-2 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[rgba(176,184,196,0.7)]">Motivo da reprovação</p>
                  <button onClick={() => { setShowReprovar(false); setObservacao('') }} className="text-[rgba(176,184,196,0.6)] hover:text-[#D0D8E4]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Descreva o que precisa ser corrigido..."
                  className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.4)] text-xs min-h-[70px] resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleReprovar}
                  disabled={saving || !observacao.trim()}
                  className="w-full h-8 text-xs bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] text-white"
                >
                  {saving ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Enviando...</> : 'Confirmar reprovação'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Download para vídeos já aprovados */}
        {video.status === 'aprovado' && video.arquivo_url && (
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full h-8 text-xs bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#5BAFF5] border border-[rgba(255,255,255,0.08)]"
          >
            {downloading ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Baixando...</> : <><Download className="w-3.5 h-3.5 mr-1.5" />Baixar em alta resolução</>}
          </Button>
        )}

        {/* Status de produção */}
        {video.status === 'pendente' && (
          <span className="block text-xs text-[rgba(176,184,196,0.4)]">Aguardando produção</span>
        )}
        {video.status === 'em_edicao' && (
          <span className="block text-xs text-[#D4A843]/70">Em produção...</span>
        )}

        {video.tamanho_arquivo && (
          <span className="block text-xs text-zinc-700">{video.tamanho_arquivo.toFixed(0)} MB</span>
        )}
      </div>
    </div>
  )
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  title: string
  icon: React.ElementType
  accent: string
  children: React.ReactNode
  delay?: number
}

function MetricCard({ title, icon: Icon, accent, children, delay = 0 }: MetricCardProps) {
  return (
    <div
      className={`bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] border-l-4 ${accent} rounded-xl p-5`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#B0B8C4]" />
        <span className="text-[#B0B8C4] text-sm font-medium">{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function EdicaoVideosClient({ contrato, videos: initialVideos }: Props) {
  const [videos, setVideos] = useState(initialVideos)

  function handleStatusChange(id: string, status: VideoItem['status'], obs?: string) {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status, observacao_reprovacao: obs ?? v.observacao_reprovacao } : v))
  }

  const totalCombinado = contrato?.total_combinado ?? 0
  const dataEntrega = contrato?.data_entrega ?? null

  const entregues  = videos.filter(v => v.status === 'entregue' || v.status === 'aprovado').length
  const emEdicao   = videos.filter(v => v.status === 'em_edicao').length
  const pendentes  = videos.filter(v => v.status === 'pendente').length
  const progressPct = totalCombinado > 0 ? Math.min((entregues / totalCombinado) * 100, 100) : 0

  const countdown = useCountdown(dataEntrega)
  const countEntregues = useCounter(entregues)
  const countTotal = useCounter(totalCombinado)

  const noContrato = !contrato
  const noVideos = videos.length === 0

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
          <Video className="w-5 h-5 text-[#B0B8C4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Edição de Vídeos</h1>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Acompanhe seus vídeos em produção</p>
        </div>
      </div>

      {/* ── Notice when no contract ──────────────────────────────────── */}
      {noContrato && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-xl">
          <Sparkles className="w-4 h-4 text-[#B0B8C4] shrink-0" />
          <p className="text-[#B0B8C4] text-xs">
            Seus dados de contrato e vídeos aparecerão aqui assim que a equipe Bkoulf configurar o projeto.
          </p>
        </div>
      )}

      {/* ── Metric cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

        {/* Card 1: Total combinado */}
        <MetricCard title="Vídeos combinados" icon={Film} accent="border-l-[#2D7DD2]" delay={0}>
          <p className={`text-3xl font-bold tabular-nums ${noContrato ? 'text-[rgba(176,184,196,0.4)]' : 'text-white'}`}>
            {noContrato ? '—' : Math.round(countTotal)}
          </p>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-1">
            {noContrato ? 'Aguardando configuração' : `Total acordado em contrato`}
          </p>
        </MetricCard>

        {/* Card 2: Data de entrega */}
        <MetricCard title="Data de entrega" icon={Calendar} accent={countdown.isUrgent ? 'border-l-[#2D7DD2]' : 'border-l-[#2D7DD2]'} delay={80}>
          {noContrato ? (
            <p className="text-3xl font-bold text-[rgba(176,184,196,0.4)]">—</p>
          ) : (
            <p className={`text-2xl font-bold ${countdown.isUrgent ? 'text-[rgba(176,184,196,0.7)]' : 'text-white'}`}>
              {countdown.text}
            </p>
          )}
          {!noContrato && dataEntrega && (
            <p className="text-[rgba(176,184,196,0.6)] text-xs mt-1">
              {new Date(dataEntrega + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          )}
          {!noContrato && !dataEntrega && (
            <p className="text-[rgba(176,184,196,0.4)] text-xs mt-1">Sem prazo definido</p>
          )}
        </MetricCard>

        {/* Card 3: Progresso */}
        <MetricCard title="Progresso" icon={CheckCircle2} accent="border-l-[#2D7DD2]" delay={160}>
          <div className="flex items-end gap-2">
            <p className={`text-3xl font-bold tabular-nums ${noContrato ? 'text-[rgba(176,184,196,0.4)]' : 'text-white'}`}>
              {noContrato ? '—' : Math.round(countEntregues)}
            </p>
            {!noContrato && (
              <p className="text-[rgba(176,184,196,0.6)] text-sm mb-1">/ {totalCombinado} entregues</p>
            )}
          </div>
          {!noContrato && (
            <>
              <ProgressBar percent={progressPct} />
              <div className="flex items-center gap-3 mt-2 text-xs text-[rgba(176,184,196,0.6)]">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#2D7DD2] inline-block" />{emEdicao} em edição</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-zinc-500 inline-block" />{pendentes} pendentes</span>
              </div>
            </>
          )}
          {noContrato && <p className="text-[rgba(176,184,196,0.4)] text-xs mt-1">Aguardando configuração</p>}
        </MetricCard>
      </div>

      {/* ── Video list ───────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-base">Seus Vídeos</h2>
          {videos.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[rgba(176,184,196,0.6)]">
              <Clock className="w-3.5 h-3.5" />
              {videos.length} vídeo{videos.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {noVideos ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl">
            <div className="w-16 h-16 rounded-2xl bg-[#1C2333] flex items-center justify-center">
              <Film className="w-8 h-8 text-[rgba(176,184,196,0.4)]" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-base">Nenhum vídeo cadastrado ainda</p>
              <p className="text-[rgba(176,184,196,0.6)] text-sm mt-1 max-w-xs">
                Seus vídeos aparecerão aqui assim que forem adicionados pela equipe Bkoulf.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(v => <VideoCard key={v.id} video={v} onStatusChange={handleStatusChange} />)}
          </div>
        )}
      </div>

      <ContactServiceBanner service="Edição de Vídeos" />
    </div>
  )
}
