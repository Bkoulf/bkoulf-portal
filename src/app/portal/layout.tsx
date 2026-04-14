import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/portal/sidebar'
import { Header } from '@/components/portal/header'
import { PortalTopbar } from '@/components/portal/topbar'
import { MobileBottomNav } from '@/components/portal/mobile-bottom-nav'
import { AlertTriangle } from 'lucide-react'

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca profile + status do client em query única com join
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, client_id, role, clients(status)')
    .eq('id', user.id)
    .single()

  const clientStatus = (profile?.clients as unknown as { status: string } | null)?.status

  if (profile?.role === 'client' && profile?.client_id) {
    if (clientStatus === 'inativo') {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Conta suspensa</h1>
            <p className="text-zinc-400 leading-relaxed">
              Seu acesso foi temporariamente suspenso por pendência financeira.
              Entre em contato com a equipe Bkoulf para regularizar sua situação.
            </p>
            <div className="mt-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
              <p className="text-zinc-500 text-sm">Precisa de ajuda?</p>
              <p className="text-white text-sm font-medium mt-1">contato@bkoulf.com.br</p>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="flex h-dvh bg-zinc-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={profile?.full_name ?? user.email ?? 'Usuário'}
          userEmail={profile?.email ?? user.email ?? ''}
        />
        <PortalTopbar
          userName={profile?.full_name ?? user.email ?? 'Usuário'}
          userEmail={profile?.email ?? user.email ?? ''}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
