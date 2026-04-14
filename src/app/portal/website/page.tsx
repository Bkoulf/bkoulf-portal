import { createClient } from '@/lib/supabase/server'
import { WebsiteClient } from '@/components/portal/website-client'
import { ContactServiceBanner } from '@/components/portal/contact-service-banner'
import { Card, CardContent } from '@/components/ui/card'
import { Globe } from 'lucide-react'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Website',
}


export default async function WebsitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('client_id').eq('id', user!.id).single()
  const clienteId = profile?.client_id ?? ''

  const { data: service } = await supabase
    .from('services').select('*').eq('client_id', clienteId).eq('type', 'website').single()

  if (!service) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-zinc-400" />
          <h1 className="text-2xl font-bold text-white">Website</h1>
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-sm">Este serviço não está ativo no seu plano.</p>
          </CardContent>
        </Card>
        <ContactServiceBanner service="Website" contracted={false} />
      </div>
    )
  }

  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('cliente_id', clienteId)
    .single()

  return <WebsiteClient website={website ?? null} />
}
