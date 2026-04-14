'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PackageCheck, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const serviceLabels: Record<string, string> = {
  trafego_pago: 'Tráfego Pago',
  edicao_videos: 'Edição de Vídeos',
  identidade_visual: 'Identidade Visual',
  website: 'Website',
}

const statusColors: Record<string, string> = {
  aguardando_aprovacao: 'bg-[rgba(255,255,255,0.06)] text-[#B0B8C4] border-[rgba(255,255,255,0.08)]',
  aprovado: 'bg-[rgba(255,255,255,0.06)] text-[#D4A843] border-[rgba(255,255,255,0.08)]',
  ajuste_solicitado: 'bg-[rgba(255,255,255,0.06)] text-[#B0B8C4] border-[rgba(255,255,255,0.08)]',
  entregue: 'bg-[rgba(255,255,255,0.06)] text-[#D4A843] border-[rgba(255,255,255,0.08)]',
}

const statusLabels: Record<string, string> = {
  aguardando_aprovacao: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  ajuste_solicitado: 'Ajuste solicitado',
  entregue: 'Entregue',
}

interface Client { id: string; name: string }
interface Service { id: string; client_id: string; type: string; status: string }
interface Deliverable { id: string; service_id: string; client_id: string; title: string; description?: string; status: string; file_url?: string; due_date?: string; created_at: string }

export function EntregasManager({ clients, services, deliverables: initialDeliverables }: {
  clients: Client[]
  services: Service[]
  deliverables: Deliverable[]
}) {
  const [deliverables, setDeliverables] = useState(initialDeliverables)
  const [showNew, setShowNew] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [form, setForm] = useState({ title: '', description: '', serviceId: '', fileUrl: '', dueDate: '' })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const clientServices = services.filter(s => s.client_id === selectedClientId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClientId || !form.serviceId) {
      toast.error('Selecione o cliente e o serviço')
      return
    }
    setSaving(true)

    const { data, error } = await supabase
      .from('deliverables')
      .insert({
        client_id: selectedClientId,
        service_id: form.serviceId,
        title: form.title,
        description: form.description || null,
        file_url: form.fileUrl || null,
        due_date: form.dueDate || null,
        status: 'aguardando_aprovacao',
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar entrega')
    } else {
      setDeliverables(prev => [data as Deliverable, ...prev])
      setShowNew(false)
      setForm({ title: '', description: '', serviceId: '', fileUrl: '', dueDate: '' })
      setSelectedClientId('')
      toast.success('Entrega criada!')
      router.refresh()
    }
    setSaving(false)
  }

  function getClientName(clientId: string) {
    return clients.find(c => c.id === clientId)?.name ?? '—'
  }

  function getServiceLabel(serviceId: string) {
    const service = services.find(s => s.id === serviceId)
    return service ? serviceLabels[service.type] ?? service.type : '—'
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PackageCheck className="w-6 h-6 text-[#D4A843]" />
            <div>
              <h1 className="text-2xl font-bold text-white">Entregas</h1>
              <p className="text-[#B0B8C4] text-sm mt-0.5">{deliverables.length} entregas registradas</p>
            </div>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Nova entrega
          </Button>
        </div>

        <Card className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)]">
          <CardContent className="pt-6">
            {deliverables.length === 0 ? (
              <p className="text-[rgba(176,184,196,0.6)] text-sm">Nenhuma entrega registrada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)]">
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Título</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Cliente</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Serviço</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3 pr-4">Prazo</th>
                      <th className="text-left text-[#B0B8C4] font-medium pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliverables.map((d) => (
                      <tr key={d.id} className="border-b border-[rgba(255,255,255,0.08)]/50 last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-white">{d.title}</p>
                          {d.description && <p className="text-xs text-[rgba(176,184,196,0.6)] mt-0.5 truncate max-w-[200px]">{d.description}</p>}
                        </td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{getClientName(d.client_id)}</td>
                        <td className="py-3 pr-4 text-[#D0D8E4]">{getServiceLabel(d.service_id)}</td>
                        <td className="py-3 pr-4 text-[#B0B8C4] text-xs">
                          {d.due_date ? new Date(d.due_date).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[d.status]}`}>
                            {statusLabels[d.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Nova entrega</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Cliente *</Label>
              <select
                value={selectedClientId}
                onChange={e => { setSelectedClientId(e.target.value); setForm(p => ({ ...p, serviceId: '' })) }}
                required
                className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                <option value="">Selecione o cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {selectedClientId && (
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Serviço *</Label>
                <select
                  value={form.serviceId}
                  onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}
                  required
                  className="w-full bg-[#18181B] border border-[rgba(255,255,255,0.12)] text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="">Selecione o serviço</option>
                  {clientServices.map(s => (
                    <option key={s.id} value={s.id}>{serviceLabels[s.type] ?? s.type}</option>
                  ))}
                </select>
                {clientServices.length === 0 && (
                  <p className="text-xs text-[#B0B8C4]">Este cliente não tem serviços ativos. Ative em Clientes → Serviços.</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Título *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="Ex: Arte para Instagram - Semana 1" className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[#D0D8E4]">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detalhes sobre a entrega..." className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)] min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Link do arquivo</Label>
                <Input value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))} placeholder="https://..." className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white placeholder:text-[rgba(176,184,196,0.6)]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[#D0D8E4]">Prazo</Label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className="bg-[#18181B] border-[rgba(255,255,255,0.12)] text-white" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" className="border-[rgba(255,255,255,0.12)] text-[#D0D8E4]" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#D4A843] text-[#050A14] hover:bg-[#D4A843] font-semibold">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar entrega'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
