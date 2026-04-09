'use client'

import { useState } from 'react'
import { Globe, ExternalLink, Copy, Eye, EyeOff, CheckCircle2, Calendar, Server, Code2, Link2, ShieldAlert, Wrench, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ContactServiceBanner } from './contact-service-banner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Website {
  id: string
  cliente_id: string
  status: 'em_desenvolvimento' | 'em_revisao' | 'entregue' | 'manutencao'
  url: string | null
  plataforma: string | null
  hospedagem: string | null
  dominio: string | null
  painel_url: string | null
  painel_usuario: string | null
  painel_senha: string | null
  data_lancamento: string | null
  data_expiracao_dominio: string | null
  data_expiracao_hospedagem: string | null
  notas: string | null
}

interface Props {
  website: Website | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusCfg = {
  em_desenvolvimento: {
    label: 'Em desenvolvimento',
    icon: Code2,
    badge: 'text-[#2D7DD2] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]',
    dot: 'bg-[#2D7DD2] animate-pulse',
    emptyTitle: 'Seu website está sendo desenvolvido',
    emptyDesc: 'Nossa equipe está construindo o site da sua marca. Em breve ele estará disponível aqui.',
    accentIcon: 'bg-[rgba(255,255,255,0.05)]',
    accentIconColor: 'text-[#2D7DD2]',
  },
  em_revisao: {
    label: 'Em revisão',
    icon: Clock,
    badge: 'text-[#5BAFF5] bg-[rgba(255,255,255,0.05)] border-[rgba(45,125,210,0.2)]',
    dot: 'bg-[#2D7DD2] animate-pulse',
    emptyTitle: 'Seu website está em revisão final',
    emptyDesc: 'Estamos nos ajustes finais. Em breve o site estará pronto para entrega.',
    accentIcon: 'bg-[rgba(255,255,255,0.05)]',
    accentIconColor: 'text-[#5BAFF5]',
  },
  entregue: {
    label: 'Entregue',
    icon: CheckCircle2,
    badge: 'text-[#5BAFF5] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]',
    dot: 'bg-[#D4A843]',
    emptyTitle: '',
    emptyDesc: '',
    accentIcon: 'bg-[rgba(255,255,255,0.05)]',
    accentIconColor: 'text-[#5BAFF5]',
  },
  manutencao: {
    label: 'Em manutenção',
    icon: Wrench,
    badge: 'text-[#B0B8C4] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]',
    dot: 'bg-[rgba(255,255,255,0.06)] animate-pulse',
    emptyTitle: '',
    emptyDesc: '',
    accentIcon: 'bg-[rgba(255,255,255,0.05)]',
    accentIconColor: 'text-[#B0B8C4]',
  },
}

function copy(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.success(`${label} copiado!`)
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr + 'T12:00:00').getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ─── Empty / In-progress state ────────────────────────────────────────────────

function EmptyState({ status }: { status: Website['status'] }) {
  const cfg = statusCfg[status]
  const Icon = cfg.icon

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className={`w-24 h-24 rounded-3xl ${cfg.accentIcon} flex items-center justify-center`}>
          <Globe className={`w-12 h-12 ${cfg.accentIconColor}`} />
        </div>
        <div className={`absolute inset-0 rounded-3xl border-2 border-current ${cfg.accentIconColor} opacity-20 animate-ping`} />
      </div>
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">{cfg.emptyTitle}</h2>
        <p className="text-[#B0B8C4] text-sm max-w-xs leading-relaxed">{cfg.emptyDesc}</p>
      </div>
      <div className={`flex items-center gap-2 px-4 py-2 border rounded-full ${cfg.badge}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <Icon className="w-3.5 h-3.5" />
        <span className="text-sm font-medium">{cfg.label}</span>
      </div>
    </div>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.08)] last:border-0">
      <span className="text-[rgba(176,184,196,0.6)] text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-white text-sm font-medium">{value}</span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[#D0D8E4] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Date Badge ───────────────────────────────────────────────────────────────

function DateBadge({ label, dateStr, icon: Icon }: { label: string; dateStr: string; icon: React.ElementType }) {
  const days = daysUntil(dateStr)
  const isUrgent = days <= 30
  const isExpired = days < 0

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${
      isExpired ? 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]' :
      isUrgent ? 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]' :
      'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]'
    }`}>
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 shrink-0 ${isExpired ? 'text-[rgba(176,184,196,0.7)]' : isUrgent ? 'text-[#2D7DD2]' : 'text-[rgba(176,184,196,0.6)]'}`} />
        <div>
          <p className="text-[#B0B8C4] text-xs">{label}</p>
          <p className="text-white text-sm font-medium mt-0.5">{formatDate(dateStr)}</p>
        </div>
      </div>
      <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
        isExpired ? 'bg-[rgba(255,255,255,0.06)] text-[rgba(176,184,196,0.7)]' :
        isUrgent ? 'bg-[rgba(255,255,255,0.05)] text-[#2D7DD2]' :
        'bg-[#1C2333] text-[#B0B8C4]'
      }`}>
        {isExpired ? 'Expirado' : days === 0 ? 'Hoje' : `${days}d`}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WebsiteClient({ website }: Props) {
  const [showSenha, setShowSenha] = useState(false)

  const status = website?.status ?? 'em_desenvolvimento'
  const cfg = statusCfg[status]
  const StatusIcon = cfg.icon
  const showFull = status === 'entregue' || status === 'manutencao'

  if (!website || !showFull) {
    return <EmptyState status={status} />
  }

  const temCredenciais = !!(website.painel_url || website.painel_usuario || website.painel_senha)
  const temDatas = !!(website.data_lancamento || website.data_expiracao_dominio || website.data_expiracao_hospedagem)
  const temInfo = !!(website.plataforma || website.hospedagem || website.dominio)

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${cfg.accentIcon} flex items-center justify-center shrink-0`}>
          <Globe className={`w-5 h-5 ${cfg.accentIconColor}`} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Website</h1>
          <p className="text-[rgba(176,184,196,0.6)] text-xs mt-0.5">Painel do seu site</p>
        </div>
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 border rounded-full ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{cfg.label}</span>
        </div>
      </div>

      {/* URL principal */}
      {website.url && (
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <p className="text-[rgba(176,184,196,0.6)] text-xs font-medium uppercase tracking-wider mb-3">Seu site</p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0 bg-[#1C2333] border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-3">
              <Globe className="w-4 h-4 text-[#5BAFF5] shrink-0" />
              <span className="text-white font-mono text-sm truncate">{website.url}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => copy(website.url!, 'URL')}
                variant="outline"
                size="sm"
                className="border-[rgba(255,255,255,0.12)] text-[#B0B8C4] hover:text-white"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copiar
              </Button>
              <Button
                onClick={() => window.open(website.url!, '_blank')}
                className="bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.05)] text-[#5BAFF5] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.08)]"
                size="sm"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Visitar site
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Informações técnicas */}
      {temInfo && (
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-2 border-b border-[rgba(255,255,255,0.08)]">
            <p className="text-white font-semibold text-sm">Informações técnicas</p>
          </div>
          <div className="px-6">
            {website.plataforma && (
              <InfoRow
                label="Plataforma"
                value={website.plataforma}
                onCopy={() => copy(website.plataforma!, 'Plataforma')}
              />
            )}
            {website.hospedagem && (
              <InfoRow
                label="Hospedagem"
                value={website.hospedagem}
                onCopy={() => copy(website.hospedagem!, 'Hospedagem')}
              />
            )}
            {website.dominio && (
              <InfoRow
                label="Domínio"
                value={website.dominio}
                onCopy={() => copy(website.dominio!, 'Domínio')}
              />
            )}
          </div>
        </div>
      )}

      {/* Credenciais do painel */}
      {temCredenciais && (
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-2 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Acesso ao painel administrativo</p>
            <ShieldAlert className="w-4 h-4 text-[rgba(176,184,196,0.6)]" />
          </div>
          <div className="px-6">
            {website.painel_url && (
              <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.08)]">
                <span className="text-[rgba(176,184,196,0.6)] text-sm">URL do painel</span>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium font-mono max-w-[200px] truncate">
                    {website.painel_url}
                  </span>
                  <button
                    onClick={() => window.open(website.painel_url!, '_blank')}
                    className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[#D0D8E4] transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => copy(website.painel_url!, 'URL do painel')}
                    className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[#D0D8E4] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            {website.painel_usuario && (
              <InfoRow
                label="Usuário"
                value={website.painel_usuario}
                onCopy={() => copy(website.painel_usuario!, 'Usuário')}
              />
            )}
            {website.painel_senha && (
              <div className="flex items-center justify-between py-3">
                <span className="text-[rgba(176,184,196,0.6)] text-sm">Senha</span>
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-medium font-mono">
                    {showSenha ? website.painel_senha : '••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowSenha(p => !p)}
                    className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[#D0D8E4] transition-colors"
                  >
                    {showSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => copy(website.painel_senha!, 'Senha')}
                    className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[#D0D8E4] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datas importantes */}
      {temDatas && (
        <div className="space-y-3">
          <p className="text-white font-semibold text-sm px-1">Datas importantes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {website.data_lancamento && (
              <DateBadge label="Data de lançamento" dateStr={website.data_lancamento} icon={Calendar} />
            )}
            {website.data_expiracao_dominio && (
              <DateBadge label="Expiração do domínio" dateStr={website.data_expiracao_dominio} icon={Globe} />
            )}
            {website.data_expiracao_hospedagem && (
              <DateBadge label="Expiração da hospedagem" dateStr={website.data_expiracao_hospedagem} icon={Server} />
            )}
          </div>
        </div>
      )}

      {/* Observações */}
      {website.notas && (
        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6">
          <p className="text-white font-semibold text-sm mb-3">Observações</p>
          <p className="text-[#B0B8C4] text-sm leading-relaxed whitespace-pre-wrap">{website.notas}</p>
        </div>
      )}

      <ContactServiceBanner service="Website" />
    </div>
  )
}
