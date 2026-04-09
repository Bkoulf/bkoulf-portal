'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, Loader2, User, RotateCcw } from 'lucide-react'
import { BkMascot } from './bk-mascot'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Como aprovar um vídeo entregue?',
  'O que é o Método BK4?',
  'Como acompanhar meu tráfego pago?',
  'Onde encontro meu brandbook?',
  'Como entrar em contato com a equipe?',
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

export function AiChatClient({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading || streaming) return

    const userMsg: Message = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, firstName }),
      })

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      setLoading(false)
      setStreaming(true)

      // Adiciona mensagem vazia do assistente para preencher via stream
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const copy = [...prev]
          copy[copy.length - 1] = {
            role: 'assistant',
            content: copy[copy.length - 1].content + chunk,
          }
          return copy
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente ou entre em contato com a equipe pelo WhatsApp.' }])
    } finally {
      setLoading(false)
      setStreaming(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function reset() {
    setMessages([])
    setInput('')
    textareaRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-10rem)]">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-[#B0B8C4]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Assistente Bkoulf</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D7DD2] animate-pulse" />
              <p className="text-[rgba(176,184,196,0.6)] text-xs">Online · Especialista em serviços Bkoulf</p>
            </div>
          </div>
        </div>
        {!isEmpty && (
          <button
            onClick={reset}
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
            /* Estado inicial */
            <div className="flex flex-col items-center justify-center h-full py-10 gap-6">
              <BkMascot size={160} />
              <div className="text-center max-w-sm">
                <p className="text-white font-semibold text-base">Olá, {firstName}! Sou a assistente da Bkoulf.</p>
                <p className="text-[rgba(176,184,196,0.6)] text-sm mt-1">Tiro dúvidas sobre nossos serviços, o portal e o Método BK4. Como posso ajudar?</p>
              </div>
              {/* Sugestões */}
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs px-3 py-2 rounded-full bg-[#1C2333] border border-[rgba(255,255,255,0.12)] text-[#D0D8E4] hover:text-white hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.06)] transition-all"
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
                  <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#B0B8C4]" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-white text-[#050A14] rounded-tr-sm'
                    : 'bg-[#1C2333] text-zinc-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#1C2333] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-[#B0B8C4]" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#B0B8C4]" />
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
              placeholder="Digite sua dúvida sobre os serviços Bkoulf..."
              disabled={loading || streaming}
              rows={1}
              className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] resize-none min-h-[44px] max-h-[120px] flex-1"
            />
            <Button
              onClick={() => send()}
              disabled={!input.trim() || loading || streaming}
              className="bg-[#2D7DD2] hover:bg-[#1B4F8A] text-white h-11 w-11 p-0 shrink-0"
            >
              {loading || streaming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </Button>
          </div>
          <p className="text-[rgba(176,184,196,0.4)] text-xs mt-2 text-center">Assistente focado exclusivamente em serviços e dúvidas Bkoulf</p>
        </div>
      </div>
    </div>
  )
}
