import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const WHATSAPP_NUMBER = '5511999999999' // ← substitua pelo número real

function buildSystemPrompt(firstName: string, clientData: string): string {
  return `Você é a assistente virtual da Bkoulf, uma agência de marketing B2B especializada no Método BK4.

O cliente com quem você está conversando se chama **${firstName}**. Cumprimente-o pelo nome na primeira mensagem e use o nome naturalmente quando fizer sentido ao longo da conversa.

---

## REGRAS ABSOLUTAS — leia com atenção:

1. **NUNCA avalie, opine ou julgue a qualidade de nenhum serviço.**
   - PROIBIDO dizer: "seu tráfego está indo bem", "o vídeo ficou ótimo", "seus resultados são bons", "a campanha está performando", "o ROAS está excelente", etc.
   - Sua função é REPORTAR FATOS E NÚMEROS, nunca analisar se algo é bom ou ruim.
   - Se o cliente perguntar "meu tráfego está bom?", responda com os dados disponíveis e oriente-o a falar com a equipe para uma análise profissional: WhatsApp ${WHATSAPP_NUMBER}

2. **Só responda sobre a Bkoulf e seus serviços.**
   - Se a pergunta for fora do escopo (receitas, clima, política, código, outros negócios, etc.), diga educadamente que seu foco é exclusivamente auxiliar clientes Bkoulf.

3. **Quando o cliente precisar de atendimento humano** (análises, dúvidas de contrato, reclamações, alterações, avaliações de resultado), passe o WhatsApp: ${WHATSAPP_NUMBER}

4. **Seja concisa.** Respostas curtas e diretas. Evite textos longos.

5. **Tom:** Profissional e acolhedor. Use "você". Sem emojis em excesso.

6. **Não invente dados.** Use apenas os dados reais fornecidos abaixo. Se alguma informação não estiver disponível, diga que não está disponível no momento.

---

## Sobre a Bkoulf e o Método BK4

A Bkoulf entrega sistemas completos de crescimento em 4 etapas:

**1. Identidade Visual** — Logotipo, brandbook, paleta, tipografia, templates
**2. Audiovisual** — Edição profissional de vídeos, motion graphics, conteúdo para anúncios
**3. Presença Digital** — Website/landing page, SEO on-page, responsivo
**4. Conversão e Tráfego** — Meta Ads, Google Ads, criativos, relatórios mensais

O portal permite acompanhar: status dos serviços, aprovação de vídeos, brandbook, dados do website, métricas de tráfego, calendário de eventos, arquivos compartilhados e suporte.

---

## DADOS REAIS DO CLIENTE ${firstName.toUpperCase()} — use esses dados para responder sobre andamento:

${clientData}

---

WhatsApp da equipe Bkoulf: ${WHATSAPP_NUMBER}`
}

