'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight, UserCircle, LogOut } from 'lucide-react'
import { toast } from 'sonner'

const PAGE_NAMES: Record<string, string> = {
  '/portal/dashboard':         'Dashboard',
  '/portal/calendario':        'Calendário',
  '/portal/arquivos':          'Arquivos',
  '/portal/diagnostico-bk4':  'Método BK4',
  '/portal/identidade-visual': 'Identidade Visual',
  '/portal/edicao-videos':     'Edição de Vídeos',
  '/portal/website':           'Website',
  '/portal/trafego-pago':      'Tráfego Pago',
  '/portal/relatorios':        'Relatórios',
  '/portal/assistente':        'BK Assistant',
  '/portal/suporte':           'Suporte',
  '/portal/perfil':            'Meu Perfil',
}

export function PortalTopbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const pageName  = PAGE_NAMES[pathname] ?? 'Portal'
  const initials  = userName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?'
  const firstName = userName.split(' ')[0] || 'Usuário'

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
      style={{ background: '#071525', borderBottom: '1px solid rgba(45,125,210,0.12)' }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: 'rgba(125,196,255,0.3)' }}>Bkoulf</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'rgba(125,196,255,0.2)' }} />
        <span className="text-sm font-semibold text-white">{pageName}</span>
      </div>

      {/* User dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 hover:bg-[rgba(45,125,210,0.08)]"
        >
          <Avatar className="w-7 h-7">
            <AvatarFallback
              className="text-[11px] font-bold"
              style={{ background: 'rgba(45,125,210,0.15)', color: '#7DC4FF' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium" style={{ color: 'rgba(176,184,196,0.8)' }}>{firstName}</span>
          <ChevronRight
            className="w-3 h-3 transition-transform duration-200"
            style={{ color: 'rgba(125,196,255,0.3)', transform: open ? 'rotate(270deg)' : 'rotate(90deg)' }}
          />
        </button>

        {open && (
          <div
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl py-1.5 shadow-2xl"
            style={{ background: '#0B1D2E', border: '1px solid rgba(45,125,210,0.18)' }}
          >
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(125,196,255,0.4)' }}>{userEmail}</p>
            </div>
            <div className="h-px mx-2 mb-1" style={{ background: 'rgba(45,125,210,0.15)' }} />
            <button
              onClick={() => { setOpen(false); router.push('/portal/perfil') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:text-white hover:bg-[rgba(45,125,210,0.08)] transition-colors text-left rounded-lg"
              style={{ color: 'rgba(176,184,196,0.7)' }}
            >
              <UserCircle className="w-4 h-4 shrink-0" />
              Meu Perfil
            </button>
            <div className="h-px mx-2 my-1" style={{ background: 'rgba(45,125,210,0.15)' }} />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-left rounded-lg"
              style={{ color: 'rgba(176,184,196,0.45)' }}
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
