import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { supabase, error: null }
}

export async function GET(request: Request) {
  const { supabase, error } = await verifyAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const periodo = searchParams.get('periodo')

  if (!clientId || !periodo) {
    return NextResponse.json({ error: 'client_id e periodo são obrigatórios' }, { status: 400 })
  }

  const [
    { data: metricas },
    { data: campanhas },
    { data: criativos },
  ] = await Promise.all([
    supabase.from('trafego_pago_metricas').select('*').eq('client_id', clientId).eq('periodo', periodo).single(),
    supabase.from('trafego_pago_campanhas').select('*').eq('client_id', clientId).eq('periodo', periodo).order('created_at', { ascending: true }),
    supabase.from('trafego_pago_criativos').select('*').eq('client_id', clientId).eq('periodo', periodo).order('leads', { ascending: false }),
  ])

  return NextResponse.json({
    metricas: metricas ? {
      ...metricas,
      investimento: Number(metricas.investimento),
      roas: Number(metricas.roas),
    } : null,
    campanhas: (campanhas ?? []).map(c => ({ ...c, investimento: Number(c.investimento) })),
    criativos: (criativos ?? []).map(c => ({ ...c, ctr: Number(c.ctr) })),
  })
}

export async function POST(request: Request) {
  const { supabase, error } = await verifyAdmin()
  if (error) return error

  const body = await request.json()
  const { client_id, periodo, metricas, campanhas, criativos } = body

  if (!client_id || !periodo) {
    return NextResponse.json({ error: 'client_id e periodo são obrigatórios' }, { status: 400 })
  }

  // Upsert métricas
  if (metricas) {
    const { error: metError } = await supabase.from('trafego_pago_metricas').upsert({
      client_id,
      periodo,
      investimento: metricas.investimento ?? 0,
      leads: metricas.leads ?? 0,
      cliques: metricas.cliques ?? 0,
      impressoes: metricas.impressoes ?? 0,
      roas: metricas.roas ?? 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id,periodo' })

    if (metError) return NextResponse.json({ error: metError.message }, { status: 500 })
  }

  // Substituir campanhas do período
  if (campanhas !== undefined) {
    await supabase.from('trafego_pago_campanhas').delete().eq('client_id', client_id).eq('periodo', periodo)
    if (campanhas.length > 0) {
      const { error: campError } = await supabase.from('trafego_pago_campanhas').insert(
        campanhas.map((c: Record<string, unknown>) => ({
          client_id,
          periodo,
          nome: c.nome,
          status: c.status ?? 'ativo',
          investimento: c.investimento ?? 0,
          leads: c.leads ?? 0,
          cliques: c.cliques ?? 0,
        }))
      )
      if (campError) return NextResponse.json({ error: campError.message }, { status: 500 })
    }
  }

  // Substituir criativos do período
  if (criativos !== undefined) {
    await supabase.from('trafego_pago_criativos').delete().eq('client_id', client_id).eq('periodo', periodo)
    if (criativos.length > 0) {
      const { error: criError } = await supabase.from('trafego_pago_criativos').insert(
        criativos.map((c: Record<string, unknown>) => ({
          client_id,
          periodo,
          nome: c.nome,
          tipo: c.tipo ?? 'imagem',
          impressoes: c.impressoes ?? 0,
          cliques: c.cliques ?? 0,
          leads: c.leads ?? 0,
          ctr: c.ctr ?? 0,
          thumbnail_url: c.thumbnail_url ?? null,
        }))
      )
      if (criError) return NextResponse.json({ error: criError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
