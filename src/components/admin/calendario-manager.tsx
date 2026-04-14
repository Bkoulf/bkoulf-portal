'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, Plus, Loader2, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Client { id: string; name: string }
interface Event {
  id: string
  client_id: string
  title: string
  description?: string
  event_date: string
  type: string
}

const typeConfig: Record<string, { label: string; color: string; dot: string }> = {
  reuniao:    { label: 'Reunião',    color: 'bg-[rgba(45,125,210,0.1)]   text-[#2D7DD2] border-[rgba(45,125,210,0.25)]',   dot: 'bg-[#2D7DD2]' },
  gravacao:   { label: 'Gravação',   color: 'bg-[rgba(212,168,67,0.1)]   text-[#D4A843] border-[rgba(212,168,67,0.25)]',   dot: 'bg-[#D4A843]' },
  entrega:    { label: 'Entrega',    color: 'bg-[rgba(232,124,107,0.1)]  text-[#E87C6B] border-[rgba(232,124,107,0.25)]',  dot: 'bg-[#E87C6B]' },
  revisao:    { label: 'Revisão',    color: 'bg-[rgba(155,127,212,0.1)]  text-[#9B7FD4] border-[rgba(155,127,212,0.25)]',  dot: 'bg-[#9B7FD4]' },
  publicacao: { label: 'Publicação', color: 'bg-[rgba(76,175,136,0.1)]   text-[#4CAF88] border-[rgba(76,175,136,0.25)]',   dot: 'bg-[#4CAF88]' },
  outro:      { label: 'Outro',      color: 'bg-[rgba(255,255,255,0.06)] text-[#B0B8C4] border-[rgba(255,255,255,0.1)]',   dot: 'bg-[#B0B8C4]' },
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) +
    ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

function EventRow({ event, clientName, onDelete }: { event: Event; clientName: string; onDelete: () => void }) {
  const cfg = typeConfig[event.type] ?? typeConfig.outro
  const date = new Date(event.event_date)
  const today = isToday(event.event_date)
  return (
    <div className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${today ? 'bg-[rgba(255,255,255,0.06)] border-[rgba(255,255,255,0.08)]' : 'bg-[#18181B]/60 border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.12)]'}`}>
      {/* Data */}
      <div className="shrink-0 text-center w-11">
        <p className={`text-lg font-black leading-none ${today ? 'text-[#D4A843]' : 'text-white'}`}>{date.getDate().toString().padStart(2, '0')}</p>
        <p className="text-xs text-[rgba(176,184,196,0.6)] uppercase mt-0.5">{date.toLocaleString('pt-BR', { month: 'short' })}</p>
      </div>
      <div className={`w-px h-8 shrink-0 ${today ? 'bg-[rgba(255,255,255,0.06)]' : 'bg-[rgba(255,255,255,0.1)]'}`} />
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">{event.title}</p>
          {today && <span className="text-xs font-semibold text-[#D4A843] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] px-1.5 py-0.5 rounded-full shrink-0">Hoje</span>}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[rgba(176,184,196,0.6)] truncate">{clientName}</span>
          <span className="text-zinc-700">·</span>
          <span className="flex items-center gap-1 text-xs text-[rgba(176,184,196,0.6)]">
            <Clock className="w-3 h-3" />{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        {event.description && <p className="text-xs text-[rgba(176,184,196,0.4)] mt-1 truncate">{event.description}</p>}
      </div>
      {/* Tipo */}
      <span className={`text-xs px-2.5 py-1 rounded-full border shrink-0 font-medium ${cfg.color}`}>{cfg.label}</span>
      {/* Delete */}
      <button
        onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center text-[rgba(176,184,196,0.4)] hover:text-[rgba(176,184,196,0.7)] hover:bg-[rgba(255,255,255,0.04)] rounded-lg transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function CalendarioManager({ clients, events: initial }: { clients: Client[]; events: Event[] }) {
  const [events, setEvents] = useState(initial)
  const [showNew, setShowNew] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ clientId: '', title: '', description: '', eventDate: '', type: 'reuniao' })
  const supabase = createClient()
  const router = useRouter()

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.event_date) >= now).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
  const past     = events.filter(e => new Date(e.event_date) < now).sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())

  function getClientName(id: string) {
    return clients.find(c => c.id === id)?.name ?? '—'
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) { toast.error('Selecione o cliente'); return }
    setSaving(true)

    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        client_id: form.clientId,
        title: form.title,
        description: form.description || null,
        event_date: form.eventDate,
        type: form.type,
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar evento')
    } else {
      setEvents(prev => [...prev, data as Event])
      setShowNew(false)
      setForm({ clientId: '', title: '', description: '', eventDate: '', type: 'reuniao' })
      toast.success('Evento criado!')
      router.refresh()
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) { toast.error('Erro ao remover evento'); return }
    setEvents(prev => prev.filter(e => e.id !== id))
    toast.success('Evento removido')
  }

  return (
    <>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#D4A843]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Calendário</h1>
              <p className="text-[#B0B8C4] text-sm mt-0.5">{upcoming.length} próximo{upcoming.length !== 1 ? 's' : ''} · {past.length} passado{past.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Novo evento
          </Button>
        </div>

        {/* Legenda de tipos */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-[rgba(176,184,196,0.6)]">{cfg.label}</span>
            </div>
          ))}
        </div>

        {/* Próximos eventos */}
        <div>
          <p className="text-xs font-semibold text-[rgba(176,184,196,0.6)] uppercase tracking-widest mb-3">Próximos eventos</p>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl gap-3">
              <Calendar className="w-8 h-8 text-zinc-700" />
              <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhum evento agendado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  clientName={getClientName(event.client_id)}
                  onDelete={() => handleDelete(event.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Eventos passados (collapsible) */}
        {past.length > 0 && (
          <div>
            <button
              onClick={() => setShowPast(p => !p)}
              className="flex items-center gap-2 text-xs font-semibold text-[rgba(176,184,196,0.6)] uppercase tracking-widest hover:text-[#D0D8E4] transition-colors mb-3"
            >
              {showPast ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Eventos passados ({past.length})
            </button>
            {showPast && (
              <div className="space-y-2 opacity-60">
                {past.map(event => (
                  <EventRow
                    key={event.id}
                    event={event}
                    clientName={getClientName(event.client_id)}
                    onDelete={() => handleDelete(event.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal novo evento */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Novo evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Cliente *</Label>
              <select
                value={form.clientId}
                onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                required
                className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(212,168,67,0.3)]"
              >
                <option value="">Selecione o cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Título *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
                placeholder="Ex: Reunião de briefing"
                className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Data e hora *</Label>
                <Input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))}
                  required
                  className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Tipo</Label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(212,168,67,0.3)]"
                >
                  {Object.entries(typeConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Descrição <span className="text-[rgba(176,184,196,0.4)]">(opcional)</span></Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Detalhes do evento..."
                className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] min-h-[70px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar evento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