async function fetchClientData(clientId: string): Promise<string> {
  if (!clientId) return 'Nenhum dado disponível para este cliente.'

  const supabase = await createClient()
  const now = new Date().toISOString()

  const [
    { data: services },
    { data: videos },
    { data: contrato },
    { data: metricas },
    { data: identidade },
    { data: website },
    { data: eventos },
  ] = await Promise.all([
    supabase.from('services').select('type, status').eq('client_id', clientId),
    supabase.from('videos').select('titulo, status').eq('cliente_id', clientId),
    supabase.from('contratos_video').select('total_combinado, data_entrega').eq('cliente_id', clientId).maybeSingle(),
    supabase.from('trafego_pago_metricas').select('investimento, leads, cliques, impressoes, roas, periodo')
      .eq('client_id', clientId).order('periodo', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('identidade_visual').select('status, entregue_em').eq('cliente_id', clientId).maybeSingle(),
    supabase.from('websites').select('status, url, plataforma').eq('cliente_id', clientId).maybeSingle(),
    supabase.from('calendar_events').select('title, event_date, type')
      .eq('client_id', clientId).gte('event_date', now).order('event_date').limit(5),
  ])

  const lines: string[] = []

  // Serviços
  if (services && services.length > 0) {
    const serviceLabels: Record<string, string> = {
      identidade_visual: 'Identidade Visual',
      edicao_videos: 'Edição de Vídeos',
      website: 'Website',
      trafego_pago: 'Tráfego Pago',
    }
    const statusLabels: Record<string, string> = {
      ativo: 'Ativo', pausado: 'Pausado', pendente: 'Pendente', concluido: 'Concluído',
    }
    lines.push('### Serviços contratados:')
    services.forEach(s => {
      lines.push(`- ${serviceLabels[s.type] ?? s.type}: ${statusLabels[s.status] ?? s.status}`)
    })
  } else {
    lines.push('### Serviços: Nenhum serviço cadastrado.')
  }

  // Identidade Visual
  if (identidade) {
    lines.push('\n### Identidade Visual:')
    lines.push(`- Status: ${identidade.status === 'entregue' ? 'Entregue' : 'Em produção'}`)
    if (identidade.entregue_em) {
      lines.push(`- Entregue em: ${new Date(identidade.entregue_em).toLocaleDateString('pt-BR')}`)
    }
  }

  // Vídeos
  if (videos && videos.length > 0) {
    const pendentes  = videos.filter(v => v.status === 'pendente').length
    const emEdicao   = videos.filter(v => v.status === 'em_edicao').length
    const entregues  = videos.filter(v => v.status === 'entregue').length
    const aprovados  = videos.filter(v => v.status === 'aprovado').length
    const reprovados = videos.filter(v => v.status === 'reprovado').length
    lines.push('\n### Edição de Vídeos:')
    if (contrato) {
      lines.push(`- Total combinado em contrato: ${contrato.total_combinado} vídeos`)
      if (contrato.data_entrega) lines.push(`- Prazo de entrega: ${new Date(contrato.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR')}`)
    }
    lines.push(`- Pendentes (aguardando produção): ${pendentes}`)
    lines.push(`- Em edição: ${emEdicao}`)
    lines.push(`- Entregues (aguardando aprovação do cliente): ${entregues}`)
    lines.push(`- Aprovados pelo cliente: ${aprovados}`)
    lines.push(`- Reprovados pelo cliente: ${reprovados}`)
  }

  // Website
  if (website) {
    const statusLabel: Record<string, string> = {
      em_desenvolvimento: 'Em desenvolvimento',
      em_revisao: 'Em revisão',
      no_ar: 'No ar',
      pausado: 'Pausado',
    }
    lines.push('\n### Website:')
    lines.push(`- Status: ${statusLabel[website.status] ?? website.status}`)
    if (website.url) lines.push(`- URL: ${website.url}`)
    if (website.plataforma) lines.push(`- Plataforma: ${website.plataforma}`)
  }

  // Tráfego Pago
  if (metricas) {
    lines.push('\n### Tráfego Pago — último período disponível:')
    lines.push(`- Período: ${metricas.periodo}`)
    lines.push(`- Investimento: R$ ${Number(metricas.investimento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
    lines.push(`- Leads gerados: ${metricas.leads}`)
    lines.push(`- Cliques: ${metricas.cliques}`)
    lines.push(`- Impressões: ${metricas.impressoes}`)
    lines.push(`- ROAS: ${Number(metricas.roas).toFixed(2)}`)
    const cpl = metricas.leads > 0 ? Number(metricas.investimento) / metricas.leads : 0
    lines.push(`- CPL (custo por lead): R$ ${cpl.toFixed(2)}`)
    lines.push('(Não avalie estes números. Apenas reporte-os quando solicitado.)')
  }

  // Próximos eventos
  if (eventos && eventos.length > 0) {
    const typeLabels: Record<string, string> = {
      reuniao: 'Reunião', gravacao: 'Gravação', entrega: 'Entrega',
      revisao: 'Revisão', publicacao: 'Publicação', outro: 'Outro',
    }
    lines.push('\n### Próximos eventos na agenda:')
    eventos.forEach(e => {
      const d = new Date(e.event_date)
      lines.push(`- ${typeLabels[e.type] ?? e.type}: "${e.title}" — ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`)
    })
  } else {
    lines.push('\n### Agenda: Nenhum evento próximo agendado.')
  }

  return lines.join('\n')
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('client_id, full_name').eq('id', user.id).single()

    const { messages, firstName } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages', { status: 400 })
    }

    const name = firstName || profile?.full_name?.split(' ')[0] || 'Cliente'
    const clientData = await fetchClientData(profile?.client_id ?? '')
    const systemPrompt = buildSystemPrompt(name, clientData)

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 700,
      system: systemPrompt,
      messages: messages.slice(-10),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[ai-chat]', err)
    return new Response('Erro interno', { status: 500 })
  }
}
