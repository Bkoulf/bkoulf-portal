'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight, UserCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_NAMES: Record<string, string> = {
  '/admin':                    'Visão Geral',
  '/admin/clientes':           'Clientes',
  '/admin/entregas':           'Entregas',
  '/admin/calendario':         'Calendário',
  '/admin/leads':              'Leads',
  '/admin/identidade-visual':  'Identidade Visual',
  '/admin/videos':             'Edição de Vídeos',
  '/admin/website':            'Website',
  '/admin/trafego-pago':       'Tráfego Pago',
  '/admin/relatorios':         'Relatórios',
  '/admin/diagnosticos':       'Diagnósticos',
  '/admin/assistente':         'BK Assistant',
  '/admin/suporte':            'Suporte',
  '/admin/perfil':             'Meu Perfil',
}

export function AdminTopbar({ userName }: { userName: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const pageName  = PAGE_NAMES[pathname] ?? 'Admin'
  const initials  = userName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'A'
  const firstName = userName.split(' ')[0] || 'Admin'

  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Saiu com sucesso')
    router.push('/login')
    router.refresh()
  }

  return (
    <header
      className="hidden lg:flex h-14 items-center justify-between px-6 shrink-0"
      style={{ background: '#0D0D0F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'rgba(176,184,196,0.35)' }}>Bkoulf</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(176,184,196,0.2)' }} />
        <span className="text-sm font-semibold text-white">{pageName}</span>
      </div>

      {/* User dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 hover:bg-[rgba(255,255,255,0.05)]"
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback
              className="text-[11px] font-bold"
              style={{ background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-[#B0B8C4] font-medium">{firstName}</span>
          <ChevronRight
            className="w-3 h-3 transition-transform duration-200"
            style={{ color: 'rgba(176,184,196,0.35)', transform: open ? 'rotate(270deg)' : 'rotate(90deg)' }}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl py-1.5 shadow-2xl"
            style={{ background: '#18181B', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(176,184,196,0.45)' }}>Administrador</p>
            </div>
            <div className="h-px mx-2 mb-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={() => { setOpen(false); router.push('/admin/perfil') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#B0B8C4] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left rounded-lg"
            >
              <UserCircle className="w-4 h-4 shrink-0" />
              Meu Perfil
            </button>
            <div className="h-px mx-2 my-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left rounded-lg"
              style={{ color: 'rgba(176,184,196,0.5)' }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
