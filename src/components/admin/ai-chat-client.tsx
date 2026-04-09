'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, Loader2, User, RotateCcw, CalendarCheck, CheckCircle2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  eventCreated?: boolean
}

const SUGGESTIONS = [
  'Marcar reunião dia 20/07/2026 às 10h',
  'Agendar gravação para semana que vem',
  'Ver próximos eventos de um cliente',
  'Criar entrega para o dia 15/07',
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export function AdminAiChatClient({ adminName }: { adminName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Erro na resposta')
      const data = await res.json()

      const eventCreated = data.toolResults?.some((t: { tool: string }) => t.tool === 'criar_evento')

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.text,
        eventCreated,
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Ocorreu um erro. Tente novamente.',
      }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-10rem)]">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#D4A843]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Bk Assistant</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-pulse" />
              <p className="text-[rgba(176,184,196,0.6)] text-xs">Online · Assistente de operações — {adminName}</p>
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-[rgba(176,184,196,0.6)] hover:text-[#D0D8E4] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Nova conversa
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-2xl flex flex-col overflow-hidden">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full py-10 gap-6">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center">
                <Bot className="w-8 h-8 text-[#D4A843]" />
              </div>
              <div className="text-center max-w-sm">
                <p className="text-white font-semibold text-base">Olá, {adminName}!</p>
                <p className="text-[rgba(176,184,196,0.6)] text-sm mt-1">
                  Posso agendar eventos no calendário dos seus clientes, listar compromissos e muito mais. O que deseja fazer?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-2 rounded-full bg-[#1C2333] border border-[rgba(255,255,255,0.12)] text-[#D0D8E4] hover:text-white hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#D4A843]" />
                  </div>
                )}
                <div className="max-w-[80%] space-y-2">
                  {/* Event created badge */}
                  {msg.eventCreated && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#D4A843] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2">
                      <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                      Evento criado no calendário do cliente
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#D4A843] text-[#050A14] rounded-tr-sm font-medium'
                      : 'bg-[#1C2333] text-zinc-100 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1C2333] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#B0B8C4]" />
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.05)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#D4A843]" />
              </div>
              <div className="bg-[#1C2333] rounded-2xl rounded-tl-sm px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: marcar reunião dia 20/07 às 10h com o cliente X..."
              disabled={loading}
              rows={1}
              className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] resize-none min-h-[44px] max-h-[120px] flex-1"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="bg-[#D4A843] hover:bg-[#D4A843] text-[#050A14] font-bold h-11 w-11 p-0 shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[rgba(176,184,196,0.4)] text-xs mt-2 text-center">Assistente de operações — cria e gerencia eventos no calendário dos clientes</p>
        </div>
      </div>
    </div>
  )
}
