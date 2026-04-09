'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Users,
  LayoutDashboard,
  PackageCheck,
  Calendar,
  TrendingUp,
  Video,
  Palette,
  Monitor,
  Bot,
  UserCircle,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/entregas', label: 'Entregas', icon: PackageCheck },
  { href: '/admin/calendario', label: 'Calendário', icon: Calendar },
  { href: '/admin/identidade-visual', label: 'Identidade Visual', icon: Palette },
  { href: '/admin/videos', label: 'Edição de Vídeos', icon: Video },
  { href: '/admin/website', label: 'Website', icon: Monitor },
  { href: '/admin/trafego-pago', label: 'Tráfego Pago', icon: TrendingUp },
  { href: '/admin/assistente', label: 'Bk Assistant', icon: Bot },
  { href: '/admin/perfil', label: 'Meu Perfil', icon: UserCircle },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return (
    <aside
      className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-[rgba(255,255,255,0.08)]"
      style={{ background: 'rgba(10,22,40,0.95)' }}
    >
      <div className="flex flex-col items-center justify-center py-5 border-b border-[rgba(255,255,255,0.08)]">
        <Image
          src="/logo-full.jpg"
          alt="Bkoulf"
          width={180}
          height={72}
          className="object-contain"
          style={{ mixBlendMode: 'screen' }}
          priority
        />
        <span className="mt-2 text-[9px] font-bold tracking-[3px] uppercase text-[#D4A843]">
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none py-4 px-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[rgba(255,255,255,0.05)] text-[#D4A843] border border-[rgba(212,168,67,0.3)]'
                      : 'text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#D4A843]' : '')} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sair */}
      <div className="px-3 py-4 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[rgba(176,184,196,0.6)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
