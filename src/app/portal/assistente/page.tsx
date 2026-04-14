import { createClient } from '@/lib/supabase/server'
import { AiChatClient } from '@/components/portal/ai-chat-client'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'BK Assistant',
}


export default async function AssistentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Cliente'

  return <AiChatClient firstName={firstName} />
}
