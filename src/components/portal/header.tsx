'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
                  'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[rgba(45,125,210,0.12)] text-white'
                    : 'text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2D7DD2] rounded-r-full" />
                )}
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#2D7DD2]' : 'opacity-60')} />
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
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('touchstart', handleOutside)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('touchstart', handleOutside)
    }
  }, [])

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
          background: '#071525',
          borderBottom: '1px solid rgba(45,125,210,0.18)',
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
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 outline-none"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-[rgba(255,255,255,0.1)] text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {profileOpen && (
            <div
              className="fixed right-4 z-50 min-w-[180px] rounded-lg p-1 shadow-xl"
              style={{ top: '3.75rem', background: 'rgba(10,16,28,0.98)', border: '1px solid rgba(45,125,210,0.18)' }}
            >
              <p className="px-3 py-2 text-xs text-[#B0B8C4]">{userEmail}</p>
              <div className="h-px bg-[rgba(45,125,210,0.18)] mx-1 my-1" />
              <button
                onClick={() => { setProfileOpen(false); router.push('/portal/perfil') }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </button>
              <div className="h-px bg-[rgba(45,125,210,0.18)] mx-1 my-1" />
              <button
                onClick={() => { setProfileOpen(false); handleLogout() }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[rgba(176,184,196,0.7)] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
        </div>
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
              background: 'rgba(7,21,37,0.99)',
              borderRight: '1px solid rgba(45,125,210,0.18)',
            }}
          >
            {/* Logo + fechar */}
            <div
              className="flex items-center justify-between px-4 py-4"
              style={{ borderBottom: '1px solid rgba(45,125,210,0.18)' }}
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
              style={{ borderTop: '1px solid rgba(45,125,210,0.18)' }}
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
