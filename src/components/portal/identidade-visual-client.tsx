'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Palette, Download, Loader2, ExternalLink, ArrowLeft, FileCode, Calendar, CheckCircle2 } from 'lucide-react'
import { ContactServiceBanner } from './contact-service-banner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface IdentidadeVisual {
  id: string
  cliente_id: string
  arquivo_url: string | null
  nome_arquivo: string | null
  status: 'em_producao' | 'entregue'
  entregue_em: string | null
}

interface Props {
  identidade: IdentidadeVisual | null
  clienteId: string
}

// ─── Estado vazio (em produção) ───────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
          <Palette className="w-12 h-12 text-[#B0B8C4]" />
        </div>
        <div className="absolute inset-0 rounded-3xl border-2 border-[rgba(255,255,255,0.08)] animate-ping" />
      </div>
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Sua identidade visual está sendo criada</h2>
        <p className="text-[#B0B8C4] text-sm max-w-xs leading-relaxed">
          Nossa equipe está desenvolvendo o brandbook completo da sua marca. Em breve ele aparecerá aqui.
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full">
        <span className="w-2 h-2 rounded-full bg-[#2D7DD2] animate-pulse" />
        <span className="text-[#2D7DD2] text-sm font-medium">Em produção</span>
      </div>
    </div>
  )
}

// ─── Visualizador do brandbook ────────────────────────────────────────────────

function BrandbookViewer({ clienteId, nomeArquivo, onBack }: {
  clienteId: string
  nomeArquivo: string | null
  onBack: () => void
}) {
  const [iframeHeight, setIframeHeight] = useState(800)
  const [loaded, setLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    function handler(e: MessageEvent) {
      if (typeof e.data?.iframeHeight === 'number' && e.data.iframeHeight > 0) {
        setIframeHeight(e.data.iframeHeight)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/brandbook/${clienteId}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo ?? 'brandbook.html'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="-mx-4 lg:-mx-6">
      {/* Barra superior com voltar + download */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 py-3 bg-[rgba(255,255,255,0.03)]/95 backdrop-blur-sm border-b border-[rgba(255,255,255,0.08)]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#B0B8C4] hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-[#B0B8C4] shrink-0" />
          <span className="text-white text-sm font-medium truncate max-w-[180px] sm:max-w-xs">
            {nomeArquivo ?? 'Brandbook'}
          </span>
        </div>

        <Button
          onClick={handleDownload}
          disabled={downloading}
          size="sm"
          className="shrink-0 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.06)] text-[#B0B8C4] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)]"
        >
          {downloading
            ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Baixando...</>
            : <><Download className="w-3.5 h-3.5 mr-1.5" />Baixar</>
          }
        </Button>
      </div>

      {/* Skeleton enquanto carrega */}
      {!loaded && (
        <div className="px-4 lg:px-6 pt-6 space-y-4 animate-pulse">
          <div className="h-64 bg-[#1C2333] rounded-lg" />
          <div className="h-40 bg-[#1C2333] rounded-lg" />
          <div className="h-96 bg-[#1C2333] rounded-lg" />
        </div>
      )}

      {/* iframe */}
      <iframe
        src={`/api/brandbook/${clienteId}`}
        className="w-full border-0 block"
        style={{
          height: `${iframeHeight}px`,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
        onLoad={() => setLoaded(true)}
        title="Brandbook"
        scrolling="no"
      />
    </div>
  )
}

// ─── Card do brandbook ────────────────────────────────────────────────────────

function BrandbookCard({ identidade, clienteId, onOpen }: {
  identidade: IdentidadeVisual
  clienteId: string
  onOpen: () => void
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/brandbook/${clienteId}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = identidade.nome_arquivo ?? 'brandbook.html'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
          <Palette className="w-5 h-5 text-[#B0B8C4]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Identidade Visual</h1>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Seu brandbook está pronto</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#5BAFF5]" />
          <span className="text-[#5BAFF5] text-xs font-medium">Entregue</span>
        </div>
      </div>

      {/* Card principal */}
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
        {/* Preview area */}
        <div className="relative bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.08)] p-12 flex flex-col items-center justify-center gap-5">
          {/* Ícone decorativo */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-[#1C2333] border border-[rgba(255,255,255,0.12)] flex items-center justify-center shadow-2xl">
              <FileCode className="w-10 h-10 text-[#B0B8C4]" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4A843] rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="text-center">
            <p className="text-white font-semibold text-lg">{identidade.nome_arquivo ?? 'brandbook.html'}</p>
            <p className="text-[rgba(176,184,196,0.6)] text-sm mt-1">Brandbook — Identidade Visual Completa</p>
          </div>

          {/* Botão abrir */}
          <Button
            onClick={onOpen}
            className="bg-[#2D7DD2] hover:bg-[#2D7DD2] text-white font-semibold px-8 h-11 shadow-lg "
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Brandbook
          </Button>
        </div>

        {/* Rodapé do card com metadados e download */}
        <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            {identidade.entregue_em && (
              <div className="flex items-center gap-2 text-[#B0B8C4] text-sm">
                <Calendar className="w-4 h-4 text-[rgba(176,184,196,0.6)]" />
                <span>
                  Entregue em{' '}
                  <span className="text-white font-medium">
                    {new Date(identidade.entregue_em).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="sm"
            className="bg-white text-black hover:bg-zinc-200 border-0 font-medium"
          >
            {downloading
              ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Baixando...</>
              : <><Download className="w-3.5 h-3.5 mr-1.5" />Baixar arquivo</>
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function IdentidadeVisualClient({ identidade, clienteId }: Props) {
  const [viewing, setViewing] = useState(false)
  const temBrandbook = !!(identidade?.arquivo_url && identidade?.status === 'entregue')

  if (!temBrandbook) {
    return (
      <div className="space-y-4">
        <EmptyState />
        <ContactServiceBanner service="Identidade Visual" />
      </div>
    )
  }

  if (viewing) {
    return (
      <BrandbookViewer
        clienteId={clienteId}
        nomeArquivo={identidade!.nome_arquivo}
        onBack={() => setViewing(false)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <BrandbookCard
        identidade={identidade!}
        clienteId={clienteId}
        onOpen={() => setViewing(true)}
      />
      <ContactServiceBanner service="Identidade Visual" />
    </div>
  )
}
