'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, PackageCheck, Calendar, Bot,
  Menu, X, LogOut, TrendingUp, Video, Palette, Monitor,
  UserCircle, PackageCheck as Entregas,
} from 'lucide-react'

const navItems = [
  { href: '/admin',                   label: 'Visão Geral',       icon: LayoutDashboard },
  { href: '/admin/clientes',          label: 'Clientes',          icon: Users },
  { href: '/admin/entregas',          label: 'Entregas',          icon: PackageCheck },
  { href: '/admin/calendario',        label: 'Calendário',        icon: Calendar },
  { href: '/admin/identidade-visual', label: 'Identidade Visual', icon: Palette },
  { href: '/admin/videos',            label: 'Edição de Vídeos',  icon: Video },
  { href: '/admin/website',           label: 'Website',           icon: Monitor },
  { href: '/admin/trafego-pago',      label: 'Tráfego Pago',      icon: TrendingUp },
  { href: '/admin/assistente',        label: 'Bk Assistant',      icon: Bot },
  { href: '/admin/perfil',            label: 'Meu Perfil',        icon: UserCircle },
]

const bottomItems = [
  { href: '/admin',            label: 'Geral',    icon: LayoutDashboard },
  { href: '/admin/clientes',   label: 'Clientes', icon: Users },
  { href: '/admin/entregas',   label: 'Entregas', icon: PackageCheck },
  { href: '/admin/calendario', label: 'Agenda',   icon: Calendar },
  { href: '/admin/assistente', label: 'Assistant',icon: Bot },
]

export function AdminMobileBottomNav() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{ background: 'rgba(5,10,20,0.99)', borderRight: '1px solid rgba(212,168,67,0.12)' }}
          >
            <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2">
                <Image src="/logo-full.jpg" alt="Bkoulf" width={100} height={40} className="object-contain" style={{ mixBlendMode: 'screen' }} />
                <span className="text-[9px] font-bold tracking-[2px] uppercase text-[#D4A843]">Admin</span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#B0B8C4] hover:text-white" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3">
              <ul className="space-y-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border',
                          isActive
                            ? 'text-[#D4A843] border-[rgba(212,168,67,0.3)]'
                            : 'text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] border-transparent'
                        )}
                        style={isActive ? { background: 'rgba(212,168,67,0.08)' } : {}}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#D4A843]' : '')} />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(5,10,20,0.97)',
          borderTop: '1px solid rgba(212,168,67,0.12)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ul className="flex items-stretch h-16">
          {/* Botão sair — esquerda */}
          <li className="flex-1">
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 h-full w-full text-[rgba(176,184,196,0.5)] active:text-white transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-6 rounded-lg">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">Sair</span>
            </button>
          </li>

          {/* Itens do meio */}
          {bottomItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                    isActive ? 'text-[#D4A843]' : 'text-[rgba(176,184,196,0.5)]'
                  )}
                >
                  <div className={cn('flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200', isActive && 'bg-[rgba(212,168,67,0.12)]')}>
                    <Icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-110')} />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </Link>
              </li>
            )
          })}

          {/* Menu hambúrguer — direita */}
          <li className="flex-1">
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center justify-center gap-1 h-full w-full text-[rgba(176,184,196,0.5)] active:text-white transition-all duration-200"
            >
              <div className="flex items-center justify-center w-8 h-6 rounded-lg">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-medium leading-none">Menu</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  )
}
