import { createClient } from '@/lib/supabase/server'
import { AdminAiChatClient } from '@/components/admin/ai-chat-client'

export default async function AdminAssistentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', user!.id).single()

  const adminName = profile?.full_name?.split(' ')[0] ?? 'Admin'

  return <AdminAiChatClient adminName={adminName} />
}
