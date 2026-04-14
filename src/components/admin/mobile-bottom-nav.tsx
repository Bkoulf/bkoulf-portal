'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, PackageCheck, Calendar, Crosshair,
  Palette, Video, Monitor, TrendingUp,
  Bot, HeadphonesIcon,
  Wrench, Layers, X,
} from 'lucide-react'

const grupos = [
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    icon: Wrench,
    itens: [
      { href: '/admin/clientes',   label: 'Clientes',   icon: Users },
      { href: '/admin/entregas',   label: 'Entregas',   icon: PackageCheck },
      { href: '/admin/calendario', label: 'Calendário', icon: Calendar },
      { href: '/admin/leads',      label: 'Leads',      icon: Crosshair },
    ],
  },
  {
    id: 'servicos',
    label: 'Serviços',
    icon: Layers,
    itens: [
      { href: '/admin/identidade-visual', label: 'Identidade Visual', icon: Palette },
      { href: '/admin/videos',            label: 'Edição de Vídeos',  icon: Video },
      { href: '/admin/website',           label: 'Website',           icon: Monitor },
      { href: '/admin/trafego-pago',      label: 'Tráfego Pago',      icon: TrendingUp },
    ],
  },
  {
    id: 'ajuda',
    label: 'Ajuda',
    icon: HeadphonesIcon,
    itens: [
      { href: '/admin/assistente', label: 'BK Assistant', icon: Bot },
      { href: '/admin/suporte',    label: 'Suporte',       icon: HeadphonesIcon },
    ],
  },
]

export function AdminMobileBottomNav() {
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
                background: 'rgba(13,13,15,0.99)',
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
                          ? 'bg-[rgba(212,168,67,0.1)] text-[#D4A843]'
                          : 'text-[#B0B8C4] active:bg-[rgba(255,255,255,0.05)]'
                      )}
                    >
                      <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-[#D4A843]' : '')} />
                      {item.label}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4A843]" />
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
          background: 'rgba(10,10,14,0.97)',
          borderTop: '1px solid rgba(212,168,67,0.18)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ul className="flex items-stretch h-16">

          {/* Visão Geral — link direto */}
          <li className="flex-1">
            <Link
              href="/admin"
              onClick={fechar}
              className={cn(
                'flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                !aberto && pathname === '/admin' ? 'text-[#D4A843]' : 'text-[rgba(176,184,196,0.5)]'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                !aberto && pathname === '/admin' && 'bg-[rgba(212,168,67,0.15)]'
              )}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">Geral</span>
            </Link>
          </li>

          {/* Grupos com popup */}
          {grupos.map(grupo => {
            const Icon = grupo.icon
            const isPopupAberto = aberto === grupo.id
            const aceso = aberto ? isPopupAberto : grupoAtivo?.id === grupo.id

            return (
              <li key={grupo.id} className="flex-1">
                <button
                  onClick={() => toggle(grupo.id)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 h-full w-full transition-all duration-200',
                    aceso ? 'text-[#D4A843]' : 'text-[rgba(176,184,196,0.5)]'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                    aceso && 'bg-[rgba(212,168,67,0.15)]'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{grupo.label}</span>
                </button>
              </li>
            )
          })}

        </ul>
      </nav>
    </>
  )
}
