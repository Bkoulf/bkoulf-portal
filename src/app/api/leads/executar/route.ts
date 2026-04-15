import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// URL do webhook no n8n que dispara o workflow de busca de leads
const N8N_WEBHOOK_URL = process.env.N8N_LEADS_WEBHOOK_URL

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Verifica se é admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso restrito a admins' }, { status: 403 })
  }

  // Lê config atual para passar para o n8n
  const { data: config } = await supabase
    .from('leads_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json({
      error: 'N8N_LEADS_WEBHOOK_URL não configurada no .env.local',
    }, { status: 503 })
  }

  let body: { cidade?: string } = {}
  try {
    body = await req.json()
  } catch {
    // body opcional
  }

  // Dispara o n8n com a config atual
  const payload = {
    cidades: body.cidade ? [body.cidade] : (config?.cidades ?? []),
    raio_km: config?.raio_km ?? 30,
    limite_diario: config?.limite_diario ?? 30,
    disparado_por: 'admin_manual',
    disparado_em: new Date().toISOString(),
  }

  let n8nResponse: Response
  try {
    n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    return NextResponse.json({
      error: `Não foi possível conectar ao n8n: ${err instanceof Error ? err.message : String(err)}`,
    }, { status: 502 })
  }

  if (!n8nResponse.ok) {
    return NextResponse.json({
      error: `n8n retornou ${n8nResponse.status}`,
    }, { status: 502 })
  }

  return NextResponse.json({ ok: true, payload })
}
