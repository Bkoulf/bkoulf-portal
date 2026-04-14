import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopbar } from '@/components/admin/topbar'
import { AdminMobileHeader } from '@/components/admin/mobile-header'
import { AdminMobileBottomNav } from '@/components/admin/mobile-bottom-nav'

export const metadata: Metadata = {
  title: {
    template: '%s | Bkoulf Admin',
    default: 'Admin | Bkoulf',
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/portal/dashboard')

  const displayName = profile?.full_name ?? profile?.email ?? ''

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: '#0A0A0F' }}>
      {/* Sidebar desktop */}
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminMobileHeader userName={displayName} />
        <AdminTopbar userName={displayName} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <AdminMobileBottomNav />
    </div>
  )
}
