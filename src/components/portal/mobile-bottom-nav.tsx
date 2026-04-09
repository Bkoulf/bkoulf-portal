'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FolderOpen, Calendar, Zap, Bot } from 'lucide-react'

const items = [
  { href: '/portal/dashboard',        label: 'Início',     icon: LayoutDashboard },
  { href: '/portal/calendario',       label: 'Agenda',     icon: Calendar },
  { href: '/portal/diagnostico-bk4', label: 'BK4',        icon: Zap },
  { href: '/portal/arquivos',         label: 'Arquivos',   icon: FolderOpen },
  { href: '/portal/assistente',       label: 'BK Assistant', icon: Bot },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(5,10,20,0.97)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch h-16">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-full transition-all duration-200',
                  isActive ? 'text-[#2D7DD2]' : 'text-[rgba(176,184,196,0.5)]'
                )}
              >
                <div className={cn(
                  'flex items-center justify-center w-8 h-6 rounded-lg transition-all duration-200',
                  isActive && 'bg-[rgba(45,125,210,0.15)]'
                )}>
                  <Icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'scale-110')} />
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
