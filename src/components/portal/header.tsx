'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  LogOut, User, Menu, X,
  LayoutDashboard, TrendingUp, Video, Palette, Globe,
  FolderOpen, Calendar, HeadphonesIcon, Zap, UserCircle, Bot,
} from 'lucide-react'
import { toast } from 'sonner'

interface HeaderProps {
  userName: string
  userEmail: string
}

const ferramentas = [
  { href: '/portal/dashboard',        label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/portal/calendario',       label: 'Calendário',        icon: Calendar },
  { href: '/portal/arquivos',         label: 'Arquivos',          icon: FolderOpen },
]

const servicos = [
  { href: '/portal/diagnostico-bk4', label: 'Método BK4',        icon: Zap },
  { href: '/portal/identidade-visual',label: 'Identidade Visual', icon: Palette },
  { href: '/portal/edicao-videos',   label: 'Edição de Vídeos',  icon: Video },
  { href: '/portal/website',         label: 'Website',            icon: Globe },
  { href: '/portal/trafego-pago',    label: 'Tráfego Pago',      icon: TrendingUp },
]

const ajuda = [
  { href: '/portal/assistente',      label: 'BK Assistant',     icon: Bot },
  { href: '/portal/suporte',         label: 'Suporte',           icon: HeadphonesIcon },
]

function NavSection({ title, items, pathname, onClose }: {
  title: string
  items: { href: string; label: string; icon: React.ElementType }[]
  pathname: string
  onClose: () => void
}) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 px-3 mb-1">{title}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[rgba(45,125,210,0.12)] text-[#2D7DD2] border border-[rgba(45,125,210,0.2)]'
                    : 'text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] border border-transparent'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#2D7DD2]' : '')} />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Header({ userName, userEmail }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Saiu com sucesso')
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <header
        className="lg:hidden h-14 flex items-center justify-between px-4 shrink-0"
        style={{
          background: 'rgba(5,10,20,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Hamburger (mobile only) */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#B0B8C4] hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src="/logo-full.jpg"
            alt="Bkoulf"
            width={90}
            height={36}
            className="object-contain"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>

        {/* Spacer desktop */}
        <div className="hidden lg:block" />

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-white leading-none">{userName}</p>
              <p className="text-xs text-[#B0B8C4] mt-0.5">{userEmail}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            style={{ background: 'rgba(10,16,28,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}
            className="text-white min-w-[180px]"
          >
            <DropdownMenuLabel className="text-[#B0B8C4] font-normal text-xs">
              {userEmail}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
            <DropdownMenuItem
              onClick={() => router.push('/portal/perfil')}
              className="hover:bg-[rgba(255,255,255,0.05)] cursor-pointer gap-2 text-[#B0B8C4] hover:text-white"
            >
              <User className="w-4 h-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-[rgba(255,255,255,0.05)] cursor-pointer gap-2 text-[rgba(176,184,196,0.7)] hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className="absolute left-0 top-0 h-full w-72 flex flex-col shadow-2xl"
            style={{
              background: 'rgba(5,10,20,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Logo + fechar */}
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Image
                src="/logo-full.jpg"
                alt="Bkoulf"
                width={110}
                height={44}
                className="object-contain"
                style={{ mixBlendMode: 'screen' }}
              />
              <button
                onClick={() => setMenuOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#B0B8C4] hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
              <NavSection title="Ferramentas" items={ferramentas} pathname={pathname} onClose={() => setMenuOpen(false)} />
              <NavSection title="Serviços"    items={servicos}    pathname={pathname} onClose={() => setMenuOpen(false)} />
              <NavSection title="Ajuda"       items={ajuda}       pathname={pathname} onClose={() => setMenuOpen(false)} />
            </nav>

            {/* Perfil + Sair */}
            <div
              className="px-3 py-4 space-y-0.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Link
                href="/portal/perfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all border border-transparent"
              >
                <UserCircle className="w-4 h-4 shrink-0" />
                Meu Perfil
              </Link>
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
