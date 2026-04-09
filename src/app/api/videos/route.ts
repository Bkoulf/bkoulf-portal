import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clienteId = searchParams.get('clienteId')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, client_id').eq('id', user.id).single()

  // Clientes só veem seus próprios vídeos; admin pode buscar qualquer clienteId
  const id = profile?.role === 'admin' ? clienteId : profile?.client_id
  if (!id) return NextResponse.json({ error: 'No client' }, { status: 400 })

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('cliente_id', id)
    .order('criado_em', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { cliente_id, titulo, descricao, status, arquivo_url, tamanho_arquivo, resolucao, thumbnail_url } = body

  if (!cliente_id || !titulo) return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

  const { data, error } = await supabase.from('videos').insert({
    cliente_id,
    titulo,
    descricao: descricao || null,
    status: status ?? 'pendente',
    arquivo_url: arquivo_url || null,
    tamanho_arquivo: tamanho_arquivo ? Number(tamanho_arquivo) : null,
    resolucao: resolucao ?? '1080p',
    thumbnail_url: thumbnail_url || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
