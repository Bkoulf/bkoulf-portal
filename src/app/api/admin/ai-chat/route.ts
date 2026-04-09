import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EVENT_TYPES = {
  reuniao:    'Reunião',
  gravacao:   'Gravação',
  entrega:    'Entrega',
  revisao:    'Revisão',
  publicacao: 'Publicação',
  outro:      'Outro',
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'criar_evento',
    description: 'Cria um evento no calendário de um cliente. Use esta ferramenta somente quando tiver TODAS as informações: cliente, título, data/hora, tipo. Se faltar qualquer dado, pergunte antes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id:   { type: 'string', description: 'UUID do cliente' },
        title:       { type: 'string', description: 'Título do evento' },
        event_date:  { type: 'string', description: 'Data e hora no formato ISO 8601, ex: 2026-07-13T10:00:00' },
        type:        { type: 'string', enum: Object.keys(EVENT_TYPES), description: 'Tipo do evento' },
        description: { type: 'string', description: 'Descrição ou observação opcional' },
      },
      required: ['client_id', 'title', 'event_date', 'type'],
    },
  },
  {
    name: 'listar_eventos_cliente',
    description: 'Lista os próximos eventos de um cliente específico.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: { type: 'string', description: 'UUID do cliente' },
      },
      required: ['client_id'],
    },
  },
]

async function executeTool(name: string, input: Record<string, string>, supabase: Awaited<ReturnType<typeof createClient>>) {
  if (name === 'criar_evento') {
    const { client_id, title, event_date, type, description } = input
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ client_id, title, event_date, type, description: description || null })
      .select()
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, event: data, message: `Evento "${title}" criado com sucesso para ${new Date(event_date).toLocaleString('pt-BR')}.` }
  }

  if (name === 'listar_eventos_cliente') {
    const { data } = await supabase
      .from('calendar_events')
      .select('title, event_date, type')
      .eq('client_id', input.client_id)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      .limit(10)

    if (!data || data.length === 0) return { eventos: [], message: 'Nenhum evento futuro para este cliente.' }
    return {
      eventos: data.map(e => ({
        titulo: e.title,
        data: new Date(e.event_date).toLocaleString('pt-BR'),
        tipo: EVENT_TYPES[e.type as keyof typeof EVENT_TYPES] ?? e.type,
      })),
    }
  }

  return { error: 'Ferramenta desconhecida' }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).single()
    if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })

    const { messages } = await req.json()
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages', { status: 400 })
    }

    // Busca clientes ativos para o contexto
    const { data: clients } = await supabase
      .from('clients').select('id, name, company').eq('status', 'ativo').order('name')

    const clientList = (clients ?? [])
      .map(c => `- ${c.name}${c.company ? ` (${c.company})` : ''} → ID: ${c.id}`)
      .join('\n')

    const systemPrompt = `Você é o assistente de operações da Bkoulf, disponível exclusivamente para o administrador.

Seu nome é **Bk Assistant** e você ajuda o admin a gerenciar clientes, principalmente agendando eventos no calendário.

## Clientes ativos na plataforma:
${clientList || 'Nenhum cliente cadastrado ainda.'}

## Tipos de evento disponíveis:
${Object.entries(EVENT_TYPES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

## Como agir:

**Para criar um evento:**
1. Se o admin mencionar uma data mas não especificar outros dados, pergunte um por um: qual cliente, qual tipo de evento, qual título, qual horário (se não informado).
2. Só chame a ferramenta \`criar_evento\` quando tiver TODOS os dados obrigatórios.
3. Para o campo \`client_id\`, use o UUID exato da lista acima.
4. Confirme antes de criar: mostre um resumo e peça confirmação do admin.

**Para listar eventos:**
- Use \`listar_eventos_cliente\` quando o admin quiser ver os eventos de um cliente.

**Outras tarefas:**
- Responda perguntas sobre os clientes cadastrados e seus dados.
- Se não souber fazer algo, diga claramente.

**Tom:** Direto, eficiente, profissional. Você está falando com o admin, não com o cliente.`

    // Executa o loop de tool use
    let currentMessages = messages.slice(-20) as Anthropic.MessageParam[]
    let finalText = ''
    let toolResults: { tool: string; result: unknown }[] = []

    // Primeira chamada
    let response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      tools: TOOLS,
      messages: currentMessages,
    })

    // Loop de tool use (máx 3 iterações)
    let iterations = 0
    while (response.stop_reason === 'tool_use' && iterations < 3) {
      iterations++
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResultContents: Anthropic.ToolResultBlockParam[] = []

      for (const block of toolUseBlocks) {
        const result = await executeTool(block.name, block.input as Record<string, string>, supabase)
        toolResults.push({ tool: block.name, result })
        toolResultContents.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        })
      }

      // Adiciona a resposta do assistente e os resultados das ferramentas
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResultContents },
      ]

      response = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        tools: TOOLS,
        messages: currentMessages,
      })
    }

    // Extrai texto final
    finalText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    return Response.json({
      text: finalText,
      toolResults,
    })
  } catch (err) {
    console.error('[admin/ai-chat]', err)
    return new Response('Erro interno', { status: 500 })
  }
}
