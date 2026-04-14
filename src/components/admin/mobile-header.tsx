'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Menu, X, LogOut,
  Users, LayoutDashboard, PackageCheck, Calendar,
  TrendingUp, Video, Palette, Monitor, Bot, UserCircle, Crosshair, HeadphonesIcon,
} from 'lucide-react'
import { toast } from 'sonner'

const ferramentas = [
  { href: '/admin',            label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/clientes',   label: 'Clientes',    icon: Users },
  { href: '/admin/entregas',   label: 'Entregas',    icon: PackageCheck },
  { href: '/admin/calendario', label: 'Calendário',  icon: Calendar },
  { href: '/admin/leads',      label: 'Leads',       icon: Crosshair },
]

const servicos = [
  { href: '/admin/identidade-visual', label: 'Identidade Visual', icon: Palette },
  { href: '/admin/videos',            label: 'Edição de Vídeos',  icon: Video },
  { href: '/admin/website',           label: 'Website',           icon: Monitor },
  { href: '/admin/trafego-pago',      label: 'Tráfego Pago',      icon: TrendingUp },
]

const ajuda = [
  { href: '/admin/assistente', label: 'BK Assistant', icon: Bot },
  { href: '/admin/suporte',    label: 'Suporte',       icon: HeadphonesIcon },
]

interface Props {
  userName: string
}

export function AdminMobileHeader({ userName }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Saiu com sucesso')
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Top bar (mobile only) */}
      <header
        className="lg:hidden h-14 flex items-center justify-between px-4 shrink-0"
        style={{
          background: '#0D0D0F',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-[#B0B8C4] hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Image
            src="/logo-full.jpg"
            alt="Bkoulf"
            width={90}
            height={36}
            className="object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
          <span
            className="text-[9px] font-bold tracking-[2px] uppercase px-1.5 py-0.5 rounded"
            style={{
              color: '#D4A843',
              background: 'rgba(212,168,67,0.1)',
              border: '1px solid rgba(212,168,67,0.2)',
            }}
          >
            Admin
          </span>
        </div>

        <div className="w-9" />
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{
              background: '#0D0D0F',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Logo + close */}
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <Image
                  src="/logo-full.jpg"
                  alt="Bkoulf"
                  width={100}
                  height={40}
                  className="object-contain"
                  style={{ mixBlendMode: 'screen' }}
                />
                <span
                  className="text-[9px] font-bold tracking-[2px] uppercase"
                  style={{ color: '#D4A843' }}
                >
                  Admin
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#B0B8C4] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              {[
                { label: 'Ferramentas', items: ferramentas },
                { label: 'Serviços',    items: servicos },
                { label: 'Ajuda',       items: ajuda },
                { label: 'Conta',       items: [{ href: '/admin/perfil', label: 'Meu Perfil', icon: UserCircle }] },
              ].map(({ label, items }) => (
                <div key={label}>
                  <p className="px-3 mb-2 text-[9px] font-bold text-white/30 uppercase tracking-[3px]">{label}</p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                              isActive
                                ? 'bg-[rgba(212,168,67,0.1)] text-white'
                                : 'text-[#8B9AAB] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#D4A843] rounded-r-full" />
                            )}
                            <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#D4A843]' : 'opacity-60')} />
                            {item.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* User + logout */}
            <div
              className="px-3 py-4 space-y-1"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="px-3 py-2 text-xs text-[#B0B8C4]">{userName}</div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgba(176,184,196,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
