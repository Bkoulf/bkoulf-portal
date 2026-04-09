import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clienteId = searchParams.get('clienteId')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()
  const id = profile?.role === 'admin' ? clienteId : profile?.client_id
  if (!id) return NextResponse.json({ error: 'No client' }, { status: 400 })

  const { data } = await supabase.from('contratos_video').select('*').eq('cliente_id', id).single()
  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { cliente_id, total_combinado, data_entrega } = body

  if (!cliente_id) return NextResponse.json({ error: 'cliente_id obrigatório' }, { status: 400 })

  const { data, error } = await supabase.from('contratos_video').upsert({
    cliente_id,
    total_combinado: total_combinado ?? 0,
    data_entrega: data_entrega || null,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'cliente_id' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
