'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Message } from '@/lib/types'

interface Client { id: string; name: string }

export function AdminSuporteClient({ clients, adminId, adminName }: {
  clients: Client[]
  adminId: string
  adminName: string
}) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!selectedClient) return
    setLoading(true)

    supabase
      .from('messages')
      .select('*')
      .eq('client_id', selectedClient.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as Message[]) ?? [])
        setLoading(false)
      })

    // Marca como lidas
    supabase.from('messages').update({ read: true })
      .eq('client_id', selectedClient.id).eq('is_from_agency', false)
  }, [selectedClient])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!newMessage.trim() || !selectedClient) return
    setSending(true)

    const { data, error } = await supabase
      .from('messages')
      .insert({
        client_id: selectedClient.id,
        sender_id: adminId,
        sender_name: adminName,
        content: newMessage.trim(),
        is_from_agency: true,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao enviar mensagem')
    } else {
      setMessages(prev => [...prev, data as Message])
      setNewMessage('')
    }
    setSending(false)
  }

  return (
    <div className="space-y-4 h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-[#D4A843]" />
        <div>
          <h1 className="text-2xl font-bold text-white">Suporte</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Responda mensagens dos clientes</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Lista de clientes */}
        <div className="w-56 shrink-0">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm">Clientes</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ul className="space-y-0.5">
                {clients.map(client => (
                  <li key={client.id}>
                    <button
                      onClick={() => setSelectedClient(client)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedClient?.id === client.id
                          ? 'bg-[#D4A843] text-[#050A14]'
                          : 'text-[#B0B8C4] hover:text-white hover:bg-[#1C2333]'
                      }`}
                    >
                      {client.name}
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] flex flex-col flex-1 min-h-0">
            {!selectedClient ? (
              <CardContent className="flex-1 flex items-center justify-center">
                <p className="text-[rgba(176,184,196,0.6)] text-sm">Selecione um cliente para ver as mensagens</p>
              </CardContent>
            ) : (
              <>
                <CardHeader className="pb-3 border-b border-[rgba(255,255,255,0.08)]">
                  <CardTitle className="text-white text-base">{selectedClient.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto px-4 pb-0">
                  {loading ? (
                    <div className="flex items-center gap-2 text-[#B0B8C4] text-sm pt-4">
                      <Loader2 className="w-4 h-4 animate-spin" />Carregando...
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-[rgba(176,184,196,0.6)] text-sm text-center pt-8">Nenhuma mensagem ainda.</p>
                  ) : (
                    <ul className="space-y-3 py-4">
                      {messages.map((msg) => (
                        <li key={msg.id} className={`flex ${msg.is_from_agency ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.is_from_agency
                              ? 'bg-[#D4A843] text-[#050A14] rounded-tr-sm'
                              : 'bg-[#1C2333] text-zinc-100 rounded-tl-sm'
                          }`}>
                            {!msg.is_from_agency && (
                              <p className="text-xs font-semibold text-[#B0B8C4] mb-1">{msg.sender_name}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.is_from_agency ? 'text-[rgba(176,184,196,0.4)]' : 'text-[rgba(176,184,196,0.6)]'}`}>
                              {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </li>
                      ))}
                      <div ref={bottomRef} />
                    </ul>
                  )}
                </CardContent>
                <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Responda o cliente..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                      className="bg-[#1C2333] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] resize-none min-h-[44px] max-h-[120px]"
                      rows={1}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={sending || !newMessage.trim()}
                      className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] shrink-0 h-11 w-11 p-0"
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
