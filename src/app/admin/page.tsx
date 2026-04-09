import { createClient } from '@/lib/supabase/server'
import { TasksBoard } from '@/components/admin/tasks-board'

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: tarefas }] = await Promise.all([
    supabase.from('clients').select('id, name, company').eq('status', 'ativo').order('name'),
    supabase.from('tarefas').select('id, client_id, category, title, status, due_date, created_at').order('created_at', { ascending: false }),
  ])

  return (
    <TasksBoard
      clients={clients ?? []}
      tarefas={tarefas ?? []}
    />
  )
}
