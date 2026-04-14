'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Plus, Trash2, Check, X, Pencil, Palette, Video, Monitor, TrendingUp, Loader2, CalendarClock, ArrowUpRight } from 'lucide-react'
import { toast } from 'sonner'

type Category = 'identidade_visual' | 'edicao_videos' | 'website' | 'trafego_pago'
type Status = 'nao_iniciado' | 'em_andamento' | 'finalizado'

interface Client { id: string; name: string; company?: string }
interface Tarefa {
  id: string
  client_id: string | null
  category: Category
  title: string
  status: Status
  due_date: string | null
  created_at: string
}

function formatDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function isOverdue(date: string) {
  return new Date(date + 'T00:00:00') < new Date(new Date().toDateString())
}

const COLUMNS: {
  key: Category
  label: string
  icon: React.ElementType
  bar: string
  accent: string
  iconColor: string
}[] = [
  { key: 'identidade_visual', label: 'Identidade Visual', icon: Palette,    bar: 'bg-[rgba(212,168,67,0.4)]', accent: 'border-[rgba(255,255,255,0.08)]', iconColor: 'text-[#D4A843]' },
  { key: 'edicao_videos',     label: 'Edição de Vídeos',  icon: Video,      bar: 'bg-[#D4A843]',              accent: 'border-[rgba(255,255,255,0.08)]', iconColor: 'text-[#D4A843]' },
  { key: 'website',           label: 'Website',           icon: Monitor,    bar: 'bg-[#D4A843]',              accent: 'border-[rgba(255,255,255,0.08)]', iconColor: 'text-[#D4A843]' },
  { key: 'trafego_pago',      label: 'Tráfego Pago',      icon: TrendingUp, bar: 'bg-[#D4A843]',              accent: 'border-[rgba(255,255,255,0.08)]', iconColor: 'text-[#D4A843]' },
]

const STATUS_CFG: Record<Status, { label: string; cls: string }> = {
  nao_iniciado: { label: 'Não iniciado',  cls: 'bg-[rgba(255,255,255,0.06)] text-[#B0B8C4] border border-[rgba(255,255,255,0.12)]' },
  em_andamento: { label: 'Em andamento', cls: 'bg-[rgba(212,168,67,0.12)] text-[#F5D88A] border border-[rgba(212,168,67,0.3)]' },
  finalizado:   { label: 'Finalizado',   cls: 'bg-[rgba(212,168,67,0.15)] text-[#D4A843] border border-[rgba(212,168,67,0.35)]' },
}

const CATEGORY_HREF: Record<Category, string> = {
  identidade_visual: '/admin/identidade-visual',
  edicao_videos:     '/admin/videos',
  website:           '/admin/website',
  trafego_pago:      '/admin/trafego-pago',
}


