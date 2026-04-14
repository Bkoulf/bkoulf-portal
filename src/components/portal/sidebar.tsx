'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  LayoutDashboard,
  TrendingUp,
  Video,
  Palette,
  Globe,
  FolderOpen,
  HeadphonesIcon,
  Zap,
  UserCircle,
  LogOut,
  Calendar,
  Bot,
} from 'lucide-react'

const ferramentas = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/calendario', label: 'Calendário', icon: Calendar },
  { href: '/portal/arquivos', label: 'Arquivos', icon: FolderOpen },
]

const servicos = [
  { href: '/portal/diagnostico-bk4', label: 'Método BK4', icon: Zap },
  { href: '/portal/identidade-visual', label: 'Identidade Visual', icon: Palette },
  { href: '/portal/edicao-videos', label: 'Edição de Vídeos', icon: Video },
  { href: '/portal/website', label: 'Website', icon: Globe },
  { href: '/portal/trafego-pago', label: 'Tráfego Pago', icon: TrendingUp },
]

const outros = [
  { href: '/portal/assistente', label: 'BK Assistant', icon: Bot },
  { href: '/portal/suporte', label: 'Suporte', icon: HeadphonesIcon },
]

const bottomItems = [
  { href: '/portal/perfil', label: 'Meu Perfil', icon: UserCircle },
]

function NavLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: React.ElementType; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-[rgba(45,125,210,0.12)] text-white'
          : 'text-[#7AAAC8] hover:text-[#EBF4FF] hover:bg-[rgba(45,125,210,0.08)]'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#2D7DD2] rounded-r-full" />
      )}
      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#2D7DD2]' : 'opacity-60')} />
      {label}
    </Link>
  )
}

export function Sidebar() {
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
    <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 border-r border-[rgba(45,125,210,0.15)]"
      style={{ background: '#071525' }}>
      <div className="flex items-center justify-center py-5 border-b border-[rgba(45,125,210,0.15)]">
        <Image
          src="/logo-full.jpg"
          alt="Bkoulf"
          width={180}
          height={72}
          className="object-contain"
          style={{ mixBlendMode: 'screen' }}
          priority
        />
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
            {outros.map((item) => (
              <li key={item.href}>
                <NavLink {...item} isActive={pathname === item.href} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-[rgba(45,125,210,0.15)] space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink key={item.href} {...item} isActive={pathname === item.href} />
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full transition-all duration-150 hover:bg-[rgba(45,125,210,0.08)]"
          style={{ color: 'rgba(176,184,196,0.45)' }}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  )
}
