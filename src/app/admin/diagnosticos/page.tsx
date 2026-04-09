import { createClient } from '@/lib/supabase/server'
import { DiagnosticoManager } from '@/components/admin/diagnostico-manager'

export default async function AdminDiagnosticosPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: diagnostics }] = await Promise.all([
    supabase.from('clients').select('id, name').eq('status', 'ativo').order('name'),
    supabase.from('bk4_diagnostics').select('*').order('created_at', { ascending: false }),
  ])

  return <DiagnosticoManager clients={clients ?? []} diagnostics={diagnostics ?? []} />
}
