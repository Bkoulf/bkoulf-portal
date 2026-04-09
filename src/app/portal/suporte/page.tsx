import { HeadphonesIcon, MessageCircle, Mail, ExternalLink } from 'lucide-react'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const canais = [
  {
    label: 'WhatsApp',
    descricao: 'Atendimento direto com a equipe',
    href: 'https://wa.me/SEU_NUMERO',
    icon: MessageCircle,
    iconClass: 'text-green-400',
    bg: 'bg-green-500/10',
    hover: 'hover:border-green-500/40 hover:bg-green-500/5',
    borda: 'border-zinc-800',
  },
  {
    label: 'Instagram',
    descricao: '@bkoulf',
    href: 'https://instagram.com/SEU_PERFIL',
    icon: InstagramIcon,
    iconClass: 'text-pink-400',
    bg: 'bg-pink-500/10',
    hover: 'hover:border-pink-500/40 hover:bg-pink-500/5',
    borda: 'border-zinc-800',
  },
  {
    label: 'E-mail',
    descricao: 'contato@bkoulf.com.br',
    href: 'mailto:contato@bkoulf.com.br',
    icon: Mail,
    iconClass: 'text-blue-400',
    bg: 'bg-blue-500/10',
    hover: 'hover:border-blue-500/40 hover:bg-blue-500/5',
    borda: 'border-zinc-800',
  },
]

export default function SuportePage() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
          <HeadphonesIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Suporte</h1>
          <p className="text-zinc-500 text-xs mt-0.5">Fale diretamente com a equipe Bkoulf</p>
        </div>
      </div>

      {/* Canais de contato */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {canais.map((canal) => {
          const Icon = canal.icon
          return (
            <a
              key={canal.label}
              href={canal.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex items-center gap-4 bg-zinc-900 border ${canal.borda} ${canal.hover} rounded-xl p-5 transition-all duration-200`}
            >
              <div className={`w-11 h-11 rounded-xl ${canal.bg} flex items-center justify-center shrink-0 transition-colors`}>
                <Icon className={`w-5 h-5 ${canal.iconClass}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm">{canal.label}</p>
                <p className="text-zinc-500 text-xs truncate mt-0.5">{canal.descricao}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-colors" />
            </a>
          )
        })}
      </div>

      {/* Info adicional */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <p className="text-white font-semibold text-sm mb-1">Horário de atendimento</p>
        <p className="text-zinc-400 text-sm">Segunda a sexta, das 9h às 18h</p>
        <p className="text-zinc-500 text-xs mt-3">
          Para dúvidas rápidas sobre os serviços, use o{' '}
          <a href="/portal/assistente" className="text-violet-400 hover:underline">Assistente IA</a>{' '}
          disponível no portal.
        </p>
      </div>

    </div>
  )
}
