import { createClient } from '@/lib/supabase/server'
import { ClientesTable } from '@/components/admin/clientes-table'

export default async function AdminClientesPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, client_id, role')
    .eq('role', 'client')

  return <ClientesTable clients={clients ?? []} profiles={profiles ?? []} />
}
