import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clienteId = req.nextUrl.searchParams.get('clienteId')
  if (!clienteId) return NextResponse.json({ error: 'clienteId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('identidade_visual')
    .select('*')
    .eq('cliente_id', clienteId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? null)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { cliente_id, arquivo_url, nome_arquivo } = await req.json()
  if (!cliente_id) return NextResponse.json({ error: 'cliente_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('identidade_visual')
    .upsert({
      cliente_id,
      arquivo_url,
      nome_arquivo,
      status: 'entregue',
      entregue_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'cliente_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
