'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, FolderOpen,
  Zap, Palette, Video, Globe, TrendingUp,
  Bot, Wrench, Layers, Home, X,
} from 'lucide-react'

const grupos = [
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    icon: Wrench,
    itens: [
      { href: '/portal/calendario', label: 'Calendário', icon: Calendar },
      { href: '/portal/arquivos',   label: 'Arquivos',   icon: FolderOpen },
    ],
  },
  {
    id: 'servicos',
    label: 'Serviços',
    icon: Layers,
    itens: [
      { href: '/portal/diagnostico-bk4',   label: 'Método BK4',        icon: Zap },
      { href: '/portal/identidade-visual',  label: 'Identidade Visual', icon: Palette },
      { href: '/portal/edicao-videos',      label: 'Edição de Vídeos',  icon: Video },
      { href: '/portal/website',            label: 'Website',           icon: Globe },
      { href: '/portal/trafego-pago',       label: 'Tráfego Pago',      icon: TrendingUp },
    ],
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [aberto, setAberto] = useState<string | null>(null)

  function toggle(id: string) {
    setAberto(prev => prev === id ? null : id)
  }

  function fechar() {
    setAberto(null)
  }

  const grupoAtivo = grupos.find(g => g.itens.some(i => pathname === i.href || pathname.startsWith(i.href + '/')))

  return (
    <>
      {/* Backdrop ao abrir popup */}
      {aberto && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          onClick={fechar}
        />
      )}

      {/* Popup de seleção */}
      {grupos.map(grupo => (
        aberto === grupo.id && (
          <div
            key={grupo.id}
            className="fixed left-0 right-0 z-40 lg:hidden mx-3"
            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom) + 8px)' }}
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl"
              style={{
                background: 'rgba(7,21,37,0.99)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {/* Header do popup */}
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <span className="text-xs font-bold tracking-widest uppercase text-[rgba(176,184,196,0.5)]">
                  {grupo.label}
                </span>
                <button onClick={fechar} className="text-[rgba(176,184,196,0.5)] hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Itens */}
              <div className="p-2">
                {grupo.itens.map(item => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={fechar}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                        isActive
                          ? 'bg-[rgba(45,125,210,0.12)] text-[#2D7DD2]'
                          : 'text-[#B0B8C4] active:bg-[rgba(255,255,255,0.05)]'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-[#2D7DD2]' : '')} />
                      {item.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2D7DD2]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        )
      ))}

      {/* Bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(7,21,37,0.97)',
          borderTop: '1px solid rgba(45,125,210,0.18)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ul className="flex items-stretch h-16">

          {/* Início — link direto */}
          <li className="flex-1">
            <Link
              href="/portal/dashboard"
              onClick={fechar}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                !aberto && pathname === '/portal/dashboard' ? 'text-[#2D7DD2]' : 'text-[rgba(176,184,196,0.5)]'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                !aberto && pathname === '/portal/dashboard' && 'bg-[rgba(45,125,210,0.15)]'
              )}>
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">Início</span>
            </Link>
          </li>

          {/* Grupos com popup */}
          {grupos.map(grupo => {
            const Icon = grupo.icon
            const isPopupAberto = aberto === grupo.id
            // Se algum popup está aberto, só acende o que está aberto
            // Se nenhum popup está aberto, acende o grupo da rota atual
            const aceso = aberto ? isPopupAberto : grupoAtivo?.id === grupo.id

            return (
              <li key={grupo.id} className="flex-1">
                <button
                  onClick={() => toggle(grupo.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200',
                    aceso ? 'text-[#2D7DD2]' : 'text-[rgba(176,184,196,0.5)]'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                    aceso && 'bg-[rgba(45,125,210,0.15)]'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{grupo.label}</span>
                </button>
              </li>
            )
          })}

          {/* BK IA — link direto, último */}
          <li className="flex-1">
            <Link
              href="/portal/assistente"
              onClick={fechar}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                !aberto && pathname.startsWith('/portal/assistente') ? 'text-[#2D7DD2]' : 'text-[rgba(176,184,196,0.5)]'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                !aberto && pathname.startsWith('/portal/assistente') && 'bg-[rgba(45,125,210,0.15)]'
              )}>
                <Bot className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">BK IA</span>
            </Link>
          </li>

        </ul>
      </nav>
    </>
  )
}
