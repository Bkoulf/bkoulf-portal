import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Webhook secret para validar que a requisição vem do n8n ou da Evolution API
const WEBHOOK_SECRET = process.env.LEADS_WEBHOOK_SECRET

// Mapeia eventos da Evolution API para status da tabela leads
const EVOLUTION_EVENT_TO_STATUS: Record<string, string> = {
  // Eventos de entrega
  'message.delivery': 'entregue',
  'messages.update':  'entregue',
  // Eventos de leitura
  'message.read':     'lido',
  // Quando o lead responde
  'messages.upsert':  'respondeu',
}

export async function POST(req: NextRequest) {
  // Valida secret via header
  const secret = req.headers.get('x-webhook-secret')
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createClient()

  // ─── Formato 1: chamada do n8n (atualização direta de status) ───
  // Body: { google_place_id, status, telefone? }
  if (body.google_place_id && body.status) {
    const statusValidos = ['capturado', 'mensagem_enviada', 'entregue', 'lido', 'respondeu', 'bloqueou', 'opt_out']
    if (!statusValidos.includes(body.status as string)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const update: Record<string, unknown> = { status: body.status }
    if (body.status === 'mensagem_enviada') {
      update.enviado_em = new Date().toISOString()
      if (body.mensagem_enviada) update.mensagem_enviada = body.mensagem_enviada
    }
    if (body.telefone) update.telefone = body.telefone
    if (typeof body.whatsapp_valido === 'boolean') update.whatsapp_valido = body.whatsapp_valido

    const { error } = await supabase
      .from('leads')
      .update(update)
      .eq('google_place_id', body.google_place_id as string)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // ─── Formato 2: evento da Evolution API ───
  // Body: { event, data: { key: { remoteJid }, message? } }
  if (body.event && body.data) {
    const event = body.event as string
    const data = body.data as Record<string, unknown>
    const key = data.key as Record<string, unknown> | undefined

    if (!key?.remoteJid) {
      return NextResponse.json({ ok: true, skipped: 'no remoteJid' })
    }

    // remoteJid format: "5511999999999@s.whatsapp.net"
    const telefone = (key.remoteJid as string).replace('@s.whatsapp.net', '').replace('@c.us', '')
    const newStatus = EVOLUTION_EVENT_TO_STATUS[event]

    if (!newStatus || !telefone) {
      return NextResponse.json({ ok: true, skipped: 'event not mapped' })
    }

    // Só atualiza se o novo status representa progresso (não volta atrás)
    const statusOrder = ['capturado', 'mensagem_enviada', 'entregue', 'lido', 'respondeu']
    const { data: lead } = await supabase
      .from('leads')
      .select('id, status')
      .eq('telefone', telefone)
      .single()

    if (!lead) return NextResponse.json({ ok: true, skipped: 'lead not found' })

    const currentIdx = statusOrder.indexOf(lead.status)
    const newIdx = statusOrder.indexOf(newStatus)

    // Só avança, nunca retrocede (exceto bloqueio/opt_out que são terminais)
    if (newIdx <= currentIdx && !['bloqueou', 'opt_out'].includes(newStatus)) {
      return NextResponse.json({ ok: true, skipped: 'status would not advance' })
    }

    await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', lead.id)

    return NextResponse.json({ ok: true, updated: { id: lead.id, status: newStatus } })
  }

  return NextResponse.json({ ok: true, skipped: 'no matching format' })
}