/* ── Card individual ── */
function TaskCard({
  task, clients, onDelete, onUpdate,
}: {
  task: Tarefa
  clients: Client[]
  onDelete: (id: string) => void
  onUpdate: (id: string, fields: Partial<Pick<Tarefa, 'title' | 'status'>>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const [draftStatus, setDraftStatus] = useState<Status>(task.status)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const client = clients.find(c => c.id === task.client_id)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function openEdit() {
    setDraft(task.title)
    setDraftStatus(task.status)
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
    setDraft(task.title)
    setDraftStatus(task.status)
  }

  async function save() {
    const trimmed = draft.trim()
    if (!trimmed) return
    setSaving(true)
    const { error } = await supabase
      .from('tarefas')
      .update({ title: trimmed, status: draftStatus })
      .eq('id', task.id)
    if (error) { toast.error('Erro ao salvar') }
    else { onUpdate(task.id, { title: trimmed, status: draftStatus }); setEditing(false) }
    setSaving(false)
  }

  async function remove() {
    const { error } = await supabase.from('tarefas').delete().eq('id', task.id)
    if (error) { toast.error('Erro ao remover'); return }
    onDelete(task.id)
  }

  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 space-y-2.5 hover:border-[rgba(255,255,255,0.12)] transition-colors group">

      {editing ? (
        /* ── Modo edição ── */
        <div className="space-y-2.5">
          <Input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') cancelEdit() }}
            className="bg-[#18181B] border-[rgba(255,255,255,0.1)] text-white text-sm h-8 px-2"
          />

          {/* Seletor de etiqueta */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(STATUS_CFG) as Status[]).map(s => (
              <button
                key={s}
                onClick={() => setDraftStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-all ${STATUS_CFG[s].cls} ${
                  draftStatus === s ? 'ring-2 ring-white/20 scale-105' : 'opacity-50 hover:opacity-80'
                }`}
              >
                {STATUS_CFG[s].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              onClick={save}
              disabled={!draft.trim() || saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A843] text-[#050A14] text-xs font-semibold rounded-lg hover:bg-[#D4A843] disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Salvar
            </button>
            <button
              onClick={cancelEdit}
              className="w-7 h-7 flex items-center justify-center text-[rgba(176,184,196,0.6)] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Modo normal ── */
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="text-white text-sm font-medium leading-snug flex-1">{task.title}</p>
            <button
              onClick={openEdit}
              className="w-5 h-5 flex items-center justify-center text-[rgba(176,184,196,0.3)] hover:text-[#B0B8C4] rounded transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          {task.due_date && (
            <div className={`flex items-center gap-1.5 text-sm font-medium ${isOverdue(task.due_date) && task.status !== 'finalizado' ? 'text-[rgba(176,184,196,0.7)]' : 'text-[#B0B8C4]'}`}>
              <CalendarClock className="w-4 h-4 shrink-0" />
              Entrega: {formatDate(task.due_date)}
            </div>
          )}

          {client && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[#18181B] border border-[rgba(255,255,255,0.1)] text-[#B0B8C4]">
              {client.name}
            </span>
          )}

          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CFG[task.status].cls}`}>
              {STATUS_CFG[task.status].label}
            </span>
            <button
              onClick={remove}
              className="w-6 h-6 flex items-center justify-center text-[rgba(176,184,196,0.3)] hover:text-[rgba(176,184,196,0.7)] hover:bg-[rgba(255,255,255,0.04)] rounded transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {task.status === 'finalizado' && (
            <Link
              href={CATEGORY_HREF[task.category]}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[rgba(212,168,67,0.06)] border border-[rgba(212,168,67,0.15)] text-[#D4A843] text-xs font-semibold hover:bg-[rgba(212,168,67,0.06)] transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Entregar
            </Link>
          )}
        </>
      )}
    </div>
  )
}

/* ── Inline add card ── */
function AddCard({
  category, clients, selectedClient, onAdd,
}: {
  category: Category
  clients: Client[]
  selectedClient: string
  onAdd: (task: Tarefa) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const clientId = selectedClient === 'todos' ? '' : selectedClient
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function save() {
    if (!title.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('tarefas')
      .insert({ category, title: title.trim(), client_id: clientId || null, status: 'nao_iniciado', due_date: dueDate || null })
      .select().single()
    if (error) { toast.error('Erro ao criar tarefa') }
    else { onAdd(data as Tarefa); setTitle(''); setDueDate(''); setOpen(false); toast.success('Tarefa criada!') }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-2 py-2 text-[rgba(176,184,196,0.6)] hover:text-white hover:bg-[#18181B]/60 rounded-lg transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Adicionar tarefa
      </button>
    )
  }

  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 space-y-2.5">
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setOpen(false); setTitle(''); setDueDate('') }
        }}
        placeholder="Nome da tarefa..."
        className="bg-[#18181B] border-[rgba(255,255,255,0.1)] text-white text-sm h-8 placeholder:text-[rgba(176,184,196,0.4)]"
      />
      <div className="flex items-center gap-2">
        <CalendarClock className="w-3.5 h-3.5 text-[rgba(176,184,196,0.6)] shrink-0" />
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="flex-1 bg-[#18181B] border border-[rgba(255,255,255,0.1)] text-white rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[rgba(212,168,67,0.3)] [color-scheme:dark]"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={!title.trim() || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4A843] text-[#050A14] text-xs font-semibold rounded-lg hover:bg-[#D4A843] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Adicionar
        </button>
        <button
          onClick={() => { setOpen(false); setTitle('') }}
          className="w-7 h-7 flex items-center justify-center text-[rgba(176,184,196,0.6)] hover:text-white hover:bg-[#18181B] rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

/* ── Board principal ── */
export function TasksBoard({ clients, tarefas: initial }: { clients: Client[]; tarefas: Tarefa[] }) {
  const [tarefas, setTarefas] = useState(initial)
  const [selectedClient, setSelectedClient] = useState<string>('todos')

  const filtered = selectedClient === 'todos'
    ? tarefas
    : tarefas.filter(t => t.client_id === selectedClient)

  function getColumn(cat: Category) {
    return filtered.filter(t => t.category === cat)
  }

  function handleAdd(task: Tarefa) {
    setTarefas(prev => [task, ...prev])
  }

  function handleDelete(id: string) {
    setTarefas(prev => prev.filter(t => t.id !== id))
    toast.success('Tarefa removida')
  }

  function handleUpdate(id: string, fields: Partial<Pick<Tarefa, 'title' | 'status'>>) {
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
          <p className="text-[#B0B8C4] text-sm mt-0.5">Board de tarefas da agência</p>

        </div>
        <select
          value={selectedClient}
          onChange={e => setSelectedClient(e.target.value)}
          className="bg-[#18181B] border border-[rgba(255,255,255,0.1)] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(212,168,67,0.3)]"
        >
          <option value="todos">Todos os clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const Icon = col.icon
          const tasks = getColumn(col.key)
          const done = tasks.filter(t => t.status === 'finalizado').length

          return (
            <div key={col.key} className="flex flex-col gap-3">

              {/* Column header */}
              <div className={`rounded-xl border ${col.accent} bg-[rgba(255,255,255,0.04)] overflow-hidden`}>
                <div className={`h-1 w-full ${col.bar}`} />
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${col.iconColor}`} />
                    <span className="text-sm font-semibold text-white">{col.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-[rgba(176,184,196,0.6)]">{done}/{tasks.length}</span>
                  </div>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2 min-h-[80px]">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    clients={clients}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>

              {/* Add card */}
              <AddCard
                category={col.key}
                clients={clients}
                selectedClient={selectedClient}
                onAdd={handleAdd}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
