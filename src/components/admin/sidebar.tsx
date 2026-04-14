'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
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
  Crosshair,
  HeadphonesIcon,
} from 'lucide-react'

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

const bottomItems = [
  { href: '/admin/perfil', label: 'Meu Perfil', icon: UserCircle },
]

function NavLink({ href, label, icon: Icon, isActive }: {
  href: string; label: string; icon: React.ElementType; isActive: boolean
}) {
  return (
    <Link
      href={href}
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
      {label}
    </Link>
  )
}

export function AdminSidebar() {
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
    <aside
      className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-[rgba(255,255,255,0.08)]"
      style={{ background: '#0D0D0F' }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <Image
          src="/logo-full.jpg"
          alt="Bkoulf"
          width={130}
          height={52}
          className="object-contain"
          style={{ mixBlendMode: 'screen' }}
          priority
        />
        <span
          className="text-[9px] font-bold tracking-[3px] uppercase px-2 py-1 rounded-md"
          style={{
            color: '#D4A843',
            background: 'rgba(212,168,67,0.1)',
            border: '1px solid rgba(212,168,67,0.2)',
          }}
        >
          Admin
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none py-4 px-3 space-y-5">
        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-white/30 uppercase tracking-[3px]">
            Ferramentas
          </p>
          <ul className="space-y-0.5">
            {ferramentas.map((item) => (
              <li key={item.href}>
                <NavLink {...item} isActive={pathname === item.href} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-white/30 uppercase tracking-[3px]">
            Serviços
          </p>
          <ul className="space-y-0.5">
            {servicos.map((item) => (
              <li key={item.href}>
                <NavLink {...item} isActive={pathname === item.href} />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="px-3 mb-2 text-[9px] font-bold text-white/30 uppercase tracking-[3px]">
            Ajuda
          </p>
          <ul className="space-y-0.5">
            {ajuda.map((item) => (
              <li key={item.href}>
                <NavLink {...item} isActive={pathname === item.href} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-[rgba(255,255,255,0.08)] space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} isActive={pathname === item.href} />
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-150 hover:bg-[rgba(255,255,255,0.05)]"
          style={{ color: 'rgba(176,184,196,0.45)' }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
