import { createClient } from '@/lib/supabase/server'
import { VideosManager } from '@/components/admin/videos-manager'

export default async function AdminVideosPage() {
  const supabase = await createClient()

  // Busca clientes com serviço de edição de vídeos
  const { data: services } = await supabase
    .from('services')
    .select('client_id, clients(id, name, company)')
    .eq('type', 'edicao_videos')

  const raw = (services ?? []).map(s => {
    const c = s.clients as unknown as { id: string; name: string; company?: string } | null
    return c ? { id: c.id, name: c.name, company: c.company ?? undefined } : null
  }).filter(Boolean) as { id: string; name: string; company?: string }[]

  const clients = raw.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i)

  return <VideosManager clients={clients} />
}
